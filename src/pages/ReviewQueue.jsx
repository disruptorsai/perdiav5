import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useAllRevisions } from '@/hooks/useArticleRevisions'

// UI Components
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Calendar,
  MessageSquare,
  FileText,
  Filter,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// Status configuration
const REVIEW_STATUSES = [
  { value: 'qa_review', label: 'In Review', icon: Clock, color: 'blue' },
  { value: 'refinement', label: 'Needs Work', icon: AlertCircle, color: 'yellow' },
  { value: 'ready_to_publish', label: 'Approved', icon: CheckCircle2, color: 'green' }
]

const STATUS_COLORS = {
  qa_review: 'bg-blue-50 text-blue-700 border-blue-200',
  refinement: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ready_to_publish: 'bg-green-50 text-green-700 border-green-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  drafting: 'bg-purple-50 text-purple-700 border-purple-200',
  idea: 'bg-gray-50 text-gray-700 border-gray-200'
}

export default function ReviewQueue() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState('qa_review')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch articles in review statuses
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['review-articles', selectedStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, article_contributors(name)')
        .eq('status', selectedStatus)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user
  })

  // Get all revisions for comment counts
  const { data: allRevisions = [] } = useAllRevisions()

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('articles')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-articles'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    }
  })

  const handleQuickAction = async (articleId, newStatus) => {
    await updateStatusMutation.mutateAsync({ id: articleId, status: newStatus })
  }

  const getArticleCommentCount = (articleId) => {
    return allRevisions.filter(r => r.article_id === articleId && r.status === 'pending').length
  }

  // Filter articles by search
  const filteredArticles = articles.filter(article =>
    !searchQuery ||
    article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.focus_keyword?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Count by status
  const statusCounts = {
    qa_review: articles.filter(a => a.status === 'qa_review').length,
    refinement: articles.filter(a => a.status === 'refinement').length,
    ready_to_publish: articles.filter(a => a.status === 'ready_to_publish').length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            Review Queue
          </h1>
          <p className="text-gray-600 text-lg">
            Review articles, add comments, and approve for publishing
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {REVIEW_STATUSES.map(({ value, label, icon: Icon, color }) => (
              <Button
                key={value}
                variant={selectedStatus === value ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(value)}
                className={`gap-2 whitespace-nowrap ${
                  selectedStatus === value
                    ? color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      color === 'green' ? 'bg-green-600 hover:bg-green-700' : ''
                    : 'border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <Badge
                  variant="secondary"
                  className={`ml-1 ${
                    selectedStatus === value
                      ? 'bg-white/20 text-inherit border-0'
                      : ''
                  }`}
                >
                  {statusCounts[value] || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Queue Items */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-24 mb-3" />
                      <Skeleton className="h-8 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredArticles.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-500">
                  No articles with "{REVIEW_STATUSES.find(s => s.value === selectedStatus)?.label}" status
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article, index) => {
              const commentCount = getArticleCommentCount(article.id)
              const contributorName = article.article_contributors?.name || article.contributor_name

              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          {/* Badges Row */}
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`${STATUS_COLORS[article.status]} border font-medium`}
                            >
                              {article.status?.replace(/_/g, ' ')}
                            </Badge>

                            {article.quality_score && (
                              <Badge
                                variant="outline"
                                className={`${
                                  article.quality_score >= 85
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : article.quality_score >= 70
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                Quality: {article.quality_score}%
                              </Badge>
                            )}

                            {commentCount > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                <MessageSquare className="w-3 h-3" />
                                {commentCount} comment{commentCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                            {article.title}
                          </h3>

                          {/* Excerpt */}
                          {article.excerpt && (
                            <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            {article.content_type && (
                              <span className="capitalize">
                                {article.content_type.replace(/_/g, ' ')}
                              </span>
                            )}
                            <span>•</span>
                            <span>{article.word_count?.toLocaleString() || 0} words</span>
                            {contributorName && (
                              <>
                                <span>•</span>
                                <span>By {contributorName}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              Created {format(new Date(article.created_at), 'MMM d')}
                            </span>
                          </div>

                          {/* Risk Flags */}
                          {article.risk_flags && article.risk_flags.length > 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-semibold text-yellow-900">
                                  {article.risk_flags.length} risk flag{article.risk_flags.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {article.risk_flags.map((flag, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-white text-yellow-700 border-yellow-300"
                                  >
                                    {flag.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link to={`/review/${article.id}`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 w-full">
                              Review Article
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>

                          {article.status === 'qa_review' && (
                            <>
                              <Button
                                variant="outline"
                                className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleQuickAction(article.id, 'ready_to_publish')}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Quick Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                onClick={() => handleQuickAction(article.id, 'refinement')}
                              >
                                <XCircle className="w-4 h-4" />
                                Needs Work
                              </Button>
                            </>
                          )}

                          {article.status === 'ready_to_publish' && (
                            <Button
                              variant="outline"
                              className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleQuickAction(article.id, 'published')}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark Published
                            </Button>
                          )}

                          <Link to={`/editor/${article.id}`}>
                            <Button variant="ghost" className="gap-2 w-full">
                              <FileText className="w-4 h-4" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
