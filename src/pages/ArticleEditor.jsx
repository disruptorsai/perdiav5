import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useArticle, useUpdateArticle } from '../hooks/useArticles'
import { useAutoFixQuality } from '../hooks/useGeneration'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import QualityChecklist from '../components/editor/QualityChecklist'

function ArticleEditor() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { data: article, isLoading } = useArticle(articleId)
  const updateArticle = useUpdateArticle()
  const autoFixQuality = useAutoFixQuality()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  // Update local state when article loads
  useEffect(() => {
    if (article) {
      setTitle(article.title || '')
      setContent(article.content || '')
    }
  }, [article])

  // Quill editor configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  }), [])

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateArticle.mutateAsync({
        articleId,
        updates: { title, content }
      })
      alert('Article saved successfully!')
    } catch (error) {
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoFix = async (issues) => {
    try {
      const result = await autoFixQuality.mutateAsync({
        articleId,
        content,
        issues,
      })

      // Update local content with fixed version
      setContent(result.content)
      alert('Quality issues fixed successfully!')
    } catch (error) {
      throw error
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
      <div className="p-8">
        <p>Article not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Article</h1>
              <p className="text-sm text-gray-600">
                {article.contributor_name && `By ${article.contributor_name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {article.quality_score > 0 && (
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                article.quality_score >= 85 ? 'bg-green-100 text-green-700' :
                article.quality_score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                Quality: {article.quality_score}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
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
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-3 gap-6 p-6">
          {/* Main Editor - 2/3 width */}
          <div className="col-span-2 overflow-y-auto space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Article title..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white"
                  style={{ height: '500px', marginBottom: '50px' }}
                  placeholder="Write your article content here..."
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Word Count</p>
                <p className="text-lg font-semibold text-gray-900">{article.word_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {article.status?.replace('_', ' ')}
                </p>
              </div>
              {article.focus_keyword && (
                <div>
                  <p className="text-sm text-gray-600">Focus Keyword</p>
                  <p className="text-lg font-semibold text-gray-900">{article.focus_keyword}</p>
                </div>
              )}
              {article.created_at && (
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quality Checklist Sidebar - 1/3 width */}
          <div className="overflow-y-auto">
            <div className="sticky top-0">
              <QualityChecklist
                article={article}
                onAutoFix={handleAutoFix}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArticleEditor
