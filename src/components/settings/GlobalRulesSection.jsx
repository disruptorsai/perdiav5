import { useState, useEffect } from 'react'
import { Settings, Sliders, Ban, RefreshCw } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

function GlobalRulesSection() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    ai_temperature: 0.7,
    max_tokens: 4000,
    target_word_count: 2000,
    tone: 'professional',
    voice: 'authoritative',
    banned_phrases: [],
    auto_fix_enabled: true,
    humanization_level: 'medium',
  })
  const [bannedPhrasesText, setBannedPhrasesText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      const loaded = {
        ai_temperature: data.ai_temperature ?? 0.7,
        max_tokens: data.max_tokens ?? 4000,
        target_word_count: data.target_word_count ?? 2000,
        tone: data.tone ?? 'professional',
        voice: data.voice ?? 'authoritative',
        banned_phrases: data.banned_phrases ?? [],
        auto_fix_enabled: data.auto_fix_enabled ?? true,
        humanization_level: data.humanization_level ?? 'medium',
      }
      setSettings(loaded)
      setBannedPhrasesText(loaded.banned_phrases.join('\n'))
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveMessage('')

    const settingsToSave = {
      ...settings,
      banned_phrases: bannedPhrasesText.split('\n').map(p => p.trim()).filter(Boolean),
      user_id: user.id,
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(settingsToSave, { onConflict: 'user_id' })

    setIsSaving(false)

    if (error) {
      setSaveMessage('Error saving settings')
      console.error(error)
    } else {
      setSaveMessage('Settings saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Global AI Rules</h2>
          <p className="text-sm text-gray-600">Configure AI generation behavior</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          saveMessage.includes('Error')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* AI Temperature */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Sliders className="w-4 h-4" />
              AI Temperature
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.ai_temperature}
                onChange={(e) => setSettings({ ...settings, ai_temperature: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 w-12 text-center">
                {settings.ai_temperature}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="1000"
              max="8000"
              step="500"
              value={settings.max_tokens}
              onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum length of AI responses (1000-8000)
            </p>
          </div>

          {/* Target Word Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Word Count
            </label>
            <input
              type="number"
              min="500"
              max="5000"
              step="100"
              value={settings.target_word_count}
              onChange={(e) => setSettings({ ...settings, target_word_count: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Target article length in words
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Tone
            </label>
            <select
              value={settings.tone}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="academic">Academic</option>
              <option value="conversational">Conversational</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>

          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Voice
            </label>
            <select
              value={settings.voice}
              onChange={(e) => setSettings({ ...settings, voice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="authoritative">Authoritative</option>
              <option value="informative">Informative</option>
              <option value="persuasive">Persuasive</option>
              <option value="supportive">Supportive</option>
              <option value="educational">Educational</option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Humanization Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Humanization Level
            </label>
            <select
              value={settings.humanization_level}
              onChange={(e) => setSettings({ ...settings, humanization_level: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light - Minor adjustments</option>
              <option value="medium">Medium - Balanced rewrite</option>
              <option value="heavy">Heavy - Complete transformation</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How aggressively to humanize AI-generated content
            </p>
          </div>

          {/* Auto-Fix Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Auto-Fix Quality Issues</p>
              <p className="text-sm text-gray-600">Automatically fix issues with AI</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.auto_fix_enabled}
                onChange={(e) => setSettings({ ...settings, auto_fix_enabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Banned Phrases */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Ban className="w-4 h-4" />
              Banned Phrases
            </label>
            <textarea
              value={bannedPhrasesText}
              onChange={(e) => setBannedPhrasesText(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter one phrase per line:
dive into
delve into
navigate the landscape
in today's fast-paced world
..."
            />
            <p className="text-xs text-gray-500 mt-1">
              One phrase per line. These will be removed from generated content.
            </p>
          </div>
        </div>
      </div>

      {/* Common banned phrases quick add */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Add Common AI Phrases</p>
        <div className="flex flex-wrap gap-2">
          {[
            'dive into',
            'delve into',
            'navigate the landscape',
            'in today\'s fast-paced world',
            'game-changer',
            'unlock the potential',
            'embark on a journey',
            'at the end of the day',
            'it\'s important to note',
            'leverage',
          ].map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                if (!bannedPhrasesText.includes(phrase)) {
                  setBannedPhrasesText(prev => prev ? `${prev}\n${phrase}` : phrase)
                }
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              + {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GlobalRulesSection
