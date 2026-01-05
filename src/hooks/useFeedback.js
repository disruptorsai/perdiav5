import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

/**
 * Get all feedback for an article
 */
export function useArticleFeedback(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['article_feedback', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_feedback')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Get current user's feedback for an article
 */
export function useUserFeedback(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user_feedback', articleId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_feedback')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Get feedback summary for an article (up/down counts)
 */
export function useFeedbackSummary(articleId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['feedback_summary', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_feedback')
        .select('vote_type')
        .eq('article_id', articleId)

      if (error) throw error

      const upvotes = data.filter(f => f.vote_type === 'up').length
      const downvotes = data.filter(f => f.vote_type === 'down').length

      return {
        upvotes,
        downvotes,
        total: upvotes + downvotes,
        score: upvotes - downvotes,
        percentage: upvotes + downvotes > 0
          ? Math.round((upvotes / (upvotes + downvotes)) * 100)
          : 0,
      }
    },
    enabled: !!user && !!articleId,
  })
}

/**
 * Submit or update feedback (thumbs up/down with optional comment)
 */
export function useSubmitFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, voteType, comment = null }) => {
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('article_feedback')
        .upsert(
          {
            article_id: articleId,
            user_id: user.id,
            vote_type: voteType,
            comment,
          },
          {
            onConflict: 'article_id,user_id',
          }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['article_feedback', data.article_id] })
      queryClient.invalidateQueries({ queryKey: ['user_feedback', data.article_id] })
      queryClient.invalidateQueries({ queryKey: ['feedback_summary', data.article_id] })
    },
  })
}

/**
 * Remove feedback
 */
export function useRemoveFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId) => {
      const { error } = await supabase
        .from('article_feedback')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: ['article_feedback', articleId] })
      queryClient.invalidateQueries({ queryKey: ['user_feedback', articleId] })
      queryClient.invalidateQueries({ queryKey: ['feedback_summary', articleId] })
    },
  })
}

/**
 * Get all articles with feedback (for analytics)
 */
export function useArticlesWithFeedback() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['articles_with_feedback'],
    queryFn: async () => {
      // Get all feedback grouped by article
      const { data, error } = await supabase
        .from('article_feedback')
        .select(`
          article_id,
          vote_type,
          articles (
            id,
            title,
            status
          )
        `)

      if (error) throw error

      // Aggregate by article
      const articleMap = new Map()
      for (const feedback of data) {
        if (!feedback.articles) continue

        const articleId = feedback.article_id
        if (!articleMap.has(articleId)) {
          articleMap.set(articleId, {
            ...feedback.articles,
            upvotes: 0,
            downvotes: 0,
          })
        }

        const article = articleMap.get(articleId)
        if (feedback.vote_type === 'up') {
          article.upvotes++
        } else {
          article.downvotes++
        }
      }

      return Array.from(articleMap.values())
        .sort((a, b) => (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes))
    },
    enabled: !!user,
  })
}
