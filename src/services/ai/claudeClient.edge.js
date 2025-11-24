/**
 * Claude AI Client (Edge Function Version)
 * Calls Supabase Edge Function instead of Claude API directly
 * This keeps API keys secure on the server-side
 */

import { supabase } from '../supabaseClient'

class ClaudeClient {
  constructor() {
    this.functionName = 'claude-api'
  }

  /**
   * Call the Claude Edge Function
   */
  async callEdgeFunction(action, payload) {
    const { data, error } = await supabase.functions.invoke(this.functionName, {
      body: {
        action,
        payload,
      },
    })

    if (error) {
      throw new Error(`Claude Edge Function error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(`Claude API error: ${data.error}`)
    }

    return data.data
  }

  /**
   * Humanize AI-generated content to make it undetectable
   */
  async humanize(content, options = {}) {
    const {
      contributorProfile = null,
      targetPerplexity = 'high',
      targetBurstiness = 'high',
    } = options

    try {
      const result = await this.callEdgeFunction('humanize', {
        content,
        contributorProfile,
        targetPerplexity,
        targetBurstiness,
      })

      return result

    } catch (error) {
      console.error('Claude humanization error:', error)
      throw error
    }
  }

  /**
   * Auto-fix quality issues in content
   */
  async autoFixQualityIssues(content, issues, siteArticles = []) {
    try {
      const result = await this.callEdgeFunction('autoFixQualityIssues', {
        content,
        issues,
        siteArticles,
      })

      return result

    } catch (error) {
      console.error('Claude auto-fix error:', error)
      throw error
    }
  }

  /**
   * Revise content based on editorial feedback
   */
  async reviseWithFeedback(content, feedbackItems) {
    try {
      const result = await this.callEdgeFunction('reviseWithFeedback', {
        content,
        feedbackItems,
      })

      return result

    } catch (error) {
      console.error('Claude revision error:', error)
      throw error
    }
  }

  /**
   * Extract learning patterns from feedback for AI training
   */
  async extractLearningPatterns(originalContent, revisedContent, feedbackItems) {
    try {
      const result = await this.callEdgeFunction('extractLearningPatterns', {
        originalContent,
        revisedContent,
        feedbackItems,
      })

      return result

    } catch (error) {
      console.error('Claude pattern extraction error:', error)
      throw error
    }
  }

  /**
   * Add internal links to content
   */
  async addInternalLinks(content, siteArticles) {
    try {
      const result = await this.callEdgeFunction('addInternalLinks', {
        content,
        siteArticles,
      })

      return result

    } catch (error) {
      console.error('Claude add internal links error:', error)
      throw error
    }
  }
}

export default ClaudeClient
