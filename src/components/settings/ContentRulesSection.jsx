import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Globe, Ban, Link2, User } from 'lucide-react'
import {
  useContentRules,
  useCreateContentRule,
  useUpdateContentRule,
  useDeleteContentRule,
  useToggleContentRule,
} from '../../hooks/useContentRules'

const RULE_TYPES = [
  { value: 'domain_whitelist', label: 'Domain Whitelist', icon: Globe, description: 'Allowed external domains for links' },
  { value: 'domain_blacklist', label: 'Domain Blacklist', icon: Ban, description: 'Blocked domains' },
  { value: 'source_whitelist', label: 'Source Whitelist', icon: Link2, description: 'Approved external sources' },
  { value: 'author_mapping', label: 'Author Mapping', icon: User, description: 'Content type to author rules' },
  { value: 'blocked_pattern', label: 'Blocked Patterns', icon: Ban, description: 'Phrases to avoid' },
]

function ContentRulesSection() {
  const [activeTab, setActiveTab] = useState('domain_whitelist')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)

  const { data: rules, isLoading } = useContentRules(activeTab)
  const createRule = useCreateContentRule()
  const updateRule = useUpdateContentRule()
  const deleteRule = useDeleteContentRule()
  const toggleRule = useToggleContentRule()

  const handleAddRule = async (ruleData) => {
    await createRule.mutateAsync({
      rule_type: activeTab,
      ...ruleData,
    })
    setShowAddModal(false)
  }

  const handleUpdateRule = async (ruleId, updates) => {
    await updateRule.mutateAsync({ ruleId, updates })
    setEditingRule(null)
  }

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Delete this rule?')) return
    await deleteRule.mutateAsync(ruleId)
  }

  const handleToggleRule = async (ruleId, currentStatus) => {
    await toggleRule.mutateAsync({ ruleId, isActive: !currentStatus })
  }

  const activeRuleType = RULE_TYPES.find(r => r.value === activeTab)

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Content Rules</h2>
          <p className="text-sm text-gray-600">Configure domain, source, and author rules</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Rule Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-4">
        {RULE_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.value}
              onClick={() => setActiveTab(type.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === type.value
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          )
        })}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">
        {activeRuleType?.description}
      </p>

      {/* Rules List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading rules...</div>
      ) : rules?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <activeRuleType.icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No {activeRuleType?.label.toLowerCase()} rules</p>
          <p className="text-sm text-gray-500">Add a rule to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules?.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              ruleType={activeTab}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => handleDeleteRule(rule.id)}
              onToggle={() => handleToggleRule(rule.id, rule.is_active)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingRule) && (
        <RuleModal
          ruleType={activeTab}
          rule={editingRule}
          onClose={() => {
            setShowAddModal(false)
            setEditingRule(null)
          }}
          onSubmit={(data) => {
            if (editingRule) {
              handleUpdateRule(editingRule.id, data)
            } else {
              handleAddRule(data)
            }
          }}
        />
      )}
    </div>
  )
}

function RuleRow({ rule, ruleType, onEdit, onDelete, onToggle }) {
  const getRuleDisplay = () => {
    switch (ruleType) {
      case 'domain_whitelist':
      case 'domain_blacklist':
        return {
          primary: rule.pattern,
          secondary: rule.description,
        }
      case 'source_whitelist':
        return {
          primary: rule.pattern,
          secondary: `Priority: ${rule.priority || 0}`,
        }
      case 'author_mapping':
        return {
          primary: `${rule.pattern} → ${rule.replacement}`,
          secondary: rule.description,
        }
      case 'blocked_pattern':
        return {
          primary: rule.pattern,
          secondary: rule.replacement ? `Replace with: ${rule.replacement}` : 'Will be removed',
        }
      default:
        return {
          primary: rule.pattern,
          secondary: '',
        }
    }
  }

  const display = getRuleDisplay()

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${
      rule.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${rule.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
            {display.primary}
          </span>
          {!rule.is_active && (
            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Disabled</span>
          )}
        </div>
        {display.secondary && (
          <p className="text-sm text-gray-500 mt-0.5">{display.secondary}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className={`p-2 rounded hover:bg-gray-100 ${
            rule.is_active ? 'text-green-600' : 'text-gray-400'
          }`}
          title={rule.is_active ? 'Disable rule' : 'Enable rule'}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Edit rule"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
          title="Delete rule"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function RuleModal({ ruleType, rule, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    pattern: rule?.pattern || '',
    replacement: rule?.replacement || '',
    description: rule?.description || '',
    priority: rule?.priority || 0,
    is_active: rule?.is_active ?? true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getFields = () => {
    switch (ruleType) {
      case 'domain_whitelist':
      case 'domain_blacklist':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain Pattern *
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example.com or *.example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use * for wildcards</p>
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
                placeholder="Why this domain is allowed/blocked"
              />
            </div>
          </>
        )
      case 'source_whitelist':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source URL/Pattern *
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/research/*"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Higher priority sources are preferred</p>
            </div>
          </>
        )
      case 'author_mapping':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type *
              </label>
              <select
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select content type...</option>
                <option value="ranking">Rankings</option>
                <option value="guide">Guides</option>
                <option value="listicle">Listicles</option>
                <option value="explainer">Explainers</option>
                <option value="review">Reviews</option>
                <option value="tutorial">Tutorials</option>
                <option value="stem">STEM Content</option>
                <option value="professional">Professional Programs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Author *
              </label>
              <input
                type="text"
                value={formData.replacement}
                onChange={(e) => setFormData({ ...formData, replacement: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Author name or ID"
                required
              />
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
                placeholder="Why this author for this content"
              />
            </div>
          </>
        )
      case 'blocked_pattern':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phrase to Block *
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="phrase to avoid"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replace With (optional)
              </label>
              <input
                type="text"
                value={formData.replacement}
                onChange={(e) => setFormData({ ...formData, replacement: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="alternative phrase (leave empty to remove)"
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {rule ? 'Edit Rule' : 'Add Rule'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {getFields()}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Rule is active
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
                {rule ? 'Update' : 'Add'} Rule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContentRulesSection
