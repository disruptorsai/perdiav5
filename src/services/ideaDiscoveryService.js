/**
 * IdeaDiscoveryService - Discovers trending content ideas using AI with web context
 *
 * This service uses Grok's web search capabilities to find:
 * - Trending topics on Reddit
 * - Current news and trends
 * - Google Trends data
 * - General topic exploration
 */

import GrokClient from './ai/grokClient'

class IdeaDiscoveryService {
  constructor() {
    this.grokClient = new GrokClient()
  }

  /**
   * Discover new content ideas from multiple sources
   * @param {Object} options - Discovery options
   * @param {string[]} options.sources - Sources to search ['reddit', 'news', 'trends', 'general']
   * @param {string} options.customTopic - Optional custom topic focus
   * @param {string[]} options.existingTopics - Existing topics to avoid duplicates
   * @param {string[]} options.coveredKeywords - Keywords already covered
   * @param {Object[]} options.topPerformingArticles - Top articles for context
   * @param {string} options.niche - The niche/industry focus (e.g., 'higher education')
   * @returns {Promise<Object[]>} Array of discovered ideas
   */
  async discoverIdeas({
    sources = ['reddit', 'news', 'trends', 'general'],
    customTopic = '',
    existingTopics = [],
    coveredKeywords = [],
    topPerformingArticles = [],
    niche = 'higher education, online degrees, career development'
  }) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const sourceDescriptions = {
      reddit: 'Reddit discussions, trending subreddits like r/college, r/careerguidance, r/education, r/gradschool',
      news: 'Current news articles, recent headlines, breaking stories in education and careers',
      trends: 'Google Trends, search volume data, emerging search queries',
      general: 'General topic exploration, evergreen content opportunities, seasonal trends'
    }

    const selectedSources = sources
      .filter(s => sourceDescriptions[s])
      .map(s => sourceDescriptions[s])
      .join('\n- ')

    const topArticlesContext = topPerformingArticles.length > 0
      ? `\n\nTop performing articles to learn from (generate similar quality topics):\n${topPerformingArticles.map(a => `- "${a.title}" (${a.views || 0} views)`).join('\n')}`
      : ''

    const existingTopicsContext = existingTopics.length > 0
      ? `\n\nAVOID these existing topics (already covered):\n${existingTopics.slice(0, 50).map(t => `- ${t}`).join('\n')}`
      : ''

    const coveredKeywordsContext = coveredKeywords.length > 0
      ? `\n\nKeywords already covered (find NEW angles):\n${coveredKeywords.slice(0, 30).join(', ')}`
      : ''

    const customTopicContext = customTopic
      ? `\n\nUSER REQUESTED FOCUS: "${customTopic}" - prioritize ideas related to this topic.`
      : ''

    const prompt = `You are a content strategist specializing in ${niche}. Today is ${currentDate}.

Your task is to discover 10 UNIQUE, HIGH-VALUE content ideas by researching current trends and discussions.

SOURCES TO RESEARCH:
- ${selectedSources}
${customTopicContext}
${topArticlesContext}
${existingTopicsContext}
${coveredKeywordsContext}

REQUIREMENTS FOR EACH IDEA:
1. Must be TIMELY and RELEVANT to current trends/discussions
2. Must have clear SEARCH INTENT (what problem does it solve?)
3. Must be UNIQUE - not duplicating existing content
4. Should target SPECIFIC keywords with search volume potential
5. Must align with the ${niche} niche

For each idea, determine the best content type:
- "guide" - How-to guides, step-by-step instructions
- "listicle" - Top X lists, rankings, comparisons
- "career_guide" - Career paths, job market insights
- "ranking" - School rankings, program comparisons
- "explainer" - Concept explanations, what-is articles
- "review" - Program reviews, tool reviews

Return a JSON object with this exact structure:
{
  "ideas": [
    {
      "title": "Clear, SEO-optimized title (50-60 chars ideal)",
      "description": "2-3 sentence description explaining the topic and why it's timely",
      "content_type": "guide|listicle|career_guide|ranking|explainer|review",
      "target_keywords": ["primary keyword", "secondary keyword", "tertiary keyword"],
      "search_intent": "informational|commercial|transactional|navigational",
      "estimated_search_volume": "high|medium|low",
      "trending_reason": "Why this topic is trending NOW",
      "source": "reddit|news|trends|general"
    }
  ]
}

Generate exactly 10 unique ideas. Be creative but practical. Focus on topics people are ACTIVELY searching for RIGHT NOW.`

