import { useState } from 'react'
import { Plus, Trash2, Edit2, Code, Copy, Check, X } from 'lucide-react'
import {
  useShortcodes,
  useShortcodeCategories,
  useCreateShortcode,
  useUpdateShortcode,
  useDeleteShortcode,
  formatShortcode,
} from '../../hooks/useShortcodes'

function ShortcodesSection() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingShortcode, setEditingShortcode] = useState(null)
  const [previewContext, setPreviewContext] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const { data: shortcodes, isLoading } = useShortcodes(activeCategory)
  const { data: categories } = useShortcodeCategories()
  const createShortcode = useCreateShortcode()
  const updateShortcode = useUpdateShortcode()
  const deleteShortcode = useDeleteShortcode()

  const handleAddShortcode = async (shortcodeData) => {
    await createShortcode.mutateAsync(shortcodeData)
    setShowAddModal(false)
  }

  const handleUpdateShortcode = async (shortcodeId, updates) => {
    await updateShortcode.mutateAsync({ shortcodeId, updates })
    setEditingShortcode(null)
  }

  const handleDeleteShortcode = async (shortcodeId) => {
    if (!confirm('Delete this shortcode?')) return
    await deleteShortcode.mutateAsync(shortcodeId)
  }

  const handleCopy = async (shortcode) => {
    await navigator.clipboard.writeText(`[${shortcode.name}]`)
    setCopiedId(shortcode.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Shortcodes</h2>
          <p className="text-sm text-gray-600">Manage reusable content snippets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Shortcode
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            !activeCategory
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories?.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              activeCategory === category
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Shortcodes List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading shortcodes...</div>
      ) : shortcodes?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No shortcodes found</p>
          <p className="text-sm text-gray-500">Add your first shortcode to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shortcodes?.map((shortcode) => (
            <ShortcodeRow
              key={shortcode.id}
              shortcode={shortcode}
              onEdit={() => setEditingShortcode(shortcode)}
              onDelete={() => handleDeleteShortcode(shortcode.id)}
              onCopy={() => handleCopy(shortcode)}
              isCopied={copiedId === shortcode.id}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingShortcode) && (
        <ShortcodeModal
          shortcode={editingShortcode}
          categories={categories || []}
          onClose={() => {
            setShowAddModal(false)
            setEditingShortcode(null)
          }}
          onSubmit={(data) => {
            if (editingShortcode) {
              handleUpdateShortcode(editingShortcode.id, data)
            } else {
              handleAddShortcode(data)
            }
          }}
        />
      )}
    </div>
  )
}

function ShortcodeRow({ shortcode, onEdit, onDelete, onCopy, isCopied }) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <code className="px-2 py-1 bg-gray-100 text-blue-600 rounded text-sm font-mono">
              [{shortcode.name}]
            </code>
            {shortcode.category && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                {shortcode.category}
              </span>
            )}
            <span className="text-xs text-gray-500">
              Used {shortcode.times_used || 0} times
            </span>
          </div>
          {shortcode.description && (
            <p className="text-sm text-gray-600 mt-1">{shortcode.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Preview"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={onCopy}
            className={`p-2 rounded ${
              isCopied ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isCopied ? 'Copied!' : 'Copy shortcode'}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="bg-white p-3 rounded border border-gray-200 text-sm">
            <div dangerouslySetInnerHTML={{ __html: shortcode.code }} />
          </div>
        </div>
      )}
    </div>
  )
}

function ShortcodeModal({ shortcode, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: shortcode?.name || '',
    code: shortcode?.code || '',
    description: shortcode?.description || '',
    category: shortcode?.category || '',
    variables: shortcode?.variables || [],
  })
  const [newCategory, setNewCategory] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      category: newCategory || formData.category,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {shortcode ? 'Edit Shortcode' : 'Add Shortcode'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shortcode Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SHORTCODE_NAME"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be used as [{formData.name || 'SHORTCODE_NAME'}]
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value })
                    setNewCategory('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select or create new...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => {
                    setNewCategory(e.target.value)
                    setFormData({ ...formData, category: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Or type new category"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What this shortcode does"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shortcode Content *
              </label>
              <textarea
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="<div class='cta-box'>
  <h3>{{title}}</h3>
  <p>{{description}}</p>
  <a href='{{url}}'>Learn More</a>
</div>"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{{variable}}'} for dynamic content
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
              <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                <div dangerouslySetInnerHTML={{ __html: formData.code }} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {shortcode ? 'Update' : 'Add'} Shortcode
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ShortcodesSection
