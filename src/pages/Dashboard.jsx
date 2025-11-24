import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArticles, useUpdateArticleStatus } from '../hooks/useArticles'
import { useContentIdeas } from '../hooks/useContentIdeas'
import { useGenerateArticle } from '../hooks/useGeneration'
import { Plus, Loader2, FileText, Clock, CheckCircle, AlertCircle, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

const STATUSES = [
  { value: 'idea', label: 'Ideas', icon: FileText, color: 'bg-gray-100 text-gray-700' },
  { value: 'drafting', label: 'Drafting', icon: Loader2, color: 'bg-blue-100 text-blue-700' },
  { value: 'refinement', label: 'Refinement', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qa_review', label: 'QA Review', icon: AlertCircle, color: 'bg-orange-100 text-orange-700' },
  { value: 'ready_to_publish', label: 'Ready', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
]

function Dashboard() {
  const navigate = useNavigate()
  const { data: articles = [], isLoading } = useArticles()
  const { data: ideas = [] } = useContentIdeas({ status: 'approved' })
  const updateStatus = useUpdateArticleStatus()
  const generateArticle = useGenerateArticle()

  const [generatingIdea, setGeneratingIdea] = useState(null)
  const [activeId, setActiveId] = useState(null)

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before dragging starts
      },
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const articleId = active.id
    const newStatus = over.id

    // Find the article being dragged
    const article = articles.find(a => a.id === articleId)

    if (article && article.status !== newStatus) {
      // Update status in database
      handleStatusChange(article, newStatus)
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handleGenerateArticle = async (idea) => {
    setGeneratingIdea(idea.id)
    try {
      await generateArticle.mutateAsync({
        idea,
        options: {
          contentType: 'guide',
          targetWordCount: 2000,
          autoAssignContributor: true,
          addInternalLinks: true,
        },
      })
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate article: ' + error.message)
    } finally {
      setGeneratingIdea(null)
    }
  }

  const handleArticleClick = (article) => {
    navigate(`/editor/${article.id}`)
  }

  const handleStatusChange = async (article, newStatus) => {
    try {
      await updateStatus.mutateAsync({
        articleId: article.id,
        status: newStatus,
      })
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const getArticlesByStatus = (status) => {
    return articles.filter(a => a.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Get the active article for drag overlay
  const activeArticle = activeId ? articles.find(a => a.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Pipeline</h1>
            <p className="text-gray-600 mt-1">Manage your content workflow from idea to publication</p>
          </div>

          {/* Auto/Manual Mode Toggle */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Automation Mode:</span>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              title="Manual Mode: Generate articles one at a time on demand"
            >
              Manual
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium opacity-50 cursor-not-allowed"
              disabled
              title="Auto Mode: Coming soon - autonomous article generation"
            >
              Auto (Coming Soon)
            </button>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {STATUSES.map(status => {
          const count = getArticlesByStatus(status.value).length
          const StatusIcon = status.icon

          return (
            <div key={status.value} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
                <div className={`p-3 rounded-lg ${status.color}`}>
                  <StatusIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {/* Ideas Column */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Ideas</h3>
            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
              {ideas.length}
            </span>
          </div>

          <div className="space-y-3">
            {ideas.map(idea => (
              <div
                key={idea.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 text-sm mb-2">{idea.title}</h4>
                {idea.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{idea.description}</p>
                )}

                <button
                  onClick={() => handleGenerateArticle(idea)}
                  disabled={generatingIdea === idea.id}
                  className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {generatingIdea === idea.id ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Generate Article
                    </>
                  )}
                </button>
              </div>
            ))}

            {ideas.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">
                No approved ideas yet
              </div>
            )}
          </div>
        </div>

        {/* Article Columns */}
        {STATUSES.slice(1).map(status => {
          const statusArticles = getArticlesByStatus(status.value)
          const StatusIcon = status.icon

          return (
            <DroppableColumn key={status.value} id={status.value}>
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <StatusIcon className="w-4 h-4 mr-2 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{status.label}</h3>
                  </div>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                    {statusArticles.length}
                  </span>
                </div>

                <SortableContext
                  items={statusArticles.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {statusArticles.map(article => (
                      <SortableArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        onStatusChange={handleStatusChange}
                      />
                    ))}

                    {statusArticles.length === 0 && (
                      <div className="text-center text-sm text-gray-500 py-8">
                        Drop articles here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeArticle ? (
          <ArticleCard article={activeArticle} isDragging />
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  )
}

// Droppable Column Component
function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useSortable({
    id,
    data: {
      type: 'column',
      accepts: ['article'],
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 rounded-lg' : ''}`}
    >
      {children}
    </div>
  )
}

// Sortable Article Card Component
function SortableArticleCard({ article, onClick, onStatusChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start space-x-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Article Content */}
        <div className="flex-1" onClick={onClick}>
          <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
            {article.title}
          </h4>

          {article.contributor_name && (
            <p className="text-xs text-gray-600 mb-2">
              By {article.contributor_name}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{article.word_count} words</span>
            {article.quality_score > 0 && (
              <span className={`px-2 py-1 rounded ${
                article.quality_score >= 85 ? 'bg-green-100 text-green-700' :
                article.quality_score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {article.quality_score}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple Article Card (for drag overlay)
function ArticleCard({ article, isDragging = false }) {
  return (
    <div className={`bg-white p-4 rounded-lg border-2 border-blue-500 shadow-lg ${isDragging ? 'rotate-3' : ''}`}>
      <h4 className="font-medium text-gray-900 text-sm mb-2">
        {article.title}
      </h4>
      {article.contributor_name && (
        <p className="text-xs text-gray-600">By {article.contributor_name}</p>
      )}
    </div>
  )
}

export default Dashboard
