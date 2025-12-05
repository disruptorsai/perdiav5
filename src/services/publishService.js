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

export default {
  publishArticle,
  buildWebhookPayload,
  bulkPublish,
  checkPublishEligibility,
  retryPublish,
  WEBHOOK_URL,
}
