import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * GetEducated Site Catalog Hooks
 *
 * These hooks provide access to the comprehensive GetEducated.com site catalog
 * stored in Supabase. This includes 1000+ articles with full content for:
 * - Internal linking during article generation
 * - Content analysis and AI training
 * - Finding relevant articles for topic matching
 */

// ========================================
// ARTICLE HOOKS
// ========================================

/**
 * Fetch GetEducated articles with filtering
 * @param {Object} filters - Filter options
 * @param {string} filters.contentType - Filter by content type (ranking, career, blog, guide, etc.)
 * @param {string} filters.degreeLevel - Filter by degree level (doctorate, masters, bachelors, etc.)
 * @param {string} filters.subjectArea - Filter by subject area (nursing, business, education, etc.)
 * @param {string} filters.search - Search in title and content
 * @param {boolean} filters.hasContent - Filter to only enriched articles
 * @param {number} filters.limit - Maximum number of results
 */
export function useGetEducatedArticles(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['geteducated-articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('geteducated_articles')
        .select('*')
        .order('updated_at', { ascending: false })

      // Apply filters
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType)
      }

      if (filters.degreeLevel) {
        query = query.eq('degree_level', filters.degreeLevel)
      }

      if (filters.subjectArea) {
        query = query.eq('subject_area', filters.subjectArea)
      }

      if (filters.hasContent) {
        query = query.not('content_text', 'is', null)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      } else {
        query = query.limit(100) // Default limit
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get a single GetEducated article by URL
 */
export function useGetEducatedArticle(url) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['geteducated-article', url],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geteducated_articles')
        .select('*')
        .eq('url', url)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user && !!url,
  })
}

/**
 * Find relevant GetEducated articles for internal linking
 * Uses the find_relevant_ge_articles SQL function for intelligent matching
 *
 * @param {Object} params - Search parameters
 * @param {string[]} params.topics - Topics to match
 * @param {string} params.subjectArea - Subject area to prefer
 * @param {string} params.degreeLevel - Degree level to prefer
 * @param {string[]} params.excludeUrls - URLs to exclude (e.g., current article)
 * @param {number} params.limit - Maximum results (default 10)
 */
