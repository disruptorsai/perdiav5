import { useState } from 'react'
import {
  useContentIdeas,
  useCreateContentIdea,
  useUpdateContentIdea,
  useDeleteContentIdea,
} from '../hooks/useContentIdeas'
import { useGenerateArticle } from '../hooks/useGeneration'
import {
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react'
import { ProgressModal, useProgressModal } from '../components/ui/progress-modal'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
}

function ContentIdeas() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState(null)
  const [generatingIdea, setGeneratingIdea] = useState(null)

  // Progress modal for article generation
  const progressModal = useProgressModal()

  const { data: ideas = [], isLoading } = useContentIdeas({ status: filterStatus })
  const createIdea = useCreateContentIdea()
  const updateIdea = useUpdateContentIdea()
  const deleteIdea = useDeleteContentIdea()
  const generateArticle = useGenerateArticle()

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
    } catch (error) {
      alert('Failed to approve idea: ' + error.message)
    }
  }

  const handleReject = async (ideaId) => {
    try {
      await updateIdea.mutateAsync({
        ideaId,
        updates: { status: 'rejected' },
      })
    } catch (error) {
      alert('Failed to reject idea: ' + error.message)
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="text-gray-600 mt-1">Manage and generate content ideas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Idea
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
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

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onGenerate={handleGenerate}
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
    </div>
  )
}

function IdeaCard({ idea, onApprove, onReject, onDelete, onGenerate, isGenerating }) {
  const statusConfig = STATUS_CONFIG[idea.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        <button
          onClick={() => onDelete(idea.id)}
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{idea.title}</h3>
      {idea.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{idea.description}</p>
      )}

      {/* Topics */}
      {idea.seed_topics && idea.seed_topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.seed_topics.slice(0, 3).map((topic, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

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
              onClick={() => onReject(idea.id)}
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

export default ContentIdeas
