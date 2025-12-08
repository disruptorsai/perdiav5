import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useArticle, useUpdateArticle, useUpdateArticleStatus } from '../hooks/useArticles'
import { useAutoFixQuality, useHumanizeContent, useReviseWithFeedback } from '../hooks/useGeneration'
import { useActiveContributors } from '../hooks/useContributors'
import { useCreateAIRevision } from '../hooks/useAIRevisions'
import { usePublishArticle, usePublishEligibility } from '../hooks/usePublish'
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  ChevronLeft,
  ChevronRight,
  Send,
  MoreVertical,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Globe,
  MessageSquare,
  MessageSquarePlus,
  Brain,
  Edit3
} from 'lucide-react'
// TipTap editor - React 19 compatible rich text editor
import { RichTextEditor, getWordCount } from '@/components/ui/rich-text-editor'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast, ToastProvider } from '@/components/ui/toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

// Article Sidebar Components
import {
  QualityChecklist,
  SchemaGenerator,
  LinkComplianceChecker,
  BLSCitationHelper,
  ArticleNavigationGenerator,
  ContentTypeSelector,
  ContributorAssignment,
  InternalLinkSuggester,
  ShortcodeInspector,
  MonetizationPreview,
  CommentableArticle,
  AITrainingPanel
} from '@/components/article'
import GetEducatedPreview from '@/components/article/GetEducatedPreview'

// Status options for workflow
const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-100 text-gray-700' },
  { value: 'drafting', label: 'Drafting', color: 'bg-blue-100 text-blue-700' },
  { value: 'refinement', label: 'Refinement', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qa_review', label: 'QA Review', color: 'bg-purple-100 text-purple-700' },
  { value: 'ready_to_publish', label: 'Ready', color: 'bg-green-100 text-green-700' },
  { value: 'published', label: 'Published', color: 'bg-emerald-100 text-emerald-700' }
]

