import { useState } from 'react'
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader2,
  Send,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  useUserFeedback,
  useFeedbackSummary,
  useArticleFeedback,
  useSubmitFeedback,
  useRemoveFeedback,
} from '../../hooks/useFeedback'

/**
 * FeedbackPanel - Thumbs up/down voting with optional comments
 * Allows users to rate article quality and provide detailed feedback
 */
function FeedbackPanel({ articleId }) {
  const [showHistory, setShowHistory] = useState(false)
  const [comment, setComment] = useState('')
  const [showCommentBox, setShowCommentBox] = useState(false)

  const { data: userFeedback, isLoading: loadingUser } = useUserFeedback(articleId)
  const { data: summary, isLoading: loadingSummary } = useFeedbackSummary(articleId)
  const { data: allFeedback, isLoading: loadingAll } = useArticleFeedback(articleId)
  const submitFeedback = useSubmitFeedback()
  const removeFeedback = useRemoveFeedback()

  const handleVote = async (voteType) => {
    // If clicking the same vote, remove it
    if (userFeedback?.vote_type === voteType) {
      await removeFeedback.mutateAsync(articleId)
      setShowCommentBox(false)
      return
    }

    // Submit new vote (will prompt for comment on thumbs down)
    if (voteType === 'down' && !showCommentBox) {
      setShowCommentBox(true)
      // Submit the vote immediately, comment can be added after
      await submitFeedback.mutateAsync({
        articleId,
        voteType,
        comment: null,
      })
      return
    }

    await submitFeedback.mutateAsync({
      articleId,
      voteType,
      comment: comment || null,
    })
    setShowCommentBox(false)
    setComment('')
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    await submitFeedback.mutateAsync({
      articleId,
      voteType: userFeedback?.vote_type || 'down',
      comment,
    })
    setShowCommentBox(false)
    setComment('')
  }

  const isLoading = loadingUser || loadingSummary || submitFeedback.isPending || removeFeedback.isPending

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">Article Feedback</h3>
          </div>
          {summary && summary.total > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                summary.percentage >= 70 ? 'text-green-600' :
                summary.percentage >= 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {summary.percentage}% positive
              </span>
              <span className="text-xs text-gray-500">
                ({summary.total} {summary.total === 1 ? 'vote' : 'votes'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Voting Section */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">
          How would you rate this article?
        </p>

        <div className="flex items-center gap-4">
          {/* Thumbs Up */}
          <button
            onClick={() => handleVote('up')}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              userFeedback?.vote_type === 'up'
                ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ThumbsUp className={`w-5 h-5 ${
                userFeedback?.vote_type === 'up' ? 'fill-green-200' : ''
              }`} />
            )}
            <span className="font-medium">
              {summary?.upvotes || 0}
            </span>
          </button>

          {/* Thumbs Down */}
          <button
            onClick={() => handleVote('down')}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              userFeedback?.vote_type === 'down'
                ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ThumbsDown className={`w-5 h-5 ${
                userFeedback?.vote_type === 'down' ? 'fill-red-200' : ''
              }`} />
            )}
            <span className="font-medium">
              {summary?.downvotes || 0}
            </span>
          </button>
        </div>

        {/* Your Current Vote */}
        {userFeedback && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Your vote:</span>
              <span className={`font-medium ${
                userFeedback.vote_type === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {userFeedback.vote_type === 'up' ? 'Positive' : 'Negative'}
              </span>
            </div>
            {userFeedback.comment && (
              <p className="text-sm text-gray-700 mt-2 italic">
                "{userFeedback.comment}"
              </p>
            )}
            {!userFeedback.comment && userFeedback.vote_type === 'down' && (
              <button
                onClick={() => setShowCommentBox(true)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                + Add feedback comment
              </button>
            )}
          </div>
        )}

        {/* Comment Box (shown after thumbs down or when editing) */}
        {showCommentBox && (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              What could be improved?
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Describe what's wrong or what could be better..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddComment}
                disabled={!comment.trim() || submitFeedback.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {submitFeedback.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Feedback
              </button>
              <button
                onClick={() => {
                  setShowCommentBox(false)
                  setComment('')
                }}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback History Section */}
      {allFeedback && allFeedback.length > 0 && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">
              All Feedback ({allFeedback.length})
            </span>
            {showHistory ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showHistory && (
            <div className="px-4 pb-4 space-y-3">
              {loadingAll ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : (
                allFeedback.map((feedback) => (
                  <FeedbackItem key={feedback.id} feedback={feedback} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(!allFeedback || allFeedback.length === 0) && !loadingAll && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">
            No feedback yet. Be the first to rate this article!
          </p>
        </div>
      )}
    </div>
  )
}

function FeedbackItem({ feedback }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full ${
          feedback.vote_type === 'up' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {feedback.vote_type === 'up' ? (
            <ThumbsUp className="w-3 h-3 text-green-600" />
          ) : (
            <ThumbsDown className="w-3 h-3 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Anonymous</span>
            <span className="text-xs text-gray-400">|</span>
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {new Date(feedback.created_at).toLocaleDateString()}
            </span>
          </div>
          {feedback.comment && (
            <p className="text-sm text-gray-700 mt-1">
              {feedback.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeedbackPanel
