import { useState } from 'react'
import {
  useContentIdeas,
  useCreateContentIdea,
  useUpdateContentIdea,
  useDeleteContentIdea,
  useTrackCounts,
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
  DollarSign,
  User,
  Star,
  Wand2,
} from 'lucide-react'
import TitleSuggestions from '../components/ideas/TitleSuggestions'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
}

const TRACK_CONFIG = {
  monetization: {
    label: 'Monetization',
    description: 'Sponsored schools & auto-generated content',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    icon: DollarSign,
    iconColor: 'text-yellow-600',
  },
  user_initiated: {
    label: 'User-Initiated',
    description: 'Manual research-based content',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: User,
    iconColor: 'text-blue-600',
  },
}

function ContentIdeas() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterTrack, setFilterTrack] = useState(null)
  const [generatingIdea, setGeneratingIdea] = useState(null)
  const [generationProgress, setGenerationProgress] = useState({ message: '', percentage: 0 })

  const { data: ideas = [], isLoading } = useContentIdeas({
    status: filterStatus,
    generation_track: filterTrack,
  })
  const { data: trackCounts } = useTrackCounts()
  const createIdea = useCreateContentIdea()
  const updateIdea = useUpdateContentIdea()
  const deleteIdea = useDeleteContentIdea()
  const generateArticle = useGenerateArticle()

  // Filter ideas by track if filter is set
  const filteredIdeas = filterTrack
    ? ideas.filter(idea => (idea.generation_track || 'user_initiated') === filterTrack)
    : ideas

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
    setGenerationProgress({ message: 'Starting generation...', percentage: 0 })

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
        onProgress: (progress) => {
          setGenerationProgress(progress)
        },
      })

      setGenerationProgress({ message: 'Complete!', percentage: 100 })

      // Show success message briefly before clearing
      setTimeout(() => {
        setGeneratingIdea(null)
        setGenerationProgress({ message: '', percentage: 0 })
      }, 2000)

    } catch (error) {
      alert('Failed to generate article: ' + error.message)
      setGeneratingIdea(null)
      setGenerationProgress({ message: '', percentage: 0 })
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
    <div className="p-8">
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

      {/* Track Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(TRACK_CONFIG).map(([track, config]) => {
          const TrackIcon = config.icon
          const counts = trackCounts?.[track] || { total: 0, pending: 0, approved: 0 }
          const isActive = filterTrack === track

          return (
            <button
              key={track}
              onClick={() => setFilterTrack(isActive ? null : track)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? `${config.color} ring-2 ring-offset-2 ring-opacity-50 ${track === 'monetization' ? 'ring-yellow-400' : 'ring-blue-400'}`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white bg-opacity-50' : 'bg-gray-100'}`}>
                  <TrackIcon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${isActive ? '' : 'text-gray-900'}`}>
                    {config.label}
                  </p>
                  <p className={`text-xs ${isActive ? 'opacity-75' : 'text-gray-500'}`}>
                    {config.description}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className={`text-2xl font-bold ${isActive ? '' : 'text-gray-900'}`}>
                    {counts.total}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="text-yellow-600">{counts.pending} pending</span>
                    <span className="text-green-600">{counts.approved} ready</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({filteredIdeas.length})
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

        {filterTrack && (
          <button
            onClick={() => setFilterTrack(null)}
            className="ml-auto px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Clear Track Filter
          </button>
        )}
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas
          .filter(idea => !filterStatus || idea.status === filterStatus)
          .map((idea) => (
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

      {filteredIdeas.length === 0 && (
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

      {/* Generation Progress Modal */}
      {generatingIdea && (
        <GenerationProgressModal
          progress={generationProgress}
        />
      )}
    </div>
  )
}

function IdeaCard({ idea, onApprove, onReject, onDelete, onGenerate, isGenerating }) {
  const statusConfig = STATUS_CONFIG[idea.status]
  const trackConfig = TRACK_CONFIG[idea.generation_track || 'user_initiated']
  const StatusIcon = statusConfig.icon
  const TrackIcon = trackConfig.icon

  return (
    <div className={`bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
      idea.generation_track === 'monetization' ? 'border-yellow-200' : 'border-gray-200'
    }`}>
      {/* Track Header */}
      <div className={`px-4 py-2 flex items-center gap-2 ${trackConfig.badgeColor}`}>
        <TrackIcon className="w-4 h-4" />
        <span className="text-xs font-medium">{trackConfig.label}</span>
        {idea.auto_generate_title && (
          <span className="ml-auto flex items-center gap-1 text-xs opacity-75">
            <Wand2 className="w-3 h-3" />
            AI Title
          </span>
        )}
      </div>

      <div className="p-6">
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
    generation_track: 'user_initiated',
    auto_generate_title: false,
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

  const handleTitleSelect = (title) => {
    setFormData({ ...formData, title, auto_generate_title: true })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Idea</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Generation Track */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generation Track
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(TRACK_CONFIG).map(([track, config]) => {
                  const TrackIcon = config.icon
                  const isSelected = formData.generation_track === track

                  return (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setFormData({ ...formData, generation_track: track })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? `${config.color} ring-2 ring-offset-1 ${track === 'monetization' ? 'ring-yellow-400' : 'ring-blue-400'}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TrackIcon className={`w-5 h-5 ${config.iconColor}`} />
                        <div>
                          <p className={`font-medium ${isSelected ? '' : 'text-gray-900'}`}>
                            {config.label}
                          </p>
                          <p className={`text-xs ${isSelected ? 'opacity-75' : 'text-gray-500'}`}>
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description First (for AI title generation) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description / Topic
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of what this article should cover..."
              />
            </div>

            {/* AI Title Generation Toggle */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">AI Title Generation</span>
                </div>
              </div>
              <TitleSuggestions
                description={formData.description}
                topics={formData.seed_topics}
                onSelectTitle={handleTitleSelect}
                disabled={isSubmitting}
              />
            </div>

            {/* Manual Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title {formData.auto_generate_title && <span className="text-purple-600">(AI Generated)</span>}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, auto_generate_title: false })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.auto_generate_title ? 'border-purple-300 bg-purple-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Best Online MBA Programs 2025"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.auto_generate_title
                  ? 'Title was selected from AI suggestions. Edit to customize.'
                  : 'Enter a title manually or use AI suggestions above.'}
              </p>
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

function GenerationProgressModal({ progress }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Generating Article...</h2>
          <p className="text-sm text-gray-600 mb-6">{progress.message}</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{progress.percentage}% complete</p>

          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p>• Drafting with Grok AI</p>
            <p>• Humanizing with Claude AI</p>
            <p>• Adding internal links</p>
            <p>• Running quality assurance</p>
            <p>• Auto-fixing issues (up to 3 attempts)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentIdeas
