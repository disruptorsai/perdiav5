import { useState } from 'react'
import {
  useContentIdeas,
  useCreateContentIdea,
  useUpdateContentIdea,
  useDeleteContentIdea,
  useIdeaFeedback,
  useRejectIdeaWithReason,
  useApproveIdeaWithFeedback,
} from '../hooks/useContentIdeas'
import { useGenerateArticle } from '../hooks/useGeneration'
import {
  useRecordFeedback,
  useUntrainedFeedback,
  useFeedbackStats,
  REJECTION_CATEGORIES,
} from '../hooks/useIdeaFeedbackHistory'
import {
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Sparkles,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  History,
  Brain,
  ChevronRight,
  BarChart3,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { ProgressModal, useProgressModal, MinimizedProgressIndicator } from '../components/ui/progress-modal'
import IdeaFeedbackHistory from '../components/ideas/IdeaFeedbackHistory'
import AILearningModal from '../components/ideas/AILearningModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
}

function ContentIdeas() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterMonetization, setFilterMonetization] = useState(null) // high, medium, low, or null for all
  const [generatingIdea, setGeneratingIdea] = useState(null)
  const [rejectModalIdea, setRejectModalIdea] = useState(null) // For rejection reason modal
  const [activeTab, setActiveTab] = useState('ideas') // ideas, history
  const [learningModalOpen, setLearningModalOpen] = useState(false)

  // Progress modal for article generation
  const progressModal = useProgressModal()

  const { data: ideas = [], isLoading } = useContentIdeas({ status: filterStatus })
  const createIdea = useCreateContentIdea()
  const updateIdea = useUpdateContentIdea()
  const deleteIdea = useDeleteContentIdea()
  const generateArticle = useGenerateArticle()
  const ideaFeedback = useIdeaFeedback()
  const rejectWithReason = useRejectIdeaWithReason()
  const approveWithFeedback = useApproveIdeaWithFeedback()
  const recordFeedback = useRecordFeedback()
  const { data: untrainedFeedback = [] } = useUntrainedFeedback(100)
  const { data: feedbackStats } = useFeedbackStats()

  const handleCreateIdea = async (formData) => {
    try {
      await createIdea.mutateAsync(formData)
      setIsModalOpen(false)
    } catch (error) {
      alert('Failed to create idea: ' + error.message)
    }
  }

  const handleApprove = async (ideaId) => {
    try {
      await updateIdea.mutateAsync({
        ideaId,
        updates: { status: 'approved' },
      })
      // Record feedback for AI learning
      await recordFeedback.mutateAsync({
        ideaId,
        decision: 'approved',
      })
    } catch (error) {
      alert('Failed to approve idea: ' + error.message)
    }
  }

  // Open rejection modal instead of immediate rejection
  const handleReject = (idea) => {
    setRejectModalIdea(idea)
  }

  // Handle rejection with reason (from modal)
  const handleRejectWithReason = async (rejectionData) => {
    try {
      await rejectWithReason.mutateAsync({
        ideaId: rejectModalIdea.id,
        ...rejectionData,
      })
      // Record feedback for AI learning
      await recordFeedback.mutateAsync({
        ideaId: rejectModalIdea.id,
        decision: 'rejected',
        rejectionCategory: rejectionData.rejectionCategory,
        rejectionReason: rejectionData.rejectionReason,
        feedbackNotes: rejectionData.feedbackNotes,
      })
      setRejectModalIdea(null)
    } catch (error) {
      alert('Failed to reject idea: ' + error.message)
    }
  }

  // Quick thumbs up/down feedback
  const handleQuickFeedback = async (ideaId, isPositive) => {
    try {
      await ideaFeedback.mutateAsync({ ideaId, isPositive })
      // Record feedback for AI learning
      await recordFeedback.mutateAsync({
        ideaId,
        decision: isPositive ? 'thumbs_up' : 'thumbs_down',
      })
    } catch (error) {
      alert('Failed to submit feedback: ' + error.message)
    }
  }

  const handleDelete = async (ideaId) => {
    if (!confirm('Are you sure you want to delete this idea?')) return

    try {
      await deleteIdea.mutateAsync(ideaId)
    } catch (error) {
      alert('Failed to delete idea: ' + error.message)
    }
  }

  const handleGenerate = async (idea) => {
    setGeneratingIdea(idea.id)

    // Start progress modal
    progressModal.start(
      'Generating Article',
      `Creating "${idea.title.substring(0, 50)}${idea.title.length > 50 ? '...' : ''}"`
    )

    try {
      await generateArticle.mutateAsync({
        idea,
        options: {
          contentType: 'guide',
          targetWordCount: 2000,
          autoAssignContributor: true,
          addInternalLinks: true,
          autoFix: true,
          maxFixAttempts: 3,
        },
        onProgress: ({ message, percentage }) => {
          progressModal.updateProgress(percentage)
          if (message) {
            progressModal.addStep(message)
            if (percentage > 10) {
              progressModal.completeStep(message)
            }
          }
        },
      })

      progressModal.addStep('Article saved to database!')
      progressModal.completeStep('Article saved to database!')
      progressModal.complete()

    } catch (error) {
      progressModal.addStep(`Error: ${error.message}`)
      progressModal.errorStep(`Error: ${error.message}`)
      progressModal.error(error.message)
    } finally {
      setGeneratingIdea(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="text-gray-600 mt-1">Manage and generate content ideas</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats Badge */}
          {feedbackStats && feedbackStats.total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{feedbackStats.approvalRate}% approval</span>
            </div>
          )}
          {/* Train AI Badge */}
          {untrainedFeedback.length > 0 && (
            <button
              onClick={() => setLearningModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>Train AI</span>
              <Badge className="bg-purple-600 text-white text-xs">
                {untrainedFeedback.length}
              </Badge>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Idea
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="ideas" className="gap-2">
            <FileText className="w-4 h-4" />
            Ideas
            <Badge variant="secondary" className="ml-1">{ideas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Feedback History
            {feedbackStats && (
              <Badge variant="secondary" className="ml-1">{feedbackStats.total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({ideas.length})
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Monetization Filters */}
          <div className="flex gap-2 mb-6">
            <span className="text-sm text-gray-500 flex items-center gap-1 mr-2">
              <DollarSign className="w-4 h-4" /> Revenue:
            </span>
            <button
              onClick={() => setFilterMonetization(null)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filterMonetization === null
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMonetization('high')}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                filterMonetization === 'high'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              <TrendingUp className="w-3 h-3" /> High $
            </button>
            <button
              onClick={() => setFilterMonetization('medium')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filterMonetization === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
              }`}
            >
              Med $
            </button>
            <button
              onClick={() => setFilterMonetization('low')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filterMonetization === 'low'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              Low $
            </button>
          </div>

          {/* Ideas Grid - filtered by monetization */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas
              .filter(idea => !filterMonetization || idea.monetization_confidence === filterMonetization)
              .map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                onGenerate={handleGenerate}
                onQuickFeedback={handleQuickFeedback}
                isGenerating={generatingIdea === idea.id}
              />
            ))}
          </div>

          {ideas.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
              <p className="text-gray-600 mb-4">Create your first content idea to get started</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Idea
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <IdeaFeedbackHistory onStartLearning={() => setLearningModalOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* Create Idea Modal */}
      {isModalOpen && (
        <CreateIdeaModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateIdea}
          isSubmitting={createIdea.isPending}
        />
      )}

      {/* Progress Modal for Article Generation */}
      <ProgressModal {...progressModal.modalProps} />
      <MinimizedProgressIndicator {...progressModal.minimizedProps} />

      {/* Rejection Reason Modal */}
      {rejectModalIdea && (
        <RejectIdeaModal
          idea={rejectModalIdea}
          onClose={() => setRejectModalIdea(null)}
          onSubmit={handleRejectWithReason}
          isSubmitting={rejectWithReason.isPending}
        />
      )}

      {/* AI Learning Modal */}
      <AILearningModal
        open={learningModalOpen}
        onOpenChange={setLearningModalOpen}
      />
    </div>
  )
}

function IdeaCard({ idea, onApprove, onReject, onDelete, onGenerate, onQuickFeedback, isGenerating }) {
  const statusConfig = STATUS_CONFIG[idea.status]
  const StatusIcon = statusConfig.icon
  const feedbackScore = idea.feedback_score || 0

  // Monetization score badge configuration
  const getMonetizationBadge = () => {
    const confidence = idea.monetization_confidence || 'unscored'
    const score = idea.monetization_score || 0

    if (confidence === 'unscored' || confidence === null) {
      return null // Don't show badge for unscored ideas
    }

    const configs = {
      high: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'High $' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Med $' },
      low: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Low $' },
    }

    return configs[confidence] || null
  }

  const monetizationBadge = getMonetizationBadge()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header: Status Badge + Monetization + Quick Feedback + Delete */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          {/* Monetization Score Badge */}
          {monetizationBadge && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${monetizationBadge.bg} ${monetizationBadge.text} border ${monetizationBadge.border}`}
              title={`Monetization potential: ${idea.monetization_confidence} (score: ${idea.monetization_score})`}
            >
              <DollarSign className="w-3 h-3" />
              {monetizationBadge.label}
            </span>
          )}
          {/* Feedback Score Badge */}
          {feedbackScore !== 0 && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              feedbackScore > 0
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {feedbackScore > 0 ? '+' : ''}{feedbackScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Quick Feedback Buttons */}
          <button
            onClick={() => onQuickFeedback(idea.id, true)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Good idea"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onQuickFeedback(idea.id, false)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Not a good idea"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete idea"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{idea.title}</h3>
      {idea.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{idea.description}</p>
      )}

      {/* Rejection reason display (for rejected ideas) */}
      {idea.status === 'rejected' && idea.rejection_category && (
        <div className="mb-4 p-2 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-1 text-xs font-medium text-red-700 mb-1">
            <MessageSquare className="w-3 h-3" />
            {REJECTION_CATEGORIES[idea.rejection_category]?.label || idea.rejection_category}
          </div>
          {idea.rejection_reason && (
            <p className="text-xs text-red-600 line-clamp-2">{idea.rejection_reason}</p>
          )}
        </div>
      )}

      {/* Degree Level + Topics */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Degree Level Badge */}
        {idea.monetization_degree_level && (
          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded border border-purple-200">
            {idea.monetization_degree_level}
          </span>
        )}
        {/* Topics */}
        {idea.seed_topics && idea.seed_topics.slice(0, 3).map((topic, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {idea.status === 'pending' && (
          <>
            <button
              onClick={() => onApprove(idea.id)}
              className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(idea)}
              className="flex-1 bg-red-600 text-white text-sm py-2 px-3 rounded hover:bg-red-700 flex items-center justify-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </>
        )}

        {idea.status === 'approved' && (
          <button
            onClick={() => onGenerate(idea)}
            disabled={isGenerating}
            className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Article
              </>
            )}
          </button>
        )}

        {idea.status === 'completed' && (
          <div className="flex-1 text-center text-sm text-gray-600 py-2">
            Article generated
          </div>
        )}

        {idea.status === 'rejected' && (
          <button
            onClick={() => onApprove(idea.id)}
            className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 px-3 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Reconsider
          </button>
        )}
      </div>
    </div>
  )
}

function CreateIdeaModal({ onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    seed_topics: '',
    source: 'manual',
    status: 'pending',
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const topics = formData.seed_topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    onSubmit({
      ...formData,
      seed_topics: topics,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Idea</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Best Online MBA Programs 2025"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of what this article should cover..."
              />
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topics (comma-separated)
              </label>
              <input
                type="text"
                value={formData.seed_topics}
                onChange={(e) => setFormData({ ...formData, seed_topics: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., mba, business school, online education"
              />
            </div>

            {/* Auto-approve checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoApprove"
                checked={formData.status === 'approved'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.checked ? 'approved' : 'pending',
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoApprove" className="ml-2 text-sm text-gray-700">
                Auto-approve (skip review)
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Idea'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function RejectIdeaModal({ idea, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    rejectionCategory: '',
    rejectionReason: '',
    feedbackNotes: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.rejectionCategory) {
      alert('Please select a rejection category')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Idea</h2>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            "{idea.title}"
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rejection Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why is this idea being rejected? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(REJECTION_CATEGORIES).map(([key, { label, description }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, rejectionCategory: key })}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.rejectionCategory === key
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Reason (for AI training)
              </label>
              <textarea
                value={formData.rejectionReason}
                onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Explain why this idea doesn't work so the AI can learn to avoid similar suggestions..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This feedback will help train the AI to suggest better ideas in the future.
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (optional)
              </label>
              <input
                type="text"
                value={formData.feedbackNotes}
                onChange={(e) => setFormData({ ...formData, feedbackNotes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Any other context or suggestions..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject Idea
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContentIdeas
