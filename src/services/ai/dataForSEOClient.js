/**
 * DataForSEO Client for Keyword Research
 * Uses Supabase Edge Function to proxy requests (avoids CORS and keeps credentials secure)
 */

import { supabase } from '../supabaseClient'

class DataForSEOClient {
  constructor() {
    // Get the Supabase URL for Edge Function calls
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    this.functionName = 'dataforseo-api'
  }

  /**
   * Call the DataForSEO Edge Function
   */
  async callEdgeFunction(action, payload) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User must be authenticated to use DataForSEO')
    }

    const response = await fetch(`${this.supabaseUrl}/functions/v1/${this.functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function error: ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Unknown error from DataForSEO')
    }

    return result.data
  }

  /**
   * Get keyword suggestions based on seed keywords
   */
  async getKeywordSuggestions(seedKeywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
      limit = 50,
    } = options

    const keywords = Array.isArray(seedKeywords) ? seedKeywords : [seedKeywords]

    try {
      const results = await this.callEdgeFunction('getKeywordSuggestions', {
        seedKeywords: keywords,
        location,
        language,
        limit,
      })

      return results
    } catch (error) {
      console.error('DataForSEO keyword suggestions error:', error)
      throw error
    }
  }

  /**
   * Get search volume for specific keywords
   */
  async getSearchVolume(keywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
    } = options

    const keywordArray = Array.isArray(keywords) ? keywords : [keywords]

    try {
      const results = await this.callEdgeFunction('getSearchVolume', {
        keywords: keywordArray,
        location,
        language,
      })

      return results
    } catch (error) {
      console.error('DataForSEO search volume error:', error)
      throw error
    }
  }

  /**
   * Get SERP analysis (optional, uses more credits)
   */
  async getSerpAnalysis(keyword, options = {}) {
    const {
      location = 'United States',
      language = 'English',
    } = options

    try {
      const result = await this.callEdgeFunction('getSerpAnalysis', {
        keyword,
        location,
        language,
      })

      return result
    } catch (error) {
      console.error('DataForSEO SERP analysis error:', error)
      throw error
    }
  }

  /**
   * Filter keywords by criteria (client-side filtering)
   */
  filterKeywords(keywords, criteria = {}) {
    const {
      minSearchVolume = 100,
      maxSearchVolume = Infinity,
      maxDifficulty = 70,
      minOpportunityScore = 50,
      excludeKeywords = [],
      trend = null,
    } = criteria

    return keywords.filter(kw => {
      if (kw.search_volume < minSearchVolume) return false
      if (kw.search_volume > maxSearchVolume) return false
      if (kw.difficulty > maxDifficulty) return false
      if (kw.opportunity_score < minOpportunityScore) return false

      if (excludeKeywords.some(excluded =>
        kw.keyword.toLowerCase().includes(excluded.toLowerCase())
      )) {
        return false
      }

      if (trend && kw.trend !== trend) return false

      return true
    })
  }

  /**
   * Rank keywords by opportunity score (client-side sorting)
   */
  rankKeywords(keywords) {
    return keywords.sort((a, b) => b.opportunity_score - a.opportunity_score)
  }
}

export default DataForSEOClient
