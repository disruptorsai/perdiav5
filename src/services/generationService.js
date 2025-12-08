/**
 * Generation Service
 * Orchestrates the complete two-pass AI generation pipeline with quality checks
 * Pipeline: Grok Draft → StealthGPT Humanize → Quality Check → Auto-Fix Loop → Save
 */

import GrokClient from './ai/grokClient'
import ClaudeClient from './ai/claudeClient'
import StealthGptClient from './ai/stealthGptClient'
import { supabase } from './supabaseClient'
import IdeaDiscoveryService from './ideaDiscoveryService'
import { getCostDataContext } from './costDataService'
import { insertShortcodeInContent } from './shortcodeService'
import { MonetizationEngine, monetizationValidator } from './monetizationEngine'
import {
  getAuthorSystemPrompt,
  APPROVED_AUTHORS,
  BLOCKED_BYLINES,
  validateByline,
  recommendAuthor,
} from '../hooks/useContributors'
import { contentValidator, validateDraft, validateForPublish } from './validation/contentValidator'

class GenerationService {
  constructor() {
    this.grok = new GrokClient()
    this.claude = new ClaudeClient()
    this.stealthGpt = new StealthGptClient()
    this.ideaDiscovery = new IdeaDiscoveryService()
    this.monetizationEngine = new MonetizationEngine()
    this.isProcessing = false
    this.processingQueue = []
    this.currentTask = null

    // Humanization settings - optimized for maximum AI detection bypass
    this.humanizationProvider = 'stealthgpt' // 'stealthgpt' or 'claude'
    this.stealthGptSettings = {
      tone: 'College',      // Recommended for professional content
      mode: 'High',         // Maximum bypass potential
      detector: 'gptzero',  // Most common AI detector
      business: true,       // Use 10x more powerful engine
      doublePassing: false, // Two-pass humanization for extra safety
    }
  }