export function useFindRelevantArticles(params = {}) {
  const { user } = useAuth()
  const { topics = [], subjectArea, degreeLevel, excludeUrls = [], limit = 10 } = params

  return useQuery({
    queryKey: ['geteducated-relevant', topics, subjectArea, degreeLevel, excludeUrls],
    queryFn: async () => {
      // Use the SQL function for intelligent matching
      const { data, error } = await supabase.rpc('find_relevant_ge_articles', {
        search_topics: topics,
        search_subject: subjectArea || null,
        search_degree_level: degreeLevel || null,
        exclude_urls: excludeUrls,
        result_limit: limit,
      })

      if (error) {
        console.error('Error finding relevant articles:', error)
        // Fallback to simple query if RPC fails
        return fallbackRelevantSearch(topics, subjectArea, degreeLevel, excludeUrls, limit)
      }

      return data || []
    },
    enabled: !!user && topics.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fallback search when RPC is not available
 */
async function fallbackRelevantSearch(topics, subjectArea, degreeLevel, excludeUrls, limit) {
  let query = supabase
    .from('geteducated_articles')
    .select('id, url, title, excerpt, content_type, degree_level, subject_area, topics, times_linked_to')
    .not('content_text', 'is', null)
    .order('times_linked_to', { ascending: true })
    .limit(limit * 3) // Get more for client-side filtering

  if (subjectArea) {
    query = query.eq('subject_area', subjectArea)
  }

  if (degreeLevel) {
    query = query.eq('degree_level', degreeLevel)
  }

  const { data, error } = await query

  if (error) throw error

  // Client-side relevance scoring
  const scoredArticles = (data || [])
    .filter(a => !excludeUrls.includes(a.url))
    .map(article => {
      let score = 0

      // Score by topic overlap
      if (article.topics && topics.length > 0) {
        const topicMatches = topics.filter(t =>
          article.topics.some(at => at.toLowerCase().includes(t.toLowerCase()))
        )
        score += topicMatches.length * 20
      }

      // Score by title keyword matches
      const titleWords = article.title.toLowerCase().split(' ')
      const keywordMatches = topics.filter(t =>
        titleWords.some(tw => tw.includes(t.toLowerCase()))
      )
      score += keywordMatches.length * 10

      return { ...article, relevance_score: score }
    })
    .filter(a => a.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit)

  return scoredArticles
}

/**
 * Get catalog enrichment statistics
 */
export function useGetEducatedCatalogStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['geteducated-catalog-stats'],
    queryFn: async () => {
      // Get total count
      const { count: totalCount } = await supabase
        .from('geteducated_articles')
        .select('*', { count: 'exact', head: true })

      // Get enriched count (has content)
      const { count: enrichedCount } = await supabase
        .from('geteducated_articles')
        .select('*', { count: 'exact', head: true })
        .not('content_text', 'is', null)

      // Get content type breakdown
      const { data: contentTypes } = await supabase
        .from('geteducated_articles')
        .select('content_type')

      const contentTypeBreakdown = {}
      ;(contentTypes || []).forEach(a => {
        const type = a.content_type || 'other'
        contentTypeBreakdown[type] = (contentTypeBreakdown[type] || 0) + 1
      })

      // Get degree level breakdown
      const { data: degreeLevels } = await supabase
        .from('geteducated_articles')
        .select('degree_level')
        .not('degree_level', 'is', null)

      const degreeLevelBreakdown = {}
      ;(degreeLevels || []).forEach(a => {
        if (a.degree_level) {
          degreeLevelBreakdown[a.degree_level] = (degreeLevelBreakdown[a.degree_level] || 0) + 1
        }
      })

      // Get subject area breakdown
      const { data: subjectAreas } = await supabase
        .from('geteducated_articles')
        .select('subject_area')
        .not('subject_area', 'is', null)

      const subjectAreaBreakdown = {}
      ;(subjectAreas || []).forEach(a => {
        if (a.subject_area) {
          subjectAreaBreakdown[a.subject_area] = (subjectAreaBreakdown[a.subject_area] || 0) + 1
        }
      })

      return {
        totalArticles: totalCount || 0,
        enrichedArticles: enrichedCount || 0,
        enrichmentProgress: totalCount > 0 ? Math.round((enrichedCount / totalCount) * 100) : 0,
        needsEnrichment: (totalCount || 0) - (enrichedCount || 0),
        contentTypes: contentTypeBreakdown,
        degreeLevels: degreeLevelBreakdown,
        subjectAreas: subjectAreaBreakdown,
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ========================================
// AUTHOR HOOKS
// ========================================

/**
 * Fetch all GetEducated authors
 */
export function useGetEducatedAuthors() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['geteducated-authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geteducated_authors')
        .select('*')
        .order('articles_count', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

// ========================================
// SCHOOL HOOKS
// ========================================

/**
 * Fetch GetEducated schools with filtering
 */
export function useGetEducatedSchools(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['geteducated-schools', filters],
    queryFn: async () => {
      let query = supabase
        .from('geteducated_schools')
        .select('*')
        .order('name', { ascending: true })

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      } else {
        query = query.limit(100)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

// ========================================
// LINK TRACKING HOOKS
// ========================================

/**
 * Increment the times_linked_to counter for an article
 */
export function useIncrementArticleLinkCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleUrl) => {
      // Use the SQL function if available
      const { data, error } = await supabase.rpc('increment_article_link_count', {
        article_url: articleUrl,
      })

      if (error) {
        // Fallback to manual increment
        const { data: article } = await supabase
          .from('geteducated_articles')
          .select('id, times_linked_to')
          .eq('url', articleUrl)
          .single()

        if (article) {
          await supabase
            .from('geteducated_articles')
            .update({ times_linked_to: (article.times_linked_to || 0) + 1 })
            .eq('id', article.id)
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geteducated-articles'] })
      queryClient.invalidateQueries({ queryKey: ['geteducated-relevant'] })
    },
  })
}

/**
 * Mark an article as needing rewrite
 */
export function useMarkArticleForRewrite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleUrl) => {
      const { data, error } = await supabase
        .from('geteducated_articles')
        .update({ needs_rewrite: true })
        .eq('url', articleUrl)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geteducated-articles'] })
    },
  })
}

/**
 * Mark an article rewrite as complete (after re-scraping)
 */
export function useCompleteArticleRewrite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleUrl, newContent }) => {
      const updates = {
        needs_rewrite: false,
        scraped_at: new Date().toISOString(),
      }

      // If new content is provided, update it
      if (newContent) {
        updates.content_html = newContent.content_html
        updates.content_text = newContent.content_text
        updates.word_count = newContent.word_count
        updates.heading_structure = newContent.heading_structure
        updates.internal_links = newContent.internal_links
        updates.external_links = newContent.external_links
      }

      const { data, error } = await supabase
        .from('geteducated_articles')
        .update(updates)
        .eq('url', articleUrl)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geteducated-articles'] })
    },
  })
}

// ========================================
// SYNC HOOKS
// ========================================

/**
 * Add a new article to the catalog (after publishing)
 */
export function useAddArticleToCatalog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleData) => {
      const { url, title, content, contentType, degreeLevel, subjectArea, topics } = articleData

      // Strip HTML for text content
      const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const wordCount = textContent.split(' ').filter(w => w.length > 0).length

      // Generate slug from URL
      const slug = url.replace('https://www.geteducated.com/', '').replace(/\/$/, '')

      const { data, error } = await supabase
        .from('geteducated_articles')
        .upsert({
          url,
          slug,
          title,
          content_html: content,
          content_text: textContent,
          word_count: wordCount,
          content_type: contentType || 'guide',
          degree_level: degreeLevel || null,
          subject_area: subjectArea || null,
          topics: topics || [],
          primary_topic: topics?.[0] || null,
          scraped_at: new Date().toISOString(),
          needs_rewrite: false,
          times_linked_to: 0,
        }, { onConflict: 'url' })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geteducated-articles'] })
      queryClient.invalidateQueries({ queryKey: ['geteducated-catalog-stats'] })
    },
  })
}

// ========================================
// FILTER OPTIONS
// ========================================

/**
 * Get available filter options from the catalog
 */
export function useGetEducatedFilterOptions() {
  const { data: stats } = useGetEducatedCatalogStats()

  return {
    contentTypes: stats?.contentTypes ? Object.keys(stats.contentTypes) : [],
    degreeLevels: stats?.degreeLevels ? Object.keys(stats.degreeLevels) : [],
    subjectAreas: stats?.subjectAreas ? Object.keys(stats.subjectAreas) : [],
  }
}
