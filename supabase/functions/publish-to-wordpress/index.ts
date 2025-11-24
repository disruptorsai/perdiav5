/**
 * Supabase Edge Function: publish-to-wordpress
 * Publishes articles to WordPress via REST API
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
    const { articleId, connectionId } = await req.json()

    if (!articleId || !connectionId) {
      throw new Error('Missing required parameters: articleId and connectionId')
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

    // Fetch the article
    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (articleError || !article) {
      throw new Error(`Article not found: ${articleError?.message}`)
    }

    // Fetch WordPress connection
    const { data: connection, error: connError } = await supabaseClient
      .from('wordpress_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connError || !connection) {
      throw new Error(`WordPress connection not found: ${connError?.message}`)
    }

    if (!connection.is_active) {
      throw new Error('WordPress connection is not active')
    }

    console.log('Publishing article to WordPress:', article.title)

    // Prepare WordPress post data
    const postData = {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      status: connection.default_post_status || 'draft',
      meta: {
        _yoast_wpseo_title: article.meta_title || article.title,
        _yoast_wpseo_metadesc: article.meta_description || article.excerpt,
        _yoast_wpseo_focuskw: article.focus_keyword || '',
      },
    }

    if (connection.default_category_id) {
      postData.categories = [connection.default_category_id]
    }

    // Authenticate based on auth type
    let authHeader = ''
    if (connection.auth_type === 'basic_auth' || connection.auth_type === 'application_password') {
      const credentials = btoa(`${connection.username}:${connection.password}`)
      authHeader = `Basic ${credentials}`
    } else if (connection.auth_type === 'jwt') {
      // JWT would require additional token endpoint call
      throw new Error('JWT authentication not yet implemented')
    }

    // Publish to WordPress
    const wpResponse = await fetch(`${connection.site_url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(postData),
    })

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text()
      throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`)
    }

    const wpPost = await wpResponse.json()

    // Update article in database
    const { error: updateError } = await supabaseClient
      .from('articles')
      .update({
        wordpress_post_id: wpPost.id,
        published_url: wpPost.link,
        published_at: new Date().toISOString(),
        status: 'published',
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Error updating article:', updateError)
      // Don't throw - post was successful
    }

    console.log('Article published successfully:', wpPost.link)

    return new Response(
      JSON.stringify({
        success: true,
        wordpress_post_id: wpPost.id,
        published_url: wpPost.link,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('WordPress publishing error:', error)
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
