import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabaseClient'
import GenerationService from '../services/generationService'

const generationService = new GenerationService()

/**
 * Load humanization settings from database and apply to GenerationService
 */
async function loadHumanizationSettings() {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'humanization_provider',
        'stealthgpt_tone',
        'stealthgpt_mode',
        'stealthgpt_detector',
        'stealthgpt_business',
        'stealthgpt_double_passing',
      ])

    if (error) {
      console.warn('[Generation] Could not load humanization settings:', error.message)
      return
    }

    // Convert array to object
    const settingsMap = {}
    settings?.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value
    })

    // Apply provider setting
    if (settingsMap.humanization_provider) {
      generationService.setHumanizationProvider(settingsMap.humanization_provider)
    }

    // Apply StealthGPT settings
    generationService.setStealthGptSettings({
      tone: settingsMap.stealthgpt_tone || 'College',
      mode: settingsMap.stealthgpt_mode || 'High',
      detector: settingsMap.stealthgpt_detector || 'gptzero',
      business: settingsMap.stealthgpt_business === 'true',
      doublePassing: settingsMap.stealthgpt_double_passing === 'true',
    })

    console.log('[Generation] Humanization settings loaded from database')
  } catch (err) {
    console.warn('[Generation] Error loading humanization settings:', err)
  }
}

/**
 * Generate complete article from content idea with full pipeline
 * Includes: Grok draft → StealthGPT humanize → Internal linking → Quality QA → Auto-fix loop → Save
 */
export function useGenerateArticle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ idea, options, onProgress }) => {
      // Load latest humanization settings before generation
      await loadHumanizationSettings()

      // Generate complete article with full pipeline
      const articleData = await generationService.generateArticleComplete(
        idea,
        {
          contentType: options?.contentType || 'guide',
          targetWordCount: options?.targetWordCount || 2000,
          autoAssignContributor: options?.autoAssignContributor !== false,
          addInternalLinks: options?.addInternalLinks !== false,
          autoFix: options?.autoFix !== false,
          maxFixAttempts: options?.maxFixAttempts || 3,
        },
        onProgress
      )

      // Save to database
      const savedArticle = await generationService.saveArticle(
        articleData,
        idea.id,
        user.id
      )

      return savedArticle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Auto-fix quality issues in an article
 */
export function useAutoFixQuality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, content, issues }) => {
      // Use generationService to fix issues
      const fixedContent = await generationService.autoFixQualityIssues(
        content,
        issues,
        []
      )

      // Recalculate quality metrics
      const metrics = generationService.calculateQualityMetrics(fixedContent, [])

      // Update article in database
      const { data, error } = await supabase
        .from('articles')
        .update({
          content: fixedContent,
          quality_score: metrics.score,
          word_count: metrics.word_count,
          risk_flags: metrics.issues.map(i => i.type),
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
    },
  })
}

/**
 * Revise article with editorial feedback
 */
export function useReviseArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, content, feedbackItems }) => {
      // Use Claude to revise based on feedback
      const revisedContent = await generationService.claude.reviseWithFeedback(
        content,
        feedbackItems
      )

      // Update article
      const { data, error } = await supabase
        .from('articles')
        .update({ content: revisedContent })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error

      // Mark feedback items as addressed
      await supabase
        .from('article_revisions')
        .update({ status: 'addressed', ai_revised: true })
        .in('id', feedbackItems.map(f => f.id))

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
      queryClient.invalidateQueries({ queryKey: ['revisions'] })
    },
  })
}

/**
 * Humanize content using StealthGPT (primary) or Claude (fallback)
 */
export function useHumanizeContent() {
  return useMutation({
    mutationFn: async ({ content, contributorStyle, contributorName }) => {
      // Load latest humanization settings before processing
      await loadHumanizationSettings()

      const humanizedContent = await generationService.humanizeContent(
        content,
        {
          writingStyle: contributorStyle,
          contributorName: contributorName
        }
      )

      return { content: humanizedContent }
    },
  })
}

/**
 * Revise content based on feedback comments
 * Per GetEducated spec section 8.3.3 - Article Review UI Requirements
 * Bundles article text + comments as context and sends to AI for revision
 */
export function useReviseWithFeedback() {
  return useMutation({
    mutationFn: async ({ content, title, feedbackItems, contentType, focusKeyword }) => {
      // Format feedback items for the prompt
      const feedbackText = feedbackItems
        .map((item, i) => `${i + 1}. ${item.comment}`)
        .join('\n')

      const prompt = `You are revising an article based on editorial feedback.

ARTICLE TITLE: ${title}
CONTENT TYPE: ${contentType || 'guide'}
FOCUS KEYWORD: ${focusKeyword || 'N/A'}

EDITORIAL FEEDBACK TO ADDRESS:
${feedbackText}

CURRENT ARTICLE CONTENT:
${content}

INSTRUCTIONS:
1. Carefully address ALL the feedback items listed above
2. Maintain the article's overall structure and tone
3. Keep all existing HTML formatting intact
4. Do not remove existing content unless specifically requested
5. Make changes that directly respond to the feedback
6. Ensure the article remains coherent and well-organized
7. Keep the content length similar unless asked to expand/reduce

OUTPUT ONLY THE COMPLETE REVISED HTML CONTENT (no explanations, no commentary).`

      // Use Claude to revise with feedback
      const revisedContent = await generationService.claude.chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      return { content: revisedContent }
    },
  })
}

/**
 * Generate ideas from a topic
 */
export function useGenerateIdeas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ topic, count = 5 }) => {
      const ideas = await generationService.generateIdeas(topic, count)
      return ideas
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Get contributors (for display)
 */
export function useContributors() {
  return {
    queryKey: ['contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_contributors')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    },
  }
}
