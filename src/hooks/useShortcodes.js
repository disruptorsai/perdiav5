import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Get all shortcodes
 */
export function useShortcodes(category = null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shortcodes', category],
    queryFn: async () => {
      let query = supabase
        .from('shortcodes')
        .select('*')
        .order('times_used', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get shortcode by ID
 */
export function useShortcode(shortcodeId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shortcode', shortcodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shortcodes')
        .select('*')
        .eq('id', shortcodeId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user && !!shortcodeId,
  })
}

/**
 * Create a new shortcode
 */
export function useCreateShortcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shortcodeData) => {
      const { data, error } = await supabase
        .from('shortcodes')
        .insert(shortcodeData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}

/**
 * Update an existing shortcode
 */
export function useUpdateShortcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ shortcodeId, updates }) => {
      const { data, error } = await supabase
        .from('shortcodes')
        .update(updates)
        .eq('id', shortcodeId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
      queryClient.invalidateQueries({ queryKey: ['shortcode', data.id] })
    },
  })
}

/**
 * Delete a shortcode
 */
export function useDeleteShortcode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shortcodeId) => {
      const { error } = await supabase
        .from('shortcodes')
        .delete()
        .eq('id', shortcodeId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}

/**
 * Increment shortcode usage count
 */
export function useIncrementShortcodeUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shortcodeId) => {
      // First get current count
      const { data: current, error: fetchError } = await supabase
        .from('shortcodes')
        .select('times_used')
        .eq('id', shortcodeId)
        .single()

      if (fetchError) throw fetchError

      // Increment
      const { data, error } = await supabase
        .from('shortcodes')
        .update({ times_used: (current.times_used || 0) + 1 })
        .eq('id', shortcodeId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcodes'] })
    },
  })
}

/**
 * Get shortcode categories
 */
export function useShortcodeCategories() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shortcode_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shortcodes')
        .select('category')

      if (error) throw error

      // Get unique categories
      const categories = [...new Set(data.map(s => s.category).filter(Boolean))]
      return categories.sort()
    },
    enabled: !!user,
  })
}

/**
 * Preview shortcode with context values
 */
export function formatShortcode(shortcode, context = {}) {
  let code = shortcode.code

  // Replace template variables
  for (const [key, value] of Object.entries(context)) {
    code = code.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
  }

  return code
}
