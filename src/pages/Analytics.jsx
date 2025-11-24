import { useArticles } from '../hooks/useArticles'
import { BarChart3, TrendingUp, FileText, CheckCircle } from 'lucide-react'

function Analytics() {
  const { data: articles = [] } = useArticles()

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    avgQuality: articles.length > 0
      ? Math.round(articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / articles.length)
      : 0,
    avgWordCount: articles.length > 0
      ? Math.round(articles.reduce((sum, a) => sum + (a.word_count || 0), 0) / articles.length)
      : 0,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your content production metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Articles</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Published</p>
              <p className="text-3xl font-bold text-gray-900">{stats.published}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Quality Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgQuality}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Word Count</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgWordCount}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Articles by Status</h2>
        <div className="space-y-3">
          {['drafting', 'refinement', 'qa_review', 'ready_to_publish', 'published'].map(status => {
            const count = articles.filter(a => a.status === status).length
            const percentage = articles.length > 0 ? (count / articles.length) * 100 : 0

            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Analytics
