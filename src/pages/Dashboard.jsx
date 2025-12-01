import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticles, useUpdateArticleStatus } from '../hooks/useArticles'
import { useContentIdeas } from '../hooks/useContentIdeas'
import { useGenerateArticle } from '../hooks/useGeneration'
import { Plus, Loader2, FileText, Clock, CheckCircle, AlertCircle, GripVertical, Sparkles } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-blue-600" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-gray-500"
        >
          Loading your content pipeline...
        </motion.p>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Pipeline</h1>
            <p className="text-gray-600 mt-1">Manage your content workflow from idea to publication</p>
          </div>

          {/* Auto/Manual Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            <span className="text-sm font-medium text-gray-700">Automation Mode:</span>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              title="Manual Mode: Generate articles one at a time on demand"
            >
              Manual
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium opacity-50 cursor-not-allowed transition-colors"
              disabled
              title="Auto Mode: Coming soon - autonomous article generation"
            >
              Auto (Coming Soon)
            </button>
          </motion.div>
        </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {STATUSES.map((status, index) => {
          const count = getArticlesByStatus(status.value).length
          const StatusIcon = status.icon

          return (
            <motion.div
              key={status.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              className="bg-white p-4 rounded-lg border border-gray-200 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <motion.p
                    key={count}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900 mt-1"
                  >
                    {count}
                  </motion.p>
                </div>
                <div className={`p-3 rounded-lg ${status.color}`}>
                  <StatusIcon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {/* Ideas Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Ideas</h3>
            </div>
            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
              {ideas.length}
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {ideas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-2">{idea.title}</h4>
                  {idea.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{idea.description}</p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerateArticle(idea)}
                    disabled={generatingIdea === idea.id}
                    className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                  >
                    {generatingIdea === idea.id ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-3 h-3 mr-1" />
                        </motion.div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" />
                        Generate Article
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {ideas.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-gray-500 py-8"
              >
                No approved ideas yet
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Article Columns */}
        {STATUSES.slice(1).map((status, columnIndex) => {
          const statusArticles = getArticlesByStatus(status.value)
          const StatusIcon = status.icon

          return (
            <DroppableColumn key={status.value} id={status.value}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + columnIndex * 0.05 }}
                className="bg-gray-50 rounded-lg p-4 h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <StatusIcon className="w-4 h-4 mr-2 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{status.label}</h3>
                  </div>
                  <motion.span
                    key={statusArticles.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-sm text-gray-600 bg-white px-2 py-1 rounded"
                  >
                    {statusArticles.length}
                  </motion.span>
                </div>

                <SortableContext
                  items={statusArticles.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {statusArticles.map((article, index) => (
                        <SortableArticleCard
                          key={article.id}
                          article={article}
                          onClick={() => handleArticleClick(article)}
                          onStatusChange={handleStatusChange}
                          index={index}
                        />
                      ))}
                    </AnimatePresence>

                    {statusArticles.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-sm text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg"
                      >
                        Drop articles here
                      </motion.div>
                    )}
                  </div>
                </SortableContext>
              </motion.div>
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
      </motion.div>
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
function SortableArticleCard({ article, onClick, onStatusChange, index = 0 }) {
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
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
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
            <span className="text-gray-500">{article.word_count || 0} words</span>
            {article.quality_score > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-2 py-1 rounded ${
                  article.quality_score >= 85 ? 'bg-green-100 text-green-700' :
                  article.quality_score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {article.quality_score}
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Simple Article Card (for drag overlay)
function ArticleCard({ article, isDragging = false }) {
  return (
    <motion.div
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.05, rotate: isDragging ? 3 : 0 }}
      className="bg-white p-4 rounded-lg border-2 border-blue-500 shadow-xl"
    >
      <h4 className="font-medium text-gray-900 text-sm mb-2">
        {article.title}
      </h4>
      {article.contributor_name && (
        <p className="text-xs text-gray-600">By {article.contributor_name}</p>
      )}
    </motion.div>
  )
}

export default Dashboard
