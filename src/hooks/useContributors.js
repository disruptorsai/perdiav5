import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * GetEducated approved authors
 * CRITICAL: Only these 4 people can be attributed as authors on GetEducated content
 */
export const APPROVED_AUTHORS = ['Tony Huffman', 'Kayleigh Gilbert', 'Sarah', 'Charity']

/**
 * Author display name mapping
 */
export const AUTHOR_DISPLAY_NAMES = {
  'Tony Huffman': 'Kif',
  'Kayleigh Gilbert': 'Alicia Carrasco',
  'Sarah': 'Daniel Catena',
  'Charity': 'Julia Tell',
}

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
 * Fetch only active contributors
 */
export function useActiveContributors() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['contributors', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_contributors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/**
 * Fetch only the 4 approved GetEducated authors
 * CRITICAL: Use this for all author selection in the GetEducated workflow
 */
export function useApprovedContributors() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['contributors', 'approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_contributors')
        .select('*')
        .eq('is_active', true)
        .in('name', APPROVED_AUTHORS)
        .order('name', { ascending: true })

      if (error) throw error

      // Ensure we only return approved authors even if DB has others
      const approved = (data || []).filter(c => APPROVED_AUTHORS.includes(c.name))

      // If no approved authors in DB, return placeholder data
      if (approved.length === 0) {
        console.warn('No approved contributors found in database. Using fallback data.')
        return APPROVED_AUTHORS.map(name => ({
          id: null,
          name,
          display_name: AUTHOR_DISPLAY_NAMES[name],
          is_active: true,
          expertise_areas: [],
          content_types: [],
        }))
      }

      return approved
    },
    enabled: !!user,
  })
}

/**
 * Check if an author name is approved for GetEducated
 * @param {string} authorName - The author name to check
 * @returns {boolean} True if author is approved
 */
export function isApprovedAuthor(authorName) {
  return APPROVED_AUTHORS.includes(authorName)
}

/**
 * Get the display name for an author
 * @param {string} authorName - The real author name
 * @returns {string} The display name (pen name)
 */
export function getAuthorDisplayName(authorName) {
  return AUTHOR_DISPLAY_NAMES[authorName] || authorName
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
    totalArticles: contributors.reduce((sum, c) => sum + (c.articles_count || c.article_count || 0), 0),
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
