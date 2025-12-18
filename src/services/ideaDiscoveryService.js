/**
 * IdeaDiscoveryService - Monetization-First Content Idea Discovery
 *
 * CRITICAL PRINCIPLE (per Tony Huffman's requirements):
 * "Content articles for the sake of articles and traffic isn't the goal,
 * its content and traffic we can monetize."
 *
 * This service now uses a MONETIZATION-FIRST approach:
 * 1. Load monetizable categories, concentrations, and paid schools
 * 2. Generate ideas that FIT these monetizable areas
 * 3. Validate and filter ideas by monetization potential
 * 4. Reject ideas that cannot be monetized (e.g., "space tourism", "forest ranger")
 */

import GrokClient from './ai/grokClient.edge'
import { supabase } from './supabaseClient'

/**
 * Banned topic patterns - topics with NO monetization potential
 * These will be automatically rejected
 */
const BANNED_TOPIC_PATTERNS = [
  /space\s*(tourism|exploration|careers?)/i,
  /astronaut/i,
  /forest\s*ranger/i,
  /park\s*ranger/i,
  /wildlife\s*(officer|warden|conservation)/i,
  /marine\s*biology/i,  // Very niche, few online programs
  /archaeology/i,       // Very niche
  /paleontology/i,      // Very niche
  /zoology/i,           // Very niche
  /oceanography/i,      // Very niche
  /astronomy/i,         // Very niche
  /astrophysics/i,      // Very niche
]

class IdeaDiscoveryService {
  constructor() {
    this.grokClient = new GrokClient()
    this.learnedPatterns = null
    this.monetizationContext = null
  }

  // ============================================================================
  // MONETIZATION CONTEXT - The core of monetization-first approach
  // ============================================================================

  /**
   * Load monetization context: categories, concentrations, paid schools
   * This data tells the AI what topics we CAN actually monetize
   */
  async getMonetizationContext() {
    // Return cached if available and recent (5 minutes)
    if (this.monetizationContext &&
        this.monetizationContext.loadedAt > Date.now() - 5 * 60 * 1000) {
      return this.monetizationContext
    }

    try {
      // Fetch categories and concentrations
      const { data: categories, error: catError } = await supabase
        .from('monetization_categories')
        .select('category_id, concentration_id, category, concentration')
        .eq('is_active', true)
        .order('category')

      if (catError) throw catError

      // Fetch paid schools with degree counts
      const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('id, school_name, school_slug')
        .eq('is_paid_client', true)
        .eq('is_active', true)
        .order('school_name')

      if (schoolError) throw schoolError

      // Fetch degree counts per school
      const { data: degreeCounts, error: degreeError } = await supabase
        .from('paid_school_degrees')
        .select('school_name')

      // Count degrees per school
      const schoolDegreeCounts = {}
      if (degreeCounts) {
        degreeCounts.forEach(d => {
          schoolDegreeCounts[d.school_name] = (schoolDegreeCounts[d.school_name] || 0) + 1
        })
      }

      // Fetch degree levels
      const { data: levels, error: levelError } = await supabase
        .from('monetization_levels')
        .select('level_code, level_name')
        .eq('is_active', true)
        .order('level_code')

      // Group categories by name with their concentrations
      const categoryMap = new Map()
      categories?.forEach(cat => {
        if (!categoryMap.has(cat.category)) {
          categoryMap.set(cat.category, {
            id: cat.category_id,
            name: cat.category,
            concentrations: []
          })
        }
        categoryMap.get(cat.category).concentrations.push({
          id: cat.concentration_id,
          name: cat.concentration
        })
      })

      // Sort schools by degree count (most degrees first)
      const sortedSchools = schools?.map(s => ({
        ...s,
        degreeCount: schoolDegreeCounts[s.school_name] || 0
      })).sort((a, b) => b.degreeCount - a.degreeCount) || []

      this.monetizationContext = {
        categories: Array.from(categoryMap.values()),
        schools: sortedSchools,
        levels: levels || [],
        loadedAt: Date.now(),
        stats: {
          totalCategories: categoryMap.size,
          totalConcentrations: categories?.length || 0,
          totalPaidSchools: schools?.length || 0
        }
      }

      return this.monetizationContext
    } catch (error) {
      console.error('Failed to load monetization context:', error)
      return null
    }
  }

