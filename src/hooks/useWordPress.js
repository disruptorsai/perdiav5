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
