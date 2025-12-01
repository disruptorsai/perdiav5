import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useArticles, useUpdateArticleStatus } from '../hooks/useArticles'
import { useContentIdeas, useCreateContentIdea } from '../hooks/useContentIdeas'
import { useGenerateArticle } from '../hooks/useGeneration'
import { useSystemSettings } from '../hooks/useSystemSettings'
import { Plus, Loader2, FileText, Clock, CheckCircle, AlertCircle, GripVertical, Sparkles, Search, Zap, Settings2 } from 'lucide-react'
import SourceSelector from '../components/ideas/SourceSelector'
import IdeaDiscoveryService from '../services/ideaDiscoveryService'
import { useToast } from '../components/ui/toast'
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
  const { data: allIdeas = [] } = useContentIdeas({})
  const updateStatus = useUpdateArticleStatus()
  const generateArticle = useGenerateArticle()
  const createContentIdea = useCreateContentIdea()
  const { data: settings } = useSystemSettings()
  const { addToast } = useToast()

  const [generatingIdea, setGeneratingIdea] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [sourceSelectorOpen, setSourceSelectorOpen] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [automationMode, setAutomationMode] = useState('manual') // 'manual' | 'semiauto' | 'full_auto'

  // Initialize idea discovery service
  const ideaDiscoveryService = new IdeaDiscoveryService()

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

  // Handle idea discovery from sources
  const handleDiscoverIdeas = useCallback(async ({ sources, customTopic, existingTopics }) => {
    setIsDiscovering(true)

    try {
      // Get existing idea titles to avoid duplicates
      const existingTitles = allIdeas.map(idea => idea.title)

      // Discover ideas using the service
      const discoveredIdeas = await ideaDiscoveryService.discoverIdeas({
        sources,
        customTopic,
        existingTopics: existingTitles,
        niche: settings?.niche || 'higher education, online degrees, career development',
      })

      addToast({
        title: 'Ideas Discovered',
        description: `Found ${discoveredIdeas.length} new content ideas`,
        variant: 'success',
      })

      return discoveredIdeas
    } catch (error) {
      console.error('Idea discovery error:', error)
      addToast({
        title: 'Discovery Failed',
        description: error.message || 'Failed to discover ideas',
        variant: 'error',
      })
      throw error
    } finally {
      setIsDiscovering(false)
    }
  }, [allIdeas, settings, addToast, ideaDiscoveryService])

  // Handle adding selected ideas to the content queue
  const handleSourceSelectorClose = useCallback(async (open, selectedIdeas) => {
    setSourceSelectorOpen(open)

    if (selectedIdeas && selectedIdeas.length > 0) {
      // Add selected ideas to content_ideas table
      for (const idea of selectedIdeas) {
        try {
          await createContentIdea.mutateAsync({
            title: idea.title,
            description: idea.description,
            content_type: idea.content_type,
            target_keywords: idea.target_keywords,
            search_intent: idea.search_intent,
            trending_reason: idea.trending_reason,
            source: idea.source,
            status: 'approved', // Auto-approve discovered ideas
          })
        } catch (error) {
          console.error('Failed to add idea:', error)
        }
      }

      addToast({
        title: 'Ideas Added',
        description: `Added ${selectedIdeas.length} ideas to your content queue`,
        variant: 'success',
      })

      // In auto mode, start generating articles automatically
      if (automationMode === 'full_auto') {
        addToast({
          title: 'Auto Mode Active',
          description: 'Starting automatic article generation...',
          variant: 'info',
        })
        // TODO: Trigger automatic generation pipeline
      }
    }
  }, [createContentIdea, addToast, automationMode])

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
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Pipeline</h1>
              <p className="text-gray-600 mt-1">Manage your content workflow from idea to publication</p>
            </div>

            {/* Auto/Manual Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
            >
              <Settings2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Mode:</span>
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setAutomationMode('manual')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    automationMode === 'manual'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Manual Mode: Generate articles one at a time"
                >
                  Manual
                </button>
                <button
                  onClick={() => setAutomationMode('semiauto')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    automationMode === 'semiauto'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Semi-Auto: Discover ideas, generate with approval"
                >
                  Semi-Auto
                </button>
                <button
                  onClick={() => setAutomationMode('full_auto')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    automationMode === 'full_auto'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Full Auto: Autonomous pipeline - discover, generate, fix, ready for review"
                >
                  <Zap className="w-3 h-3 inline mr-1" />
                  Auto
                </button>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSourceSelectorOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium shadow-sm transition-all"
            >
              <Search className="w-4 h-4" />
              Find New Ideas
              <Sparkles className="w-4 h-4" />
            </motion.button>

            {automationMode === 'full_auto' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
                <span>Auto Mode Active - Ideas will be generated automatically</span>
              </motion.div>
            )}

            {ideas.length > 0 && automationMode !== 'manual' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Generate all approved ideas
                  addToast({
                    title: 'Batch Generation Started',
                    description: `Generating ${ideas.length} articles...`,
                    variant: 'info',
                  })
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all"
              >
                <Zap className="w-4 h-4" />
                Generate All ({ideas.length})
              </motion.button>
            )}
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

      {/* Source Selector Modal */}
      <SourceSelector
        open={sourceSelectorOpen}
        onOpenChange={handleSourceSelectorClose}
        onDiscoverIdeas={handleDiscoverIdeas}
        existingTopics={allIdeas.map(i => i.title)}
        isLoading={isDiscovering}
      />
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
