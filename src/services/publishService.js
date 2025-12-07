/**
 * Publishing Service for GetEducated
 * Handles publishing articles via webhook (temporary) and WordPress API (future)
 *
 * Current Implementation: POST to n8n webhook
 * Future: Direct WordPress REST API integration
 */

import { supabase } from './supabaseClient'
import { validateForPublish } from './validation/prePublishValidation'
import { AUTHOR_DISPLAY_NAMES } from '../hooks/useContributors'

// Webhook endpoint for n8n WordPress publishing
const WEBHOOK_URL = 'https://willdisrupt.app.n8n.cloud/webhook-test/144c3e6f-63e7-4bca-b029-0a470f2e3f79'

/**
 * Publish an article via webhook
 * @param {Object} article - The article to publish
 * @param {Object} options - Publishing options
 * @returns {Object} Result with success status and details
 */
export async function publishArticle(article, options = {}) {
  const {
    status = 'draft', // 'draft' or 'publish'
    validateFirst = true,
    updateDatabase = true,
  } = options

  // Run pre-publish validation
  if (validateFirst) {
    const validation = validateForPublish(article)
    if (!validation.canPublish) {
      return {
        success: false,
        error: 'Validation failed',
        blockingIssues: validation.blockingIssues,
        validation,
      }
    }
  }

  // Prepare payload for webhook
  const payload = buildWebhookPayload(article, status)

  try {
    // POST to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Webhook error: ${response.status} - ${errorText}`)
    }

    // Parse response (may contain WordPress post ID)
    let webhookResponse = {}
    try {
      webhookResponse = await response.json()
    } catch {
      // Response might not be JSON
      webhookResponse = { raw: await response.text() }
    }

    // Update article status in database
    if (updateDatabase) {
      const updateData = {
        status: 'published',
        published_at: new Date().toISOString(),
      }

      // Store WordPress post ID if returned
      if (webhookResponse.post_id || webhookResponse.wordpress_post_id) {
        updateData.wordpress_post_id = webhookResponse.post_id || webhookResponse.wordpress_post_id
      }

      if (webhookResponse.url || webhookResponse.published_url) {
        updateData.published_url = webhookResponse.url || webhookResponse.published_url
      }

      const { error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', article.id)

      if (updateError) {
        console.error('Failed to update article status:', updateError)
        // Don't fail the whole operation, just log it
      }

      // Sync to GetEducated site catalog for internal linking
      const publishedUrl = webhookResponse.url || webhookResponse.published_url
      if (publishedUrl) {
        await syncToGetEducatedCatalog(article, publishedUrl)
      }
    }

    return {
      success: true,
      articleId: article.id,
      webhookResponse,
      publishedAt: new Date().toISOString(),
    }

  } catch (error) {
    console.error('Publishing error:', error)
    return {
      success: false,
      error: error.message,
      articleId: article.id,
    }
  }
}

/**
 * Build the webhook payload from an article
 * @param {Object} article - The article object
 * @param {string} status - 'draft' or 'publish'
 * @returns {Object} Webhook payload
 */
export function buildWebhookPayload(article, status = 'draft') {
  const authorName = article.contributor_name || article.article_contributors?.name
  const displayName = AUTHOR_DISPLAY_NAMES[authorName] || authorName

  return {
    // Article identification
    article_id: article.id,

    // Content
    title: article.title,
    content: article.content,
    excerpt: article.excerpt || generateExcerpt(article.content),

    // Author info
    author: authorName,
    author_display_name: displayName,

    // SEO metadata
    meta_title: article.meta_title || article.title,
    meta_description: article.meta_description || article.excerpt,
    focus_keyword: article.focus_keyword,
    slug: article.slug || generateSlug(article.title),

    // Structured data
    faqs: article.faqs || [],

    // Publishing settings
    status: status,
    published_at: new Date().toISOString(),

    // Quality metrics (for reference)
    quality_score: article.quality_score,
    risk_level: article.risk_level,
    word_count: article.word_count,
  }
}

/**
 * Generate an excerpt from content
 * @param {string} content - HTML content
 * @param {number} maxLength - Maximum excerpt length
 * @returns {string} Plain text excerpt
 */
function generateExcerpt(content, maxLength = 160) {
  if (!content) return ''

  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (plainText.length <= maxLength) return plainText

  // Cut at word boundary
  const truncated = plainText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace) + '...'
}

/**
 * Generate a URL-safe slug from title
 * @param {string} title - Article title
 * @returns {string} URL slug
 */
function generateSlug(title) {
  if (!title) return ''

  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
}

/**
 * Bulk publish multiple articles
 * @param {Array} articles - Array of articles to publish
 * @param {Object} options - Publishing options
 * @returns {Object} Results summary
 */
export async function bulkPublish(articles, options = {}) {
  const results = {
    total: articles.length,
    successful: 0,
    failed: 0,
    results: [],
  }

  for (const article of articles) {
    const result = await publishArticle(article, options)
    results.results.push(result)

    if (result.success) {
      results.successful++
    } else {
      results.failed++
    }

    // Small delay between requests to avoid overwhelming the webhook
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

/**
 * Check if an article is eligible for publishing
 * @param {Object} article - Article to check
 * @returns {Object} Eligibility result
 */
export function checkPublishEligibility(article) {
  const validation = validateForPublish(article)

  return {
    eligible: validation.canPublish,
    riskLevel: validation.riskLevel,
    qualityScore: validation.qualityScore,
    blockingIssues: validation.blockingIssues,
    warnings: validation.warnings,
    checks: validation.checks,
  }
}

/**
 * Retry a failed publish
 * @param {string} articleId - Article ID to retry
 * @param {Object} options - Publishing options
 * @returns {Object} Result
 */
export async function retryPublish(articleId, options = {}) {
  // Fetch the article fresh from database
  const { data: article, error } = await supabase
    .from('articles')
    .select('*, article_contributors(*)')
    .eq('id', articleId)
    .single()

  if (error) {
    return {
      success: false,
      error: `Failed to fetch article: ${error.message}`,
    }
  }

  return publishArticle(article, options)
}

/**
 * Sync published article to GetEducated site catalog
 * This adds the article to the geteducated_articles table for internal linking
 * @param {Object} article - The article that was published
 * @param {string} publishedUrl - The URL where the article was published
 */
async function syncToGetEducatedCatalog(article, publishedUrl) {
  try {
    // Strip HTML for text content
    const textContent = (article.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length

    // Generate slug from URL
    const slug = publishedUrl
      .replace('https://www.geteducated.com/', '')
      .replace(/\/$/, '')

    // Determine content type, degree level, subject area from article metadata or title
    const title = (article.title || '').toLowerCase()
    let contentType = 'guide'
    let degreeLevel = null
    let subjectArea = null

    // Content type detection
    if (title.includes('ranking') || title.includes('best') || title.includes('top') || title.includes('cheapest')) {
      contentType = 'ranking'
    } else if (title.includes('career') || title.includes('job') || title.includes('salary')) {
      contentType = 'career'
    } else if (title.includes('how to')) {
      contentType = 'how_to'
    }

    // Degree level detection
    if (title.includes('doctorate') || title.includes('phd') || title.includes('dnp') || title.includes('edd')) {
      degreeLevel = 'doctorate'
    } else if (title.includes('master') || title.includes('mba') || title.includes('msn')) {
      degreeLevel = 'masters'
    } else if (title.includes('bachelor') || title.includes('bsn')) {
      degreeLevel = 'bachelors'
    } else if (title.includes('associate')) {
      degreeLevel = 'associate'
    }

    // Subject area detection
    const subjectMap = {
      nursing: ['nursing', 'nurse', 'bsn', 'msn', 'dnp', 'rn'],
      business: ['business', 'mba', 'management', 'accounting', 'finance', 'marketing'],
      education: ['education', 'teaching', 'teacher', 'med', 'edd'],
      technology: ['technology', 'computer', 'cybersecurity', 'data science', 'software'],
      healthcare: ['healthcare', 'health', 'medical', 'public health'],
      psychology: ['psychology', 'counseling', 'mental health'],
      social_work: ['social work', 'msw'],
    }

    for (const [subject, keywords] of Object.entries(subjectMap)) {
      if (keywords.some(kw => title.includes(kw))) {
        subjectArea = subject
        break
      }
    }

    // Extract topics from focus keyword and title
    const topics = []
    if (article.focus_keyword) {
      topics.push(article.focus_keyword)
    }
    if (degreeLevel) topics.push(degreeLevel)
    if (subjectArea) topics.push(subjectArea.replace('_', ' '))

    // Upsert to GetEducated catalog
    const { error } = await supabase
      .from('geteducated_articles')
      .upsert({
        url: publishedUrl,
        slug,
        title: article.title,
        meta_description: article.meta_description || article.excerpt,
        excerpt: article.excerpt || textContent.substring(0, 300),
        content_html: article.content,
        content_text: textContent,
        word_count: wordCount,
        content_type: contentType,
        degree_level: degreeLevel,
        subject_area: subjectArea,
        topics: topics.length > 0 ? topics : null,
        primary_topic: topics[0] || null,
        author_name: article.contributor_name || null,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
        needs_rewrite: false,
        times_linked_to: 0,
      }, { onConflict: 'url' })

    if (error) {
      console.error('[PublishService] Failed to sync to GetEducated catalog:', error.message)
    } else {
      console.log('[PublishService] Article synced to GetEducated catalog:', publishedUrl)
    }
  } catch (error) {
    // Non-blocking - log but don't fail the publish
    console.error('[PublishService] Error syncing to GetEducated catalog:', error)
  }
}

export default {
  publishArticle,
  buildWebhookPayload,
  bulkPublish,
  checkPublishEligibility,
  retryPublish,
  syncToGetEducatedCatalog,
  WEBHOOK_URL,
}
