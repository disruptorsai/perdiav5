import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Zap,
  Shield,
  Clock,
  Save,
  Bot,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSystemSettings, useBulkUpdateSettings } from '@/hooks/useSystemSettings'
import { useToast, ToastProvider } from '@/components/ui/toast'

function SettingsContent() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('automation')
  const [isSaving, setIsSaving] = useState(false)

  const { data: settings = [], isLoading } = useSystemSettings()
  const bulkUpdateSettings = useBulkUpdateSettings()

  // Helper to get setting value
  const getSettingValue = (key, defaultValue = '') => {
    const setting = settings.find(s => s.setting_key === key)
    return setting?.setting_value ?? defaultValue
  }

  // State for all settings
  const [automationSettings, setAutomationSettings] = useState({
    automationLevel: 'manual',
    autoPostEnabled: false,
    autoPostDays: '5',
    postingBlockStart: '',
    postingBlockEnd: '',
    autoGenerateIdeas: false,
    ideaQueueMinimum: '5',
    maxConcurrentGeneration: '2',
    autoApproveArticles: false,
    autoApproveIdeas: false,
  })

  const [workflowSettings, setWorkflowSettings] = useState({
    requireReview: true,
    autoPublishDays: '5',
    dailyLimit: '10',
    weeklyLimit: '100',
  })

  const [aiSettings, setAiSettings] = useState({
    defaultModel: 'grok-beta',
    temperature: '0.7',
    maxTokens: '4000',
  })

  const [qualitySettings, setQualitySettings] = useState({
    minWordCount: '800',
    minInternalLinks: '3',
    minExternalLinks: '1',
    requireExternalCitation: false,
    requireBLSCitation: false,
    requireFAQSchema: false,
    enforceShortcodes: false,
    minReadabilityScore: '60',
    maxReadabilityScore: '80',
    minImages: '1',
    requireImageAltText: true,
    keywordDensityMin: '0.5',
    keywordDensityMax: '2.5',
    requireHeadings: true,
    minHeadingCount: '3',
    checkGrammar: true,
    checkPlagiarism: false,
  })

  // Load settings from database
  useEffect(() => {
    if (settings.length > 0) {
      setAutomationSettings({
        automationLevel: getSettingValue('automation_level', 'manual'),
        autoPostEnabled: getSettingValue('auto_post_enabled', 'false') === 'true',
        autoPostDays: getSettingValue('auto_post_days', '5'),
        postingBlockStart: getSettingValue('posting_block_start', ''),
        postingBlockEnd: getSettingValue('posting_block_end', ''),
        autoGenerateIdeas: getSettingValue('auto_generate_ideas', 'false') === 'true',
        ideaQueueMinimum: getSettingValue('idea_queue_minimum', '5'),
        maxConcurrentGeneration: getSettingValue('max_concurrent_generation', '2'),
        autoApproveArticles: getSettingValue('auto_approve_articles', 'false') === 'true',
        autoApproveIdeas: getSettingValue('auto_approve_ideas', 'false') === 'true',
      })

      setWorkflowSettings({
        requireReview: getSettingValue('require_review', 'true') === 'true',
        autoPublishDays: getSettingValue('auto_publish_days', '5'),
        dailyLimit: getSettingValue('daily_limit', '10'),
        weeklyLimit: getSettingValue('weekly_limit', '100'),
      })

      setAiSettings({
        defaultModel: getSettingValue('default_model', 'grok-beta'),
        temperature: getSettingValue('temperature', '0.7'),
        maxTokens: getSettingValue('max_tokens', '4000'),
      })

      setQualitySettings({
        minWordCount: getSettingValue('min_word_count', '800'),
        minInternalLinks: getSettingValue('min_internal_links', '3'),
        minExternalLinks: getSettingValue('min_external_links', '1'),
        requireExternalCitation: getSettingValue('require_external_citation', 'false') === 'true',
        requireBLSCitation: getSettingValue('require_bls_citation', 'false') === 'true',
        requireFAQSchema: getSettingValue('require_faq_schema', 'false') === 'true',
        enforceShortcodes: getSettingValue('enforce_shortcodes', 'false') === 'true',
        minReadabilityScore: getSettingValue('min_readability_score', '60'),
        maxReadabilityScore: getSettingValue('max_readability_score', '80'),
        minImages: getSettingValue('min_images', '1'),
        requireImageAltText: getSettingValue('require_image_alt_text', 'true') === 'true',
        keywordDensityMin: getSettingValue('keyword_density_min', '0.5'),
        keywordDensityMax: getSettingValue('keyword_density_max', '2.5'),
        requireHeadings: getSettingValue('require_headings', 'true') === 'true',
        minHeadingCount: getSettingValue('min_heading_count', '3'),
        checkGrammar: getSettingValue('check_grammar', 'true') === 'true',
        checkPlagiarism: getSettingValue('check_plagiarism', 'false') === 'true',
      })
    }
  }, [settings])

  const handleSaveAutomation = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'automation_level', value: automationSettings.automationLevel, type: 'workflow' },
        { key: 'auto_post_enabled', value: automationSettings.autoPostEnabled.toString(), type: 'workflow' },
        { key: 'auto_post_days', value: automationSettings.autoPostDays, type: 'workflow' },
        { key: 'posting_block_start', value: automationSettings.postingBlockStart, type: 'workflow' },
        { key: 'posting_block_end', value: automationSettings.postingBlockEnd, type: 'workflow' },
        { key: 'auto_generate_ideas', value: automationSettings.autoGenerateIdeas.toString(), type: 'workflow' },
        { key: 'idea_queue_minimum', value: automationSettings.ideaQueueMinimum, type: 'workflow' },
        { key: 'max_concurrent_generation', value: automationSettings.maxConcurrentGeneration, type: 'workflow' },
        { key: 'auto_approve_articles', value: automationSettings.autoApproveArticles.toString(), type: 'workflow' },
        { key: 'auto_approve_ideas', value: automationSettings.autoApproveIdeas.toString(), type: 'workflow' },
      ])
      toast.success('Automation settings saved successfully')
    } catch (error) {
      toast.error('Failed to save automation settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWorkflow = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'require_review', value: workflowSettings.requireReview.toString(), type: 'workflow' },
        { key: 'auto_publish_days', value: workflowSettings.autoPublishDays, type: 'workflow' },
        { key: 'daily_limit', value: workflowSettings.dailyLimit, type: 'throughput' },
        { key: 'weekly_limit', value: workflowSettings.weeklyLimit, type: 'throughput' },
      ])
      toast.success('Workflow settings saved successfully')
    } catch (error) {
      toast.error('Failed to save workflow settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAI = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'default_model', value: aiSettings.defaultModel, type: 'ai' },
        { key: 'temperature', value: aiSettings.temperature, type: 'ai' },
        { key: 'max_tokens', value: aiSettings.maxTokens, type: 'ai' },
      ])
      toast.success('AI settings saved successfully')
    } catch (error) {
      toast.error('Failed to save AI settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveQuality = async () => {
    setIsSaving(true)
    try {
      await bulkUpdateSettings.mutateAsync([
        { key: 'min_word_count', value: qualitySettings.minWordCount, type: 'quality' },
        { key: 'min_internal_links', value: qualitySettings.minInternalLinks, type: 'quality' },
        { key: 'min_external_links', value: qualitySettings.minExternalLinks, type: 'quality' },
        { key: 'require_external_citation', value: qualitySettings.requireExternalCitation.toString(), type: 'quality' },
        { key: 'require_bls_citation', value: qualitySettings.requireBLSCitation.toString(), type: 'quality' },
        { key: 'require_faq_schema', value: qualitySettings.requireFAQSchema.toString(), type: 'quality' },
        { key: 'enforce_shortcodes', value: qualitySettings.enforceShortcodes.toString(), type: 'quality' },
        { key: 'min_readability_score', value: qualitySettings.minReadabilityScore, type: 'quality' },
        { key: 'max_readability_score', value: qualitySettings.maxReadabilityScore, type: 'quality' },
        { key: 'min_images', value: qualitySettings.minImages, type: 'quality' },
        { key: 'require_image_alt_text', value: qualitySettings.requireImageAltText.toString(), type: 'quality' },
        { key: 'keyword_density_min', value: qualitySettings.keywordDensityMin, type: 'quality' },
        { key: 'keyword_density_max', value: qualitySettings.keywordDensityMax, type: 'quality' },
        { key: 'require_headings', value: qualitySettings.requireHeadings.toString(), type: 'quality' },
        { key: 'min_heading_count', value: qualitySettings.minHeadingCount, type: 'quality' },
        { key: 'check_grammar', value: qualitySettings.checkGrammar.toString(), type: 'quality' },
        { key: 'check_plagiarism', value: qualitySettings.checkPlagiarism.toString(), type: 'quality' },
      ])
      toast.success('Quality settings saved successfully')
    } catch (error) {
      toast.error('Failed to save quality settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-600 mt-1">Configure content engine behavior and policies</p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none">
            <TabsTrigger value="automation">
              <Bot className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <Clock className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Zap className="w-4 h-4 mr-2" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Shield className="w-4 h-4 mr-2" />
              Quality Rules
            </TabsTrigger>
          </TabsList>

          {/* Automation Settings Tab */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Automation Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Manual Mode */}
                  <div
                    onClick={() => setAutomationSettings({ ...automationSettings, automationLevel: 'manual' })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      automationSettings.automationLevel === 'manual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        automationSettings.automationLevel === 'manual' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {automationSettings.automationLevel === 'manual' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Manual Mode</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Full human control. AI provides tools and suggestions, but your team initiates and approves every action.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white">Human-Powered</Badge>
                          <Badge variant="outline" className="bg-white">Maximum Control</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assisted Mode */}
                  <div
                    onClick={() => setAutomationSettings({ ...automationSettings, automationLevel: 'assisted' })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      automationSettings.automationLevel === 'assisted'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        automationSettings.automationLevel === 'assisted' ? 'border-purple-500' : 'border-gray-300'
                      }`}>
                        {automationSettings.automationLevel === 'assisted' && (
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Assisted Automation</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          AI generates complete articles automatically. Your team reviews, approves, and decides when to publish.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white">AI Drafts</Badge>
                          <Badge variant="outline" className="bg-white">Human Approval</Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Recommended</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Auto Mode */}
                  <div
                    onClick={() => setAutomationSettings({ ...automationSettings, automationLevel: 'full_auto' })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      automationSettings.automationLevel === 'full_auto'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        automationSettings.automationLevel === 'full_auto' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {automationSettings.automationLevel === 'full_auto' && (
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Full Automation</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Fully autonomous content engine. AI handles research, generation, review, optimization, and publishing.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white">Autonomous</Badge>
                          <Badge variant="outline" className="bg-white">Hands-Free</Badge>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Use Carefully</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Post Settings */}
                <div className="pt-6 border-t space-y-6">
                  <h4 className="font-semibold text-gray-900">Auto-Post Settings</h4>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Enable Auto-Post</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically publish approved articles after a waiting period
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoPostEnabled}
                      onCheckedChange={(checked) =>
                        setAutomationSettings({ ...automationSettings, autoPostEnabled: checked })
                      }
                    />
                  </div>

                  {automationSettings.autoPostEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Auto-Post After (Days)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={automationSettings.autoPostDays}
                          onChange={(e) =>
                            setAutomationSettings({ ...automationSettings, autoPostDays: e.target.value })
                          }
                        />
                        <p className="text-xs text-gray-600">
                          Articles approved for {automationSettings.autoPostDays} days will be automatically published
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label>Posting Block Start (Time)</Label>
                          <Input
                            type="time"
                            value={automationSettings.postingBlockStart}
                            onChange={(e) =>
                              setAutomationSettings({ ...automationSettings, postingBlockStart: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-600">
                            Do not post after this time (e.g. 00:00)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Posting Block End (Time)</Label>
                          <Input
                            type="time"
                            value={automationSettings.postingBlockEnd}
                            onChange={(e) =>
                              setAutomationSettings({ ...automationSettings, postingBlockEnd: e.target.value })
                            }
                          />
                          <p className="text-xs text-gray-600">
                            Resume posting after this time (e.g. 06:00)
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Idea Generation Settings */}
                <div className="pt-6 border-t space-y-6">
                  <h4 className="font-semibold text-gray-900">Idea Generation</h4>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Auto-Generate Ideas</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically generate new content ideas when queue is low
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoGenerateIdeas}
                      onCheckedChange={(checked) =>
                        setAutomationSettings({ ...automationSettings, autoGenerateIdeas: checked })
                      }
                    />
                  </div>

                  {automationSettings.autoGenerateIdeas && (
                    <div className="space-y-2">
                      <Label>Minimum Idea Queue Size</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={automationSettings.ideaQueueMinimum}
                        onChange={(e) =>
                          setAutomationSettings({ ...automationSettings, ideaQueueMinimum: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-600">
                        Generate new ideas when approved ideas fall below this number
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Auto-Approve Ideas</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically approve AI-generated ideas
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoApproveIdeas}
                      onCheckedChange={(checked) =>
                        setAutomationSettings({ ...automationSettings, autoApproveIdeas: checked })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveAutomation}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Automation Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert variant="info">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>How Automation Works:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li><strong>Manual:</strong> You control everything - AI just provides helpful tools</li>
                  <li><strong>Assisted:</strong> AI generates articles, you review and approve before publishing</li>
                  <li><strong>Full Auto:</strong> AI manages the entire lifecycle including publishing</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Workflow Settings Tab */}
          <TabsContent value="workflow" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Review & Publishing Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Manual Review</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      All articles must be reviewed before publishing
                    </p>
                  </div>
                  <Switch
                    checked={workflowSettings.requireReview}
                    onCheckedChange={(checked) =>
                      setWorkflowSettings({ ...workflowSettings, requireReview: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Auto-Publish After (Days)</Label>
                  <Input
                    type="number"
                    value={workflowSettings.autoPublishDays}
                    onChange={(e) =>
                      setWorkflowSettings({ ...workflowSettings, autoPublishDays: e.target.value })
                    }
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-600">
                    Automatically publish if not reviewed within this timeframe (0 to disable)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Article Limit</Label>
                    <Input
                      type="number"
                      value={workflowSettings.dailyLimit}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, dailyLimit: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly Article Limit</Label>
                    <Input
                      type="number"
                      value={workflowSettings.weeklyLimit}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, weeklyLimit: e.target.value })
                      }
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveWorkflow}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Workflow Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changes to workflow settings will affect all future articles. Existing articles in the queue will maintain their current settings until manually updated.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI Model Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <select
                    value={aiSettings.defaultModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, defaultModel: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="grok-beta">Grok Beta (xAI) - Recommended</option>
                    <option value="grok-vision-beta">Grok Vision Beta (xAI)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                  </select>
                  <p className="text-xs text-gray-600">
                    Select the primary AI model for content generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Temperature (0.0 - 1.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({ ...aiSettings, temperature: e.target.value })}
                  />
                  <p className="text-xs text-gray-600">
                    Lower = more focused, Higher = more creative (0.7 recommended)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Tokens</Label>
                  <Input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAiSettings({ ...aiSettings, maxTokens: e.target.value })}
                  />
                  <p className="text-xs text-gray-600">
                    Maximum length for AI-generated content
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveAI}
                    disabled={isSaving}
                    className="w-full bg-blue-700 hover:bg-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save AI Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Generation Time</span>
                    <Badge className="bg-emerald-600">~15 seconds</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge className="bg-blue-600">98.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Avg Quality Score</span>
                    <Badge className="bg-purple-600">8.2/10</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Rules Tab */}
          <TabsContent value="quality" className="space-y-6 mt-6">
            {/* Content Requirements */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Content Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Word Count</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minWordCount}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minWordCount: e.target.value })
                      }
                      placeholder="800"
                    />
                    <p className="text-xs text-gray-600">
                      Articles below this will be flagged
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Heading Count</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minHeadingCount}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minHeadingCount: e.target.value })
                      }
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-600">
                      Minimum H2/H3 headings for structure
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Heading Structure</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Articles must have proper H2/H3 heading hierarchy
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireHeadings}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireHeadings: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Link & Citation Rules */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Links & Citations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Internal Links</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minInternalLinks}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minInternalLinks: e.target.value })
                      }
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-600">
                      Links to your own content
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum External Citations</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minExternalLinks}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minExternalLinks: e.target.value })
                      }
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-600">
                      Authoritative external sources
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require BLS Citation</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Require Bureau of Labor Statistics data for salary/career articles
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireBLSCitation}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireBLSCitation: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO & Schema */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  SEO & Schema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Keyword Density Min (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={qualitySettings.keywordDensityMin}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, keywordDensityMin: e.target.value })
                      }
                      placeholder="0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Keyword Density Max (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={qualitySettings.keywordDensityMax}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, keywordDensityMax: e.target.value })
                      }
                      placeholder="2.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require FAQ Schema</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Articles must include structured FAQ data for rich snippets
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireFAQSchema}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireFAQSchema: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Enforce Shortcodes</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Block publishing if monetization links bypass shortcodes
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.enforceShortcodes}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, enforceShortcodes: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Readability & Images */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Readability & Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Readability Score</Label>
                    <Input
                      type="number"
                      value={qualitySettings.minReadabilityScore}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, minReadabilityScore: e.target.value })
                      }
                      placeholder="60"
                    />
                    <p className="text-xs text-gray-600">
                      Flesch-Kincaid reading ease (60-70 = standard)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Readability Score</Label>
                    <Input
                      type="number"
                      value={qualitySettings.maxReadabilityScore}
                      onChange={(e) =>
                        setQualitySettings({ ...qualitySettings, maxReadabilityScore: e.target.value })
                      }
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Images</Label>
                  <Input
                    type="number"
                    value={qualitySettings.minImages}
                    onChange={(e) =>
                      setQualitySettings({ ...qualitySettings, minImages: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-base font-medium">Require Image Alt Text</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      All images must have descriptive alt text for accessibility
                    </p>
                  </div>
                  <Switch
                    checked={qualitySettings.requireImageAltText}
                    onCheckedChange={(checked) =>
                      setQualitySettings({ ...qualitySettings, requireImageAltText: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveQuality}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Quality Rules'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Schema Validation</span>
                    <Badge className="bg-emerald-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">Quality Checks</span>
                    <Badge className="bg-emerald-600">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium">E-E-A-T Guidelines</span>
                    <Badge className="bg-emerald-600">Following</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function Settings() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  )
}

export default Settings
