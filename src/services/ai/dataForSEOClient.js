/**
 * DataForSEO Client for Keyword Research
 * Provides long-tail keyword discovery and search volume data
 */

class DataForSEOClient {
  constructor(username, password) {
    this.username = username || import.meta.env.VITE_DATAFORSEO_USERNAME
    this.password = password || import.meta.env.VITE_DATAFORSEO_PASSWORD
    this.baseUrl = 'https://api.dataforseo.com/v3'
  }

  /**
   * Make authenticated request to DataForSEO API
   */
  async request(endpoint, payload) {
    const auth = btoa(`${this.username}:${this.password}`)

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DataForSEO API error: ${error.status_message || 'Unknown error'}`)
    }

    const data = await response.json()

    if (data.status_code !== 20000) {
      throw new Error(`DataForSEO error: ${data.status_message}`)
    }

    return data
  }

  /**
   * Get keyword suggestions based on seed keywords
   */
  async getKeywordSuggestions(seedKeywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
      limit = 100,
      includeSerp = true,
      sortBy = 'search_volume',
    } = options

    const keywords = Array.isArray(seedKeywords) ? seedKeywords : [seedKeywords]

    const payload = [{
      location_name: location,
      language_name: language,
      keywords: keywords,
      include_serp_info: includeSerp,
      sort_by: sortBy,
    }]

    try {
      const data = await this.request('/keywords_data/google_ads/keywords_for_keywords/live', payload)

      const results = data.tasks[0]?.result?.[0]?.items || []

      return results
        .filter(item => item.search_volume > 0)
        .map(item => ({
          keyword: item.keyword,
          search_volume: item.search_volume,
          competition: item.competition,
          competition_level: item.competition_level, // LOW, MEDIUM, HIGH
          cpc: item.cpc,
          monthly_searches: item.monthly_searches,
          trend: this.calculateTrend(item.monthly_searches),
          difficulty: this.calculateDifficulty(item),
          opportunity_score: this.calculateOpportunityScore(item),
        }))
        .slice(0, limit)

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

    const payload = [{
      location_name: location,
      language_name: language,
      keywords: keywordArray,
    }]

    try {
      const data = await this.request('/keywords_data/google_ads/search_volume/live', payload)

      const results = data.tasks[0]?.result?.[0]?.items || []

      return results.map(item => ({
        keyword: item.keyword,
        search_volume: item.search_volume,
        competition: item.competition,
        cpc: item.cpc,
      }))

    } catch (error) {
      console.error('DataForSEO search volume error:', error)
      throw error
    }
  }

  /**
   * Calculate trend from monthly searches data
   */
  calculateTrend(monthlySearches) {
    if (!monthlySearches || monthlySearches.length < 2) {
      return 'stable'
    }

    // Get last 3 months
    const recent = monthlySearches.slice(-3)
    const avgRecent = recent.reduce((sum, m) => sum + m.search_volume, 0) / recent.length

    // Get previous 3 months
    const previous = monthlySearches.slice(-6, -3)
    if (previous.length === 0) return 'stable'

    const avgPrevious = previous.reduce((sum, m) => sum + m.search_volume, 0) / previous.length

    const percentChange = ((avgRecent - avgPrevious) / avgPrevious) * 100

    if (percentChange > 20) return 'rising'
    if (percentChange < -20) return 'declining'
    return 'stable'
  }

  /**
   * Calculate difficulty score (0-100)
   * Lower is easier to rank for
   */
  calculateDifficulty(keywordData) {
    const { competition, competition_level, cpc, search_volume } = keywordData

    let score = 0

    // Competition level (0-40 points)
    if (competition_level === 'LOW') score += 10
    else if (competition_level === 'MEDIUM') score += 25
    else if (competition_level === 'HIGH') score += 40

    // CPC factor (0-30 points) - Higher CPC = more competitive
    if (cpc < 0.5) score += 5
    else if (cpc < 2) score += 15
    else if (cpc < 5) score += 25
    else score += 30

    // Volume factor (0-30 points) - Higher volume = more competitive
    if (search_volume < 500) score += 5
    else if (search_volume < 2000) score += 15
    else if (search_volume < 10000) score += 25
    else score += 30

    return Math.min(100, score)
  }

  /**
   * Calculate opportunity score (0-100)
   * Higher is better - good volume with low competition
   */
  calculateOpportunityScore(keywordData) {
    const { search_volume, competition_level, cpc } = keywordData
    const difficulty = this.calculateDifficulty(keywordData)

    let score = 0

    // Volume score (0-40 points) - Sweet spot is 500-5000
    if (search_volume >= 500 && search_volume <= 5000) score += 40
    else if (search_volume > 5000 && search_volume <= 10000) score += 30
    else if (search_volume > 100 && search_volume < 500) score += 25
    else if (search_volume > 10000) score += 20
    else score += 10

    // Competition score (0-40 points) - Lower is better
    if (competition_level === 'LOW') score += 40
    else if (competition_level === 'MEDIUM') score += 20
    else score += 5

    // CPC score (0-20 points) - Moderate CPC is good (shows value but not too competitive)
    if (cpc >= 1 && cpc <= 3) score += 20
    else if (cpc > 3 && cpc <= 5) score += 15
    else if (cpc > 0.5 && cpc < 1) score += 15
    else if (cpc > 5) score += 5
    else score += 10

    return Math.min(100, score)
  }

  /**
   * Get SERP analysis (optional, uses more credits)
   */
  async getSerpAnalysis(keyword, options = {}) {
    const {
      location = 'United States',
      language = 'English',
    } = options

    const payload = [{
      location_name: location,
      language_name: language,
      keyword: keyword,
    }]

    try {
      const data = await this.request('/serp/google/organic/live/advanced', payload)

      const items = data.tasks[0]?.result?.[0]?.items || []

      return {
        keyword,
        total_results: items.length,
        top_results: items.slice(0, 10).map(item => ({
          position: item.rank_group,
          title: item.title,
          url: item.url,
          domain: item.domain,
        })),
      }

    } catch (error) {
      console.error('DataForSEO SERP analysis error:', error)
      throw error
    }
  }

  /**
   * Filter keywords by criteria
   */
  filterKeywords(keywords, criteria = {}) {
    const {
      minSearchVolume = 100,
      maxSearchVolume = Infinity,
      maxDifficulty = 70,
      minOpportunityScore = 50,
      excludeKeywords = [],
      trend = null, // 'rising', 'stable', 'declining'
    } = criteria

    return keywords.filter(kw => {
      // Volume filters
      if (kw.search_volume < minSearchVolume) return false
      if (kw.search_volume > maxSearchVolume) return false

      // Difficulty filter
      if (kw.difficulty > maxDifficulty) return false

      // Opportunity score filter
      if (kw.opportunity_score < minOpportunityScore) return false

      // Exclude specific keywords
      if (excludeKeywords.some(excluded => kw.keyword.toLowerCase().includes(excluded.toLowerCase()))) {
        return false
      }

      // Trend filter
      if (trend && kw.trend !== trend) return false

      return true
    })
  }

  /**
   * Rank keywords by opportunity score
   */
  rankKeywords(keywords) {
    return keywords.sort((a, b) => b.opportunity_score - a.opportunity_score)
  }
}

export default DataForSEOClient
