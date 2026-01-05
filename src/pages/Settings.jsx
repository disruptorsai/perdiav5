import { useState } from 'react'
import { Settings as SettingsIcon, Plus, Trash2, Check, X, ExternalLink, Webhook } from 'lucide-react'
import ContentRulesSection from '../components/settings/ContentRulesSection'
import ShortcodesSection from '../components/settings/ShortcodesSection'
import GlobalRulesSection from '../components/settings/GlobalRulesSection'
import SitemapSection from '../components/settings/SitemapSection'

function Settings() {
  const [wpConnections, setWpConnections] = useState([])
  const [showWpModal, setShowWpModal] = useState(false)

  const handleAddWpConnection = (connectionData) => {
    setWpConnections([...wpConnections, { ...connectionData, id: Date.now() }])
    setShowWpModal(false)
  }

  const handleDeleteWpConnection = (id) => {
    if (!confirm('Delete this WordPress connection?')) return
    setWpConnections(wpConnections.filter(conn => conn.id !== id))
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your Perdia Content Engine</p>
      </div>

      <div className="max-w-5xl">
        {/* Content Rules Section */}
        <ContentRulesSection />

        {/* Shortcodes Section */}
        <ShortcodesSection />

        {/* Global Rules Section */}
        <GlobalRulesSection />

        {/* Sitemap & Internal Linking Section */}
        <SitemapSection />

        {/* WordPress Connections Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">WordPress Connections</h2>
              <p className="text-sm text-gray-600">Configure publishing destinations</p>
            </div>
            <button
              onClick={() => setShowWpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Connection
            </button>
          </div>

          {wpConnections.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No WordPress connections</p>
              <p className="text-sm text-gray-500">Add a connection to publish articles to WordPress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wpConnections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{conn.name}</h3>
                      {conn.isDefault && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Default</span>
                      )}
                      {conn.useN8N && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                          <Webhook className="w-3 h-3" />
                          N8N
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{conn.siteUrl}</p>
                    <p className="text-xs text-gray-500 mt-1">User: {conn.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Test connection"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWpConnection(conn.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete connection"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Keys Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grok API Key
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claude API Key
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DataForSEO Username
              </label>
              <input
                type="text"
                placeholder="username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DataForSEO Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Automation Mode</p>
                <p className="text-sm text-gray-600">Choose how articles are generated</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="manual">Manual</option>
                <option value="semi_auto">Semi-Automatic</option>
                <option value="full_auto">Fully Automatic</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-Publish</p>
                <p className="text-sm text-gray-600">Automatically publish articles with score ≥ 85</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-Fix Quality Issues</p>
                <p className="text-sm text-gray-600">Automatically fix quality issues with AI</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Quality Thresholds */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Thresholds</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Publish Threshold
              </label>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue="85"
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum quality score for auto-publishing</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Threshold
              </label>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue="75"
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum quality score to avoid rejection</p>
            </div>
          </div>
        </div>

        <button className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>

      {/* WordPress Connection Modal */}
      {showWpModal && (
        <WordPressConnectionModal
          onClose={() => setShowWpModal(false)}
          onSubmit={handleAddWpConnection}
        />
      )}
    </div>
  )
}

function WordPressConnectionModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    siteUrl: '',
    username: '',
    password: '',
    authType: 'basic',
    isDefault: false,
    useN8N: false,
    n8nWebhookUrl: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add WordPress Connection</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My WordPress Site"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site URL *
              </label>
              <input
                type="url"
                value={formData.siteUrl}
                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Full WordPress site URL (no trailing slash)</p>
            </div>

            {/* N8N Toggle */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-purple-600" />
                  <p className="font-medium text-gray-900">Use N8N Webhook</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.useN8N}
                    onChange={(e) => setFormData({ ...formData, useN8N: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Publish via N8N workflow instead of direct WordPress API
              </p>

              {formData.useN8N && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N8N Webhook URL *
                  </label>
                  <input
                    type="url"
                    value={formData.n8nWebhookUrl}
                    onChange={(e) => setFormData({ ...formData, n8nWebhookUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://n8n.example.com/webhook/..."
                    required={formData.useN8N}
                  />
                </div>
              )}
            </div>

            {!formData.useN8N && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WordPress Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin"
                    required={!formData.useN8N}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="xxxx xxxx xxxx xxxx"
                    required={!formData.useN8N}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate in WordPress: Users → Profile → Application Passwords
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Set as default connection
              </label>
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
                Add Connection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings
