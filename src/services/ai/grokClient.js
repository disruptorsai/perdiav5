/**
 * Grok AI Client for Article Drafting
 * Uses xAI's Grok API for initial content generation
 */

class GrokClient {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_GROK_API_KEY
    this.baseUrl = 'https://api.x.ai/v1'
    // Try the latest Grok model name - xAI has updated their models
    this.model = 'grok-2-latest' // Changed from 'grok-beta'
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
      max_tokens = 4000,
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
    } = options

    const prompt = this.buildDraftPrompt(idea, contentType, targetWordCount)

    try {
      const response = await this.request([
        {
          role: 'system',
          content: 'You are an expert content writer who creates high-quality, engaging articles. You write in a natural, conversational style with varied sentence structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8,
        max_tokens: 4000,
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
   */
  buildDraftPrompt(idea, contentType, targetWordCount) {
    return `Generate a comprehensive ${contentType} article based on this content idea.

CONTENT IDEA:
Title: ${idea.title}
Description: ${idea.description || 'Not provided'}
${idea.keyword_research_data ? `Primary Keyword: ${idea.keyword_research_data.primary_keyword}` : ''}
${idea.seed_topics ? `Topics to cover: ${idea.seed_topics.join(', ')}` : ''}

REQUIREMENTS:
- Target word count: ${targetWordCount} words
- Content type: ${contentType}
- Include an engaging introduction that hooks the reader
- Use clear headings and subheadings (H2, H3)
- Write in a conversational, natural tone
- Include specific examples and actionable insights
- Vary sentence length (short punchy sentences mixed with longer explanatory ones)
- Avoid generic phrases like "In conclusion", "It's important to note"
- Make it valuable and informative

STRUCTURE:
${this.getStructureForContentType(contentType)}

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