    try {
      const response = await this.grokClient.generateWithWebContext(prompt)

      // Parse and validate the response
      let ideas = []
      try {
        const parsed = typeof response === 'string' ? JSON.parse(response) : response
        ideas = parsed.ideas || parsed || []
      } catch (parseError) {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          ideas = parsed.ideas || []
        }
      }

      // Validate and clean ideas
      return ideas
        .filter(idea => idea.title && idea.description)
        .map(idea => ({
          title: idea.title?.trim() || '',
          description: idea.description?.trim() || '',
          content_type: this.validateContentType(idea.content_type),
          target_keywords: Array.isArray(idea.target_keywords) ? idea.target_keywords : [],
          search_intent: idea.search_intent || 'informational',
          estimated_search_volume: idea.estimated_search_volume || 'medium',
          trending_reason: idea.trending_reason || '',
          source: idea.source || 'general',
          discovered_at: new Date().toISOString()
        }))
    } catch (error) {
      console.error('Idea discovery error:', error)
      throw new Error(`Failed to discover ideas: ${error.message}`)
    }
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '')

    if (s1 === s2) return 1.0
    if (s1.length === 0 || s2.length === 0) return 0.0

    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1

    const editDistance = this.getEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  getEditDistance(s1, s2) {
    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  /**
   * Filter out duplicate ideas based on similarity threshold
   */
  filterDuplicates(ideas, existingTitles, threshold = 0.7) {
    return ideas.filter(idea => {
      const isDuplicate = existingTitles.some(existing => {
        const similarity = this.calculateSimilarity(idea.title, existing)
        return similarity > threshold
      })
      return !isDuplicate
    })
  }

  /**
   * Validate content type
   */
  validateContentType(type) {
    const validTypes = ['guide', 'listicle', 'career_guide', 'ranking', 'explainer', 'review']
    return validTypes.includes(type) ? type : 'guide'
  }

  /**
   * Auto-detect content type from title
   */
  detectContentType(title) {
    const lowerTitle = title.toLowerCase()

    if (/\d+\s*(best|top|ways|tips|steps|things)/.test(lowerTitle)) {
      return 'listicle'
    }
    if (/(career|job|salary|profession|work)/.test(lowerTitle)) {
      return 'career_guide'
    }
    if (/(rank|best\s+\w+\s+program|top\s+\w+\s+school|vs|versus|comparison)/.test(lowerTitle)) {
      return 'ranking'
    }
    if (/(what\s+is|how\s+does|explained|understanding|guide\s+to)/.test(lowerTitle)) {
      return 'explainer'
    }
    if (/(review|worth\s+it|honest|experience)/.test(lowerTitle)) {
      return 'review'
    }

    return 'guide'
  }

  /**
   * Generate SEO-optimized title from an idea
   */
  async generateOptimizedTitle(idea, existingTitles = []) {
    const prompt = `Generate an SEO-optimized article title for this topic:

Original idea: "${idea.title}"
Description: "${idea.description}"
Target keywords: ${idea.target_keywords?.join(', ') || 'N/A'}
Content type: ${idea.content_type}

Requirements:
- 50-60 characters ideal length
- Include primary keyword near the beginning
- Make it compelling and click-worthy
- Avoid clickbait - be accurate and helpful
- Must be DIFFERENT from these existing titles:
${existingTitles.slice(0, 20).map(t => `- ${t}`).join('\n')}

Return ONLY the optimized title, nothing else.`

    try {
      const response = await this.grokClient.generate(prompt)
      const title = response.trim().replace(/^["']|["']$/g, '')
      return title || idea.title
    } catch (error) {
      console.error('Title optimization error:', error)
      return idea.title
    }
  }
}

export default IdeaDiscoveryService
