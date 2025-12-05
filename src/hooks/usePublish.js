/**
 * Publishing Hooks for GetEducated
 * React Query hooks for article publishing operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { publishArticle, bulkPublish, checkPublishEligibility, retryPublish } from '../services/publishService'

/**
 * Hook to publish a single article
 * @returns {Object} Mutation object with publishArticle function
 */
export function usePublishArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ article, options = {} }) => {
      return publishArticle(article, options)
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate article queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['articles'] })
        queryClient.invalidateQueries({ queryKey: ['article', result.articleId] })
      }
    },
  })
}

/**
 * Hook to bulk publish multiple articles
 * @returns {Object} Mutation object with bulkPublish function
 */
export function useBulkPublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articles, options = {} }) => {
      return bulkPublish(articles, options)
    },
    onSuccess: () => {
      // Invalidate all article queries
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Hook to retry a failed publish
 * @returns {Object} Mutation object with retryPublish function
 */
export function useRetryPublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, options = {} }) => {
      return retryPublish(articleId, options)
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['articles'] })
        queryClient.invalidateQueries({ queryKey: ['article', result.articleId] })
      }
    },
  })
}

/**
 * Hook to check publish eligibility (non-mutating)
 * @param {Object} article - Article to check
 * @returns {Object} Eligibility result
 */
export function usePublishEligibility(article) {
  if (!article) {
    return {
      eligible: false,
      riskLevel: 'UNKNOWN',
      qualityScore: 0,
      blockingIssues: [],
      warnings: [],
      checks: {},
    }
  }

  return checkPublishEligibility(article)
}

/**
 * Hook that combines eligibility check with publish action
 * @returns {Object} Combined eligibility and publish functionality
 */
export function usePublishWithValidation() {
  const publishMutation = usePublishArticle()

  const publishWithCheck = async (article, options = {}) => {
    // Check eligibility first
    const eligibility = checkPublishEligibility(article)

    if (!eligibility.eligible) {
      return {
        success: false,
        error: 'Article is not eligible for publishing',
        eligibility,
      }
    }

    // Proceed with publish
    return publishMutation.mutateAsync({ article, options })
  }

  return {
    publish: publishWithCheck,
    isPublishing: publishMutation.isPending,
    error: publishMutation.error,
    reset: publishMutation.reset,
  }
}

export default {
  usePublishArticle,
  useBulkPublish,
  useRetryPublish,
  usePublishEligibility,
  usePublishWithValidation,
}
