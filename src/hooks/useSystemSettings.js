import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'

/**
 * Fetch all system settings
 */
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key')

      if (error) throw error
      return data || []
    },
  })
}

/**
 * Get a single setting value with a default fallback
 */
export function useSettingValue(settingKey, defaultValue = '') {
  const { data: settings = [] } = useSystemSettings()
  const setting = settings.find(s => s.key === settingKey)
  return setting?.value ?? defaultValue
}

/**
 * Hook to get settings as a map for easy access
 */
export function useSettingsMap() {
  const { data: settings = [], isLoading, error } = useSystemSettings()

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})

  const getValue = (key, defaultValue = '') => {
    return settingsMap[key] ?? defaultValue
  }

  const getBoolValue = (key, defaultValue = false) => {
    const value = settingsMap[key]
    if (value === undefined) return defaultValue
    return value === 'true'
  }

  const getIntValue = (key, defaultValue = 0) => {
    const value = settingsMap[key]
    if (value === undefined) return defaultValue
    return parseInt(value, 10) || defaultValue
  }

  const getFloatValue = (key, defaultValue = 0) => {
    const value = settingsMap[key]
    if (value === undefined) return defaultValue
    return parseFloat(value) || defaultValue
  }

  return {
    settings: settingsMap,
    getValue,
    getBoolValue,
    getIntValue,
    getFloatValue,
    isLoading,
    error,
  }
}

/**
 * Update or create a system setting
 */
export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value, category = 'workflow', description = '' }) => {
      // First, try to find existing setting
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .single()

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new
        const { data, error } = await supabase
          .from('system_settings')
          .insert({
            key,
            value,
            category,
            description,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}

/**
 * Bulk update multiple settings at once
 */
export function useBulkUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings) => {
      // settings is an array of { key, value, category?, description? }
      const results = []

      for (const setting of settings) {
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('key', setting.key)
          .single()

        if (existing) {
          const { data, error } = await supabase
            .from('system_settings')
            .update({ value: setting.value })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error
          results.push(data)
        } else {
          const { data, error } = await supabase
            .from('system_settings')
            .insert({
              key: setting.key,
              value: setting.value,
              category: setting.category || 'workflow',
              description: setting.description || '',
            })
            .select()
            .single()

          if (error) throw error
          results.push(data)
        }
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}

/**
 * Delete a system setting
 */
export function useDeleteSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settingKey) => {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('key', settingKey)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}
