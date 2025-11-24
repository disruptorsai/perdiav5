/**
 * Supabase Edge Function: generate-ideas-from-keywords
 * Uses DataForSEO to get keyword data and Grok to generate content ideas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { seedKeywords, count = 10, userId } = await req.json()

    if (!seedKeywords || !Array.isArray(seedKeywords) || !userId) {
      throw new Error('Missing required parameters: seedKeywords (array) and userId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const grokApiKey = Deno.env.get('GROK_API_KEY')
    const dataForSEOUsername = Deno.env.get('DATAFORSEO_USERNAME')
    const dataForSEOPassword = Deno.env.get('DATAFORSEO_PASSWORD')

    if (!grokApiKey) {
      throw new Error('Grok API key not configured')
    }

    console.log('Generating ideas from keywords:', seedKeywords)

    let keywordData: any[] = []

    // OPTIONAL: Get keyword data from DataForSEO if configured
    if (dataForSEOUsername && dataForSEOPassword) {
      console.log('Fetching keyword data from DataForSEO...')
      try {
        keywordData = await getKeywordDataFromDataForSEO(
          seedKeywords,
          dataForSEOUsername,
          dataForSEOPassword
        )
      } catch (error) {
        console.warn('DataForSEO error (continuing without keyword data):', error)
      }
    }

    // Generate content ideas with Grok
    console.log('Generating content ideas with Grok...')
    const ideas = await generateIdeasWithGrok(seedKeywords, count, grokApiKey, keywordData)

    // Save ideas to database
    console.log('Saving ideas to database...')
    const savedIdeas = []

    for (const idea of ideas) {
      const { data, error } = await supabaseClient
        .from('content_ideas')
        .insert({
          title: idea.title,
          description: idea.description,
          status: 'pending',
          source: 'ai_generated',
          seed_topics: idea.target_keywords || seedKeywords,
          keyword_research_data: idea.keyword_data || null,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving idea:', error)
      } else {
        savedIdeas.push(data)
      }
    }

    console.log(`Generated and saved ${savedIdeas.length} ideas`)

    return new Response(
      JSON.stringify({
        success: true,
        count: savedIdeas.length,
        ideas: savedIdeas,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Idea generation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// ===============================================
// HELPER FUNCTIONS
// ===============================================

async function getKeywordDataFromDataForSEO(
  keywords: string[],
  username: string,
  password: string
) {
  const auth = btoa(`${username}:${password}`)

  const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google/search_volume/live', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        keywords: keywords,
        location_code: 2840, // United States
        language_code: 'en',
      }
    ]),
  })

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.tasks && data.tasks[0] && data.tasks[0].result) {
    return data.tasks[0].result
  }

  return []
}

async function generateIdeasWithGrok(
  seedKeywords: string[],
  count: number,
  apiKey: string,
  keywordData: any[]
) {
  const keywordContext = keywordData.length > 0
    ? `\n\nKEYWORD DATA:\n${keywordData.map(k =>
        `- "${k.keyword}": ${k.search_volume || 'N/A'} monthly searches, difficulty: ${k.keyword_difficulty || 'N/A'}`
      ).join('\n')}`
    : ''

  const prompt = `Generate ${count} unique, specific content ideas for articles about: ${seedKeywords.join(', ')}
${keywordContext}

REQUIREMENTS:
- Each idea should be specific and actionable
- Include a variety of content types (guides, listicles, how-tos, explanations)
- Focus on long-tail, specific angles rather than broad topics
- Make them valuable and interesting to readers
- Avoid generic or overused ideas
- If keyword data is provided, consider search volume and difficulty in your suggestions
- Prioritize keywords with high search volume and low-to-medium difficulty

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

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a content strategist who generates creative, specific article ideas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Grok API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const parsed = JSON.parse(content)

  // Enrich ideas with keyword data if available
  if (keywordData.length > 0) {
    parsed.ideas = parsed.ideas.map((idea: any) => {
      // Find matching keyword data
      const matchingKeyword = keywordData.find((k: any) =>
        idea.target_keywords.some((tk: string) =>
          k.keyword.toLowerCase().includes(tk.toLowerCase())
        )
      )

      if (matchingKeyword) {
        idea.keyword_data = {
          primary_keyword: matchingKeyword.keyword,
          search_volume: matchingKeyword.search_volume,
          difficulty: matchingKeyword.keyword_difficulty,
          cpc: matchingKeyword.cpc,
          competition: matchingKeyword.competition,
        }
      }

      return idea
    })
  }

  return parsed.ideas
}