function ArticleEditorContent() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { data: article, isLoading, refetch } = useArticle(articleId)
  const updateArticle = useUpdateArticle()
  const updateStatus = useUpdateArticleStatus()
  const autoFixQuality = useAutoFixQuality()
  const humanizeContent = useHumanizeContent()
  const reviseWithFeedback = useReviseWithFeedback()
  const createAIRevision = useCreateAIRevision()
  const { data: contributors = [] } = useActiveContributors()
  const publishArticle = usePublishArticle()
  const { toast } = useToast()

  // Editor state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [contentType, setContentType] = useState('guide')
  const [selectedContributorId, setSelectedContributorId] = useState(null)
  const [faqs, setFaqs] = useState([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarTab, setSidebarTab] = useState('quality')
  const [showPreview, setShowPreview] = useState(false)
  const [commentMode, setCommentMode] = useState(false) // Comment mode for text selection feedback
  const [qualityData, setQualityData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isHumanizing, setIsHumanizing] = useState(false)
  const [isRevising, setIsRevising] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackComments, setFeedbackComments] = useState([]) // Array of comments for AI revision

  // Update local state when article loads
  useEffect(() => {
    if (article) {
      setTitle(article.title || '')
      setContent(article.content || '')
      setMetaDescription(article.meta_description || '')
      setFocusKeyword(article.focus_keyword || '')
      setContentType(article.content_type || 'guide')
      setSelectedContributorId(article.contributor_id || null)
      setFaqs(article.faqs || [])
    }
  }, [article])

  // Calculate word count using TipTap helper
  const wordCount = useMemo(() => getWordCount(content), [content])

  // Save handler
  const handleSave = async () => {
    setSaving(true)
    try {
      await updateArticle.mutateAsync({
        articleId,
        updates: {
          title,
          content,
          meta_description: metaDescription,
          focus_keyword: focusKeyword,
          content_type: contentType,
          contributor_id: selectedContributorId,
          faqs,
          word_count: wordCount,
          quality_score: qualityData?.score || article?.quality_score
        }
      })
      toast.success('Article saved successfully')
    } catch (error) {
      toast.error('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Status change handler
  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus.mutateAsync({
        articleId,
        status: newStatus
      })
      toast.success(`Article moved to ${newStatus.replace('_', ' ')}`)
      refetch()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  // Publish to WordPress handler
  const handlePublish = async (publishStatus = 'draft') => {
    setIsPublishing(true)
    try {
      // Build full article object with current editor state
      const articleToPublish = {
        ...article,
        title,
        content,
        meta_description: metaDescription,
        focus_keyword: focusKeyword,
        content_type: contentType,
        contributor_id: selectedContributorId,
        contributor_name: contributors.find(c => c.id === selectedContributorId)?.name,
        faqs,
        word_count: wordCount,
        quality_score: qualityData?.score || article?.quality_score
      }

      const result = await publishArticle.mutateAsync({
        article: articleToPublish,
        options: {
          status: publishStatus,
          validateFirst: true,
          updateDatabase: true
        }
      })

      if (result.success) {
        toast.success(`Article published to WordPress as ${publishStatus}!`)
        if (result.webhookResponse?.url) {
          toast.success(`Published URL: ${result.webhookResponse.url}`)
        }
        refetch()
      } else {
        if (result.blockingIssues?.length > 0) {
          toast.error(`Cannot publish: ${result.blockingIssues.map(i => i.message).join(', ')}`)
        } else {
          toast.error(`Publish failed: ${result.error}`)
        }
      }
    } catch (error) {
      toast.error('Publish failed: ' + error.message)
    } finally {
      setIsPublishing(false)
    }
  }

  // Auto-fix handler
  const handleAutoFix = async (issues) => {
    try {
      const result = await autoFixQuality.mutateAsync({
        articleId,
        content,
        issues,
      })
      setContent(result.content)
      toast.success('Quality issues have been automatically fixed')
    } catch (error) {
      toast.error('Auto-fix failed: ' + error.message)
    }
  }

  // Humanize handler
  const handleHumanize = async () => {
    setIsHumanizing(true)
    try {
      const contributor = contributors.find(c => c.id === selectedContributorId)
      const result = await humanizeContent.mutateAsync({
        content,
        contributorStyle: contributor?.writing_style,
        contributorName: contributor?.name
      })
      setContent(result.content)
      toast.success('Content has been rewritten for natural flow')
    } catch (error) {
      toast.error('Humanization failed: ' + error.message)
    } finally {
      setIsHumanizing(false)
    }
  }

  // AI Revise handler - per GetEducated spec section 8.3.3
  // Sends article + comments as context for AI revision and logs for training
  const handleAIRevise = async () => {
    if (feedbackComments.length === 0 && !feedbackComment.trim()) {
      toast.error('Please add at least one feedback comment before requesting AI revision')
      return
    }

    setIsRevising(true)
    const previousContent = content
    const allComments = feedbackComment.trim()
      ? [...feedbackComments, { comment: feedbackComment.trim(), timestamp: new Date().toISOString() }]
      : feedbackComments

    // Get contributor info for context
    const contributor = contributors.find(c => c.id === selectedContributorId)

    try {
      // Call AI revision with feedback
      const result = await reviseWithFeedback.mutateAsync({
        content,
        title,
        feedbackItems: allComments,
        contentType,
        focusKeyword,
      })

      // Update content with revised version
      setContent(result.content)

      // Log the revision for AI training (per spec section 8.4) with full context
      await createAIRevision.mutateAsync({
        articleId,
        previousVersion: previousContent,
        revisedVersion: result.content,
        commentsSnapshot: allComments,
        revisionType: 'feedback',
        // Enhanced context for RLHF training
        articleContext: {
          title,
          focus_keyword: focusKeyword,
          content_type: contentType,
          contributor_name: contributor?.name || null,
          contributor_style: contributor?.writing_style || null,
          article_status: article?.status,
        },
        // Store the quality delta if available
        qualityDelta: qualityData ? {
          before: qualityData.score,
          after: null, // Will be calculated after content update
        } : null,
      })

      // Clear feedback after successful revision
      setFeedbackComments([])
      setFeedbackComment('')

      toast.success('Article revised based on feedback. Revision logged for AI training.')
    } catch (error) {
      toast.error('AI revision failed: ' + error.message)
    } finally {
      setIsRevising(false)
    }
  }

  // Add feedback comment to list
  const handleAddFeedbackComment = () => {
    if (!feedbackComment.trim()) return
    setFeedbackComments(prev => [
      ...prev,
      { comment: feedbackComment.trim(), timestamp: new Date().toISOString() }
    ])
    setFeedbackComment('')
  }

  // Remove feedback comment from list
  const handleRemoveFeedbackComment = (index) => {
    setFeedbackComments(prev => prev.filter((_, i) => i !== index))
  }

  // Insert citation handler
  const handleInsertCitation = (citation) => {
    setContent(prev => prev + '\n' + citation)
    toast.success('BLS citation inserted at end of article')
  }

  // Insert navigation handler
  const handleInsertNavigation = (navHtml) => {
    // Insert after first paragraph
    const firstPEnd = content.indexOf('</p>')
    if (firstPEnd > -1) {
      setContent(prev =>
        prev.slice(0, firstPEnd + 4) + '\n' + navHtml + '\n' + prev.slice(firstPEnd + 4)
      )
    } else {
      setContent(prev => navHtml + '\n' + prev)
    }
    toast.success('Table of contents inserted into article')
  }

  // Schema update handler
  const handleSchemaUpdate = (newFaqs, schema) => {
    setFaqs(newFaqs)
    toast.success(`${newFaqs.length} FAQ items updated`)
  }

  // Insert internal link handler
  const handleInsertInternalLink = (linkHtml, siteArticle) => {
    // For now, append to clipboard and notify
    navigator.clipboard.writeText(linkHtml)
    toast.success(`Link to "${siteArticle.title}" copied to clipboard`)
  }

  // Copy content handler
  const handleCopyContent = async () => {
    const plainText = content.replace(/<[^>]*>/g, '')
    await navigator.clipboard.writeText(plainText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Article content copied to clipboard')
  }

  // Auto-assign contributor
  const handleAutoAssignContributor = async () => {
    // Simple scoring based on content type and title
    const titleLower = title.toLowerCase()

    const scored = contributors.map(c => {
      let score = 0
      const expertise = c.expertise_areas || []
      const types = c.content_types || []

      expertise.forEach(area => {
        if (titleLower.includes(area.toLowerCase())) score += 20
      })
      if (types.includes(contentType)) score += 30

      return { ...c, score }
    })

    const best = scored.sort((a, b) => b.score - a.score)[0]
    if (best) {
      setSelectedContributorId(best.id)
      toast.success(`${best.name} selected as best match`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Article not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === article.status)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900 max-w-md truncate">
                {title || 'Untitled Article'}
              </h1>
              <Badge className={currentStatus?.color}>
                {currentStatus?.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quality Score Badge */}
            {qualityData && (
              <Badge
                variant="outline"
                className={`
                  ${qualityData.score >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                    qualityData.score >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'}
                `}
              >
                Quality: {qualityData.score}%
              </Badge>
            )}

            {/* Word Count */}
            <Badge variant="secondary">
              {wordCount} words
            </Badge>

            {/* Edit/Preview/Comment Mode Toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={!showPreview && !commentMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-0"
                onClick={() => { setShowPreview(false); setCommentMode(false); }}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant={showPreview ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-0 border-l"
                onClick={() => { setShowPreview(true); setCommentMode(false); }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                variant={commentMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-0 border-l"
                onClick={() => { setShowPreview(false); setCommentMode(true); }}
              >
                <MessageSquarePlus className="w-4 h-4 mr-1" />
                Comment
              </Button>
            </div>

            {/* Sidebar Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleHumanize} disabled={isHumanizing}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isHumanizing ? 'Humanizing...' : 'Humanize Content'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyContent}>
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy Content
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open(article.published_url, '_blank')} disabled={!article.published_url}>
                  <Globe className="w-4 h-4 mr-2" />
                  View Published
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handlePublish('draft')}
                  disabled={isPublishing || article.status === 'published'}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish as Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePublish('publish')}
                  disabled={isPublishing || article.status === 'published'}
                  className="text-green-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish Live
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Dropdown */}
            <Select value={article.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} variant="outline">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>

            {/* Publish Button - prominent when ready */}
            {article.status === 'ready_to_publish' && (
              <Button
                onClick={() => handlePublish('publish')}
                disabled={isPublishing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish to WordPress
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Area */}
        <div className={`flex-1 overflow-hidden flex flex-col ${showSidebar ? 'mr-80' : ''}`}>
          {commentMode ? (
            /* Comment Mode - Text selection feedback with CommentableArticle */
            <CommentableArticle
              articleId={articleId}
              content={content}
              title={title}
              focusKeyword={focusKeyword}
              contentType={contentType}
              contributorName={contributors.find(c => c.id === selectedContributorId)?.name}
              contributorStyle={contributors.find(c => c.id === selectedContributorId)?.writing_style}
              onContentChange={setContent}
              className="flex-1"
            />
          ) : showPreview ? (
            /* Preview Mode - Shows exactly how article will appear on GetEducated.com */
            <ScrollArea className="flex-1">
              <GetEducatedPreview
                article={{
                  ...article,
                  title,
                  content,
                  word_count: wordCount,
                  faqs,
                  article_contributors: contributors.find(c => c.id === selectedContributorId)
                }}
              />
            </ScrollArea>
          ) : (
            /* Edit Mode */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Title */}
                <div>
                  <Label className="mb-2">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-bold"
                    placeholder="Article title..."
                  />
                </div>

                {/* Meta Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Focus Keyword</Label>
                    <Input
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="Primary keyword..."
                    />
                  </div>
                  <div>
                    <Label className="mb-2">Content Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="listicle">Listicle</SelectItem>
                        <SelectItem value="ranking">Ranking</SelectItem>
                        <SelectItem value="explainer">Explainer</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2">Meta Description</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO meta description (155-160 characters)..."
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {metaDescription.length}/160 characters
                  </p>
                </div>

                {/* Content Editor - TipTap WYSIWYG */}
                <div>
                  <Label className="mb-2">Content</Label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write your article content here..."
                    minHeight="400px"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Word count: {wordCount} | Use toolbar for formatting
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-l border-gray-200 bg-white fixed right-0 top-[57px] bottom-0 flex flex-col overflow-hidden">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full border-b rounded-none h-auto p-1 bg-gray-50 flex-shrink-0">
                <TabsTrigger value="quality" className="flex-1 text-xs py-2">Quality</TabsTrigger>
                <TabsTrigger value="seo" className="flex-1 text-xs py-2">SEO</TabsTrigger>
                <TabsTrigger value="links" className="flex-1 text-xs py-2">Links</TabsTrigger>
                <TabsTrigger value="monetize" className="flex-1 text-xs py-2">Monetize</TabsTrigger>
                <TabsTrigger value="tools" className="flex-1 text-xs py-2">Tools</TabsTrigger>
                <TabsTrigger value="training" className="flex-1 text-xs py-2">AI Training</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                  {/* Quality Tab */}
                  <TabsContent value="quality" className="mt-0 space-y-4">
                    <QualityChecklist
                      article={article}
                      content={content}
                      onQualityChange={setQualityData}
                      onAutoFix={handleAutoFix}
                    />

                    <ContributorAssignment
                      article={article}
                      selectedContributorId={selectedContributorId}
                      onContributorSelect={setSelectedContributorId}
                      onAutoAssign={handleAutoAssignContributor}
                    />
                  </TabsContent>

                  {/* SEO Tab */}
                  <TabsContent value="seo" className="mt-0 space-y-4">
                    <ContentTypeSelector
                      value={contentType}
                      onChange={setContentType}
                      showDetails
                    />

                    <SchemaGenerator
                      article={article}
                      faqs={faqs}
                      onSchemaUpdate={handleSchemaUpdate}
                    />

                    <ArticleNavigationGenerator
                      content={content}
                      onNavigationGenerated={handleInsertNavigation}
                    />
                  </TabsContent>

                  {/* Links Tab */}
                  <TabsContent value="links" className="mt-0 space-y-4">
                    <LinkComplianceChecker
                      content={content}
                      onComplianceChange={(compliant, stats) => {
                        // Could update quality data here
                      }}
                    />

                    <ShortcodeInspector
                      content={content}
                      onRefresh={() => {
                        // Re-analyze shortcodes by triggering content change
                        setContent(prev => prev)
                      }}
                    />

                    <InternalLinkSuggester
                      article={article}
                      content={content}
                      onInsertLink={handleInsertInternalLink}
                    />
                  </TabsContent>

                  {/* Monetization Tab */}
                  <TabsContent value="monetize" className="mt-0 space-y-4">
                    <MonetizationPreview
                      categoryId={article?.category_id}
                      concentrationId={article?.concentration_id}
                      levelCode={article?.degree_level_code}
                      maxPrograms={5}
                    />

                    <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-2">
                      <p className="font-medium">Monetization Tips:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Use <code className="bg-gray-200 px-1 rounded">[degree_table]</code> for program listings</li>
                        <li>Use <code className="bg-gray-200 px-1 rounded">[degree_offer]</code> for single program highlights</li>
                        <li>Sponsored listings display first automatically</li>
                        <li>Links always point to GetEducated pages</li>
                      </ul>
                    </div>
                  </TabsContent>

                  {/* Tools Tab */}
                  <TabsContent value="tools" className="mt-0 space-y-4">
                    {/* AI Revise with Feedback - per spec section 8.3.3 */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <h3 className="font-medium text-sm text-blue-900">AI Revise with Feedback</h3>
                      </div>
                      <p className="text-xs text-blue-700">
                        Add feedback comments and let AI revise the article. All revisions are logged for training.
                      </p>

                      {/* Existing comments */}
                      {feedbackComments.length > 0 && (
                        <div className="space-y-2">
                          {feedbackComments.map((comment, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border border-blue-100">
                              <MessageSquare className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                              <p className="text-xs text-gray-700 flex-1">{comment.comment}</p>
                              <button
                                onClick={() => handleRemoveFeedbackComment(index)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment input */}
                      <div className="space-y-2">
                        <Textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Add feedback comment (e.g., 'Make the introduction more engaging', 'Add more statistics')"
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddFeedbackComment}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={!feedbackComment.trim()}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Add Comment
                          </Button>
                          <Button
                            onClick={handleAIRevise}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={isRevising || (feedbackComments.length === 0 && !feedbackComment.trim())}
                          >
                            {isRevising ? (
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Brain className="w-3 h-3 mr-1" />
                            )}
                            {isRevising ? 'Revising...' : 'AI Revise'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <BLSCitationHelper
                      onInsertCitation={handleInsertCitation}
                    />

                    {/* Quick Actions */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <h3 className="font-medium text-sm mb-3">Quick Actions</h3>

                      <Button
                        onClick={handleHumanize}
                        disabled={isHumanizing}
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        {isHumanizing ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Humanize Content
                      </Button>

                      <Button
                        onClick={handleCopyContent}
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy Plain Text
                      </Button>
                    </div>
                  </TabsContent>

                  {/* AI Training Tab */}
                  <TabsContent value="training" className="mt-0">
                    <AITrainingPanel
                      articleId={articleId}
                      content={content}
                      onContentRestore={setContent}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

function ArticleEditor() {
  return (
    <ToastProvider>
      <ArticleEditorContent />
    </ToastProvider>
  )
}

export default ArticleEditor
