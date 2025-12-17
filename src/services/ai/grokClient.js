/**
 * Grok AI Client for Article Drafting
 * Uses xAI's Grok API for initial content generation
 */

// Anti-hallucination rules to inject into all generation prompts
const ANTI_HALLUCINATION_RULES = `
=== CRITICAL: ANTI-HALLUCINATION RULES ===

You MUST follow these rules to avoid generating fabricated content:

1. NEVER FABRICATE STATISTICS:
   - NEVER cite percentages, survey results, or specific numbers unless provided in the source data below
   - BAD: "73% of students prefer online learning" or "According to a 2024 survey..."
   - GOOD: "Many students prefer online learning" or "Research suggests..."

2. NEVER FABRICATE STUDIES OR SURVEYS:
   - NEVER reference specific studies, surveys, reports, or research unless explicitly provided
   - BAD: "According to a 2024 survey by the Online Learning Consortium, 68% reported..."
   - GOOD: "Industry research indicates that..." or "Experts in the field note..."

3. NEVER FABRICATE SCHOOL NAMES:
   - NEVER invent school names or use placeholder names like "University A, B, C"
   - NEVER use template markers like "[School Name]" or "[University]"
   - GOOD: Only mention schools if specific data is provided in the prompt, or use "many accredited online programs"

4. NEVER FABRICATE LEGISLATION:
   - NEVER cite specific bills (SB-1001, HB-123), acts, or legal codes unless provided
   - BAD: "California's SB-1001 requires..." or "The Higher Education Act of 2024..."
   - GOOD: "State regulations may require..." or "Check with your state licensing board"

5. NEVER FABRICATE ORGANIZATIONS:
   - NEVER invent organization names or acronyms
   - ONLY cite real, well-known organizations: BLS, NCES, Department of Education, etc.

ALTERNATIVE PHRASING TO USE:
- Instead of "73% of students..." → "Many students find that..."
- Instead of "A 2024 study found..." → "Research suggests that..."
- Instead of "$45,000 average salary" → "competitive salaries" (unless BLS data is provided)
- Instead of "University A offers..." → "Many accredited programs offer..."
- Instead of "SB-1001 requires..." → "State requirements vary, so check with your licensing board"

=== END ANTI-HALLUCINATION RULES ===
`

