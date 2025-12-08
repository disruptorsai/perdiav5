/**
 * CommentableArticle Component
 *
 * Enables editors to:
 * 1. Select text in the article preview
 * 2. Add structured feedback (category, severity, instructions)
 * 3. See highlighted text color-coded by severity
 * 4. View comment cards in a sidebar
 * 5. Trigger AI revision to process all pending comments
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  MessageSquarePlus,
  X,
  Brain,
  Loader2,
  Check,
  AlertCircle,
  ChevronRight,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useArticleComments,
  usePendingComments,
  useCreateComment,
  useDeleteComment,
  useDismissComment,
  useMarkCommentsAddressed,
  COMMENT_CATEGORIES,
  COMMENT_SEVERITIES,
  getSeverityConfig,
  getCategoryConfig,
} from '@/hooks/useArticleComments'
import { useCreateAIRevision } from '@/hooks/useAIRevisions'
import ClaudeClient from '@/services/ai/claudeClient'
import { cn } from '@/lib/utils'

/**
 * Floating action button that appears on text selection
 */
function FloatingAddButton({ position, onAdd }) {
  if (!position) return null

  return createPortal(
    <div
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <Button
        size="sm"
        className="shadow-lg bg-blue-600 hover:bg-blue-700 gap-1.5"
        onClick={onAdd}
      >
        <MessageSquarePlus className="w-4 h-4" />
        Add Comment
      </Button>
    </div>,
    document.body
  )
}

/**
 * Dialog for adding a new comment
 */
function AddCommentDialog({
  open,
  onClose,
  selectedText,
  onSubmit,
  isSubmitting,
}) {
  const [category, setCategory] = useState('general')
  const [severity, setSeverity] = useState('minor')
  const [feedback, setFeedback] = useState('')

  const handleSubmit = () => {
    if (!feedback.trim()) return
    onSubmit({ category, severity, feedback: feedback.trim() })
    setFeedback('')
    setCategory('general')
    setSeverity('minor')
  }

  const severityConfig = getSeverityConfig(severity)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-blue-600" />
            Add Comment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected text preview */}
          <div>
            <Label className="text-xs text-gray-500 mb-1">Selected Text</Label>
            <div
              className="p-3 rounded-lg text-sm border-l-4"
              style={{
                backgroundColor: severityConfig.bgColor,
                borderColor: severityConfig.color,
              }}
            >
              "{selectedText?.length > 200
                ? selectedText.slice(0, 200) + '...'
                : selectedText}"
            </div>
          </div>

          {/* Category and Severity selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-xs text-gray-500">{cat.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMENT_SEVERITIES.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sev.color }}
                        />
                        <div>
                          <div className="font-medium">{sev.label}</div>
                          <div className="text-xs text-gray-500">{sev.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Feedback input */}
          <div>
            <Label className="mb-1.5">Feedback / Instructions</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe what should be changed or improved..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!feedback.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Add Comment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Single comment card in the sidebar
 */