  /**
   * Generate complete article from content idea with full quality assurance
   * Includes auto-fix loop with up to 3 retry attempts
   */
  async generateArticleComplete(idea, options = {}, onProgress) {
    const {
      contentType = 'guide',
      targetWordCount = 2000,
      autoAssignContributor = true,
      addInternalLinks = true,
      autoFix = true,
      maxFixAttempts = 3,
      qualityThreshold = 85,
    } = options

    try {
      // Update progress
      this.updateProgress(onProgress, 'Fetching cost data from ranking reports...', 5)

      // STAGE 0: Get cost data context for RAG
      const costContext = await getCostDataContext(idea)
      console.log(`[Generation] Cost data found: ${costContext.hasData ? costContext.costData.length + ' entries' : 'none'}`)

      this.updateProgress(onProgress, 'Auto-assigning contributor...', 10)

      // STAGE 1: Auto-assign contributor FIRST so we can use their profile in generation
      let contributor = null
      if (autoAssignContributor) {
        contributor = await this.assignContributor(idea, contentType)
      }

      // Build author system prompt from comprehensive profile
      const authorPrompt = contributor ? getAuthorSystemPrompt(contributor) : ''
      if (authorPrompt) {
        console.log(`[Generation] Using author profile for ${contributor.name} (${authorPrompt.length} chars)`)
      }

      this.updateProgress(onProgress, 'Generating draft with Grok AI...', 20)

      // STAGE 2: Generate draft with Grok (includes cost data AND author profile)
      const draftData = await this.grok.generateDraft(idea, {
        contentType,
        targetWordCount,
        costDataContext: costContext.promptText, // Pass cost data to prompt
        authorProfile: authorPrompt, // Pass comprehensive author profile
        authorName: contributor?.name,
      })

      this.updateProgress(onProgress, 'Validating draft content...', 30)

      // VALIDATION CHECKPOINT 1: Check draft for truncation and placeholders
      const draftValidation = await validateDraft(draftData.content, {
        targetWordCount,
        faqs: draftData.faqs,
        checkTruncation: true,
        checkPlaceholders: true,
        checkStatistics: false, // Defer to final validation
        checkLegislation: false, // Defer to final validation
      })

      if (draftValidation.isBlocked) {
        console.error('[Generation] Draft validation BLOCKED:', draftValidation.blockingIssues)
        // Attempt to regenerate once if draft is truncated or has placeholders
        console.log('[Generation] Attempting to regenerate draft...')
        const retryDraftData = await this.grok.generateDraft(idea, {
          contentType,
          targetWordCount: targetWordCount + 200, // Request slightly longer to ensure completion
          costDataContext: costContext.promptText,
          authorProfile: authorPrompt,
          authorName: contributor?.name,
        })

        // Re-validate
        const retryValidation = await validateDraft(retryDraftData.content, {
          targetWordCount,
          faqs: retryDraftData.faqs,
        })

        if (retryValidation.isBlocked) {
          // Still blocked - throw error with details
          const issues = retryValidation.blockingIssues.map(i => i.message).join('; ')
          throw new Error(`Draft generation failed validation: ${issues}`)
        }

        // Use retry data
        Object.assign(draftData, retryDraftData)
        console.log('[Generation] Retry draft passed validation')
      } else {
        console.log('[Generation] Draft validation passed:', contentValidator.getSummary(draftValidation))
      }

      this.updateProgress(onProgress, 'Humanizing content with StealthGPT...', 40)

      // STAGE 3: Humanize with StealthGPT (primary) or Claude (fallback)
      // Uses optimized settings: 150-200 word chunks, iterative rephrasing, business mode
      let humanizedContent
      try {
        if (this.humanizationProvider === 'stealthgpt' && this.stealthGpt.isConfigured()) {
          const stealthOptions = {
            tone: this.stealthGptSettings.tone,
            mode: this.stealthGptSettings.mode,
            detector: this.stealthGptSettings.detector,
            business: this.stealthGptSettings.business, // 10x more powerful engine
          }

          // Use double-passing for maximum undetectability if enabled
          if (this.stealthGptSettings.doublePassing) {
            console.log('[Generation] Using double-pass humanization for maximum bypass')
            humanizedContent = await this.stealthGpt.humanizeWithDoublePassing(draftData.content, stealthOptions)
          } else {
            humanizedContent = await this.stealthGpt.humanizeLongContent(draftData.content, stealthOptions)
          }
          console.log('[Generation] Content humanized with StealthGPT (optimized)')
        } else {
          // Fallback to Claude with comprehensive author profile
          humanizedContent = await this.claude.humanize(draftData.content, {
            contributorProfile: contributor,
            authorSystemPrompt: authorPrompt,
            targetPerplexity: 'high',
            targetBurstiness: 'high',
          })
          console.log('[Generation] Content humanized with Claude (fallback)')
        }
      } catch (humanizeError) {
        console.warn('[Generation] StealthGPT humanization failed, falling back to Claude:', humanizeError.message)
        humanizedContent = await this.claude.humanize(draftData.content, {
          contributorProfile: contributor,
          authorSystemPrompt: authorPrompt,
          targetPerplexity: 'high',
          targetBurstiness: 'high',
        })
      }

      this.updateProgress(onProgress, 'Adding internal links...', 55)

      // STAGE 4: Add internal links
      let finalContent = humanizedContent
      if (addInternalLinks) {
        const siteArticles = await this.getRelevantSiteArticles(draftData.title, 30)
        if (siteArticles.length >= 3) {
          finalContent = await this.addInternalLinksToContent(humanizedContent, siteArticles)
        }
      }

      this.updateProgress(onProgress, 'Adding monetization shortcodes...', 62)

      // STAGE 4.5: Add monetization shortcodes using new MonetizationEngine
      let monetizationResult = null
      try {
        // First, match the topic to a monetization category
        const monetizationMatch = await this.monetizationEngine.matchTopicToCategory(
          idea.title || draftData.title,
          costContext.degreeLevel
        )

        if (monetizationMatch.matched) {
          console.log(`[Generation] Matched monetization: category=${monetizationMatch.categoryId}, concentration=${monetizationMatch.concentrationId}, confidence=${monetizationMatch.confidence}`)

          // Determine article type for slot configuration
          const articleType = options.contentType || 'default'

          // Generate full monetization with program selection
          monetizationResult = await this.monetizationEngine.generateMonetization({
            articleId: idea.id,
            categoryId: monetizationMatch.categoryId,
            concentrationId: monetizationMatch.concentrationId,
            degreeLevelCode: monetizationMatch.degreeLevelCode,
            articleType,
          })

          if (monetizationResult.success && monetizationResult.slots.length > 0) {
            console.log(`[Generation] Generated ${monetizationResult.slots.length} monetization slots with ${monetizationResult.totalProgramsSelected} programs`)

            // Insert shortcodes at their designated positions
            for (const slot of monetizationResult.slots) {
              // Map slot names to insertion positions
              const positionMap = {
                'after_intro': 'after_intro',
                'mid_article': 'mid_content',
                'near_conclusion': 'pre_conclusion',
              }
              const insertPosition = positionMap[slot.name] || 'after_intro'

              finalContent = insertShortcodeInContent(finalContent, slot.shortcode, insertPosition)
              console.log(`[Generation] Inserted ${slot.type} shortcode at ${slot.name} (${slot.programCount} programs, sponsored: ${slot.hasSponsored})`)
            }
          } else {
            console.warn('[Generation] Monetization generation returned no slots')
          }
        } else {
          console.warn('[Generation] Could not match monetization category:', monetizationMatch.error)
        }

        // Validate monetization compliance (business rules)
        const validation = await monetizationValidator.validate(monetizationResult, finalContent)
        if (validation.blockingIssues.length > 0) {
          console.error('[Generation] Monetization validation blocking issues:', validation.blockingIssues)
        } else if (validation.warnings.length > 0) {
          console.warn('[Generation] Monetization validation warnings:', validation.warnings.map(w => w.message))
        }

      } catch (monetizationError) {
        console.warn('[Generation] Monetization shortcode insertion failed:', monetizationError.message)
        // Non-blocking - continue without shortcodes
      }

      this.updateProgress(onProgress, 'Running content validation...', 68)

      // VALIDATION CHECKPOINT 2: Full validation before quality scoring
      const preQAValidation = await validateForPublish(finalContent, {
        targetWordCount,
        faqs: draftData.faqs,
        checkTruncation: true,
        checkPlaceholders: true,
        checkStatistics: true,
        checkLegislation: true,
        checkSchoolNames: true,
        checkInternalLinks: true,
      })

      // Log validation results
      console.log('[Generation] Pre-QA Validation:', contentValidator.getSummary(preQAValidation))

      // Extract validation flags for storage
      const validationFlags = preQAValidation.issues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
      }))

      const requiresHumanReview = preQAValidation.requiresReview
      const reviewReasons = preQAValidation.warnings.map(w => w.type)

      // If blocked, throw error (shouldn't happen if draft validation passed, but safety check)
      if (preQAValidation.isBlocked) {
        const issues = preQAValidation.blockingIssues.map(i => i.message).join('; ')
        throw new Error(`Content validation failed: ${issues}`)
      }

      this.updateProgress(onProgress, 'Running quality assurance...', 70)

      // STAGE 5: Quality Assurance Loop (with auto-fix)
      let articleData = {
        title: draftData.title,
        content: finalContent,
        excerpt: draftData.excerpt,
        meta_title: draftData.meta_title,
        meta_description: draftData.meta_description,
        focus_keyword: draftData.focus_keyword,
        slug: this.generateSlug(draftData.title),
        faqs: draftData.faqs,
        contributor_id: contributor?.id || null,
        contributor_name: contributor?.name || null,
        status: 'drafting',
        // NEW: Validation tracking fields
        validation_flags: validationFlags,
        requires_human_review: requiresHumanReview,
        review_reasons: reviewReasons,
        validation_risk_level: preQAValidation.riskLevel,
      }

      if (autoFix) {
        const qaResult = await this.qualityAssuranceLoop(
          articleData,
          maxFixAttempts,
          (attempt, total) => {
            this.updateProgress(
              onProgress,
              `Auto-fixing quality issues (attempt ${attempt}/${total})...`,
              70 + (attempt * 10)
            )
          }
        )

        articleData = qaResult.article
      } else {
        // Just calculate metrics without fixing
        const metrics = this.calculateQualityMetrics(articleData.content, articleData.faqs)
        articleData.word_count = metrics.word_count
        articleData.quality_score = metrics.score
        articleData.risk_flags = metrics.issues.map(i => i.type)
      }

      this.updateProgress(onProgress, 'Finalizing article...', 95)

      return articleData

    } catch (error) {
      console.error('Article generation error:', error)
      throw error
    }
  }

  /**
   * Quality Assurance Loop with Auto-Fix
   * Attempts to fix quality issues up to maxAttempts times
   */
  async qualityAssuranceLoop(articleData, maxAttempts = 3, onAttempt) {
    let currentArticle = { ...articleData }
    let attempt = 0

    while (attempt < maxAttempts) {
      attempt++

      if (onAttempt) onAttempt(attempt, maxAttempts)

      // Calculate quality metrics
      const metrics = this.calculateQualityMetrics(currentArticle.content, currentArticle.faqs)
      const issues = metrics.issues

      // Update article with metrics
      currentArticle.word_count = metrics.word_count
      currentArticle.quality_score = metrics.score

      console.log(`QA Attempt ${attempt}/${maxAttempts}: Score = ${metrics.score}, Issues = ${issues.length}`)

      // If no issues or max attempts reached, stop
      if (issues.length === 0) {
        console.log('✓ All quality checks passed!')
        currentArticle.risk_flags = []
        break
      }

      if (attempt === maxAttempts) {
        console.log(`⚠ Max attempts reached. Flagging ${issues.length} remaining issues.`)
        currentArticle.risk_flags = issues.map(i => i.type)
        break
      }

      // Auto-fix issues
      console.log(`Fixing issues: ${issues.map(i => i.type).join(', ')}`)

      try {
        const fixedContent = await this.autoFixQualityIssues(
          currentArticle.content,
          issues,
          currentArticle.faqs
        )

        currentArticle.content = fixedContent

        // Re-calculate metrics to check improvement
        const newMetrics = this.calculateQualityMetrics(fixedContent, currentArticle.faqs)

        console.log(`Improvement: ${metrics.score} → ${newMetrics.score}`)

        // If no improvement, stop trying
        if (newMetrics.score <= metrics.score) {
          console.log('⚠ No improvement detected. Stopping auto-fix.')
          currentArticle.risk_flags = issues.map(i => i.type)
          break
        }

      } catch (error) {
        console.error('Auto-fix failed:', error)
        currentArticle.risk_flags = issues.map(i => i.type)
        break
      }
    }

    return {
      article: currentArticle,
      attempts: attempt,
      finalScore: currentArticle.quality_score,
    }
  }

  /**
   * Auto-fix quality issues using Claude
   */
  async autoFixQualityIssues(content, issues, currentFaqs = []) {
    const issueDescriptions = issues.map(issue => {
      switch (issue.type) {
        case 'word_count_low':
          return '- Article is too short. Add 200-300 more words with valuable information.'
        case 'word_count_high':
          return '- Article is too long. Condense and remove unnecessary repetition.'
        case 'missing_internal_links':
          return '- Missing internal links. Add 2-3 more relevant internal links if possible.'
        case 'missing_external_links':
          return '- Missing external citations. Add 1-2 authoritative external sources with links.'
        case 'missing_faqs':
          return `- Missing FAQ section. Add ${3 - currentFaqs.length} more relevant questions and answers.`
        case 'weak_headings':
          return '- Weak heading structure. Add 2-3 more H2 subheadings to break up content.'
        case 'poor_readability':
          return '- Poor readability. Shorten some long sentences and use simpler language.'
        default:
          return `- ${issue.type}: ${issue.severity} issue`
      }
    }).join('\n')

    const prompt = `You are reviewing an article and need to fix the following quality issues:

QUALITY ISSUES TO FIX:
${issueDescriptions}

CURRENT ARTICLE CONTENT:
${content}

INSTRUCTIONS:
1. Fix ALL the issues listed above
2. Maintain the article's overall tone and message
3. Keep the existing heading structure unless adding new headings
4. For external citations, use real, authoritative sources when possible
5. For FAQs, make them relevant and helpful to readers
6. Do NOT remove existing content unless consolidating
7. Ensure all HTML tags are properly closed

OUTPUT ONLY THE COMPLETE FIXED HTML CONTENT (no explanations or commentary).`

    try {
      const fixedContent = await this.claude.chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      return fixedContent

    } catch (error) {
      console.error('Error in auto-fix:', error)
      throw error
    }
  }

  /**
   * Calculate quality metrics for an article
   */
  calculateQualityMetrics(content, faqs = []) {
    const issues = []
    let score = 100

    // Strip HTML for word count
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length

    // Word count check (1500-2500)
    if (wordCount < 1500) {
      issues.push({ type: 'word_count_low', severity: 'major' })
      score -= 15
    } else if (wordCount > 2500) {
      issues.push({ type: 'word_count_high', severity: 'minor' })
      score -= 5
    }

    // Internal links check (3-5)
    const internalLinks = (content.match(/<a href/gi) || []).length
    if (internalLinks < 3) {
      issues.push({ type: 'missing_internal_links', severity: 'major' })
      score -= 15
    }

    // External links check (2-4)
    const externalLinkMatches = content.match(/href="http/gi) || []
    const externalLinks = externalLinkMatches.length
    if (externalLinks < 2) {
      issues.push({ type: 'missing_external_links', severity: 'minor' })
      score -= 10
    }

    // FAQ check (at least 3)
    if (!faqs || faqs.length < 3) {
      issues.push({ type: 'missing_faqs', severity: 'minor' })
      score -= 10
    }

    // Heading structure check
    const h2Count = (content.match(/<h2/gi) || []).length
    if (h2Count < 3) {
      issues.push({ type: 'weak_headings', severity: 'minor' })
      score -= 10
    }

    // Readability (simple heuristic - average sentence length)
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0
    if (avgSentenceLength > 25) {
      issues.push({ type: 'poor_readability', severity: 'minor' })
      score -= 10
    }

    return {
      score: Math.max(0, score),
      word_count: wordCount,
      issues,
    }
  }

  /**
   * Auto-assign contributor based on topic and content type
   * CRITICAL: Only assigns from the 4 approved GetEducated authors
   * Per spec section 8.2.2: Uses default_author_by_article_type table first
   *
   * PUBLIC BYLINE uses REAL NAME (Tony Huffman, Kayleigh Gilbert, Sarah, Charity)
   * NEVER use style proxy names (Kif, Alicia, Danny, Julia) as public bylines
   */
  async assignContributor(idea, contentType) {
    // APPROVED_AUTHORS is imported from useContributors hook
    // Contains: ['Tony Huffman', 'Kayleigh Gilbert', 'Sarah', 'Charity']

    try {
      // First, check if there's a default author for this content type (per spec 8.2.2)
      // Note: This table may not exist yet - it's an optional feature
      let defaultConfig = null
      try {
        const { data, error: configError } = await supabase
          .from('default_author_by_article_type')
          .select('default_author_name')
          .eq('article_type', contentType)
          .eq('is_active', true)
          .single()

        if (!configError) {
          defaultConfig = data
        }
      } catch (e) {
        // Table doesn't exist - ignore silently, this is an optional feature
      }

      const { data: contributors, error } = await supabase
        .from('article_contributors')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      // Filter to only approved authors
      const approvedContributors = contributors.filter(c =>
        APPROVED_AUTHORS.includes(c.name)
      )

      if (approvedContributors.length === 0) {
        console.error('No approved contributors found in database!')
        throw new Error('No approved GetEducated authors available')
      }

      // If we found a default author config, give that author a huge score boost
      const defaultAuthorName = defaultConfig?.default_author_name || null
      if (defaultAuthorName) {
        console.log(`[Generation] Default author for ${contentType}: ${defaultAuthorName}`)
      }

      // Score each contributor based on topic/content type match
      const scoredContributors = approvedContributors.map(contributor => {
        let score = 0

        // FIRST PRIORITY: Default author from config gets massive boost (per spec 8.2.2)
        if (defaultAuthorName && contributor.name === defaultAuthorName) {
          score += 100 // This ensures default author wins unless there's a very strong topic match
        }

        // Check expertise areas match with idea topics
        const ideaTopics = idea.seed_topics || []
        const expertiseMatch = contributor.expertise_areas?.some(area =>
          ideaTopics.some(topic => topic.toLowerCase().includes(area.toLowerCase()))
        )
        if (expertiseMatch) score += 50

        // Check content type match
        if (contributor.content_types && contributor.content_types.includes(contentType)) {
          score += 30
        }

        // Check title for keyword matches
        const titleWords = idea.title.toLowerCase().split(' ')
        const titleMatch = contributor.expertise_areas?.some(area =>
          titleWords.some(word => word.includes(area.toLowerCase()))
        )
        if (titleMatch) score += 20

        // Topic-specific author matching for GetEducated
        const title = idea.title.toLowerCase()

        // Tony Huffman - Rankings, cost analysis, affordability
        if (contributor.name === 'Tony Huffman') {
          if (title.includes('ranking') || title.includes('best') || title.includes('top') ||
              title.includes('affordable') || title.includes('cheapest') || title.includes('cost')) {
            score += 40
          }
        }

        // Kayleigh Gilbert - Healthcare, professional licensure, social work
        if (contributor.name === 'Kayleigh Gilbert') {
          if (title.includes('lcsw') || title.includes('nursing') || title.includes('healthcare') ||
              title.includes('social work') || title.includes('hospitality') || title.includes('licensure')) {
            score += 40
          }
        }

        // Sarah - Technical education, general guides, online learning basics
        if (contributor.name === 'Sarah') {
          if (title.includes('technical') || title.includes('online college') || title.includes('what degree') ||
              title.includes('how to') || title.includes('guide to') || title.includes('beginner')) {
            score += 40
          }
        }

        // Charity - Teaching, education degrees, certification, career change
        if (contributor.name === 'Charity') {
          if (title.includes('teaching') || title.includes('teacher') || title.includes('education degree') ||
              title.includes('mat ') || title.includes('med ') || title.includes('certification') ||
              title.includes('career change')) {
            score += 40
          }
        }

        return { contributor, score }
      })

      scoredContributors.sort((a, b) => b.score - a.score)

      const selectedContributor = scoredContributors[0].contributor
      console.log(`[Generation] Assigned contributor: ${selectedContributor.name} (${selectedContributor.display_name})`)

      return selectedContributor

    } catch (error) {
      console.error('Contributor assignment error:', error)
      // Return first approved author as fallback (Tony Huffman)
      // CRITICAL: display_name is the PUBLIC BYLINE (real name), style_proxy is INTERNAL only
      return {
        name: 'Tony Huffman',
        display_name: 'Tony Huffman',  // PUBLIC BYLINE = Real name
        style_proxy: 'Kif',            // INTERNAL only - for AI voice matching
        expertise_areas: ['rankings', 'cost-analysis', 'online-degrees'],
        content_types: ['ranking', 'analysis', 'comparison'],
        writing_style_profile: { tone: 'authoritative', complexity_level: 'intermediate' }
      }
    }
  }

  /**
   * Get relevant site articles for internal linking
   * Now uses the GetEducated catalog (geteducated_articles) for richer data
   * Falls back to legacy site_articles if GetEducated catalog is empty
   */
  async getRelevantSiteArticles(articleTitle, limit = 30, options = {}) {
    const { subjectArea, degreeLevel, excludeUrls = [] } = options

    try {
      // Extract topics from article title for matching
      const titleWords = articleTitle.toLowerCase().split(' ').filter(w => w.length > 3)

      // First, try to use the SQL function for intelligent matching
      const { data: rpcData, error: rpcError } = await supabase.rpc('find_relevant_ge_articles', {
        search_topics: titleWords,
        search_subject: subjectArea || null,
        search_degree_level: degreeLevel || null,
        exclude_urls: excludeUrls,
        result_limit: limit,
      })

      if (!rpcError && rpcData && rpcData.length > 0) {
        console.log(`[Generation] Found ${rpcData.length} relevant articles via SQL function`)
        return rpcData.slice(0, 5).map(a => ({
          id: a.id,
          url: a.url,
          title: a.title,
          excerpt: a.excerpt,
          topics: a.topics,
        }))
      }

      // Fallback: Direct query to geteducated_articles
      const { data: geArticles, error: geError } = await supabase
        .from('geteducated_articles')
        .select('id, url, title, excerpt, topics, content_type, degree_level, subject_area, times_linked_to')
        .not('content_text', 'is', null) // Only enriched articles
        .order('times_linked_to', { ascending: true }) // Prefer less-linked articles
        .limit(limit * 2)

      if (!geError && geArticles && geArticles.length > 0) {
        // Score articles by relevance
        const scoredArticles = geArticles
          .filter(a => !excludeUrls.includes(a.url))
          .map(article => {
            let score = 0

            const articleTitleWords = article.title.toLowerCase().split(' ')
            const commonWords = titleWords.filter(word =>
              articleTitleWords.some(aw => aw.includes(word))
            )
            score += commonWords.length * 10

            // Topic matching (stronger signal)
            if (article.topics && article.topics.length > 0) {
              const topicMatches = article.topics.filter(topic =>
                titleWords.some(word => topic.toLowerCase().includes(word))
              )
              score += topicMatches.length * 15
            }

            // Subject area bonus
            if (subjectArea && article.subject_area === subjectArea) {
              score += 20
            }

            // Degree level bonus
            if (degreeLevel && article.degree_level === degreeLevel) {
              score += 15
            }

            return { article, score }
          })

        scoredArticles.sort((a, b) => b.score - a.score)

        const results = scoredArticles
          .filter(a => a.score > 0)
          .slice(0, 5)
          .map(a => a.article)

        if (results.length > 0) {
          console.log(`[Generation] Found ${results.length} relevant articles from GetEducated catalog`)
          return results
        }
      }

      // Final fallback: Legacy site_articles table
      console.log('[Generation] Falling back to legacy site_articles table')
      const { data: legacyArticles, error: legacyError } = await supabase
        .from('site_articles')
        .select('*')
        .order('times_linked_to', { ascending: true })
        .limit(limit)

      if (legacyError) throw legacyError

      const scoredLegacy = (legacyArticles || []).map(article => {
        let score = 0

        const articleTitleWords = article.title.toLowerCase().split(' ')
        const commonWords = titleWords.filter(word =>
          articleTitleWords.some(aw => aw.includes(word))
        )
        score += commonWords.length * 10

        if (article.topics && article.topics.length > 0) {
          const topicMatches = article.topics.filter(topic =>
            titleWords.some(word => topic.toLowerCase().includes(word))
          )
          score += topicMatches.length * 15
        }

        return { article, score }
      })

      scoredLegacy.sort((a, b) => b.score - a.score)

      return scoredLegacy
        .filter(a => a.score > 0)
        .slice(0, 5)
        .map(a => a.article)

    } catch (error) {
      console.error('Error fetching site articles:', error)
      return []
    }
  }

  /**
   * Increment link count for articles that were linked to
   * Updates the GetEducated catalog tracking
   */
  async incrementArticleLinkCounts(articleUrls) {
    for (const url of articleUrls) {
      try {
        // Try the SQL function first
        await supabase.rpc('increment_article_link_count', { article_url: url })
      } catch (error) {
        // Fallback to manual increment
        const { data } = await supabase
          .from('geteducated_articles')
          .select('id, times_linked_to')
          .eq('url', url)
          .single()

        if (data) {
          await supabase
            .from('geteducated_articles')
            .update({ times_linked_to: (data.times_linked_to || 0) + 1 })
            .eq('id', data.id)
        }
      }
    }
  }

  /**
   * Add internal links to content using Claude
   */
  async addInternalLinksToContent(content, siteArticles) {
    const prompt = `Add 3-5 contextual internal links to this article content.

ARTICLE CONTENT:
${content}

AVAILABLE ARTICLES TO LINK TO:
${siteArticles.map(a => `- [${a.title}](${a.url})`).join('\n')}

INSTRUCTIONS:
1. Add links where genuinely relevant
2. Use natural anchor text
3. Distribute throughout article
4. Use HTML format: <a href="URL">anchor text</a>
5. Aim for 3-5 links total

OUTPUT ONLY THE UPDATED HTML CONTENT with links added.`

    try {
      const linkedContent = await this.claude.chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      return linkedContent

    } catch (error) {
      console.error('Error adding internal links:', error)
      return content
    }
  }

  /**
   * Generate URL slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)
  }

  /**
   * Save generated article to database
   */
  async saveArticle(articleData, ideaId, userId) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...articleData,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error

      // Update the idea
      await supabase
        .from('content_ideas')
        .update({ article_id: data.id, status: 'completed' })
        .eq('id', ideaId)

      return data

    } catch (error) {
      console.error('Error saving article:', error)
      throw error
    }
  }

  /**
   * Humanize existing content using StealthGPT (primary) or Claude (fallback)
   * @param {string} content - The content to humanize
   * @param {Object} options - Options including writingStyle, contributorName, useStealthGpt
   * @returns {string} - Humanized content
   */
  async humanizeContent(content, options = {}) {
    const { writingStyle, contributorName, useStealthGpt = true } = options

    // Try StealthGPT first if enabled and configured
    if (useStealthGpt && this.humanizationProvider === 'stealthgpt' && this.stealthGpt.isConfigured()) {
      try {
        console.log('[Generation] Humanizing with StealthGPT...')
        const humanizedContent = await this.stealthGpt.humanizeLongContent(content, {
          tone: this.stealthGptSettings.tone,
          mode: this.stealthGptSettings.mode,
          detector: this.stealthGptSettings.detector,
        })
        return humanizedContent
      } catch (error) {
        console.warn('[Generation] StealthGPT failed, falling back to Claude:', error.message)
      }
    }

    // Fallback to Claude
    const prompt = `Humanize this content to sound more natural and engaging.

${writingStyle ? `WRITING STYLE: ${writingStyle}` : ''}
${contributorName ? `AUTHOR PERSONA: ${contributorName}` : ''}

CURRENT CONTENT:
${content}

INSTRUCTIONS:
1. Maintain the core information and structure
2. Make the language more conversational and engaging
3. Vary sentence length and structure for better flow
4. Remove any robotic or formulaic phrases
5. Add personality while keeping professionalism
6. Keep all HTML formatting intact
7. Do NOT add new sections or significantly expand content

OUTPUT ONLY THE HUMANIZED HTML CONTENT.`

    try {
      const humanizedContent = await this.claude.chat([
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.9,
        max_tokens: 4500,
      })

      return humanizedContent
    } catch (error) {
      console.error('Error humanizing content:', error)
      throw error
    }
  }

  /**
   * Generate content ideas from a topic
   * @param {string} topic - The topic to generate ideas for
   * @param {number} count - Number of ideas to generate
   * @returns {Array} - Array of idea objects
   */
  async generateIdeas(topic, count = 5) {
    try {
      const ideas = await this.grok.generateIdeas(topic, count)
      return ideas
    } catch (error) {
      console.error('Error generating ideas:', error)
      throw error
    }
  }

  /**
   * Helper to update progress
   */
  updateProgress(callback, message, percentage) {
    if (callback) {
      callback({ message, percentage })
    }
    console.log(`[${percentage}%] ${message}`)
  }

  // ========================================
  // AUTOMATIC PIPELINE METHODS
  // ========================================

  /**
   * Run the full automatic pipeline:
   * 1. Discover new ideas from sources
   * 2. Filter duplicates and validate
   * 3. Generate articles for each idea
   * 4. Quality check and auto-fix
   * 5. Save to database
   */
  async runAutoPipeline(options = {}, onProgress, onComplete) {
    const {
      sources = ['reddit', 'news', 'trends', 'general'],
      customTopic = '',
      maxIdeas = 10,
      generateImmediately = true,
      userId,
      niche = 'higher education, online degrees, career development',
    } = options

    if (this.isProcessing) {
      throw new Error('Pipeline already running')
    }

    this.isProcessing = true
    const results = {
      discoveredIdeas: [],
      generatedArticles: [],
      failedIdeas: [],
      skippedIdeas: [],
    }

    try {
      // STAGE 1: Discover Ideas
      this.updateProgress(onProgress, 'Discovering new content ideas...', 5)

      const existingIdeas = await this.getExistingIdeas(userId)
      const existingTitles = existingIdeas.map(i => i.title)

      const discoveredIdeas = await this.ideaDiscovery.discoverIdeas({
        sources,
        customTopic,
        existingTopics: existingTitles,
        niche,
      })

      // Filter out duplicates using similarity check
      const uniqueIdeas = this.ideaDiscovery.filterDuplicates(
        discoveredIdeas,
        existingTitles,
        0.7 // 70% similarity threshold
      )

      results.discoveredIdeas = uniqueIdeas.slice(0, maxIdeas)
      results.skippedIdeas = discoveredIdeas.filter(
        i => !uniqueIdeas.includes(i)
      )

      this.updateProgress(
        onProgress,
        `Found ${results.discoveredIdeas.length} unique ideas`,
        15
      )

      // STAGE 2: Save Ideas to Database
      const savedIdeas = []
      for (const idea of results.discoveredIdeas) {
        try {
          const savedIdea = await this.saveIdea(idea, userId)
          savedIdeas.push(savedIdea)
        } catch (error) {
          console.error('Failed to save idea:', error)
        }
      }

      this.updateProgress(onProgress, `Saved ${savedIdeas.length} ideas`, 20)

      // STAGE 3: Generate Articles (if immediate mode)
      if (generateImmediately && savedIdeas.length > 0) {
        const progressPerIdea = 75 / savedIdeas.length

        for (let i = 0; i < savedIdeas.length; i++) {
          const idea = savedIdeas[i]
          const baseProgress = 20 + (i * progressPerIdea)

          try {
            this.updateProgress(
              onProgress,
              `Generating article ${i + 1}/${savedIdeas.length}: ${idea.title.substring(0, 40)}...`,
              baseProgress
            )

            // Generate the article
            const articleData = await this.generateArticleComplete(
              idea,
              {
                contentType: idea.content_type || 'guide',
                targetWordCount: 2000,
                autoAssignContributor: true,
                addInternalLinks: true,
                autoFix: true,
                maxFixAttempts: 3,
                qualityThreshold: 85,
              },
              (progress) => {
                const scaledProgress = baseProgress + (progress.percentage / 100 * progressPerIdea)
                this.updateProgress(onProgress, progress.message, scaledProgress)
              }
            )

            // Save article
            const savedArticle = await this.saveArticle(articleData, idea.id, userId)
            results.generatedArticles.push(savedArticle)

            this.updateProgress(
              onProgress,
              `✓ Completed article ${i + 1}/${savedIdeas.length}`,
              baseProgress + progressPerIdea
            )

          } catch (error) {
            console.error(`Failed to generate article for idea: ${idea.title}`, error)
            results.failedIdeas.push({ idea, error: error.message })
          }
        }
      }

      // STAGE 4: Finalize
      this.updateProgress(onProgress, 'Pipeline complete!', 100)

      if (onComplete) {
        onComplete(results)
      }

      return results

    } catch (error) {
      console.error('Auto pipeline error:', error)
      throw error
    } finally {
      this.isProcessing = false
      this.currentTask = null
    }
  }

  /**
   * Process a batch of ideas in sequence
   */
  async processBatch(ideaIds, userId, onProgress) {
    if (this.isProcessing) {
      throw new Error('Already processing')
    }

    this.isProcessing = true
    const results = {
      successful: [],
      failed: [],
    }

    try {
      // Fetch the ideas
      const { data: ideas, error } = await supabase
        .from('content_ideas')
        .select('*')
        .in('id', ideaIds)
        .eq('status', 'approved')

      if (error) throw error

      const progressPerIdea = 100 / ideas.length

      for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i]
        const baseProgress = i * progressPerIdea

        try {
          this.updateProgress(
            onProgress,
            `Processing ${i + 1}/${ideas.length}: ${idea.title.substring(0, 40)}...`,
            baseProgress
          )

          const articleData = await this.generateArticleComplete(
            idea,
            {
              contentType: idea.content_type || 'guide',
              targetWordCount: 2000,
              autoAssignContributor: true,
              addInternalLinks: true,
              autoFix: true,
            },
            (progress) => {
              const scaled = baseProgress + (progress.percentage / 100 * progressPerIdea)
              this.updateProgress(onProgress, progress.message, scaled)
            }
          )

          const savedArticle = await this.saveArticle(articleData, idea.id, userId)
          results.successful.push(savedArticle)

        } catch (error) {
          console.error(`Batch processing failed for: ${idea.title}`, error)
          results.failed.push({ idea, error: error.message })
        }
      }

      return results

    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Add ideas to the processing queue
   */
  async queueIdeas(ideaIds, userId) {
    for (const ideaId of ideaIds) {
      // Add to generation_queue table
      await supabase
        .from('generation_queue')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          status: 'pending',
          priority: 5,
        })
    }
  }

  /**
   * Process the next item in the queue
   */
  async processNextInQueue(userId, onProgress) {
    // Get next pending item
    const { data: queueItem, error } = await supabase
      .from('generation_queue')
      .select('*, content_ideas(*)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error || !queueItem) {
      return null
    }

    // Mark as processing
    await supabase
      .from('generation_queue')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', queueItem.id)

    try {
      const idea = queueItem.content_ideas
      const articleData = await this.generateArticleComplete(idea, {
        contentType: idea.content_type || 'guide',
        autoFix: true,
      }, onProgress)

      const savedArticle = await this.saveArticle(articleData, idea.id, userId)

      // Mark as completed
      await supabase
        .from('generation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          article_id: savedArticle.id,
        })
        .eq('id', queueItem.id)

      return savedArticle

    } catch (error) {
      // Mark as failed
      await supabase
        .from('generation_queue')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', queueItem.id)

      throw error
    }
  }

  /**
   * Get existing ideas for duplicate checking
   */
  async getExistingIdeas(userId) {
    const { data, error } = await supabase
      .from('content_ideas')
      .select('title, description')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching existing ideas:', error)
      return []
    }

    return data || []
  }

  /**
   * Save a discovered idea to the database
   */
  async saveIdea(idea, userId) {
    const { data, error } = await supabase
      .from('content_ideas')
      .insert({
        title: idea.title,
        description: idea.description,
        content_type: idea.content_type,
        target_keywords: idea.target_keywords,
        search_intent: idea.search_intent,
        source: idea.source,
        trending_reason: idea.trending_reason,
        status: 'approved', // Auto-approve discovered ideas
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentTask: this.currentTask,
      queueLength: this.processingQueue.length,
    }
  }

  /**
   * Stop the pipeline
   */
  stop() {
    this.isProcessing = false
    this.currentTask = null
  }

  // ========================================
  // HUMANIZATION CONFIGURATION
  // ========================================

  /**
   * Set the humanization provider
   * @param {string} provider - 'stealthgpt' or 'claude'
   */
  setHumanizationProvider(provider) {
    if (!['stealthgpt', 'claude'].includes(provider)) {
      throw new Error('Invalid humanization provider. Use "stealthgpt" or "claude"')
    }
    this.humanizationProvider = provider
    console.log(`[Generation] Humanization provider set to: ${provider}`)
  }

  /**
   * Get current humanization provider
   */
  getHumanizationProvider() {
    return this.humanizationProvider
  }

  /**
   * Configure StealthGPT settings
   * @param {Object} settings - StealthGPT configuration
   */
  setStealthGptSettings(settings = {}) {
    const { tone, mode, detector, business, doublePassing } = settings

    if (tone && ['Standard', 'HighSchool', 'College', 'PhD'].includes(tone)) {
      this.stealthGptSettings.tone = tone
    }

    if (mode && ['Low', 'Medium', 'High'].includes(mode)) {
      this.stealthGptSettings.mode = mode
    }

    if (detector && ['gptzero', 'turnitin'].includes(detector)) {
      this.stealthGptSettings.detector = detector
    }

    if (typeof business === 'boolean') {
      this.stealthGptSettings.business = business
    }

    if (typeof doublePassing === 'boolean') {
      this.stealthGptSettings.doublePassing = doublePassing
    }

    console.log('[Generation] StealthGPT settings updated:', this.stealthGptSettings)
  }

  /**
   * Get current StealthGPT settings
   */
  getStealthGptSettings() {
    return { ...this.stealthGptSettings }
  }

  /**
   * Check if StealthGPT is available
   */
  isStealthGptAvailable() {
    return this.stealthGpt.isConfigured()
  }

  /**
   * Get available humanization options for UI
   */
  static getHumanizationOptions() {
    return {
      providers: [
        { value: 'stealthgpt', label: 'StealthGPT', description: 'Specialized AI detection bypass' },
        { value: 'claude', label: 'Claude', description: 'Natural humanization with contributor voice' },
      ],
      tones: StealthGptClient.getToneOptions(),
      modes: StealthGptClient.getModeOptions(),
      detectors: StealthGptClient.getDetectorOptions(),
    }
  }

  // ========================================
  // AI REVISION FEEDBACK INTEGRATION
  // ========================================

  /**
   * Fetch past successful AI revisions to learn from
   * Per spec section 8.4: AI Training & Revision Log
   * @param {Object} options - Filter options
   * @returns {Array} Array of revision patterns
   */
  async getTrainingPatterns(options = {}) {
    const {
      limit = 20,
      contentType = null,
      minQualityScore = 80,
    } = options

    try {
      // Query revisions that are marked for training inclusion
      let query = supabase
        .from('ai_revisions')
        .select(`
          id,
          previous_version,
          revised_version,
          comments_snapshot,
          revision_type,
          created_at,
          articles(
            title,
            content_type,
            quality_score,
            contributor_name
          )
        `)
        .eq('include_in_training', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filter by content type if specified
      if (contentType) {
        query = query.eq('articles.content_type', contentType)
      }

      const { data, error } = await query

      if (error) {
        console.error('[Generation] Error fetching training patterns:', error)
        return []
      }

      // Filter by quality score and extract useful patterns
      const validRevisions = (data || []).filter(r =>
        r.articles && r.articles.quality_score >= minQualityScore
      )

      // Extract learning patterns from revisions
      const patterns = validRevisions.map(r => ({
        type: r.revision_type,
        contentType: r.articles.content_type,
        beforeSnippet: this.extractSnippet(r.previous_version, 200),
        afterSnippet: this.extractSnippet(r.revised_version, 200),
        feedback: r.comments_snapshot,
        contributor: r.articles.contributor_name,
      }))

      console.log(`[Generation] Loaded ${patterns.length} training patterns`)
      return patterns

    } catch (error) {
      console.error('[Generation] Error getting training patterns:', error)
      return []
    }
  }

  /**
   * Extract a representative snippet from content
   */
  extractSnippet(content, maxLength = 200) {
    if (!content) return ''
    // Strip HTML and get first N characters
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')
  }

  /**
   * Format training patterns for inclusion in AI prompts
   * @param {Array} patterns - Array of training patterns
   * @returns {string} Formatted string for prompt injection
   */
  formatPatternsForPrompt(patterns) {
    if (!patterns || patterns.length === 0) {
      return ''
    }

    let formatted = '\n\n=== LEARNED PATTERNS FROM PAST REVISIONS ===\n'
    formatted += 'The following patterns represent successful revisions. Apply similar improvements:\n\n'

    // Group by revision type for clarity
    const byType = {}
    patterns.forEach(p => {
      const type = p.type || 'general'
      if (!byType[type]) byType[type] = []
      byType[type].push(p)
    })

    for (const [type, typePatterns] of Object.entries(byType)) {
      formatted += `\n--- ${type.toUpperCase()} IMPROVEMENTS ---\n`

      typePatterns.slice(0, 3).forEach((p, i) => {
        formatted += `\nExample ${i + 1}:\n`
        if (p.beforeSnippet) {
          formatted += `BEFORE: "${p.beforeSnippet}"\n`
        }
        if (p.afterSnippet) {
          formatted += `AFTER: "${p.afterSnippet}"\n`
        }
        if (p.feedback && p.feedback.length > 0) {
          formatted += `FEEDBACK: ${JSON.stringify(p.feedback)}\n`
        }
      })
    }

    formatted += '\n=== END LEARNED PATTERNS ===\n'
    formatted += '\nApply these improvement patterns where appropriate.\n'

    return formatted
  }

  /**
   * Save a revision to the training data
   * @param {string} articleId - Article ID
   * @param {string} previousContent - Content before revision
   * @param {string} revisedContent - Content after revision
   * @param {Object} options - Additional options
   */
  async saveRevisionForTraining(articleId, previousContent, revisedContent, options = {}) {
    const {
      commentsSnapshot = [],
      revisionType = 'quality_fix',
      modelUsed = 'claude-sonnet-4',
      includeInTraining = true,
      userId = null,
    } = options

    try {
      const { data, error } = await supabase
        .from('ai_revisions')
        .insert({
          article_id: articleId,
          previous_version: previousContent,
          revised_version: revisedContent,
          comments_snapshot: commentsSnapshot,
          revision_type: revisionType,
          model_used: modelUsed,
          include_in_training: includeInTraining,
          triggered_by_user: userId,
        })
        .select()
        .single()

      if (error) throw error

      console.log(`[Generation] Saved revision for training: ${data.id}`)
      return data

    } catch (error) {
      console.error('[Generation] Error saving revision:', error)
      return null
    }
  }

  /**
   * Enhanced auto-fix with training pattern injection
   * This version uses past revisions to improve fix quality
   */
  async autoFixWithLearning(content, issues, options = {}) {
    const { articleId, contentType, contributor } = options

    // Fetch relevant training patterns
    const patterns = await this.getTrainingPatterns({
      contentType,
      limit: 10,
      minQualityScore: 80,
    })

    const patternContext = this.formatPatternsForPrompt(patterns)

    // Build enhanced prompt with training patterns
    const issueDescriptions = issues.map(i => `- ${i.type}: ${i.severity}`).join('\n')

    const prompt = `Fix the following quality issues in this article content.

QUALITY ISSUES TO FIX:
${issueDescriptions}

${patternContext}

CURRENT CONTENT:
${content}

INSTRUCTIONS:
1. Fix all listed quality issues
2. Apply learned patterns from successful revisions
3. Maintain the article structure and voice
4. Keep all HTML formatting intact
5. Do not add unrelated content

OUTPUT ONLY THE FIXED HTML CONTENT.`

    try {
      const fixedContent = await this.claude.chat([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 4500,
      })

      // Save this revision for future training
      if (articleId) {
        await this.saveRevisionForTraining(articleId, content, fixedContent, {
          commentsSnapshot: issues,
          revisionType: 'auto_fix',
          includeInTraining: true,
        })
      }

      return fixedContent

    } catch (error) {
      console.error('[Generation] Error in autoFixWithLearning:', error)
      return content // Return original on error
    }
  }
}

export default GenerationService
