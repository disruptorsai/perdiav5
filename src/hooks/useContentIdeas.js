import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import GrokClient from '../services/ai/grokClient'

const grokClient = new GrokClient()

/**
 * Fetch all content ideas for the current user
 */
export function useContentIdeas(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content_ideas', filters],
    queryFn: async () => {
      let query = supabase
        .from('content_ideas')
        .select('*, clusters(*)')
        .eq('user_id', user?.id)
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

/**
 * Generate title suggestions using AI
 */
export function useGenerateTitleSuggestions() {
  return useMutation({
    mutationFn: async ({ description, topics, count = 3 }) => {
      const suggestions = await grokClient.generateTitleSuggestions(
        description,
        topics,
        count
      )
      return suggestions
    },
  })
}

/**
 * Get ideas by generation track (monetization vs user-initiated)
 */
export function useContentIdeasByTrack(track) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content_ideas', 'by_track', track],
    queryFn: async () => {
      let query = supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (track) {
        query = query.eq('generation_track', track)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get track counts for dashboard
 */
export function useTrackCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content_ideas', 'track_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('generation_track, status')
        .eq('user_id', user?.id)

      if (error) throw error

      // Calculate counts by track
      const counts = {
        monetization: { total: 0, pending: 0, approved: 0 },
        user_initiated: { total: 0, pending: 0, approved: 0 },
      }

      data?.forEach(idea => {
        const track = idea.generation_track || 'user_initiated'
        if (counts[track]) {
          counts[track].total++
          if (idea.status === 'pending') counts[track].pending++
          if (idea.status === 'approved') counts[track].approved++
        }
      })

      return counts
    },
    enabled: !!user,
  })
}
