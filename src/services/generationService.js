/**
 * Generation Service
 * Orchestrates the complete two-pass AI generation pipeline with quality checks
 * Pipeline: Grok Draft → Claude Humanize → Quality Check → Auto-Fix Loop → Save
 */

import GrokClient from './ai/grokClient'
import ClaudeClient from './ai/claudeClient'
import { supabase } from './supabaseClient'
import IdeaDiscoveryService from './ideaDiscoveryService'

class GenerationService {
  constructor() {
    this.grok = new GrokClient()
    this.claude = new ClaudeClient()
    this.ideaDiscovery = new IdeaDiscoveryService()
    this.isProcessing = false
    this.processingQueue = []
    this.currentTask = null
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
      this.updateProgress(onProgress, 'Generating draft with Grok AI...', 10)

      // STAGE 1: Generate draft with Grok
      const draftData = await this.grok.generateDraft(idea, {
        contentType,
        targetWordCount,
      })

      this.updateProgress(onProgress, 'Auto-assigning contributor...', 25)

      // STAGE 2: Auto-assign contributor
      let contributor = null
      if (autoAssignContributor) {
        contributor = await this.assignContributor(idea, contentType)
      }

      this.updateProgress(onProgress, 'Humanizing content with Claude AI...', 40)

      // STAGE 3: Humanize with Claude
      const humanizedContent = await this.claude.humanize(draftData.content, {
        contributorProfile: contributor,
        targetPerplexity: 'high',
        targetBurstiness: 'high',
      })

      this.updateProgress(onProgress, 'Adding internal links...', 55)

      // STAGE 4: Add internal links
      let finalContent = humanizedContent
      if (addInternalLinks) {
        const siteArticles = await this.getRelevantSiteArticles(draftData.title, 30)
        if (siteArticles.length >= 3) {
          finalContent = await this.addInternalLinksToContent(humanizedContent, siteArticles)
        }
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
   */
  async assignContributor(idea, contentType) {
    try {
      const { data: contributors, error } = await supabase
        .from('article_contributors')
        .select('*')

      if (error) throw error

      // Score each contributor
      const scoredContributors = contributors.map(contributor => {
        let score = 0

        // Check expertise areas
        const ideaTopics = idea.seed_topics || []
        const expertiseMatch = contributor.expertise_areas.some(area =>
          ideaTopics.some(topic => topic.toLowerCase().includes(area.toLowerCase()))
        )
        if (expertiseMatch) score += 50

        // Check content type match
        if (contributor.content_types && contributor.content_types.includes(contentType)) {
          score += 30
        }

        // Check title for keyword matches
        const titleWords = idea.title.toLowerCase().split(' ')
        const titleMatch = contributor.expertise_areas.some(area =>
          titleWords.some(word => word.includes(area.toLowerCase()))
        )
        if (titleMatch) score += 20

        return { contributor, score }
      })

      scoredContributors.sort((a, b) => b.score - a.score)

      return scoredContributors[0].contributor

    } catch (error) {
      console.error('Contributor assignment error:', error)
      return null
    }
  }

  /**
   * Get relevant site articles for internal linking
   */
  async getRelevantSiteArticles(articleTitle, limit = 30) {
    try {
      const { data: articles, error } = await supabase
        .from('site_articles')
        .select('*')
        .order('times_linked_to', { ascending: true })
        .limit(limit)

      if (error) throw error

      // Score articles by relevance
      const titleWords = articleTitle.toLowerCase().split(' ').filter(w => w.length > 3)

      const scoredArticles = articles.map(article => {
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

      scoredArticles.sort((a, b) => b.score - a.score)

      return scoredArticles
        .filter(a => a.score > 0)
        .slice(0, 5)
        .map(a => a.article)

    } catch (error) {
      console.error('Error fetching site articles:', error)
      return []
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
   * Humanize existing content using Claude
   * @param {string} content - The content to humanize
   * @param {Object} options - Options including writingStyle and contributorName
   * @returns {string} - Humanized content
   */
  async humanizeContent(content, options = {}) {
    const { writingStyle, contributorName } = options

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
}

export default GenerationService
