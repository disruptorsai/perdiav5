import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabaseClient'
import GenerationService from '../services/generationService'

const generationService = new GenerationService()

/**
 * Generate complete article from content idea with full pipeline
 * Includes: Grok draft → Claude humanize → Internal linking → Quality QA → Auto-fix loop → Save
 */
export function useGenerateArticle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ idea, options, onProgress }) => {
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

/**
 * Refresh article with latest content rules
 * Re-applies: shortcodes, internal links, banned phrase removal, contributor voice
 */
export function useRefreshWithRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, content, article }) => {
      // Load latest content rules
      const { data: rules, error: rulesError } = await supabase
        .from('content_rules')
        .select('*')
        .eq('is_active', true)

      if (rulesError) throw rulesError

      // Load latest shortcodes
      const { data: shortcodes, error: shortcodesError } = await supabase
        .from('shortcodes')
        .select('*')

      if (shortcodesError) throw shortcodesError

      // Load system settings for banned phrases
      const { data: settings } = await supabase
        .from('system_settings')
        .select('banned_phrases')
        .single()

      const bannedPhrases = settings?.banned_phrases || []

      // Track reasoning for transparency
      const reasoning = {
        timestamp: new Date().toISOString(),
        summary: 'Article refreshed with latest rules',
        rules_applied: [],
        stages_completed: 0,
      }

      let updatedContent = content

      // Step 1: Apply blocked patterns (banned phrases)
      const blockedPatterns = rules.filter(r => r.rule_type === 'blocked_pattern')
      for (const pattern of blockedPatterns) {
        const regex = new RegExp(pattern.pattern, 'gi')
        if (regex.test(updatedContent)) {
          updatedContent = updatedContent.replace(
            regex,
            pattern.replacement || ''
          )
          reasoning.rules_applied.push({
            name: `Blocked Pattern: ${pattern.pattern}`,
            description: pattern.replacement
              ? `Replaced with "${pattern.replacement}"`
              : 'Removed from content',
            changes: 1,
          })
        }
      }
      reasoning.stages_completed++

      // Step 2: Remove system-wide banned phrases
      for (const phrase of bannedPhrases) {
        const regex = new RegExp(phrase, 'gi')
        if (regex.test(updatedContent)) {
          updatedContent = updatedContent.replace(regex, '')
          reasoning.rules_applied.push({
            name: `Banned Phrase: ${phrase}`,
            description: 'Removed from content',
            changes: 1,
          })
        }
      }
      reasoning.stages_completed++

      // Step 3: Refresh internal links using generation service
      try {
        const linkedContent = await generationService.addInternalLinks(updatedContent, article.title || '')
        if (linkedContent !== updatedContent) {
          updatedContent = linkedContent
          reasoning.stages_completed++
          reasoning.links_inserted = (updatedContent.match(/<a\s+(?:[^>]*?\s+)?href=["'][^"']*["']/gi) || []).length
        }
      } catch (linkError) {
        console.warn('Link refresh failed:', linkError)
      }

      // Step 4: Re-apply shortcodes based on content type
      const applicableShortcodes = shortcodes.filter(s => {
        // Check if shortcode matches content type or is universally applicable
        return !s.category || s.category === article.content_type || s.category === 'general'
      })

      for (const shortcode of applicableShortcodes) {
        // Update existing shortcode usages with latest version
        const shortcodePattern = new RegExp(`\\[${shortcode.name}\\]`, 'g')
        if (shortcodePattern.test(updatedContent)) {
          // Already present, update usage count
          await supabase
            .from('shortcodes')
            .update({ times_used: (shortcode.times_used || 0) + 1 })
            .eq('id', shortcode.id)
        }
      }
      reasoning.stages_completed++

      // Recalculate quality metrics
      const metrics = generationService.calculateQualityMetrics(updatedContent, [])

      // Update article with refreshed content and reasoning
      const { data, error } = await supabase
        .from('articles')
        .update({
          content: updatedContent,
          quality_score: metrics.score,
          word_count: metrics.word_count,
          risk_flags: metrics.issues.map(i => i.type),
          reasoning: JSON.stringify(reasoning),
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error

      return {
        ...data,
        rulesApplied: reasoning.rules_applied.length,
        reasoning,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.id] })
    },
  })
}
