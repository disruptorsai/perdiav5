import { useEffect, useState } from 'react'
import { useSettingsMap } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'

/**
 * Quality Checklist Component
 * Real-time quality metrics with settings-based thresholds
 */
export default function QualityChecklist({ article, content, onQualityChange, onAutoFix }) {
  const [checks, setChecks] = useState({})
  const [score, setScore] = useState(0)
  const [canPublish, setCanPublish] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const { getValue, getIntValue, getBoolValue, getFloatValue } = useSettingsMap()

  useEffect(() => {
    if (!content) {
      const emptyState = { canPublish: false, score: 0, checks: {} }
      setChecks({})
      setScore(0)
      setCanPublish(false)
      onQualityChange?.(emptyState)
      return
    }

    // Get quality settings from system settings
    const minWordCount = getIntValue('min_word_count', 800)
    const maxWordCount = getIntValue('max_word_count', 2500)
    const minInternalLinks = getIntValue('min_internal_links', 3)
    const minExternalLinks = getIntValue('min_external_links', 1)
    const requireBLS = getBoolValue('require_bls_citation', false)
    const requireFAQ = getBoolValue('require_faq_schema', false)
    const requireHeadings = getBoolValue('require_headings', true)
    const minHeadingCount = getIntValue('min_heading_count', 3)
    const minImages = getIntValue('min_images', 1)
    const requireImageAlt = getBoolValue('require_image_alt_text', true)
    const keywordDensityMin = getFloatValue('keyword_density_min', 0.5)
    const keywordDensityMax = getFloatValue('keyword_density_max', 2.5)
    const minReadability = getIntValue('min_readability_score', 60)
    const maxReadability = getIntValue('max_readability_score', 80)

    // Calculate metrics
    const plainText = content.replace(/<[^>]*>/g, '')
    const wordCount = plainText.split(/\s+/).filter(w => w).length

    // Count links (looking for href patterns)
    const allLinks = content.match(/<a\s+[^>]*href=["'][^"']+["'][^>]*>/gi) || []
    const internalLinks = allLinks.filter(link =>
      link.includes('geteducated.com') ||
      link.includes('localhost') ||
      link.match(/href=["']\/[^"']*["']/)
    ).length
    const externalLinks = allLinks.length - internalLinks

    const hasSchema = article?.faqs && article.faqs.length > 0
    const hasBLSCitation = content.toLowerCase().includes('bls.gov') ||
                          content.toLowerCase().includes('bureau of labor')

    // Count headings
    const h2Count = (content.match(/<h2/gi) || []).length
    const h3Count = (content.match(/<h3/gi) || []).length
    const totalHeadings = h2Count + h3Count

    // Count images
    const imageMatches = content.match(/<img[^>]*>/gi) || []
    const imageCount = imageMatches.length
    const imagesWithAlt = imageMatches.filter(img => /alt=["'][^"']+["']/i.test(img)).length

    // Calculate keyword density
    let keywordDensity = 0
    const targetKeywords = article?.target_keywords || article?.focus_keyword
    if (targetKeywords) {
      const primaryKeyword = Array.isArray(targetKeywords)
        ? targetKeywords[0]?.toLowerCase()
        : targetKeywords.toLowerCase()
      if (primaryKeyword && wordCount > 0) {
        const keywordOccurrences = (plainText.toLowerCase().match(new RegExp(primaryKeyword, 'g')) || []).length
        keywordDensity = (keywordOccurrences / wordCount) * 100
      }
    }

    // Calculate readability (Flesch Reading Ease approximation)
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim()).length
    const syllables = plainText.split(/\s+/).reduce((count, word) => {
      return count + (word.replace(/[^aeiou]/gi, '').length || 1)
    }, 0)
    const readabilityScore = sentences > 0 && wordCount > 0
      ? Math.max(0, Math.min(100, 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)))
      : 50

    // Build checks object
    const newChecks = {
      wordCount: {
        passed: wordCount >= minWordCount && wordCount <= maxWordCount,
        critical: false,
        label: `${minWordCount}-${maxWordCount} words`,
        value: `${wordCount} words`,
        issue: wordCount < minWordCount
          ? `Add ${minWordCount - wordCount} more words`
          : wordCount > maxWordCount
            ? `Remove ${wordCount - maxWordCount} words`
            : null
      },
      internalLinks: {
        passed: internalLinks >= minInternalLinks,
        critical: true,
        label: `At least ${minInternalLinks} internal links`,
        value: `${internalLinks} link${internalLinks !== 1 ? 's' : ''}`,
        issue: internalLinks < minInternalLinks
          ? `Add ${minInternalLinks - internalLinks} more internal link(s)`
          : null
      },
      externalLinks: {
        passed: externalLinks >= minExternalLinks,
        critical: false,
        label: `At least ${minExternalLinks} external citation${minExternalLinks !== 1 ? 's' : ''}`,
        value: `${externalLinks} citation${externalLinks !== 1 ? 's' : ''}`,
        issue: externalLinks < minExternalLinks
          ? `Add ${minExternalLinks - externalLinks} more external citation(s)`
          : null
      },
      schema: {
        passed: !requireFAQ || hasSchema,
        critical: requireFAQ,
        label: 'FAQ Schema markup',
        value: hasSchema ? 'Added' : 'Missing',
        enabled: requireFAQ,
        issue: !hasSchema && requireFAQ ? 'Add FAQ schema markup' : null
      },
      blsCitation: {
        passed: !requireBLS || hasBLSCitation,
        critical: requireBLS,
        label: 'BLS data citation',
        value: hasBLSCitation ? 'Present' : 'Missing',
        enabled: requireBLS,
        issue: !hasBLSCitation && requireBLS ? 'Add BLS citation' : null
      },
      headings: {
        passed: !requireHeadings || totalHeadings >= minHeadingCount,
        critical: false,
        label: `At least ${minHeadingCount} headings (H2/H3)`,
        value: `${totalHeadings} heading${totalHeadings !== 1 ? 's' : ''}`,
        enabled: requireHeadings,
        issue: totalHeadings < minHeadingCount && requireHeadings
          ? `Add ${minHeadingCount - totalHeadings} more heading(s)`
          : null
      },
      images: {
        passed: imageCount >= minImages,
        critical: false,
        label: `At least ${minImages} image${minImages !== 1 ? 's' : ''}`,
        value: `${imageCount} image${imageCount !== 1 ? 's' : ''}`,
        issue: imageCount < minImages
          ? `Add ${minImages - imageCount} more image(s)`
          : null
      },
      imageAlt: {
        passed: !requireImageAlt || imageCount === 0 || imagesWithAlt === imageCount,
        critical: false,
        label: 'All images have alt text',
        value: imageCount > 0 ? `${imagesWithAlt}/${imageCount} with alt text` : 'No images',
        enabled: requireImageAlt && imageCount > 0,
        issue: imagesWithAlt < imageCount && requireImageAlt
          ? `Add alt text to ${imageCount - imagesWithAlt} image(s)`
          : null
      },
      keywordDensity: {
        passed: !targetKeywords || (keywordDensity >= keywordDensityMin && keywordDensity <= keywordDensityMax),
        critical: false,
        label: `Keyword density ${keywordDensityMin}%-${keywordDensityMax}%`,
        value: `${keywordDensity.toFixed(2)}%`,
        enabled: !!targetKeywords,
        issue: targetKeywords && (keywordDensity < keywordDensityMin || keywordDensity > keywordDensityMax)
          ? keywordDensity < keywordDensityMin
            ? 'Increase keyword usage'
            : 'Reduce keyword usage (potential stuffing)'
          : null
      },
      readability: {
        passed: readabilityScore >= minReadability && readabilityScore <= maxReadability,
        critical: false,
        label: `Readability ${minReadability}-${maxReadability}`,
        value: `${readabilityScore.toFixed(0)} (${
          readabilityScore >= 70 ? 'Easy' :
          readabilityScore >= 60 ? 'Standard' :
          readabilityScore >= 50 ? 'Difficult' : 'Very Difficult'
        })`,
        issue: readabilityScore < minReadability
          ? 'Simplify sentence structure'
          : readabilityScore > maxReadability
            ? 'Add more complexity for target audience'
            : null
      }
    }

    // Filter enabled checks
    const enabledChecks = Object.entries(newChecks).reduce((acc, [key, check]) => {
      if (check.enabled === false) return acc
      acc[key] = check
      return acc
    }, {})

    const totalChecks = Object.keys(enabledChecks).length
    const passedChecks = Object.values(enabledChecks).filter(c => c.passed).length
    const criticalFailed = Object.values(enabledChecks).some(c => c.critical && !c.passed)

    const newScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0
    const newCanPublish = !criticalFailed

    setChecks(enabledChecks)
    setScore(newScore)
    setCanPublish(newCanPublish)

    onQualityChange?.({
      canPublish: newCanPublish,
      score: newScore,
      checks: enabledChecks,
      issues: Object.values(enabledChecks)
        .filter(c => !c.passed && c.issue)
        .map(c => ({ description: c.issue, critical: c.critical }))
    })
  }, [content, article, getValue, getIntValue, getBoolValue, getFloatValue, onQualityChange])

  const handleAutoFix = async () => {
    if (!onAutoFix) return

    const issues = Object.values(checks)
      .filter(c => !c.passed && c.issue)
      .map(c => ({ description: c.issue, critical: c.critical }))

    if (issues.length === 0) return

    setIsFixing(true)
    try {
      await onAutoFix(issues)
    } catch (error) {
      console.error('Auto-fix error:', error)
    } finally {
      setIsFixing(false)
    }
  }

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = () => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const issues = Object.values(checks).filter(c => !c.passed)

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quality Checklist</CardTitle>
          <Badge
            variant="outline"
            className={`${getScoreColor()} font-bold text-base px-3 py-1`}
          >
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(checks).map(([key, check]) => (
          <div
            key={key}
            className={`flex items-start justify-between gap-3 p-3 rounded-lg ${
              check.passed
                ? 'bg-green-50'
                : check.critical
                  ? 'bg-red-50'
                  : 'bg-yellow-50'
            }`}
          >
            <div className="flex items-start gap-2 flex-1">
              {check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : check.critical ? (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm text-gray-900">{check.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{check.value}</p>
                {check.critical && !check.passed && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    Critical - blocks publishing
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {!canPublish && issues.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium">
              Fix critical issues before publishing
            </p>
          </div>
        )}

        {issues.length > 0 && onAutoFix && (
          <Button
            onClick={handleAutoFix}
            disabled={isFixing}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isFixing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing Issues...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Fix All Issues
              </>
            )}
          </Button>
        )}

        {issues.length === 0 && (
          <div className={`p-3 rounded-lg border ${getScoreBgColor()}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">All checks passed!</p>
                <p className="text-xs text-green-700">Ready for publishing</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
