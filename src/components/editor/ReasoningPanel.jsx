import { useState } from 'react'
import {
  Brain,
  ChevronDown,
  ChevronRight,
  User,
  Link2,
  Sparkles,
  FileText,
  CheckCircle,
  Settings,
} from 'lucide-react'

/**
 * ReasoningPanel - Displays AI thought process during article generation
 * Shows contributor selection, link decisions, rules applied, and quality checks
 */
function ReasoningPanel({ article }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  // Parse reasoning from article (stored as JSON string)
  const reasoning = article?.reasoning ?
    (typeof article.reasoning === 'string' ?
      JSON.parse(article.reasoning) : article.reasoning)
    : null

  if (!reasoning) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">AI Reasoning</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4">
            <div className="text-center py-6 text-gray-500">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No reasoning data available</p>
              <p className="text-xs text-gray-400 mt-1">
                Reasoning is captured during article generation
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'contributor', label: 'Contributor', icon: User },
    { id: 'links', label: 'Links', icon: Link2 },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'quality', label: 'Quality', icon: CheckCircle },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900">AI Reasoning</span>
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            Transparency
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-0">
          {/* Section Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="p-4">
            {activeSection === 'overview' && (
              <OverviewSection reasoning={reasoning} />
            )}
            {activeSection === 'contributor' && (
              <ContributorSection reasoning={reasoning} />
            )}
            {activeSection === 'links' && (
              <LinksSection reasoning={reasoning} />
            )}
            {activeSection === 'rules' && (
              <RulesSection reasoning={reasoning} />
            )}
            {activeSection === 'quality' && (
              <QualitySection reasoning={reasoning} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewSection({ reasoning }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Generation Summary</h4>
        <p className="text-sm text-gray-600">
          {reasoning.summary || 'Article generated using standard pipeline.'}
        </p>
      </div>

      {reasoning.timestamp && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Generated:</span>
          <span className="font-medium">{new Date(reasoning.timestamp).toLocaleString()}</span>
        </div>
      )}

      {reasoning.model && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="w-4 h-4" />
          <span>Model: {reasoning.model}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-700">
            {reasoning.stages_completed || 5}
          </p>
          <p className="text-xs text-blue-600">Stages</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-700">
            {reasoning.rules_applied || 0}
          </p>
          <p className="text-xs text-green-600">Rules Applied</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-700">
            {reasoning.links_inserted || 0}
          </p>
          <p className="text-xs text-purple-600">Links Added</p>
        </div>
      </div>
    </div>
  )
}

function ContributorSection({ reasoning }) {
  const contributor = reasoning.contributor_selection || {}

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p className="font-medium text-blue-900">
              {contributor.selected_name || 'Auto-assigned'}
            </p>
            <p className="text-xs text-blue-700">
              Score: {contributor.score || 'N/A'} points
            </p>
          </div>
        </div>

        {contributor.reason && (
          <p className="text-sm text-blue-800 mt-2">
            <span className="font-medium">Why: </span>
            {contributor.reason}
          </p>
        )}
      </div>

      {/* Scoring Breakdown */}
      {contributor.scoring && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Scoring Breakdown</h4>
          <div className="space-y-2">
            {contributor.scoring.map((score, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{score.factor}</span>
                <span className={`font-medium ${score.points > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  +{score.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidates Considered */}
      {contributor.candidates && contributor.candidates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Other Candidates</h4>
          <div className="space-y-1">
            {contributor.candidates.slice(0, 5).map((c, index) => (
              <div
                key={index}
                className={`flex items-center justify-between text-sm p-2 rounded ${
                  index === 0 ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <span className={index === 0 ? 'text-green-700' : 'text-gray-600'}>
                  {c.name}
                </span>
                <span className="text-gray-500">{c.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LinksSection({ reasoning }) {
  const links = reasoning.internal_links || {}

  return (
    <div className="space-y-4">
      {/* Links Inserted */}
      {links.inserted && links.inserted.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Links Inserted ({links.inserted.length})
          </h4>
          <div className="space-y-2">
            {links.inserted.map((link, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {link.title}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {link.url}
                </p>
                {link.context && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    Context: "{link.context}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    Relevance: {link.relevance_score || 'High'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No internal links tracked</p>
        </div>
      )}

      {/* Links Considered but Not Used */}
      {links.considered && links.considered.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Considered but Not Used
          </h4>
          <div className="space-y-1">
            {links.considered.slice(0, 5).map((link, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <span className="text-gray-600 truncate flex-1">{link.title}</span>
                <span className="text-xs text-gray-400 ml-2">{link.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RulesSection({ reasoning }) {
  const rules = reasoning.rules_applied || []

  if (rules.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Settings className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm">No rules applied</p>
        <p className="text-xs text-gray-400 mt-1">
          Configure rules in Settings to apply during generation
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{rule.name}</p>
            <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
            {rule.changes && (
              <div className="mt-2">
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {rule.changes} changes made
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function QualitySection({ reasoning }) {
  const quality = reasoning.quality_checks || {}

  return (
    <div className="space-y-4">
      {/* Final Score */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">Quality Score</span>
          <span className="text-2xl font-bold text-green-700">
            {quality.final_score || 'N/A'}
          </span>
        </div>
      </div>

      {/* Checks Performed */}
      {quality.checks && quality.checks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Checks Performed</h4>
          <div className="space-y-2">
            {quality.checks.map((check, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded ${
                  check.passed ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {check.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center text-xs text-red-700">!</span>
                  )}
                  <span className={`text-sm ${check.passed ? 'text-green-800' : 'text-red-800'}`}>
                    {check.name}
                  </span>
                </div>
                <span className={`text-xs ${check.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {check.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-fixes Applied */}
      {quality.auto_fixes && quality.auto_fixes.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Auto-fixes Applied</h4>
          <div className="space-y-1">
            {quality.auto_fixes.map((fix, index) => (
              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-500" />
                {fix}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReasoningPanel
