import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

/**
 * Get WordPress connections
 */
export function useWordPressConnections() {
  return useQuery({
    queryKey: ['wordpress_connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wordpress_connections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

/**
 * Create WordPress connection
 */
export function useCreateWordPressConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionData) => {
      const { data, error } = await supabase
        .from('wordpress_connections')
        .insert(connectionData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] })
    },
  })
}

/**
 * Update WordPress connection
 */
export function useUpdateWordPressConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('wordpress_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] })
    },
  })
}

/**
 * Delete WordPress connection
 */
export function useDeleteWordPressConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('wordpress_connections')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_connections'] })
    },
  })
}

/**
 * Publish article to WordPress
 * Uses Edge Function for secure API calls
 */
export function usePublishToWordPress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, connectionId }) => {
      const { data, error } = await supabase.functions.invoke('publish-to-wordpress', {
        body: { articleId, connectionId },
      })

      if (error) {
        throw new Error(error.message || 'WordPress publishing failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'WordPress publishing failed')
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.articleId] })
    },
  })
}

/**
 * Test WordPress connection
 */
export function useTestWordPressConnection() {
  return useMutation({
    mutationFn: async (connection) => {
      // Test by trying to authenticate
      const auth = btoa(`${connection.username}:${connection.password}`)

      const response = await fetch(`${connection.site_url}/wp-json/wp/v2/posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      })

      if (!response.ok) {
        throw new Error('Connection test failed. Check your credentials and site URL.')
      }

      // Update last test time
      const { error } = await supabase
        .from('wordpress_connections')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_success: true,
        })
        .eq('id', connection.id)

      if (error) console.error('Error updating test status:', error)

      return { success: true, message: 'Connection successful!' }
    },
  })
}

/**
 * Publish article via N8N webhook
 * Alternative to direct WordPress API - sends to N8N for processing
 * Includes written_by meta, shortcodes, and full SEO metadata
 */
export function usePublishViaN8N() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ article, webhookUrl, options = {} }) => {
      const {
        includeShortcodes = true,
        includeWordPressAuthorId = true,
      } = options

      // Fetch contributor's WordPress author ID if needed
      let wordpressAuthorId = null
      if (includeWordPressAuthorId && article.contributor_id) {
        const { data: contributor } = await supabase
          .from('article_contributors')
          .select('wordpress_author_id, name')
          .eq('id', article.contributor_id)
          .single()

        wordpressAuthorId = contributor?.wordpress_author_id
      }

      // Fetch applicable shortcodes if needed
      let shortcodes = []
      if (includeShortcodes) {
        const { data: shortcodesData } = await supabase
          .from('shortcodes')
          .select('*')
          .eq('is_active', true)

        shortcodes = shortcodesData || []
      }

      // Build the payload for N8N
      const payload = {
        // Article content
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        slug: article.slug,

        // SEO metadata
        seo: {
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          focus_keyword: article.focus_keyword,
        },

        // Author/contributor info
        author: {
          contributor_id: article.contributor_id,
          contributor_name: article.contributor_name,
          wordpress_author_id: wordpressAuthorId,
        },

        // WordPress meta fields
        meta: {
          written_by: wordpressAuthorId || article.contributor_id,
          _yoast_wpseo_focuskw: article.focus_keyword,
          _yoast_wpseo_title: article.meta_title,
          _yoast_wpseo_metadesc: article.meta_description,
        },

        // Shortcodes to apply
        shortcodes: shortcodes.map(sc => ({
          name: sc.name,
          shortcode: sc.shortcode,
          placement: sc.placement,
          content_types: sc.content_types,
        })),

        // FAQs for schema markup
        faqs: article.faqs || [],

        // Additional metadata
        metadata: {
          article_id: article.id,
          content_type: article.content_type,
          word_count: article.word_count,
          quality_score: article.quality_score,
          generated_at: new Date().toISOString(),
        },
      }

      // Send to N8N webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      // Update article status
      await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_via: 'n8n',
          wordpress_post_id: result.post_id || null,
          wordpress_url: result.post_url || null,
        })
        .eq('id', article.id)

      return {
        success: true,
        articleId: article.id,
        postId: result.post_id,
        postUrl: result.post_url,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', data.articleId] })
    },
  })
}

/**
 * Get N8N webhook settings
 */
export function useN8NSettings() {
  return useQuery({
    queryKey: ['n8n_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'n8n_webhook_url')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data?.setting_value || null
    },
  })
}

/**
 * Update N8N webhook settings
 */
export function useUpdateN8NSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (webhookUrl) => {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'n8n_webhook_url',
          setting_value: webhookUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['n8n_settings'] })
    },
  })
}
