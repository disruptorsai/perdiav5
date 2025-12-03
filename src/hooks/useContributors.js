import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Fetch all contributors
 */
export function useContributors(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['contributors', filters],
    queryFn: async () => {
      let query = supabase
        .from('article_contributors')
        .select('*')
        .order('name', { ascending: true })

      // Note: is_active column doesn't exist in current schema
      // Contributors are managed via seeds and are always available

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch all contributors (active filter not supported in current schema)
 */
export function useActiveContributors() {
  return useContributors({})
}

/**
 * Fetch a single contributor by ID
 */
export function useContributor(contributorId) {
  return useQuery({
    queryKey: ['contributor', contributorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_contributors')
        .select('*')
        .eq('id', contributorId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!contributorId,
  })
}

/**
 * Get contributor statistics
 */
export function useContributorStats() {
  const { data: contributors = [] } = useContributors()

  return {
    total: contributors.length,
    active: contributors.filter(c => c.is_active).length,
    totalArticles: contributors.reduce((sum, c) => sum + (c.article_count || 0), 0),
  }
}

/**
 * Create a new contributor
 */
export function useCreateContributor() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contributorData) => {
      const { data, error } = await supabase
        .from('article_contributors')
        .insert({
          ...contributorData,
          user_id: user?.id,
          is_active: true,
          article_count: 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

/**
 * Update a contributor
 */
export function useUpdateContributor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('article_contributors')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
      queryClient.invalidateQueries({ queryKey: ['contributor', data.id] })
    },
  })
}

/**
 * Toggle contributor active status
 */
export function useToggleContributorStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { data, error } = await supabase
        .from('article_contributors')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

/**
 * Delete a contributor
 */
export function useDeleteContributor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('article_contributors')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

/**
 * Increment article count for a contributor
 */
export function useIncrementContributorArticleCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contributorId) => {
      const { data: current, error: fetchError } = await supabase
        .from('article_contributors')
        .select('article_count')
        .eq('id', contributorId)
        .single()

      if (fetchError) throw fetchError

      const { data, error } = await supabase
        .from('article_contributors')
        .update({ article_count: (current.article_count || 0) + 1 })
        .eq('id', contributorId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}
