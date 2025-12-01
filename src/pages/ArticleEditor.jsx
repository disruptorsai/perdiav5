import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useArticle, useUpdateArticle, useUpdateArticleStatus } from '../hooks/useArticles'
import { useAutoFixQuality, useHumanizeContent } from '../hooks/useGeneration'
import { useActiveContributors } from '../hooks/useContributors'
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
  Globe
} from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

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
  InternalLinkSuggester
} from '@/components/article'

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
  const { data: contributors = [] } = useActiveContributors()
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
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarTab, setSidebarTab] = useState('quality')
  const [showPreview, setShowPreview] = useState(false)
  const [qualityData, setQualityData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isHumanizing, setIsHumanizing] = useState(false)

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

  // Quill editor configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'align': [] }],
      ['clean']
    ],
  }), [])

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image',
    'align'
  ]

  // Calculate word count
  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return text.split(' ').filter(w => w.length > 0).length
  }, [content])

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
      toast({
        title: 'Saved',
        description: 'Article saved successfully',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save: ' + error.message,
        variant: 'destructive'
      })
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
      toast({
        title: 'Status Updated',
        description: `Article moved to ${newStatus.replace('_', ' ')}`
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      })
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
      toast({
        title: 'Issues Fixed',
        description: 'Quality issues have been automatically fixed'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Auto-fix failed: ' + error.message,
        variant: 'destructive'
      })
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
      toast({
        title: 'Content Humanized',
        description: 'Content has been rewritten for natural flow'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Humanization failed: ' + error.message,
        variant: 'destructive'
      })
    } finally {
      setIsHumanizing(false)
    }
  }

  // Insert citation handler
  const handleInsertCitation = (citation) => {
    setContent(prev => prev + '\n' + citation)
    toast({
      title: 'Citation Added',
      description: 'BLS citation inserted at end of article'
    })
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
    toast({
      title: 'Navigation Added',
      description: 'Table of contents inserted into article'
    })
  }

  // Schema update handler
  const handleSchemaUpdate = (newFaqs, schema) => {
    setFaqs(newFaqs)
    toast({
      title: 'FAQ Updated',
      description: `${newFaqs.length} FAQ items`
    })
  }

  // Insert internal link handler
  const handleInsertInternalLink = (linkHtml, siteArticle) => {
    // For now, append to clipboard and notify
    navigator.clipboard.writeText(linkHtml)
    toast({
      title: 'Link Copied',
      description: `Link to "${siteArticle.title}" copied to clipboard`
    })
  }

  // Copy content handler
  const handleCopyContent = async () => {
    const plainText = content.replace(/<[^>]*>/g, '')
    await navigator.clipboard.writeText(plainText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copied',
      description: 'Article content copied to clipboard'
    })
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
      toast({
        title: 'Contributor Assigned',
        description: `${best.name} selected as best match`
      })
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

            {/* Preview Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>

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
            <Button onClick={handleSave} disabled={saving}>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Area */}
        <div className={`flex-1 overflow-hidden flex flex-col ${showSidebar ? 'mr-80' : ''}`}>
          {showPreview ? (
            /* Preview Mode */
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
                <h1 className="text-3xl font-bold mb-4">{title}</h1>
                {article.contributor_name && (
                  <p className="text-gray-500 mb-6">By {article.contributor_name}</p>
                )}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                {faqs.length > 0 && (
                  <div className="mt-8 border-t pt-8">
                    <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                    {faqs.map((faq, i) => (
                      <div key={i} className="mb-4">
                        <h3 className="font-semibold">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

                {/* Content Editor */}
                <div>
                  <Label className="mb-2">Content</Label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="bg-white"
                      style={{ minHeight: '400px' }}
                      placeholder="Write your article content here..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-l border-gray-200 bg-white fixed right-0 top-[57px] bottom-0 flex flex-col">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
              <TabsList className="w-full border-b rounded-none h-auto p-1 bg-gray-50">
                <TabsTrigger value="quality" className="flex-1 text-xs py-2">Quality</TabsTrigger>
                <TabsTrigger value="seo" className="flex-1 text-xs py-2">SEO</TabsTrigger>
                <TabsTrigger value="links" className="flex-1 text-xs py-2">Links</TabsTrigger>
                <TabsTrigger value="tools" className="flex-1 text-xs py-2">Tools</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
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

                    <InternalLinkSuggester
                      article={article}
                      content={content}
                      onInsertLink={handleInsertInternalLink}
                    />
                  </TabsContent>

                  {/* Tools Tab */}
                  <TabsContent value="tools" className="mt-0 space-y-4">
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