  /**
   * Build the monetization context section for AI prompts
   * This is CRITICAL - it tells the AI what we can monetize
   */
  buildMonetizationPromptSection(context) {
    if (!context) return ''

    let section = `

=== MONETIZATION REQUIREMENTS (CRITICAL - READ CAREFULLY) ===

GetEducated.com ONLY makes money when content leads to degree program signups.
Topics with no connection to our paid schools/degrees are WORTHLESS.

Every idea you suggest MUST:
1. Match one of our monetizable categories below
2. Be relevant to online degree programs
3. Target prospective online students
4. Have potential to drive degree signups

=== MONETIZABLE CATEGORIES (ONLY suggest topics in these areas) ===
`

    // Add categories with concentrations
    context.categories.forEach((cat, index) => {
      const concentrations = cat.concentrations.map(c => c.name).join(', ')
      section += `\n${index + 1}. ${cat.name}: ${concentrations}`
    })

    section += `

=== PAID SCHOOLS (mention these when relevant) ===
Top schools by program count:
`

    // Add top 25 paid schools
    context.schools.slice(0, 25).forEach(school => {
      section += `- ${school.school_name} (${school.degreeCount} online programs)\n`
    })

    section += `
=== DEGREE LEVELS ===
`
    context.levels.forEach(level => {
      section += `- ${level.level_name}\n`
    })

    section += `
=== BANNED TOPICS (NEVER suggest these - zero monetization potential) ===
- Space careers, astronomy, astrophysics
- Forest/park ranger careers
- Wildlife conservation careers
- Marine biology, oceanography
- Archaeology, paleontology
- Any topic that can't connect to online degree programs
- Any topic where we have ZERO paid schools offering related degrees

=== END MONETIZATION REQUIREMENTS ===
`

    return section
  }

  // ============================================================================
  // MONETIZATION VALIDATION - Filter out non-monetizable ideas
  // ============================================================================

  /**
   * Validate an idea's monetization potential
   * Returns a score 0-100 and matched category info
   */
  async validateIdeaMonetization(idea) {
    const context = await this.getMonetizationContext()
    if (!context) {
      return { score: 0, confidence: 'unknown', reason: 'Failed to load monetization context' }
    }

    const titleLower = (idea.title || '').toLowerCase()
    const descLower = (idea.description || '').toLowerCase()
    const combined = `${titleLower} ${descLower}`

    // Check against banned patterns first
    for (const pattern of BANNED_TOPIC_PATTERNS) {
      if (pattern.test(combined)) {
        return {
          score: 0,
          confidence: 'banned',
          reason: `Topic matches banned pattern: ${pattern}`,
          matchedCategory: null
        }
      }
    }

    // Score against categories and concentrations
    let bestMatch = null
    let bestScore = 0

    for (const category of context.categories) {
      let categoryScore = 0

      // Check category name match
      const categoryWords = category.name.toLowerCase().split(/\s+/)
      for (const word of categoryWords) {
        if (word.length > 3 && combined.includes(word)) {
          categoryScore += 15
        }
      }

      // Check concentration matches
      for (const conc of category.concentrations) {
        const concLower = conc.name.toLowerCase()

        // Exact concentration match is high value
        if (combined.includes(concLower)) {
          categoryScore += 40
        } else {
          // Word-level matching
          const concWords = concLower.split(/\s+/)
          for (const word of concWords) {
            if (word.length > 3 && combined.includes(word)) {
              categoryScore += 10
            }
          }
        }
      }

      if (categoryScore > bestScore) {
        bestScore = categoryScore
        bestMatch = {
          categoryId: category.id,
          categoryName: category.name,
          score: categoryScore
        }
      }
    }

    // Cap score at 100
    const finalScore = Math.min(100, bestScore)

    // Determine confidence level
    let confidence = 'low'
    if (finalScore >= 60) confidence = 'high'
    else if (finalScore >= 30) confidence = 'medium'

    return {
      score: finalScore,
      confidence,
      matchedCategory: bestMatch,
      reason: bestMatch
        ? `Matches category: ${bestMatch.categoryName}`
        : 'No category match found'
    }
  }