class GrokClient {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_GROK_API_KEY
    this.baseUrl = 'https://api.x.ai/v1'
    // Use Grok 3 - grok-beta was deprecated on 2025-09-15
    this.model = 'grok-3'
    // Increased token limit to prevent truncation
    // Long-form articles need ~2000 words = ~2500 tokens for content alone
    // Plus JSON wrapper, FAQs, metadata = ~10000 tokens total needed
    this.defaultMaxTokens = 12000
  }

  /**
   * Strip markdown code blocks from response
   * Handles ```json ... ``` and ``` ... ``` wrappers
   */
  stripMarkdownCodeBlocks(text) {
    if (!text) return text

    // Remove ```json or ```JSON or just ``` at the start
    let cleaned = text.trim()

    // Match opening code fence with optional language specifier
    const openFenceMatch = cleaned.match(/^```(?:json|JSON)?\s*\n?/)
    if (openFenceMatch) {
      cleaned = cleaned.slice(openFenceMatch[0].length)
    }

    // Match closing code fence
    const closeFenceMatch = cleaned.match(/\n?```\s*$/)
    if (closeFenceMatch) {
      cleaned = cleaned.slice(0, -closeFenceMatch[0].length)
    }

    return cleaned.trim()
  }

  /**
   * Safely parse JSON from AI response, handling markdown wrappers
   */
  parseJsonResponse(response) {
    const cleaned = this.stripMarkdownCodeBlocks(response)
    return JSON.parse(cleaned)
  }

  /**
   * Make a request to the Grok API
   */
  async request(messages, options = {}) {
    // Check if API key is set
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.warn('⚠️ Grok API key not set. Using mock data for testing.')
      return this.getMockResponse(messages)
    }

    const {
      temperature = 0.8,
      max_tokens = this.defaultMaxTokens, // Use class default (8000) instead of 4000
    } = options

    // Try multiple model names if the primary fails
    const modelVariants = [
      this.model,           // grok-2-latest
      'grok-2',             // Alternative name
      'grok-beta',          // Legacy name
      'grok-2-1212',        // Versioned name
    ]

    let lastError = null

    for (const modelName of modelVariants) {
      try {
        console.log(`Trying Grok model: ${modelName}`)

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature,
            max_tokens,
            stream: false,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✓ Successfully used model: ${modelName}`)
          // Update the model name for future requests
          this.model = modelName
          return data.choices[0].message.content
        }

        // If not 404, don't try other models
        if (response.status !== 404) {
          const errorText = await response.text()
          let errorMessage = 'Unknown error'

          try {
            const error = JSON.parse(errorText)
            errorMessage = error.error?.message || error.message || errorText
          } catch {
            errorMessage = errorText || `HTTP ${response.status}`
          }

          throw new Error(`Grok API error (${response.status}): ${errorMessage}`)
        }

        // Store 404 error but continue trying other models
        lastError = new Error(`Model '${modelName}' not found (404)`)
        console.warn(`Model ${modelName} returned 404, trying next variant...`)

      } catch (error) {
        // If it's not a 404, stop trying and throw
        if (!error.message.includes('404')) {
          throw error
        }
        lastError = error
      }
    }

    // If we get here, all models failed
    console.error('All Grok model variants failed:', modelVariants)
    console.error('Please check https://docs.x.ai/api for the current model name')
    throw lastError || new Error('Failed to connect to Grok API with any known model name')
  }

  /**
   * Mock response for testing without API key
   */
  getMockResponse(messages) {
    const userMessage = messages.find(m => m.role === 'user')?.content || ''

    // Return mock article data as JSON
    return JSON.stringify({
      title: "Understanding Modern Web Development: A Comprehensive Guide",
      content: `<h2>Introduction to Modern Web Development</h2>
<p>Web development has evolved dramatically over the past decade. Today's developers face an ever-expanding ecosystem of tools, frameworks, and best practices that can seem overwhelming at first.</p>

<h2>Core Technologies</h2>
<p>At the heart of web development lie three fundamental technologies: HTML, CSS, and JavaScript. These form the building blocks that power every website you visit.</p>

<h3>HTML: The Structure</h3>
<p>HTML provides the semantic structure for web pages. Modern HTML5 introduces powerful features like canvas, video, and audio elements that enable rich interactive experiences.</p>

<h3>CSS: The Styling</h3>
<p>CSS has grown from simple styling rules to a sophisticated design system. Flexbox and Grid layouts have revolutionized how we approach responsive design.</p>

<h3>JavaScript: The Functionality</h3>
<p>JavaScript continues to dominate as the language of the web. With ES6+ features, the language has become more powerful and expressive than ever.</p>

<h2>Modern Frameworks and Tools</h2>
<p>Today's web developers rely on powerful frameworks like React, Vue, and Angular. These tools help manage complexity and improve development speed.</p>

<h2>Best Practices</h2>
<p>Following industry best practices ensures your applications are maintainable, performant, and accessible to all users.</p>

<h2>Conclusion</h2>
<p>Web development is a constantly evolving field that rewards continuous learning and adaptation. By mastering the fundamentals and staying current with modern tools, you'll be well-equipped to build amazing web experiences.</p>`,
      excerpt: "An in-depth exploration of modern web development practices, covering core technologies, frameworks, and best practices for building robust web applications.",
      meta_title: "Modern Web Development Guide 2025 | Best Practices & Tools",
      meta_description: "Learn modern web development with our comprehensive guide covering HTML, CSS, JavaScript, frameworks, and industry best practices.",
      focus_keyword: "web development",
      faqs: [
        {
          question: "What are the essential skills for web development?",
          answer: "The essential skills include HTML, CSS, JavaScript, responsive design, version control (Git), and familiarity with at least one modern framework."
        },
        {
          question: "How long does it take to become a web developer?",
          answer: "With consistent practice, you can learn the basics in 3-6 months, but becoming proficient typically takes 1-2 years of hands-on experience."
        },
        {
          question: "What's the difference between frontend and backend development?",
          answer: "Frontend development focuses on what users see and interact with (HTML, CSS, JavaScript), while backend handles server-side logic, databases, and APIs."
        },
        {
          question: "Which JavaScript framework should I learn first?",
          answer: "React is currently the most popular choice and has the largest job market, making it a solid first framework to learn."
        }
      ]
    })
  }

  /**
   * Generate article draft from content idea
   */
  async generateDraft(idea, options = {}) {
    const {
      contentType = 'guide',
      targetWordCount = 2000,
      includeOutline = true,
      costDataContext = null, // Cost data from ranking reports for RAG
      authorProfile = null, // Comprehensive author profile from useContributors
      authorName = null,
    } = options

    const prompt = this.buildDraftPrompt(idea, contentType, targetWordCount, costDataContext, authorProfile, authorName)

    // Build system prompt with optional author profile
    let systemPrompt = 'You are an expert content writer who creates high-quality, engaging articles. You write in a natural, conversational style with varied sentence structure.'

    if (authorProfile) {
      systemPrompt = `You are an expert content writer creating content for GetEducated.com. You are writing as ${authorName || 'a professional author'}.

=== AUTHOR PROFILE & WRITING STYLE ===
${authorProfile}
=== END AUTHOR PROFILE ===

Follow the author's voice, style, and guidelines precisely. This will ensure consistency across all articles by this author.`
    }

    try {
      const response = await this.request([
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8,
        max_tokens: this.defaultMaxTokens, // Use 8000 to prevent truncation
      })

      // Parse JSON response (handles markdown code blocks)
      const parsedResponse = this.parseJsonResponse(response)
      return parsedResponse

    } catch (error) {
      console.error('Grok draft generation error:', error)
      throw error
    }
  }

  /**
   * Build prompt for article draft generation
   * IMPORTANT: Includes GetEducated-specific content rules
   */
  buildDraftPrompt(idea, contentType, targetWordCount, costDataContext = null, authorProfile = null, authorName = null) {
    let costDataSection = ''
    if (costDataContext) {
      costDataSection = `\n\n${costDataContext}\n`
    }

    let authorSection = ''
    if (authorName) {
      authorSection = `\nAUTHOR: This article is being written by ${authorName}. Follow the author profile in the system prompt precisely.\n`
    }

    return `Generate a comprehensive ${contentType} article based on this content idea for GetEducated.com, an online education resource.

${ANTI_HALLUCINATION_RULES}
${costDataSection}${authorSection}

CONTENT IDEA:
Title: ${idea.title}
Description: ${idea.description || 'Not provided'}
${idea.keyword_research_data ? `Primary Keyword: ${idea.keyword_research_data.primary_keyword}` : ''}
${idea.seed_topics ? `Topics to cover: ${idea.seed_topics.join(', ')}` : ''}

REQUIREMENTS:
- Target word count: ${targetWordCount} words
- Content type: ${contentType}
- Include an engaging introduction that hooks prospective online students
- Use clear headings and subheadings (H2, H3)
- Write in a conversational, natural tone that empathizes with readers' education goals
- Provide actionable guidance and practical insights (but DO NOT fabricate statistics or specific data)
- Vary sentence length (short punchy sentences mixed with longer explanatory ones)
- Make it valuable and informative for people considering online education
- IMPORTANT: Complete the entire article including a proper conclusion - do not cut off mid-sentence

=== CRITICAL GETEDUCATED CONTENT RULES ===

1. COST DATA:
   - ALL cost/tuition information MUST reference GetEducated ranking reports
   - Format cost mentions as "According to GetEducated's ranking reports, [school] costs $X including all fees"
   - Include BOTH in-state and out-of-state costs when available
   - NEVER invent or estimate costs - only use data from ranking reports

2. SCHOOL/DEGREE REFERENCES:
   - NEVER invent or fabricate school names (e.g., "University A", "College B", "[School Name]")
   - Only mention specific schools if they appear in the cost data provided above
   - When mentioning degree types generically, use phrases like "many accredited programs" or "leading online universities"
   - NEVER suggest linking directly to school .edu websites
   - If no specific school data is provided, discuss programs in general terms without naming institutions

3. EXTERNAL SOURCES:
   - For salary/job outlook data, reference Bureau of Labor Statistics (BLS)
   - For education statistics, reference NCES, Department of Education
   - Accreditation info should reference official accreditation bodies (AACSB, ABET, etc.)
   - NEVER reference competitor sites (onlineu.com, usnews.com, affordablecollegesonline.com)

4. CONTENT FOCUS:
   - All content must be relevant to ONLINE students
   - Emphasize affordability, flexibility, and career outcomes
   - Discuss accreditation requirements where relevant
   - Help readers make informed decisions about their education

5. STRUCTURE REQUIREMENTS:
   - DO NOT include school recommendation sections (these will be added via shortcodes later)
   - Include article navigation suggestions (anchor links to major sections)
   - Minimum 3 FAQ items relevant to the topic with COMPLETE answers (no truncation)
   - Include a "How we researched this" note mentioning GetEducated's methodology
   - ALWAYS include a proper conclusion section - never end the article abruptly

6. SHORTCODES - CRITICAL:
   - DO NOT generate any shortcodes in the content - they will be added programmatically later
   - DO NOT use these fake shortcode formats: [degree_table], [degree_offer], [ge_monetization], [ge_internal_link], [ge_external_cited]
   - The REAL GetEducated shortcodes are: [su_ge-picks], [su_ge-cta], [su_ge-qdf]
   - If you need to indicate where a degree list should go, just write: <!-- MONETIZATION BLOCK: degree picks for [topic] -->
   - Links to ranking reports, schools, and degrees will be added via shortcodes AFTER generation

=== END GETEDUCATED RULES ===

STRUCTURE:
${this.getStructureForContentType(contentType)}

BANNED PHRASES (never use these):
- "In today's digital age"
- "In conclusion"
- "It's important to note that"
- "Delve into"
- "Dive deep"
- "At the end of the day"
- "Game changer"
- "Revolutionary"
- "Cutting-edge"

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Compelling article title (60-70 characters)",
  "excerpt": "Brief 1-2 sentence summary (150-160 characters)",
  "content": "Full article in HTML format with proper heading tags",
  "meta_title": "SEO-optimized title (50-60 characters)",
  "meta_description": "SEO description (150-160 characters)",
  "focus_keyword": "Primary keyword for SEO",
  "faqs": [
    {"question": "Question 1", "answer": "Answer 1"},
    {"question": "Question 2", "answer": "Answer 2"},
    {"question": "Question 3", "answer": "Answer 3"}
  ]
}

Generate the article now:`
  }

  /**
   * Get structure template based on content type
   */
  getStructureForContentType(contentType) {
    const structures = {
      guide: `
- Introduction (why this matters)
- Main sections with H2 headings
- Step-by-step instructions or explanations
- Examples and use cases
- Best practices
- Common mistakes to avoid
- Conclusion with key takeaways`,

      listicle: `
- Engaging introduction
- Clear list items with H2 headings
- Each item should have 2-3 paragraphs of explanation
- Use numbers or bullets
- Conclusion that ties it together`,

      ranking: `
- Introduction explaining ranking criteria
- Ranked list items (e.g., #1, #2, #3)
- Each item with pros/cons
- Clear explanation of why it's ranked that way
- Conclusion with winner summary`,

      explainer: `
- Introduction (what is this?)
- Background/context
- How it works
- Why it matters
- Real-world examples
- Conclusion`,

      review: `
- Introduction
- Overview of product/service
- Features breakdown
- Pros and cons
- Who it's for
- Final verdict`,
    }

    return structures[contentType] || structures.guide
  }

  /**
   * Generate content ideas from seed topics
   */
  async generateIdeas(seedTopics, count = 10) {
    const prompt = `Generate ${count} unique, specific content ideas for articles about: ${seedTopics.join(', ')}

REQUIREMENTS:
- Each idea should be specific and actionable
- Include a variety of content types (guides, listicles, how-tos, explanations)
- Focus on long-tail, specific angles rather than broad topics
- Make them valuable and interesting to readers
- Avoid generic or overused ideas

FORMAT YOUR RESPONSE AS JSON:
{
  "ideas": [
    {
      "title": "Specific article title",
      "description": "Brief description of what the article covers",
      "content_type": "guide|listicle|explainer|review|ranking",
      "target_keywords": ["keyword1", "keyword2"],
      "estimated_word_count": 2000
    }
  ]
}

Generate the ideas now:`

    try {
      const response = await this.request([
        {
          role: 'system',
          content: 'You are a content strategist who generates creative, specific article ideas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ])

      const parsedResponse = this.parseJsonResponse(response)
      return parsedResponse.ideas

    } catch (error) {
      console.error('Grok idea generation error:', error)
      throw error
    }
  }

  /**
   * Generate content with web context (searches internet for current trends)
   * Grok has built-in web search capabilities through xAI
   */
  async generateWithWebContext(prompt, options = {}) {
    const {
      temperature = 0.8,
      max_tokens = 4000,
    } = options

    // Grok natively supports web search through its training and real-time capabilities
    // We enhance the prompt to encourage the model to use current knowledge
    const enhancedPrompt = `${prompt}

IMPORTANT: Use your knowledge of CURRENT events, trends, and discussions.
Include timely, relevant information from recent news, social media trends, and search data.
Focus on what people are ACTIVELY searching for and discussing RIGHT NOW.`

    try {
      const response = await this.request([
        {
          role: 'system',
          content: `You are a content strategist with access to real-time information about current trends, news, and social media discussions.
You stay updated on the latest developments and can identify trending topics and emerging search queries.
When generating ideas, prioritize topics that are currently being discussed and searched for.`
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ], {
        temperature,
        max_tokens,
      })

      return response
    } catch (error) {
      console.error('Grok web context generation error:', error)
      throw error
    }
  }

  /**
   * Simple text generation (no JSON parsing)
   */
  async generate(prompt, options = {}) {
    try {
      const response = await this.request([
        {
          role: 'user',
          content: prompt
        }
      ], options)

      return response
    } catch (error) {
      console.error('Grok generation error:', error)
      throw error
    }
  }

  /**
   * Generate SEO metadata for an article
   */
  async generateMetadata(articleContent, focusKeyword) {
    const prompt = `Given this article content and focus keyword, generate optimized SEO metadata.

FOCUS KEYWORD: ${focusKeyword}

ARTICLE EXCERPT:
${articleContent.substring(0, 500)}...

Generate:
1. SEO-optimized meta title (50-60 characters, include focus keyword)
2. Compelling meta description (150-160 characters, include focus keyword)
3. URL slug (lowercase, hyphens, keyword-rich)

FORMAT AS JSON:
{
  "meta_title": "title here",
  "meta_description": "description here",
  "slug": "url-slug-here"
}`

    try {
      const response = await this.request([
        {
          role: 'system',
          content: 'You are an SEO expert who writes compelling metadata that ranks well and gets clicks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ])

      return this.parseJsonResponse(response)

    } catch (error) {
      console.error('Grok metadata generation error:', error)
      throw error
    }
  }
}

export default GrokClient
