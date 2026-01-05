import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Get all content rules for the current user
 */
export function useContentRules(ruleType = null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content_rules', ruleType],
    queryFn: async () => {
      let query = supabase
        .from('content_rules')
        .select('*')
        .eq('user_id', user?.id)
        .order('priority', { ascending: false })

      if (ruleType) {
        query = query.eq('rule_type', ruleType)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get content rules organized by type
 */
export function useContentRulesOrganized() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['content_rules', 'organized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_rules')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) throw error

      // Organize by type
      return {
        domainWhitelist: data.filter(r => r.rule_type === 'domain_whitelist'),
        domainBlacklist: data.filter(r => r.rule_type === 'domain_blacklist'),
        sourceWhitelist: data.filter(r => r.rule_type === 'source_whitelist'),
        authorMapping: data.filter(r => r.rule_type === 'author_mapping'),
        blockedPatterns: data.filter(r => r.rule_type === 'blocked_pattern'),
        shortcodeRules: data.filter(r => r.rule_type === 'shortcode_rule'),
      }
    },
    enabled: !!user,
  })
}

/**
 * Create a new content rule
 */
export function useCreateContentRule() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleData) => {
      const { data, error } = await supabase
        .from('content_rules')
        .insert({
          ...ruleData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_rules'] })
    },
  })
}

/**
 * Update an existing content rule
 */
export function useUpdateContentRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleId, updates }) => {
      const { data, error } = await supabase
        .from('content_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_rules'] })
    },
  })
}

/**
 * Delete a content rule
 */
export function useDeleteContentRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId) => {
      const { error } = await supabase
        .from('content_rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_rules'] })
    },
  })
}

/**
 * Toggle rule active status
 */
export function useToggleContentRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleId, isActive }) => {
      const { data, error } = await supabase
        .from('content_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_rules'] })
    },
  })
}

/**
 * Bulk create rules (for importing)
 */
export function useBulkCreateRules() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rules) => {
      const rulesWithUser = rules.map(rule => ({
        ...rule,
        user_id: user.id,
      }))

      const { data, error } = await supabase
        .from('content_rules')
        .insert(rulesWithUser)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_rules'] })
    },
  })
}