  /**
   * Filter ideas by monetization score
   * Rejects ideas below the minimum threshold
   */
  async filterByMonetization(ideas, minScore = 25) {
    const results = []
    const rejected = []

    for (const idea of ideas) {
      const validation = await this.validateIdeaMonetization(idea)

      if (validation.score >= minScore) {
        results.push({
          ...idea,
          monetization_score: validation.score,
          monetization_confidence: validation.confidence,
          monetization_category: validation.matchedCategory?.categoryName || null,
          monetization_category_id: validation.matchedCategory?.categoryId || null
        })
      } else {
        rejected.push({
          ...idea,
          rejection_reason: validation.reason,
          monetization_score: validation.score
        })
      }
    }

    // Log rejections for debugging
    if (rejected.length > 0) {
      console.log(`[IdeaDiscovery] Rejected ${rejected.length} ideas for low monetization:`)
      rejected.forEach(r => {
        console.log(`  - "${r.title}" (score: ${r.monetization_score}, reason: ${r.rejection_reason})`)
      })
    }

    return { accepted: results, rejected }
  }

  // ============================================================================
  // LEARNING PATTERNS - User feedback integration
  // ============================================================================

  /**
   * Load active learning session patterns
   */
  async loadLearnedPatterns() {
    try {
      const { data, error } = await supabase
        .from('ai_learning_sessions')
        .select('learned_patterns, improved_prompt, improvement_notes')
        .eq('session_type', 'idea_generation')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to load learning session:', error)
        return null
      }

      this.learnedPatterns = data
      return data
    } catch (error) {
      console.warn('Error loading learned patterns:', error)
      return null
    }
  }

  /**
   * Build learning context for the prompt
   */
  buildLearningContext(patterns) {
    if (!patterns?.learned_patterns) return ''

    const lp = patterns.learned_patterns
    let context = '\n\n=== LEARNED PREFERENCES FROM USER FEEDBACK ===\n'

    if (lp.goodPatterns?.length > 0) {
      context += `\nWHAT WORKS WELL (prioritize these patterns):\n`
      lp.goodPatterns.forEach(p => { context += `- ${p}\n` })
    }

    if (lp.badPatterns?.length > 0) {
      context += `\nWHAT TO AVOID (do not suggest ideas with these patterns):\n`
      lp.badPatterns.forEach(p => { context += `- ${p}\n` })
    }

    if (lp.preferredTopics?.length > 0) {
      context += `\nPREFERRED TOPIC AREAS:\n${lp.preferredTopics.join(', ')}\n`
    }

    if (lp.avoidTopics?.length > 0) {
      context += `\nTOPICS TO AVOID:\n${lp.avoidTopics.join(', ')}\n`
    }

    if (lp.titlePatterns) {
      if (lp.titlePatterns.good?.length > 0) {
        context += `\nGOOD TITLE PATTERNS:\n`
        lp.titlePatterns.good.forEach(p => { context += `- ${p}\n` })
      }
      if (lp.titlePatterns.bad?.length > 0) {
        context += `\nBAD TITLE PATTERNS (avoid):\n`
        lp.titlePatterns.bad.forEach(p => { context += `- ${p}\n` })
      }
    }

    if (lp.preferredContentTypes?.length > 0) {
      context += `\nPREFERRED CONTENT TYPES: ${lp.preferredContentTypes.join(', ')}\n`
    }

    if (patterns.improved_prompt) {
      context += `\nADDITIONAL INSTRUCTIONS:\n${patterns.improved_prompt}\n`
    }

    context += '\n=== END LEARNED PREFERENCES ===\n'

    return context
  }

  // ============================================================================
  // MAIN DISCOVERY METHOD - Monetization-First Approach
  // ============================================================================

  /**
   * Discover new content ideas with MONETIZATION-FIRST approach
   *
   * @param {Object} options - Discovery options
   * @param {string[]} options.sources - Sources to search
   * @param {string} options.customTopic - Optional topic focus (still must be monetizable)
   * @param {string[]} options.existingTopics - Topics to avoid
   * @param {boolean} options.strictMonetization - If true, only return high-monetization ideas
   * @param {number} options.minMonetizationScore - Minimum score to accept (default: 25)
   * @returns {Promise<Object>} Object with accepted ideas and rejected ideas
   */
  async discoverIdeas({
    sources = ['reddit', 'news', 'trends', 'general'],
    customTopic = '',
    existingTopics = [],
    coveredKeywords = [],
    topPerformingArticles = [],
    useLearnedPatterns = true,
    strictMonetization = true,
    minMonetizationScore = 25
  }) {
    // Load monetization context FIRST
    const monetizationContext = await this.getMonetizationContext()
    if (!monetizationContext) {
      throw new Error('Failed to load monetization context - cannot generate ideas without knowing what we can monetize')
    }

    // Load learned patterns if enabled
    let learningContext = ''
    if (useLearnedPatterns) {
      const patterns = await this.loadLearnedPatterns()
      learningContext = this.buildLearningContext(patterns)
    }

    // Build monetization section for prompt
    const monetizationSection = this.buildMonetizationPromptSection(monetizationContext)

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const sourceDescriptions = {
      reddit: 'Reddit discussions in r/college, r/careerguidance, r/education, r/gradschool, r/MBA, r/nursing',
      news: 'Current news about higher education, online learning, career trends',
      trends: 'Google Trends for education keywords, emerging career searches',
      general: 'Evergreen content opportunities, seasonal education trends'
    }

    const selectedSources = sources
      .filter(s => sourceDescriptions[s])
      .map(s => sourceDescriptions[s])
      .join('\n- ')

    const topArticlesContext = topPerformingArticles.length > 0
      ? `\n\nTop performing articles (generate similar quality topics):\n${topPerformingArticles.map(a => `- "${a.title}"`).join('\n')}`
      : ''

    const existingTopicsContext = existingTopics.length > 0
      ? `\n\nAVOID these existing topics:\n${existingTopics.slice(0, 50).map(t => `- ${t}`).join('\n')}`
      : ''

    const customTopicContext = customTopic
      ? `\n\nUSER REQUESTED FOCUS: "${customTopic}" - but it MUST still fit our monetizable categories!`
      : ''

    const prompt = `You are a content strategist for GetEducated.com, a website about ONLINE EDUCATION and ONLINE DEGREES.
Today is ${currentDate}.

${monetizationSection}

Your task: Generate 12 MONETIZABLE content ideas by researching current trends.

SOURCES TO RESEARCH:
- ${selectedSources}
${customTopicContext}
${topArticlesContext}
${existingTopicsContext}
${learningContext}

REQUIREMENTS FOR EACH IDEA:
1. MUST match one of our monetizable categories (Business, Healthcare, Education, IT, etc.)
2. MUST be relevant to ONLINE DEGREE programs
3. MUST target prospective online students
4. Should be timely/trending but ONLY within our monetizable areas
5. Should drive degree signups, not just traffic

For each idea, specify:
- "monetization_category": Which of our categories this fits (REQUIRED)
- "degree_level": Which degree levels this targets (Associate, Bachelor, Master, etc.)
- "content_type": guide, listicle, career_guide, ranking, explainer, review
- "why_monetizable": Brief explanation of monetization potential

Return a JSON object:
{
  "ideas": [
    {
      "title": "SEO-optimized title (50-60 chars)",
      "description": "2-3 sentences explaining the topic",
      "monetization_category": "Business|Healthcare|Education|Computer Science & IT|etc.",
      "degree_level": "Bachelor|Master|etc.",
      "content_type": "guide|listicle|career_guide|ranking|explainer|review",
      "target_keywords": ["keyword1", "keyword2"],
      "why_monetizable": "This drives signups for X programs at Y schools",
      "trending_reason": "Why this is timely",
      "source": "reddit|news|trends|general"
    }
  ]
}

Generate exactly 12 ideas. EVERY idea must be monetizable - no exceptions.`

    try {
      const response = await this.grokClient.generateWithWebContext(prompt)

      // Parse response
      let ideas = []
      try {
        let cleanResponse = response
        if (typeof response === 'string') {
          cleanResponse = response.trim()
          const openMatch = cleanResponse.match(/^```(?:json|JSON)?\s*\n?/)
          if (openMatch) {
            cleanResponse = cleanResponse.slice(openMatch[0].length)
          }
          const closeMatch = cleanResponse.match(/\n?```\s*$/)
          if (closeMatch) {
            cleanResponse = cleanResponse.slice(0, -closeMatch[0].length)
          }
          cleanResponse = cleanResponse.trim()
        }
        const parsed = typeof cleanResponse === 'string' ? JSON.parse(cleanResponse) : cleanResponse
        ideas = parsed.ideas || parsed || []
      } catch (parseError) {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          ideas = parsed.ideas || []
        }
      }

      // Clean and validate ideas
      const cleanedIdeas = ideas
        .filter(idea => idea.title && idea.description)
        .map(idea => ({
          title: idea.title?.trim() || '',
          description: idea.description?.trim() || '',
          content_type: this.validateContentType(idea.content_type),
          target_keywords: Array.isArray(idea.target_keywords) ? idea.target_keywords : [],
          search_intent: idea.search_intent || 'informational',
          estimated_search_volume: idea.estimated_search_volume || 'medium',
          trending_reason: idea.trending_reason || '',
          why_monetizable: idea.why_monetizable || '',
          ai_monetization_category: idea.monetization_category || null,
          ai_degree_level: idea.degree_level || null,
          source: idea.source || 'general',
          discovered_at: new Date().toISOString()
        }))

      // Apply monetization filtering if strict mode enabled
      if (strictMonetization) {
        const { accepted, rejected } = await this.filterByMonetization(cleanedIdeas, minMonetizationScore)

        console.log(`[IdeaDiscovery] Generated ${cleanedIdeas.length} ideas, accepted ${accepted.length}, rejected ${rejected.length}`)

        return {
          ideas: accepted,
          rejected,
          stats: {
            generated: cleanedIdeas.length,
            accepted: accepted.length,
            rejected: rejected.length,
            monetizationContext: monetizationContext.stats
          }
        }
      }

      return {
        ideas: cleanedIdeas,
        rejected: [],
        stats: {
          generated: cleanedIdeas.length,
          accepted: cleanedIdeas.length,
          rejected: 0,
          monetizationContext: monetizationContext.stats
        }
      }
    } catch (error) {
      console.error('Idea discovery error:', error)
      throw new Error(`Failed to discover ideas: ${error.message}`)
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate similarity between two strings
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
   * Filter out duplicate ideas
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
   * Generate SEO-optimized title
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

  /**
   * Get monetization stats for display
   */
  async getMonetizationStats() {
    const context = await this.getMonetizationContext()
    return context?.stats || null
  }
}

export default IdeaDiscoveryService
