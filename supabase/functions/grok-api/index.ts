/**
 * Supabase Edge Function: grok-api
 * Modular Grok API client for individual operations
 * Keeps Grok API key secure on server-side
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROK_BASE_URL = 'https://api.x.ai/v1'
const GROK_MODEL = 'grok-beta'

interface GrokMessage {
  role: string
  content: string
}

interface GrokOptions {
  temperature?: number
  max_tokens?: number
}

async function makeGrokRequest(messages: GrokMessage[], options: GrokOptions = {}) {
  const grokApiKey = Deno.env.get('GROK_API_KEY')

  if (!grokApiKey) {
    throw new Error('GROK_API_KEY not configured in Edge Function secrets')
  }

  const { temperature = 0.8, max_tokens = 4000 } = options

  const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grokApiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      temperature,
      max_tokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Grok API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

function getStructureForContentType(contentType: string): string {
  const structures: Record<string, string> = {
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

function buildDraftPrompt(idea: any, contentType: string, targetWordCount: number): string {
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
${getStructureForContentType(contentType)}

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    if (!action) {
      throw new Error('Missing required parameter: action')
    }

    let result: any

    switch (action) {
      case 'generateDraft': {
        const { idea, contentType = 'guide', targetWordCount = 2000 } = payload

        if (!idea) {
          throw new Error('Missing required parameter: idea')
        }

        console.log('Generating draft for:', idea.title)

        const prompt = buildDraftPrompt(idea, contentType, targetWordCount)
        const response = await makeGrokRequest([
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

        result = JSON.parse(response)
        break
      }

      case 'generateIdeas': {
        const { seedTopics, count = 10 } = payload

        if (!seedTopics || !Array.isArray(seedTopics)) {
          throw new Error('Missing required parameter: seedTopics (array)')
        }

        console.log('Generating ideas from:', seedTopics)

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

        const response = await makeGrokRequest([
          {
            role: 'system',
            content: 'You are a content strategist who generates creative, specific article ideas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ])

        const parsed = JSON.parse(response)
        result = parsed.ideas
        break
      }

      case 'generateMetadata': {
        const { articleContent, focusKeyword } = payload

        if (!articleContent || !focusKeyword) {
          throw new Error('Missing required parameters: articleContent and focusKeyword')
        }

        console.log('Generating metadata for keyword:', focusKeyword)

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

        const response = await makeGrokRequest([
          {
            role: 'system',
            content: 'You are an SEO expert who writes compelling metadata that ranks well and gets clicks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ])

        result = JSON.parse(response)
        break
      }

      default:
        throw new Error(`Unknown action: ${action}. Valid actions: generateDraft, generateIdeas, generateMetadata`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Grok API Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
