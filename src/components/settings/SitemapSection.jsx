import { useState } from 'react'
import {
  RefreshCw,
  Globe,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react'
import {
  useSitemapStatus,
  useLatestCrawl,
  useTriggerCrawl,
  useSponsoredSchools,
  useSiteArticles,
  useSectionCounts,
} from '../../hooks/useSitemap'

function SitemapSection() {
  const [activeTab, setActiveTab] = useState('status')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [crawlOptions, setCrawlOptions] = useState({
    fetchMetadata: false,
    maxUrls: 500,
  })

  const { data: crawlHistory, isLoading: loadingHistory } = useSitemapStatus()
  const { data: latestCrawl } = useLatestCrawl()
  const triggerCrawl = useTriggerCrawl()
  const { data: sponsoredSchools, isLoading: loadingSponsored } = useSponsoredSchools()
  const { data: siteArticles, isLoading: loadingArticles } = useSiteArticles({
    section: selectedSection || undefined,
    search: searchTerm || undefined,
    limit: 50,
  })
  const { data: sectionCounts } = useSectionCounts()

  const handleCrawl = async () => {
    if (!confirm('Start a new sitemap crawl? This may take a few minutes.')) return
    await triggerCrawl.mutateAsync(crawlOptions)
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sitemap & Internal Linking</h2>
          <p className="text-sm text-gray-600">Manage site articles for internal linking</p>
        </div>
        <button
          onClick={handleCrawl}
          disabled={triggerCrawl.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${triggerCrawl.isPending ? 'animate-spin' : ''}`} />
          {triggerCrawl.isPending ? 'Crawling...' : 'Crawl Sitemap'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'status'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Crawl Status
        </button>
        <button
          onClick={() => setActiveTab('sponsored')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'sponsored'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Sponsored Schools ({sponsoredSchools?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'articles'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Site Articles
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <CrawlStatusTab
          latestCrawl={latestCrawl}
          crawlHistory={crawlHistory}
          isLoading={loadingHistory}
          crawlOptions={crawlOptions}
          setCrawlOptions={setCrawlOptions}
        />
      )}

      {activeTab === 'sponsored' && (
        <SponsoredSchoolsTab
          schools={sponsoredSchools}
          isLoading={loadingSponsored}
        />
      )}

      {activeTab === 'articles' && (
        <SiteArticlesTab
          articles={siteArticles}
          isLoading={loadingArticles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          sectionCounts={sectionCounts}
        />
      )}
    </div>
  )
}

function CrawlStatusTab({ latestCrawl, crawlHistory, isLoading, crawlOptions, setCrawlOptions }) {
  return (
    <div className="space-y-6">
      {/* Crawl Options */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Crawl Options</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fetchMetadata"
              checked={crawlOptions.fetchMetadata}
              onChange={(e) => setCrawlOptions({ ...crawlOptions, fetchMetadata: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="fetchMetadata" className="ml-2 text-sm text-gray-700">
              Fetch page metadata (slower but more accurate)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Max URLs:</label>
            <input
              type="number"
              value={crawlOptions.maxUrls}
              onChange={(e) => setCrawlOptions({ ...crawlOptions, maxUrls: parseInt(e.target.value) || 500 })}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              min="100"
              max="2000"
            />
          </div>
        </div>
      </div>

      {/* Latest Crawl Summary */}
      {latestCrawl && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Latest Crawl</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{latestCrawl.urls_found || 0}</p>
              <p className="text-xs text-gray-500">URLs Found</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{latestCrawl.urls_added || 0}</p>
              <p className="text-xs text-gray-500">New Added</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{latestCrawl.urls_updated || 0}</p>
              <p className="text-xs text-gray-500">Updated</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{latestCrawl.sponsored_found || 0}</p>
              <p className="text-xs text-gray-500">Sponsored</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(latestCrawl.completed_at || latestCrawl.created_at).toLocaleString()}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              latestCrawl.status === 'completed' ? 'bg-green-100 text-green-700' :
              latestCrawl.status === 'running' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {latestCrawl.status}
            </span>
          </div>
        </div>
      )}

      {/* Crawl History */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Crawl History</h3>
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading history...</div>
        ) : crawlHistory?.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No crawl history</p>
            <p className="text-sm text-gray-500">Run your first sitemap crawl to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {crawlHistory?.map((crawl) => (
              <div
                key={crawl.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {crawl.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : crawl.status === 'running' ? (
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {crawl.urls_found || 0} URLs found
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(crawl.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-green-600">+{crawl.urls_added || 0}</p>
                  <p className="text-xs text-gray-500">{crawl.sponsored_found || 0} sponsored</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SponsoredSchoolsTab({ schools, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading sponsored schools...</div>
  }

  if (!schools?.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No sponsored schools found</p>
        <p className="text-sm text-gray-500">Run a sitemap crawl to detect sponsored content</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {schools.map((school) => (
        <div
          key={school.id}
          className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-gray-900">{school.title}</span>
              {school.has_logo && (
                <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">
                  Has Logo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{school.section}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Priority: {school.school_priority}
            </span>
            <a
              href={school.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

function SiteArticlesTab({
  articles,
  isLoading,
  searchTerm,
  setSearchTerm,
  selectedSection,
  setSelectedSection,
  sectionCounts,
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All sections</option>
            {sectionCounts?.map((sec) => (
              <option key={sec.section} value={sec.section}>
                {sec.section} ({sec.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section Stats */}
      {sectionCounts && (
        <div className="flex flex-wrap gap-2">
          {sectionCounts.slice(0, 6).map((sec) => (
            <button
              key={sec.section}
              onClick={() => setSelectedSection(sec.section === selectedSection ? '' : sec.section)}
              className={`px-3 py-1 rounded-full text-sm ${
                sec.section === selectedSection
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sec.section}: {sec.count}
            </button>
          ))}
        </div>
      )}

      {/* Articles List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading articles...</div>
      ) : articles?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No articles found</p>
          <p className="text-sm text-gray-500">
            {searchTerm || selectedSection
              ? 'Try adjusting your filters'
              : 'Run a sitemap crawl to populate articles'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{article.title}</span>
                  {article.is_sponsored && (
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{article.url}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {article.section}
                </span>
                <span className="text-xs text-gray-500">
                  {article.times_linked_to || 0} links
                </span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SitemapSection
