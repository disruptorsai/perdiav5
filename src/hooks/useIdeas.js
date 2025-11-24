import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabaseClient'

/**
 * Generate content ideas from keywords
 * Uses Edge Function for secure server-side generation
 */
export function useGenerateIdeas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ seedKeywords, count = 10 }) => {
      const { data, error } = await supabase.functions.invoke('generate-ideas-from-keywords', {
        body: {
          seedKeywords,
          count,
          userId: user.id,
        },
      })

      if (error) {
        throw new Error(error.message || 'Idea generation failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'Idea generation failed')
      }

      return data.ideas
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas'] })
    },
  })
}

/**
 * Approve a content idea
 */
export function useApproveIdea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ideaId) => {
      const { data, error } = await supabase
        .from('content_ideas')
        .update({ status: 'approved' })
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
 * Reject a content idea
 */
export function useRejectIdea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ideaId) => {
      const { data, error } = await supabase
        .from('content_ideas')
        .update({ status: 'rejected' })
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
 * Delete a content idea
 */
export function useDeleteIdea() {
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
