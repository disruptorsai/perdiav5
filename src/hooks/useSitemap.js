import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import SitemapCrawler from '../services/sitemapCrawler'

/**
 * Get sitemap crawl status/history
 */
export function useSitemapStatus() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sitemap_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_crawl_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get the most recent crawl
 */
export function useLatestCrawl() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['latest_crawl'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sitemap_crawl_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Trigger a sitemap crawl
 */
export function useTriggerCrawl() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options = {}) => {
      const crawler = new SitemapCrawler()
      const result = await crawler.crawl(user.id, options)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sitemap_status'] })
      queryClient.invalidateQueries({ queryKey: ['latest_crawl'] })
      queryClient.invalidateQueries({ queryKey: ['site_articles'] })
      queryClient.invalidateQueries({ queryKey: ['sponsored_schools'] })
    },
  })
}

/**
 * Get sponsored schools
 */
export function useSponsoredSchools(limit = 50) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sponsored_schools', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_articles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_sponsored', true)
        .order('school_priority', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get site articles for internal linking
 */
export function useSiteArticles(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['site_articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('site_articles')
        .select('*')
        .eq('user_id', user?.id)
        .order('school_priority', { ascending: false })
        .limit(filters.limit || 100)

      if (filters.section) {
        query = query.eq('section', filters.section)
      }

      if (filters.sponsored !== undefined) {
        query = query.eq('is_sponsored', filters.sponsored)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,url.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

/**
 * Get section counts
 */
export function useSectionCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['section_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_articles')
        .select('section')
        .eq('user_id', user?.id)

      if (error) throw error

      // Count by section
      const counts = {}
      for (const article of data) {
        const section = article.section || 'unknown'
        counts[section] = (counts[section] || 0) + 1
      }

      return Object.entries(counts)
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count)
    },
    enabled: !!user,
  })
}

/**
 * Update site article
 */
export function useUpdateSiteArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, updates }) => {
      const { data, error } = await supabase
        .from('site_articles')
        .update(updates)
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_articles'] })
      queryClient.invalidateQueries({ queryKey: ['sponsored_schools'] })
    },
  })
}

/**
 * Manually add a site article
 */
export function useAddSiteArticle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleData) => {
      const { data, error } = await supabase
        .from('site_articles')
        .insert({
          ...articleData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_articles'] })
    },
  })
}

/**
 * Delete a site article
 */
export function useDeleteSiteArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      const { error } = await supabase
        .from('site_articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_articles'] })
      queryClient.invalidateQueries({ queryKey: ['sponsored_schools'] })
    },
  })
}