function CommentCard({ comment, isActive, onClick, onDelete, onDismiss }) {
  const severityConfig = getSeverityConfig(comment.severity)
  const categoryConfig = getCategoryConfig(comment.category)
  const isAddressed = comment.status === 'addressed'
  const isDismissed = comment.status === 'dismissed'

  return (
    <div
      className={cn(
        'p-3 rounded-lg border-l-4 transition-all cursor-pointer',
        isActive && 'ring-2 ring-blue-500',
        (isAddressed || isDismissed) && 'opacity-50'
      )}
      style={{
        backgroundColor: severityConfig.bgColor,
        borderColor: severityConfig.color,
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {categoryConfig.label}
          </Badge>
          <Badge
            className="text-xs text-white"
            style={{ backgroundColor: severityConfig.color }}
          >
            {severityConfig.label}
          </Badge>
          {isAddressed && (
            <Badge variant="secondary" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Addressed
            </Badge>
          )}
          {isDismissed && (
            <Badge variant="secondary" className="text-xs">
              Dismissed
            </Badge>
          )}
        </div>

        {comment.status === 'pending' && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        "{comment.selected_text}"
      </p>

      <p className="text-sm">{comment.feedback}</p>

      <p className="text-xs text-gray-400 mt-2">
        {new Date(comment.created_at).toLocaleString()}
      </p>
    </div>
  )
}

/**
 * Comments sidebar panel
 */
function CommentsSidebar({
  comments,
  pendingCount,
  activeCommentId,
  onCommentClick,
  onDeleteComment,
  onDismissComment,
  onAIRevise,
  isRevising,
}) {
  const pendingComments = comments.filter((c) => c.status === 'pending')
  const addressedComments = comments.filter((c) => c.status !== 'pending')

  return (
    <div className="h-full flex flex-col">
      {/* Header with AI Revise button */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
          </h3>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>

        {pendingCount > 0 && (
          <Button
            onClick={onAIRevise}
            disabled={isRevising}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isRevising ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Revising...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                AI Revise ({pendingCount})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">
                Select text in the article to add feedback
              </p>
            </div>
          ) : (
            <>
              {/* Pending comments */}
              {pendingComments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Pending ({pendingComments.length})
                  </h4>
                  {pendingComments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      isActive={activeCommentId === comment.id}
                      onClick={() => onCommentClick(comment)}
                      onDelete={() => onDeleteComment(comment.id)}
                      onDismiss={() => onDismissComment(comment.id)}
                    />
                  ))}
                </div>
              )}

              {/* Addressed comments */}
              {addressedComments.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Addressed ({addressedComments.length})
                  </h4>
                  {addressedComments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      isActive={activeCommentId === comment.id}
                      onClick={() => onCommentClick(comment)}
                      onDelete={() => onDeleteComment(comment.id)}
                      onDismiss={() => onDismissComment(comment.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * Apply highlights to HTML content based on comments
 */
function getHighlightedContent(htmlContent, comments) {
  if (!comments || comments.length === 0) return htmlContent

  let result = htmlContent

  // Sort comments by selected_text length (longer first) to avoid nested replacement issues
  const sortedComments = [...comments]
    .filter((c) => c.status === 'pending')
    .sort((a, b) => b.selected_text.length - a.selected_text.length)

  for (const comment of sortedComments) {
    const severityConfig = getSeverityConfig(comment.severity)
    const escapedText = comment.selected_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedText})`, 'gi')

    result = result.replace(
      regex,
      `<mark data-comment-id="${comment.id}" style="background-color: ${severityConfig.bgColor}; border-bottom: 2px solid ${severityConfig.color}; cursor: pointer;">$1</mark>`
    )
  }

  return result
}

/**
 * Main CommentableArticle component
 */
export function CommentableArticle({
  articleId,
  content,
  title,
  focusKeyword = '',
  contentType = 'guide',
  contributorName = null,
  contributorStyle = null,
  onContentChange,
  className,
}) {
  const articleRef = useRef(null)
  const [floatingButtonPos, setFloatingButtonPos] = useState(null)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState(null)
  const [isRevising, setIsRevising] = useState(false)
  const [revisionProgress, setRevisionProgress] = useState('')

  // Hooks
  const { data: comments = [], refetch: refetchComments } = useArticleComments(articleId)
  const { data: pendingComments = [] } = usePendingComments(articleId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  const dismissComment = useDismissComment()
  const markAddressed = useMarkCommentsAddressed()
  const createAIRevision = useCreateAIRevision()

  // Calculate highlighted content
  const highlightedContent = useMemo(
    () => getHighlightedContent(content, comments),
    [content, comments]
  )

  // Handle text selection
  const handleMouseUp = useCallback((e) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (text && text.length > 0 && articleRef.current?.contains(selection?.anchorNode)) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setSelectedText(text)
        setSelectionRange(range)
        setFloatingButtonPos({
          x: rect.left + rect.width / 2 - 60, // Center the button
          y: rect.bottom + 8, // Below the selection
        })
      } else {
        setFloatingButtonPos(null)
        setSelectedText('')
        setSelectionRange(null)
      }
    }, 10)
  }, [])

  // Handle click on highlighted text
  const handleContentClick = useCallback((e) => {
    const mark = e.target.closest('mark[data-comment-id]')
    if (mark) {
      const commentId = mark.getAttribute('data-comment-id')
      setActiveCommentId(commentId)
    }
  }, [])

  // Handle adding a comment
  const handleAddComment = () => {
    setDialogOpen(true)
    setFloatingButtonPos(null)
  }

  // Submit new comment
  const handleSubmitComment = async ({ category, severity, feedback }) => {
    try {
      await createComment.mutateAsync({
        articleId,
        selectedText,
        category,
        severity,
        feedback,
      })
      setDialogOpen(false)
      setSelectedText('')
      window.getSelection()?.removeAllRanges()
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment.mutateAsync({ commentId, articleId })
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  // Handle comment click in sidebar
  const handleCommentClick = (comment) => {
    setActiveCommentId(comment.id)
    // Try to scroll to the highlighted text
    const mark = articleRef.current?.querySelector(
      `mark[data-comment-id="${comment.id}"]`
    )
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Handle AI revision
  const handleAIRevise = async () => {
    if (pendingComments.length === 0) return

    setIsRevising(true)
    setRevisionProgress('Analyzing feedback...')

    try {
      // Build the prompt with all pending comments
      setRevisionProgress('Building prompt...')
      const feedbackItems = pendingComments.map((comment, index) => {
        const categoryConfig = getCategoryConfig(comment.category)
        const severityConfig = getSeverityConfig(comment.severity)
        return `${index + 1}. [${categoryConfig.label.toUpperCase()} - ${severityConfig.label.toUpperCase()}]
   Selected Text: "${comment.selected_text}"
   Feedback: "${comment.feedback}"`
      })

      const prompt = `You are revising an article based on editorial feedback. Apply ALL the feedback items below while preserving:
- All H2 IDs (for anchor links)
- All BLS citations and external links
- The overall structure and heading hierarchy
- Any shortcodes like [degree_table] or [ge_internal_link]

ARTICLE TITLE: ${title}
${focusKeyword ? `FOCUS KEYWORD: ${focusKeyword}` : ''}
${contentType ? `CONTENT TYPE: ${contentType}` : ''}
${contributorName ? `AUTHOR STYLE: ${contributorName}${contributorStyle ? ` - ${contributorStyle}` : ''}` : ''}

CURRENT CONTENT:
${content}

EDITORIAL FEEDBACK TO ADDRESS:
${feedbackItems.join('\n\n')}

INSTRUCTIONS:
1. Apply ALL feedback items to the content
2. Make changes that address each specific feedback point
3. Maintain the same HTML structure
4. Keep the same approximate length unless told to expand/shorten
5. Return ONLY the revised HTML content, no explanations

Revised content:`

      // Call AI to revise
      setRevisionProgress('AI is revising...')
      const claudeClient = new ClaudeClient()
      const revisedContent = await claudeClient.humanize(prompt, {
        temperature: 0.7,
      })

      // Clean up the response
      const cleanedContent = revisedContent
        .replace(/^```html\s*/i, '')
        .replace(/```\s*$/i, '')
        .replace(/^Here is the revised.*?:\s*/i, '')
        .trim()

      // Save AI revision for training with full context
      setRevisionProgress('Saving revision...')
      const revisionData = await createAIRevision.mutateAsync({
        articleId,
        previousVersion: content,
        revisedVersion: cleanedContent,
        commentsSnapshot: pendingComments.map((c) => ({
          id: c.id,
          selected_text: c.selected_text,
          category: c.category,
          severity: c.severity,
          feedback: c.feedback,
        })),
        revisionType: 'feedback',
        // Enhanced context for RLHF training
        articleContext: {
          title,
          focus_keyword: focusKeyword,
          content_type: contentType,
          contributor_name: contributorName,
          contributor_style: contributorStyle,
          comment_count: pendingComments.length,
          categories_addressed: [...new Set(pendingComments.map(c => c.category))],
          severities_addressed: [...new Set(pendingComments.map(c => c.severity))],
        },
        // Store the exact prompt used for reproducibility
        promptUsed: prompt,
      })

      // Mark comments as addressed
      await markAddressed.mutateAsync({
        commentIds: pendingComments.map((c) => c.id),
        revisionId: revisionData.id,
        articleId,
      })

      // Update the content
      onContentChange?.(cleanedContent)
      setRevisionProgress('')

    } catch (error) {
      console.error('AI revision failed:', error)
      setRevisionProgress('')
    } finally {
      setIsRevising(false)
    }
  }

  // Clear floating button on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (floatingButtonPos && !e.target.closest('.floating-add-btn')) {
        setFloatingButtonPos(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [floatingButtonPos])

  return (
    <div className={cn('flex h-full', className)}>
      {/* Article content area */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={articleRef}
          className="prose prose-sm max-w-none p-6"
          onMouseUp={handleMouseUp}
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
      </div>

      {/* Comments sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0">
        <CommentsSidebar
          comments={comments}
          pendingCount={pendingComments.length}
          activeCommentId={activeCommentId}
          onCommentClick={handleCommentClick}
          onDeleteComment={handleDeleteComment}
          onDismissComment={(id) => dismissComment.mutate({ commentId: id, articleId })}
          onAIRevise={handleAIRevise}
          isRevising={isRevising}
        />
      </div>

      {/* Floating add button */}
      <FloatingAddButton position={floatingButtonPos} onAdd={handleAddComment} />

      {/* Add comment dialog */}
      <AddCommentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedText={selectedText}
        onSubmit={handleSubmitComment}
        isSubmitting={createComment.isPending}
      />

      {/* Revision progress overlay */}
      {isRevising && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">AI Revision in Progress</h3>
            <p className="text-gray-600">{revisionProgress}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentableArticle
