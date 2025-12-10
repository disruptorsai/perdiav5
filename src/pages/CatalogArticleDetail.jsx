import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/services/supabaseClient'
import articleRevisionService from '@/services/articleRevisionService'
import { useAuth } from '@/contexts/AuthContext'
import {
  useSelectVersion,
  useClearSelectedVersion,
  useEffectiveVersion,
  usePublishSelectedVersion,
  useQueueSelectedVersionForPublishing,
} from '@/hooks/useGetEducatedCatalog'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

// Icons
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  History,
  FileText,
  Link2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BookOpen,
  GraduationCap,
  Edit3,
  RotateCcw,
  Play,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Circle,
  CircleDot,
  Send,
  ListPlus,
  Info,
  Radio,
} from 'lucide-react'
import { CatalogRevisionAnimation } from '@/components/article'

export default function CatalogArticleDetail() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false)
  const [revisionType, setRevisionType] = useState('refresh')
  const [customInstructions, setCustomInstructions] = useState('')
  const [revisionProgress, setRevisionProgress] = useState(null)
  const [expandedVersion, setExpandedVersion] = useState(null)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  // Animation state
  const [showRevisionAnimation, setShowRevisionAnimation] = useState(false)
  const [revisedContent, setRevisedContent] = useState(null)
  const [revisionError, setRevisionError] = useState(null)
  const [originalContentSnapshot, setOriginalContentSnapshot] = useState(null)

  // Fetch article
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['catalog-article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geteducated_articles')
        .select('*')
        .eq('id', articleId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!articleId && !!user,
  })

  // Fetch version history
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['catalog-article-versions', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geteducated_article_versions')
        .select('*')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!articleId && !!user,
  })

  // Get effective version (selected or current)
  const { data: effectiveVersionData } = useEffectiveVersion(articleId)

  // Selection mutations
  const selectVersionMutation = useSelectVersion()
  const clearSelectionMutation = useClearSelectedVersion()
  const publishSelectedMutation = usePublishSelectedVersion()
  const queueForPublishMutation = useQueueSelectedVersionForPublishing()

  // Analyze article
  const { data: analysis } = useQuery({
    queryKey: ['catalog-article-analysis', articleId],
    queryFn: async () => {
      if (!article) return null
      return articleRevisionService.analyzeArticle(article)
    },
    enabled: !!article,
  })

  // Revision mutation
  const revisionMutation = useMutation({
    mutationFn: async ({ revisionType, customInstructions }) => {
      return articleRevisionService.reviseArticle(articleId, {
        revisionType,
        customInstructions,
        humanize: true,
        onProgress: (progress) => {
          setRevisionProgress(progress)
          // When content is ready from the service, capture it for the animation
          if (progress.content) {
            setRevisedContent(progress.content)
          }
        },
      })
    },
    onSuccess: (newVersion) => {
      // Capture the final content for the typing animation
      if (newVersion?.content_html) {
        setRevisedContent(newVersion.content_html)
      }
      queryClient.invalidateQueries({ queryKey: ['catalog-article', articleId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-article-versions', articleId] })
      // Auto-select the new revision for preview
      if (newVersion?.id) {
        selectVersionMutation.mutate({ articleId, versionId: newVersion.id })
      }
      // Don't close animation yet - let user see the result
    },
    onError: (error) => {
      console.error('Revision failed:', error)
      setRevisionError(error.message)
      setRevisionProgress({ stage: 'error', message: error.message })
    },
  })

  // Restore version mutation
  const restoreMutation = useMutation({
    mutationFn: async (versionId) => {
      return articleRevisionService.restoreVersion(articleId, versionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-article', articleId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-article-versions', articleId] })
    },
  })

  // Get revision strategies
  const revisionStrategies = articleRevisionService.getRevisionStrategies()

  // Handle start revision
  const handleStartRevision = () => {
    // Store original content for comparison
    setOriginalContentSnapshot(article?.content_html)
    // Reset state
    setRevisedContent(null)
    setRevisionError(null)
    setRevisionProgress({ stage: 'starting', message: 'Starting revision...', progress: 0 })
    // Close dialog and show animation
    setIsRevisionDialogOpen(false)
    setShowRevisionAnimation(true)
    // Start the mutation
    revisionMutation.mutate({ revisionType, customInstructions })
  }

  // Handle animation accept
  const handleAnimationAccept = useCallback(() => {
    setShowRevisionAnimation(false)
    setRevisionProgress(null)
    setRevisedContent(null)
    setOriginalContentSnapshot(null)
    setRevisionError(null)
    // Switch to versions tab to see the new version
    setActiveTab('versions')
  }, [])

  // Handle animation cancel/close
  const handleAnimationClose = useCallback(() => {
    setShowRevisionAnimation(false)
    setRevisionProgress(null)
    setRevisedContent(null)
    setOriginalContentSnapshot(null)
    setRevisionError(null)
  }, [])

  // Handle version selection
  const handleSelectVersion = (versionId) => {
    selectVersionMutation.mutate({ articleId, versionId })
  }

  // Handle clear selection
  const handleClearSelection = () => {
    clearSelectionMutation.mutate(articleId)
  }

  // Handle publish selected version
  const handlePublishSelected = () => {
    if (!effectiveVersionData?.selectedVersionId && !article?.current_version_id) return
    const versionToPublish = effectiveVersionData?.selectedVersionId || article?.current_version_id
    publishSelectedMutation.mutate({ articleId, versionId: versionToPublish })
    setIsPublishDialogOpen(false)
  }

  // Handle queue for publishing
  const handleQueueForPublishing = () => {
    if (!effectiveVersionData?.selectedVersionId && !article?.current_version_id) return
    const versionToPublish = effectiveVersionData?.selectedVersionId || article?.current_version_id
    queueForPublishMutation.mutate({ articleId, versionId: versionToPublish })
    setIsPublishDialogOpen(false)
  }

  // Compute version states for UI
  const versionStates = useMemo(() => {
    if (!versions.length) return {}

    const states = {}
    const selectedId = article?.selected_version_id
    const currentId = article?.current_version_id
    const latestVersion = versions[0] // versions are sorted newest first

    versions.forEach((version) => {
      states[version.id] = {
        isSelected: version.id === selectedId,
        isLive: version.id === currentId || version.is_current,
        isLatest: version.id === latestVersion?.id,
        isHistorical: version.id !== selectedId && version.id !== currentId && !version.is_current,
      }
    })

    return states
  }, [versions, article?.selected_version_id, article?.current_version_id])

  // Get content to display in Content tab
  const displayContent = useMemo(() => {
    if (effectiveVersionData?.version) {
      return {
        html: effectiveVersionData.version.content_html,
        wordCount: effectiveVersionData.version.word_count,
        title: effectiveVersionData.version.title,
        versionNumber: effectiveVersionData.version.version_number,
        source: effectiveVersionData.versionSource,
      }
    }
    return {
      html: article?.content_html,
      wordCount: article?.word_count,
      title: article?.title,
      versionNumber: null,
      source: 'article',
    }
  }, [effectiveVersionData, article])

  // Check if there's a pending selection (selected version different from current)
  const hasUnsavedSelection = article?.selected_version_id &&
    article.selected_version_id !== article.current_version_id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
              <p className="text-gray-600 mb-4">The article you're looking for doesn't exist or was removed.</p>
              <Button onClick={() => navigate('/catalog')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Catalog
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/catalog')}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 line-clamp-2">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                {article.url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRevisionDialogOpen(true)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Revise Article
            </Button>

            {/* Publish Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="gap-2"
                  disabled={!hasUnsavedSelection && versions.length === 0}
                >
                  <Send className="w-4 h-4" />
                  Publish
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsPublishDialogOpen(true)}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Publish Now
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleQueueForPublishing}
                  className="gap-2"
                >
                  <ListPlus className="w-4 h-4" />
                  Add to Publishing Queue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Selection Alert Banner */}
        {hasUnsavedSelection && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Version Selected for Review</AlertTitle>
            <AlertDescription className="text-green-700">
              You have selected Version {effectiveVersionData?.version?.version_number} for review.
              This is not the live version.
              <Button
                variant="link"
                className="text-green-700 underline px-1 h-auto"
                onClick={handleClearSelection}
              >
                Clear selection
              </Button>
              or
              <Button
                variant="link"
                className="text-green-700 underline px-1 h-auto"
                onClick={() => setIsPublishDialogOpen(true)}
              >
                Publish this version
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Words</p>
                  <p className="text-lg font-bold text-gray-900">
                    {displayContent.wordCount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <History className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Versions</p>
                  <p className="text-lg font-bold text-gray-900">
                    {article.version_count || versions.length || 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Link2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Times Linked</p>
                  <p className="text-lg font-bold text-gray-900">
                    {article.times_linked_to || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Level</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {article.degree_level || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  analysis?.priority === 'high' ? 'bg-red-50' :
                  analysis?.priority === 'medium' ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  {analysis?.priority === 'high' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : analysis?.priority === 'medium' ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {analysis?.priority || 'Low'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="overview" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2 relative">
              <FileText className="w-4 h-4" />
              Content
              {hasUnsavedSelection && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-2">
              <History className="w-4 h-4" />
              Versions ({versions.length})
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Zap className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metadata */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Article Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Content Type</Label>
                    <p className="text-gray-900 capitalize">{article.content_type || 'Not classified'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Subject Area</Label>
                    <p className="text-gray-900 capitalize">{article.subject_area?.replace('_', ' ') || 'Not classified'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Meta Description</Label>
                    <p className="text-gray-900 text-sm">{article.meta_description || 'No meta description'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Topics</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {article.topics?.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      )) || <span className="text-gray-400">No topics</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Structure */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Content Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-500">H2 Headings ({article.heading_structure?.h2?.length || 0})</Label>
                    <ul className="text-sm text-gray-900 list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                      {article.heading_structure?.h2?.slice(0, 10).map((h, i) => (
                        <li key={i} className="truncate">{h}</li>
                      )) || <li className="text-gray-400">No H2 headings</li>}
                    </ul>
                  </div>
                  <div>
                    <Label className="text-gray-500">FAQs ({article.faqs?.length || 0})</Label>
                    <ul className="text-sm text-gray-900 list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                      {article.faqs?.slice(0, 5).map((faq, i) => (
                        <li key={i} className="truncate">{faq.question}</li>
                      )) || <li className="text-gray-400">No FAQs</li>}
                    </ul>
                  </div>
                  <div>
                    <Label className="text-gray-500">Internal Links ({article.internal_links?.length || 0})</Label>
                    <p className="text-sm text-gray-600">
                      {article.internal_links?.length || 0} internal links found
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            {analysis?.recommendations?.length > 0 && (
              <Card className="border-none shadow-sm border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendations.map((rec) => (
                      <Button
                        key={rec}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRevisionType(rec)
                          setIsRevisionDialogOpen(true)
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {revisionStrategies[rec]?.name || rec}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Content Tab - Shows Selected Revision */}
          <TabsContent value="content">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {displayContent.source === 'selected' ? (
                      <>
                        <Check className="w-5 h-5 text-green-600" />
                        Selected Revision (v{displayContent.versionNumber})
                      </>
                    ) : displayContent.versionNumber ? (
                      <>
                        <Radio className="w-5 h-5 text-blue-600" />
                        Live Version (v{displayContent.versionNumber})
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-gray-600" />
                        Current Content
                      </>
                    )}
                  </CardTitle>
                  {displayContent.source === 'selected' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Previewing selected revision. This is not the live version.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {displayContent.wordCount?.toLocaleString() || 0} words
                  </Badge>
                  {displayContent.source === 'selected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                    >
                      View Live Version
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Content Preview Banner */}
              {displayContent.source === 'selected' && (
                <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">
                      Showing Version {displayContent.versionNumber} - Not yet published
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      onClick={handleClearSelection}
                    >
                      View Live
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setIsPublishDialogOpen(true)}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Publish This
                    </Button>
                  </div>
                </div>
              )}

              <CardContent>
                <div
                  className="prose prose-sm max-w-none max-h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: displayContent.html || '<p>No content available</p>' }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Versions Tab - With Selection UI */}
          <TabsContent value="versions">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Version History</CardTitle>
                <CardDescription>
                  Select a version to preview it in the Content tab. The selected version can then be published.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-600">Selected for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
                      <Radio className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-gray-600">Live on WordPress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-700">
                      NEW
                    </Badge>
                    <span className="text-gray-600">Latest Version</span>
                  </div>
                </div>

                {versionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No version history available yet.</p>
                    <p className="text-sm mt-1">Revise the article to create versions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version) => {
                      const state = versionStates[version.id] || {}
                      const isSelectable = !state.isSelected

                      return (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                            state.isSelected
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                              : state.isLive
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => isSelectable && handleSelectVersion(version.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {/* Selection Indicator */}
                              <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                state.isSelected
                                  ? 'border-green-500 bg-green-500'
                                  : state.isLive
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300 bg-white'
                              }`}>
                                {state.isSelected ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : state.isLive ? (
                                  <Radio className="w-4 h-4 text-white" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300" />
                                )}
                              </div>

                              {/* Version Info */}
                              <div className={`p-2 rounded-lg ${
                                version.version_type === 'original' ? 'bg-gray-100' :
                                version.version_type === 'ai_revision' ? 'bg-purple-100' :
                                'bg-blue-100'
                              }`}>
                                {version.version_type === 'original' ? (
                                  <FileText className="w-4 h-4 text-gray-600" />
                                ) : version.version_type === 'ai_revision' ? (
                                  <Zap className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <Edit3 className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900">
                                    Version {version.version_number}
                                  </span>
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {version.version_type.replace('_', ' ')}
                                  </Badge>
                                  {state.isSelected && (
                                    <Badge className="bg-green-600 text-xs gap-1">
                                      <Check className="w-3 h-3" />
                                      Selected
                                    </Badge>
                                  )}
                                  {state.isLive && (
                                    <Badge className="bg-blue-600 text-xs gap-1">
                                      <Radio className="w-3 h-3" />
                                      Live
                                    </Badge>
                                  )}
                                  {state.isLatest && !state.isSelected && !state.isLive && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-700">
                                      NEW
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                                  {version.revised_by && ` by ${version.revised_by}`}
                                </p>
                                {version.changes_summary && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    {version.changes_summary}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {version.word_count?.toLocaleString() || 0} words
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedVersion(
                                    expandedVersion === version.id ? null : version.id
                                  )
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {expandedVersion === version.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                              {!state.isSelected && (
                                <Button
                                  variant={state.isLive ? "secondary" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSelectVersion(version.id)
                                  }}
                                  disabled={selectVersionMutation.isPending}
                                  className="gap-1"
                                >
                                  {selectVersionMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Select
                                </Button>
                              )}
                              {state.isSelected && !state.isLive && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsPublishDialogOpen(true)
                                  }}
                                  className="gap-1 bg-green-600 hover:bg-green-700"
                                >
                                  <Send className="w-3 h-3" />
                                  Publish
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Expanded content preview */}
                          <AnimatePresence>
                            {expandedVersion === version.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="prose prose-sm max-w-none max-h-64 overflow-y-auto p-3 bg-white rounded-lg text-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: version.content_html?.substring(0, 5000) || '<p>No content</p>'
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quality Issues */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Quality Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis?.qualityIssues?.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.qualityIssues.map((issue, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'high' ? 'border-red-200 bg-red-50' :
                            issue.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                            'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                issue.severity === 'high' ? 'border-red-300 text-red-700' :
                                issue.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                'border-gray-300 text-gray-700'
                              }`}
                            >
                              {issue.severity}
                            </Badge>
                            <span className="text-sm text-gray-700">{issue.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>No quality issues detected!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Stats */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Word Count</span>
                      <span className="font-medium">{article.word_count?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">H2 Headings</span>
                      <span className="font-medium">{article.heading_structure?.h2?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">H3 Headings</span>
                      <span className="font-medium">{article.heading_structure?.h3?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">FAQs</span>
                      <span className="font-medium">{article.faqs?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Internal Links</span>
                      <span className="font-medium">{article.internal_links?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">External Links</span>
                      <span className="font-medium">{article.external_links?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Content Age</span>
                      <span className="font-medium">{analysis?.contentAge || 0} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Revision Dialog */}
      <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Revise Article</DialogTitle>
            <DialogDescription>
              Choose a revision type and customize the instructions for AI revision.
            </DialogDescription>
          </DialogHeader>

          {revisionProgress ? (
            <div className="py-8">
              <div className="text-center">
                {revisionProgress.stage === 'error' ? (
                  <>
                    <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <p className="text-red-600 font-medium">{revisionProgress.message}</p>
                    <Button
                      variant="outline"
                      onClick={() => setRevisionProgress(null)}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-900 font-medium">{revisionProgress.message}</p>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${revisionProgress.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {revisionProgress.progress}% complete
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Revision Type</Label>
                  <Select value={revisionType} onValueChange={setRevisionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(revisionStrategies).map(([key, strategy]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{strategy.name}</span>
                            <span className="text-xs text-gray-500">{strategy.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom Instructions (Optional)</Label>
                  <Textarea
                    placeholder="Add any specific instructions for this revision..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <p className="font-medium mb-1">What will happen:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>A new version will be created (original is preserved)</li>
                    <li>AI will revise content based on your selection</li>
                    <li>Content will be humanized to pass AI detection</li>
                    <li>The new version will be auto-selected for review</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRevisionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStartRevision} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Revision
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Publish Selected Version
            </DialogTitle>
            <DialogDescription>
              This will make the selected version the live version on WordPress.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Version Info */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    Version {effectiveVersionData?.version?.version_number || 'Current'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {effectiveVersionData?.version?.word_count?.toLocaleString() || article?.word_count?.toLocaleString() || 0} words
                  </p>
                  {effectiveVersionData?.version?.changes_summary && (
                    <p className="text-sm text-green-600 mt-2">
                      {effectiveVersionData.version.changes_summary}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning about replacing live */}
            {article?.current_version_id && article.current_version_id !== article?.selected_version_id && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    This will replace the current live version. The previous version will be preserved in the version history.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleQueueForPublishing}
              disabled={queueForPublishMutation.isPending}
              className="gap-2"
            >
              {queueForPublishMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ListPlus className="w-4 h-4" />
              )}
              Add to Queue
            </Button>
            <Button
              onClick={handlePublishSelected}
              disabled={publishSelectedMutation.isPending}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {publishSelectedMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Animation */}
      <AnimatePresence>
        {showRevisionAnimation && (
          <CatalogRevisionAnimation
            originalContent={originalContentSnapshot}
            revisedContent={revisedContent}
            articleTitle={article?.title}
            revisionType={revisionType}
            progress={revisionProgress?.progress || 0}
            stage={revisionProgress?.stage}
            isComplete={revisionMutation.isSuccess && revisedContent}
            onAccept={handleAnimationAccept}
            onCancel={handleAnimationClose}
            error={revisionError}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
