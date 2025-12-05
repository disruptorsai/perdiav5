/**
 * Link Validation Service for GetEducated
 * Enforces strict linking rules:
 * - No .edu links (use GetEducated school pages instead)
 * - No competitor links (onlineu.com, usnews.com, etc.)
 * - All school links must go to GetEducated pages
 * - External links only to BLS, government, nonprofit sites
 */

// Competitor domains to block
export const BLOCKED_COMPETITORS = [
  'onlineu.com',
  'usnews.com',
  'affordablecollegesonline.com',
  'toponlinecollegesusa.com',
  'bestcolleges.com',
  'niche.com',
  'collegeconfidential.com',
  'cappex.com',
  'collegeraptor.com',
  'collegesimply.com',
  'graduateguide.com',
  'gradschools.com',
  'petersons.com',
  'princetonreview.com',
  'collegexpress.com',
]

// Allowed external domains (whitelist approach for external links)
export const ALLOWED_EXTERNAL_DOMAINS = [
  // Bureau of Labor Statistics
  'bls.gov',
  'stats.bls.gov',
  // Government education sites
  'ed.gov',
  'nces.ed.gov',
  'studentaid.gov',
  'fafsa.gov',
  'collegescorecard.ed.gov',
  // Accreditation bodies
  'chea.org',
  'aacsb.edu',
  'abet.org',
  'cacrep.org',
  'ccne-accreditation.org',
  'cswe.org',
  'ncate.org',
  'teac.org',
  // Nonprofit education organizations
  'collegeboard.org',
  'acenet.edu',
  'aacn.nche.edu',
  'naspa.org',
  // Professional associations
  'apa.org',
  'nasw.org',
  'nursingworld.org',
]

// Internal GetEducated domains
const GETEDUCATED_DOMAINS = [
  'geteducated.com',
  'www.geteducated.com',
]

/**
 * Validate a single URL against GetEducated linking rules
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result with isValid, type, and issues
 */
export function validateLink(url) {
  const result = {
    url,
    isValid: true,
    type: 'unknown', // internal, external, anchor, invalid
    issues: [],
    severity: 'none', // none, warning, error, blocking
  }

  // Handle empty or invalid URLs
  if (!url || typeof url !== 'string') {
    result.isValid = false
    result.type = 'invalid'
    result.issues.push('Empty or invalid URL')
    result.severity = 'error'
    return result
  }

  // Handle anchor links (always valid)
  if (url.startsWith('#')) {
    result.type = 'anchor'
    return result
  }

  // Handle relative URLs (internal)
  if (url.startsWith('/')) {
    result.type = 'internal'
    return result
  }

  // Parse URL to extract domain
  let domain = ''
  try {
    const urlObj = new URL(url)
    domain = urlObj.hostname.toLowerCase()
  } catch (e) {
    // Not a valid URL format
    result.isValid = false
    result.type = 'invalid'
    result.issues.push('Invalid URL format')
    result.severity = 'error'
    return result
  }

  // Check if it's a GetEducated internal link
  if (GETEDUCATED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
    result.type = 'internal'
    return result
  }

  // Mark as external
  result.type = 'external'

  // CRITICAL: Block .edu links
  if (domain.endsWith('.edu')) {
    result.isValid = false
    result.issues.push('Direct .edu links are not allowed. Use GetEducated school pages instead.')
    result.severity = 'blocking'
    return result
  }

  // CRITICAL: Block competitor links
  for (const competitor of BLOCKED_COMPETITORS) {
    if (domain === competitor || domain.endsWith('.' + competitor)) {
      result.isValid = false
      result.issues.push(`Competitor link detected: ${competitor}. This link is not allowed.`)
      result.severity = 'blocking'
      return result
    }
  }

  // Check if external link is on the allowed whitelist
  const isAllowed = ALLOWED_EXTERNAL_DOMAINS.some(allowed =>
    domain === allowed || domain.endsWith('.' + allowed)
  )

  if (!isAllowed) {
    // Not on whitelist - warning but not blocking
    result.issues.push(`External link to ${domain} is not on the approved list. Consider using BLS, government, or nonprofit sources.`)
    result.severity = 'warning'
  }

  return result
}

/**
 * Extract all links from HTML content
 * @param {string} content - HTML content
 * @returns {Array} Array of link objects with url and anchorText
 */
export function extractLinks(content) {
  if (!content) return []

  const links = []
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      url: match[1],
      anchorText: match[2] || '',
      fullMatch: match[0],
    })
  }

  return links
}

/**
 * Validate all links in HTML content
 * @param {string} content - HTML content to validate
 * @returns {Object} Comprehensive validation result
 */
export function validateContent(content) {
  const links = extractLinks(content)
  const results = {
    isCompliant: true,
    totalLinks: links.length,
    internalLinks: 0,
    externalLinks: 0,
    anchorLinks: 0,
    invalidLinks: 0,
    blockingIssues: [],
    warnings: [],
    errors: [],
    links: [],
  }

  for (const link of links) {
    const validation = validateLink(link.url)
    validation.anchorText = link.anchorText

    results.links.push(validation)

    // Count by type
    switch (validation.type) {
      case 'internal':
        results.internalLinks++
        break
      case 'external':
        results.externalLinks++
        break
      case 'anchor':
        results.anchorLinks++
        break
      case 'invalid':
        results.invalidLinks++
        break
    }

    // Collect issues by severity
    if (validation.severity === 'blocking') {
      results.isCompliant = false
      results.blockingIssues.push({
        url: link.url,
        anchorText: link.anchorText,
        issues: validation.issues,
      })
    } else if (validation.severity === 'error') {
      results.errors.push({
        url: link.url,
        anchorText: link.anchorText,
        issues: validation.issues,
      })
    } else if (validation.severity === 'warning') {
      results.warnings.push({
        url: link.url,
        anchorText: link.anchorText,
        issues: validation.issues,
      })
    }
  }

  return results
}

/**
 * Check if a URL is a GetEducated school page
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGetEducatedSchoolPage(url) {
  if (!url) return false
  return url.includes('geteducated.com/online-schools/')
}

/**
 * Check if a URL is a GetEducated degree page
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGetEducatedDegreePage(url) {
  if (!url) return false
  return url.includes('geteducated.com/online-degrees/')
}

/**
 * Check if a URL is a GetEducated ranking report
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGetEducatedRankingReport(url) {
  if (!url) return false
  return url.includes('geteducated.com/online-college-ratings-and-rankings/')
}

/**
 * Get the appropriate GetEducated school page URL for a school name
 * @param {string} schoolName - Name of the school
 * @returns {string} GetEducated school page URL
 */
export function getSchoolPageUrl(schoolName) {
  if (!schoolName) return ''
  const slug = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return `https://www.geteducated.com/online-schools/${slug}/`
}

/**
 * Check if link compliance allows publishing
 * @param {Object} validationResult - Result from validateContent
 * @returns {Object} Publish status with reason
 */
export function canPublish(validationResult) {
  if (!validationResult.isCompliant) {
    return {
      canPublish: false,
      reason: 'Content contains blocked links that must be removed before publishing.',
      blockingIssues: validationResult.blockingIssues,
    }
  }

  return {
    canPublish: true,
    reason: null,
    warnings: validationResult.warnings,
  }
}

export default {
  validateLink,
  validateContent,
  extractLinks,
  isGetEducatedSchoolPage,
  isGetEducatedDegreePage,
  isGetEducatedRankingReport,
  getSchoolPageUrl,
  canPublish,
  BLOCKED_COMPETITORS,
  ALLOWED_EXTERNAL_DOMAINS,
}
