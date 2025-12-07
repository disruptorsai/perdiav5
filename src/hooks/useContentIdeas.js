import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all content ideas (shared workspace - all users see all ideas)
 */
export function useContentIdeas(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content_ideas', filters],
    queryFn: async () => {
      let query = supabase
        .from('content_ideas')
        .select('*, clusters(*)')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.source) {
        query = query.eq('source', filters.source)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Create a new content idea
 */
export function useCreateContentIdea() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ideaData) => {
      const { data, error } = await supabase
        .from('content_ideas')
        .insert({
          ...ideaData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Update content idea
 */
export function useUpdateContentIdea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ideaId, updates }) => {
      const { data, error } = await supabase
        .from('content_ideas')
        .update(updates)
        .eq('id', ideaId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Delete content idea
 */
export function useDeleteContentIdea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ideaId) => {
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', ideaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Generate ideas from seed topics
 */
export function useGenerateIdeas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ seedTopics, count = 10 }) => {
      // Call Supabase Edge Function for idea generation
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { seedTopics, count, userId: user.id }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Generate ideas from DataForSEO keywords
 */
export function useGenerateIdeasFromKeywords() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ seedKeywords, options }) => {
      // Call Edge Function that uses DataForSEO + AI
      const { data, error } = await supabase.functions.invoke('generate-ideas-from-keywords', {
        body: { seedKeywords, options, userId: user.id }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}
