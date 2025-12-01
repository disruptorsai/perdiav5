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
        .order('setting_key')

      if (error) throw error
      return data || []
    },
  })
}

/**
 * Get a single setting value with a default fallback
 */
export function useSettingValue(key, defaultValue = '') {
  const { data: settings = [] } = useSystemSettings()
  const setting = settings.find(s => s.setting_key === key)
  return setting?.setting_value ?? defaultValue
}

/**
 * Hook to get settings as a map for easy access
 */
export function useSettingsMap() {
  const { data: settings = [], isLoading, error } = useSystemSettings()

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value
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
    mutationFn: async ({ key, value, type = 'workflow', description = '' }) => {
      // First, try to find existing setting
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('setting_key', key)
        .single()

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('system_settings')
          .update({ setting_value: value })
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
            setting_key: key,
            setting_value: value,
            setting_type: type,
            description,
            editable_by: 'admin',
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
      // settings is an array of { key, value, type?, description? }
      const results = []

      for (const setting of settings) {
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('setting_key', setting.key)
          .single()

        if (existing) {
          const { data, error } = await supabase
            .from('system_settings')
            .update({ setting_value: setting.value })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error
          results.push(data)
        } else {
          const { data, error } = await supabase
            .from('system_settings')
            .insert({
              setting_key: setting.key,
              setting_value: setting.value,
              setting_type: setting.type || 'workflow',
              description: setting.description || '',
              editable_by: 'admin',
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
    mutationFn: async (key) => {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', key)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
  })
}
