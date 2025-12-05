/**
 * Publish Button Component
 * Handles article publishing with validation checks
 */

import { useState } from 'react'
import { Send, AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { usePublishArticle, usePublishEligibility } from '../../hooks/usePublish'
import { getRiskLevelColors } from '../../services/validation/riskAssessment'

export default function PublishButton({ article, onPublished, className = '' }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const publishMutation = usePublishArticle()
  const eligibility = usePublishEligibility(article)

  const handlePublish = async (status = 'draft') => {
    try {
      const result = await publishMutation.mutateAsync({
        article,
        options: { status, validateFirst: true },
      })

      if (result.success) {
        setShowConfirm(false)
        onPublished?.(result)
      }
    } catch (error) {
      console.error('Publish error:', error)
    }
  }

  const riskColors = getRiskLevelColors(eligibility.riskLevel)

  if (!article) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Publish Button */}
      <button
        onClick={() => setShowConfirm(true)}
        disabled={!eligibility.eligible || publishMutation.isPending}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-colors
          ${eligibility.eligible
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {publishMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Publish to WordPress
          </>
        )}
      </button>

      {/* Eligibility Status */}
      {!eligibility.eligible && eligibility.blockingIssues.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            <span>Cannot publish:</span>
          </div>
          <ul className="ml-5 list-disc">
            {eligibility.blockingIssues.slice(0, 3).map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Publish Article</h3>

            {/* Risk Level Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-4 ${riskColors.badge}`}>
              {eligibility.riskLevel === 'LOW' && <CheckCircle className="h-4 w-4" />}
              {eligibility.riskLevel === 'MEDIUM' && <AlertTriangle className="h-4 w-4" />}
              {eligibility.riskLevel === 'HIGH' && <AlertTriangle className="h-4 w-4" />}
              {eligibility.riskLevel === 'CRITICAL' && <XCircle className="h-4 w-4" />}
              Risk Level: {eligibility.riskLevel}
            </div>

            {/* Quality Score */}
            <div className="mb-4">
              <span className="text-gray-600">Quality Score: </span>
              <span className={`font-semibold ${
                eligibility.qualityScore >= 80 ? 'text-green-600' :
                eligibility.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {eligibility.qualityScore}/100
              </span>
            </div>

            {/* Validation Checks */}
            <div className="mb-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">Validation Checks:</div>
              {Object.entries(eligibility.checks || {}).map(([key, check]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="capitalize">{key}:</span>
                  <span className="text-gray-600">{check.message}</span>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {eligibility.warnings?.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 font-medium text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </div>
                <ul className="mt-1 text-sm text-yellow-600 list-disc ml-5">
                  {eligibility.warnings.slice(0, 5).map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePublish('draft')}
                disabled={publishMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handlePublish('publish')}
                disabled={publishMutation.isPending || !eligibility.eligible}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Publish Now
              </button>
            </div>

            {/* Error Display */}
            {publishMutation.error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                Error: {publishMutation.error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
