import { useEffect, useState, useMemo } from 'react'
import { useSettingsMap } from '@/hooks/useSystemSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link2, ExternalLink, CheckCircle2, AlertTriangle, Globe, Home, RefreshCw } from 'lucide-react'

/**
 * Link Compliance Checker Component
 * Analyzes internal and external links in content
 */
export default function LinkComplianceChecker({ content, onComplianceChange }) {
  const [linkStats, setLinkStats] = useState({
    internal: 0,
    external: 0,
    total: 0,
    compliant: true,
    links: []
  })
  const [showDetails, setShowDetails] = useState(false)

  const { getIntValue } = useSettingsMap()

  const minInternalLinks = getIntValue('min_internal_links', 3)
  const minExternalLinks = getIntValue('min_external_links', 1)

  useEffect(() => {
    if (!content) {
      const emptyStats = {
        internal: 0,
        external: 0,
        total: 0,
        compliant: false,
        links: []
      }
      setLinkStats(emptyStats)
      onComplianceChange?.(false, emptyStats)
      return
    }

    // Extract all links with their details
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    const links = []
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1]
      const text = match[2] || 'No anchor text'

      // Determine if internal or external
      const isInternal = url.startsWith('/') ||
                        url.includes('geteducated.com') ||
                        url.includes('localhost') ||
                        url.startsWith('#')

      links.push({
        url,
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        type: isInternal ? 'internal' : 'external',
        isAnchor: url.startsWith('#')
      })
    }

    const internalCount = links.filter(l => l.type === 'internal' && !l.isAnchor).length
    const externalCount = links.filter(l => l.type === 'external').length
    const totalCount = links.length
    const isCompliant = internalCount >= minInternalLinks && externalCount >= minExternalLinks

    const stats = {
      internal: internalCount,
      external: externalCount,
      total: totalCount,
      compliant: isCompliant,
      links
    }

    setLinkStats(stats)
    onComplianceChange?.(isCompliant, stats)
  }, [content, minInternalLinks, minExternalLinks, onComplianceChange])

  const recommendation = useMemo(() => {
    const parts = []
    if (linkStats.internal < minInternalLinks) {
      parts.push(`${minInternalLinks - linkStats.internal} more internal link${minInternalLinks - linkStats.internal !== 1 ? 's' : ''}`)
    }
    if (linkStats.external < minExternalLinks) {
      parts.push(`${minExternalLinks - linkStats.external} more external link${minExternalLinks - linkStats.external !== 1 ? 's' : ''}`)
    }
    return parts.length > 0 ? `Add ${parts.join(' and ')} for optimal SEO.` : null
  }, [linkStats, minInternalLinks, minExternalLinks])

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Link Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Internal Links */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Internal Links</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={linkStats.internal >= minInternalLinks
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }
            >
              {linkStats.internal}/{minInternalLinks}
            </Badge>
            {linkStats.internal >= minInternalLinks ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {/* External Links */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">External Citations</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={linkStats.external >= minExternalLinks
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }
            >
              {linkStats.external}/{minExternalLinks}
            </Badge>
            {linkStats.external >= minExternalLinks ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {/* Total Links Summary */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-600">Total Links Found</span>
          <Badge variant="secondary" className="text-xs">
            {linkStats.total}
          </Badge>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Recommendation:</strong> {recommendation}
            </p>
          </div>
        )}

        {/* Compliance Status */}
        {linkStats.compliant && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-800 font-medium">
                Link requirements met!
              </p>
            </div>
          </div>
        )}

        {/* Show Link Details */}
        {linkStats.links.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Link Details ({linkStats.total})
            </Button>

            {showDetails && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {linkStats.links.map((link, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      link.type === 'internal'
                        ? 'bg-blue-50 border border-blue-100'
                        : 'bg-purple-50 border border-purple-100'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {link.type === 'internal' ? (
                        <Home className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ExternalLink className="w-3 h-3 text-purple-600" />
                      )}
                      <span className="font-medium truncate">{link.text}</span>
                    </div>
                    <p className="text-gray-500 truncate text-[10px]">{link.url}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
