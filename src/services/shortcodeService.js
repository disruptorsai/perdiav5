/**
 * Shortcode Service for GetEducated
 * Handles monetization shortcode generation, validation, and placement
 *
 * Shortcode formats:
 * - [ge_monetization category_id="X" concentration_id="Y" level="Z"] - Legacy format
 * - [degree_table category="X" concentration="Y" level="Z" max="5" sponsored_first="true"] - Block table
 * - [degree_offer program_id="X" school_id="Y" highlight="true"] - Single program highlight
 * - [ge_internal_link url="/path"]text[/ge_internal_link] - Internal link
 * - [ge_external_cited url="https://..."]text[/ge_external_cited] - External citation
 */

import { supabase } from './supabaseClient'

/**
 * Shortcode type constants
 */
export const SHORTCODE_TYPES = {
  MONETIZATION: 'monetization',      // Legacy ge_monetization
  DEGREE_TABLE: 'degree_table',      // Block table shortcode
  DEGREE_OFFER: 'degree_offer',      // Single program highlight
  INTERNAL_LINK: 'internal_link',    // Internal link shortcode
  EXTERNAL_CITED: 'external_cited',  // External citation shortcode
}

/**
 * Allowlist of valid shortcode tags
 * These are the ONLY shortcodes that should appear in content
 * Add any WordPress-native shortcodes here if Tony confirms they're allowed
 */
export const ALLOWED_SHORTCODE_TAGS = [
  // GetEducated custom shortcodes
  'ge_monetization',
  'degree_table',
  'degree_offer',
  'ge_internal_link',
  'ge_external_cited',
  // WordPress native shortcodes (uncomment if Tony confirms these are OK)
  // 'caption',
  // 'gallery',
  // 'audio',
  // 'video',
  // 'playlist',
  // 'embed',
]

/**
 * Generate a monetization shortcode from parameters (legacy format)
 * @param {Object} params - Shortcode parameters
 * @returns {string} The formatted shortcode
 */
export function generateShortcode(params) {
  const { categoryId, concentrationId, levelCode } = params

  if (!categoryId || !concentrationId) {
    throw new Error('categoryId and concentrationId are required')
  }

  let shortcode = `[ge_monetization category_id="${categoryId}" concentration_id="${concentrationId}"`

  if (levelCode) {
    shortcode += ` level="${levelCode}"`
  }

  shortcode += ']'

  return shortcode
}

/**
 * Generate a degree_table shortcode (block table format from spec)
 * @param {Object} params - Shortcode parameters
 * @returns {string} The formatted shortcode
 */
export function generateDegreeTableShortcode(params) {
  const {
    categoryId,
    concentrationId,
    levelCode,
    maxPrograms = 5,
    sponsoredFirst = true,
  } = params

  if (!categoryId || !concentrationId) {
    throw new Error('categoryId and concentrationId are required')
  }

  let shortcode = `[degree_table category="${categoryId}" concentration="${concentrationId}"`

  if (levelCode) {
    shortcode += ` level="${levelCode}"`
  }

  shortcode += ` max="${maxPrograms}"`
  shortcode += ` sponsored_first="${sponsoredFirst}"`
  shortcode += ']'

  return shortcode
}

/**
 * Generate a degree_offer shortcode (single program highlight)
 * @param {Object} params - Shortcode parameters
 * @returns {string} The formatted shortcode
 */
export function generateDegreeOfferShortcode(params) {
  const { programId, schoolId, highlight = true } = params

  if (!programId) {
    throw new Error('programId is required')
  }

  let shortcode = `[degree_offer program_id="${programId}"`

  if (schoolId) {
    shortcode += ` school_id="${schoolId}"`
  }

  shortcode += ` highlight="${highlight}"`
  shortcode += ']'

  return shortcode
}

/**
 * Parse a shortcode string into its parameters
 * @param {string} shortcode - The shortcode string
 * @returns {Object} Parsed parameters
 */
export function parseShortcode(shortcode) {
  const result = {
    type: null,
    categoryId: null,
    concentrationId: null,
    levelCode: null,
    isValid: false,
  }

  if (!shortcode || typeof shortcode !== 'string') {
    return result
  }

  // Match ge_monetization shortcode (legacy)
  const monetizationMatch = shortcode.match(
    /\[ge_monetization\s+category_id="(\d+)"\s+concentration_id="(\d+)"(?:\s+level="(\d+)")?\]/i
  )

  if (monetizationMatch) {
    result.type = SHORTCODE_TYPES.MONETIZATION
    result.categoryId = parseInt(monetizationMatch[1], 10)
    result.concentrationId = parseInt(monetizationMatch[2], 10)
    result.levelCode = monetizationMatch[3] ? parseInt(monetizationMatch[3], 10) : null
    result.isValid = true
    return result
  }

  // Match degree_table shortcode (new format from spec)
  const degreeTableMatch = shortcode.match(
    /\[degree_table\s+category="(\d+)"\s+concentration="(\d+)"(?:\s+level="(\d+)")?(?:\s+max="(\d+)")?(?:\s+sponsored_first="(true|false)")?\]/i
  )

  if (degreeTableMatch) {
    result.type = SHORTCODE_TYPES.DEGREE_TABLE
    result.categoryId = parseInt(degreeTableMatch[1], 10)
    result.concentrationId = parseInt(degreeTableMatch[2], 10)
    result.levelCode = degreeTableMatch[3] ? parseInt(degreeTableMatch[3], 10) : null
    result.maxPrograms = degreeTableMatch[4] ? parseInt(degreeTableMatch[4], 10) : 5
    result.sponsoredFirst = degreeTableMatch[5] !== 'false'
    result.isValid = true
    return result
  }

  // Match degree_offer shortcode (single program highlight)
  const degreeOfferMatch = shortcode.match(
    /\[degree_offer\s+program_id="([^"]+)"(?:\s+school_id="([^"]+)")?(?:\s+highlight="(true|false)")?\]/i
  )

  if (degreeOfferMatch) {
    result.type = SHORTCODE_TYPES.DEGREE_OFFER
    result.programId = degreeOfferMatch[1]
    result.schoolId = degreeOfferMatch[2] || null
    result.highlight = degreeOfferMatch[3] !== 'false'
    result.isValid = true
    return result
  }

  // Match ge_internal_link shortcode
  const internalLinkMatch = shortcode.match(
    /\[ge_internal_link\s+url="([^"]+)"\]([^[]*)\[\/ge_internal_link\]/i
  )

  if (internalLinkMatch) {
    result.type = SHORTCODE_TYPES.INTERNAL_LINK
    result.url = internalLinkMatch[1]
    result.anchorText = internalLinkMatch[2]
    result.isValid = true
    return result
  }

  // Match ge_external_cited shortcode
  const externalLinkMatch = shortcode.match(
    /\[ge_external_cited\s+url="([^"]+)"\]([^[]*)\[\/ge_external_cited\]/i
  )

  if (externalLinkMatch) {
    result.type = SHORTCODE_TYPES.EXTERNAL_CITED
    result.url = externalLinkMatch[1]
    result.anchorText = externalLinkMatch[2]
    result.isValid = true
    return result
  }

  return result
}

/**
 * Extract all shortcodes from content
 * @param {string} content - HTML content
 * @returns {Array} Array of shortcode objects
 */
export function extractShortcodes(content) {
  if (!content) return []

  const shortcodes = []
  let match

  // Find all ge_monetization shortcodes (legacy)
  const monetizationRegex = /\[ge_monetization[^\]]+\]/gi
  while ((match = monetizationRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  // Find all degree_table shortcodes (new format)
  const degreeTableRegex = /\[degree_table[^\]]+\]/gi
  while ((match = degreeTableRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  // Find all degree_offer shortcodes (single program highlight)
  const degreeOfferRegex = /\[degree_offer[^\]]+\]/gi
  while ((match = degreeOfferRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  // Find all ge_internal_link shortcodes
  const internalRegex = /\[ge_internal_link[^\]]+\][^[]*\[\/ge_internal_link\]/gi
  while ((match = internalRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  // Find all ge_external_cited shortcodes
  const externalRegex = /\[ge_external_cited[^\]]+\][^[]*\[\/ge_external_cited\]/gi
  while ((match = externalRegex.exec(content)) !== null) {
    const parsed = parseShortcode(match[0])
    if (parsed.isValid) {
      shortcodes.push({
        ...parsed,
        raw: match[0],
        position: match.index,
      })
    }
  }

  return shortcodes
}

/**
 * Validate shortcode parameters against database
 * @param {Object} params - Shortcode parameters
 * @returns {Object} Validation result
 */
export async function validateShortcodeParams(params) {
  const { categoryId, concentrationId, levelCode } = params
  const result = {
    isValid: true,
    errors: [],
    category: null,
    level: null,
  }

  // Validate category and concentration exist
  const { data: category, error: categoryError } = await supabase
    .from('monetization_categories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('concentration_id', concentrationId)
    .single()

  if (categoryError || !category) {
    result.isValid = false
    result.errors.push(`Invalid category_id (${categoryId}) or concentration_id (${concentrationId})`)
  } else {
    result.category = category
  }

  // Validate level code if provided
  if (levelCode) {
    const { data: level, error: levelError } = await supabase
      .from('monetization_levels')
      .select('*')
      .eq('level_code', levelCode)
      .single()

    if (levelError || !level) {
      result.isValid = false
      result.errors.push(`Invalid level code: ${levelCode}`)
    } else {
      result.level = level
    }
  }

  return result
}

/**
 * Match an article topic to the best monetization category
 * @param {string} topic - Article topic/title
 * @param {string} degreeLevel - Degree level (optional)
 * @returns {Object} Best matching category and shortcode
 */
export async function matchTopicToMonetization(topic, degreeLevel = null) {
  if (!topic) {
    return { matched: false, error: 'No topic provided' }
  }

  const topicLower = topic.toLowerCase()

  // Fetch all categories
  const { data: categories, error } = await supabase
    .from('monetization_categories')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return { matched: false, error: error.message }
  }

  // Score each category based on keyword matching
  const scoredCategories = categories.map(cat => {
    let score = 0
    const categoryLower = cat.category.toLowerCase()
    const concentrationLower = cat.concentration.toLowerCase()

    // Exact concentration match (highest priority)
    if (topicLower.includes(concentrationLower)) {
      score += 100
    }

    // Category match
    if (topicLower.includes(categoryLower)) {
      score += 50
    }

    // Word-level matching
    const categoryWords = categoryLower.split(/\s+/)
    const concentrationWords = concentrationLower.split(/\s+/)
    const topicWords = topicLower.split(/\s+/)

    for (const word of categoryWords) {
      if (word.length > 3 && topicWords.includes(word)) {
        score += 10
      }
    }

    for (const word of concentrationWords) {
      if (word.length > 3 && topicWords.includes(word)) {
        score += 20
      }
    }

    return { ...cat, score }
  })

  // Sort by score and get best match
  scoredCategories.sort((a, b) => b.score - a.score)
  const bestMatch = scoredCategories[0]

  if (!bestMatch || bestMatch.score === 0) {
    return { matched: false, error: 'No matching category found' }
  }

  // Get level code if degree level provided
  let levelCode = null
  if (degreeLevel) {
    const { data: level } = await supabase
      .from('monetization_levels')
      .select('level_code')
      .ilike('level_name', `%${degreeLevel}%`)
      .single()

    if (level) {
      levelCode = level.level_code
    }
  }

  // Generate the shortcode
  const shortcode = generateShortcode({
    categoryId: bestMatch.category_id,
    concentrationId: bestMatch.concentration_id,
    levelCode,
  })

  return {
    matched: true,
    category: bestMatch,
    levelCode,
    shortcode,
    confidence: bestMatch.score > 50 ? 'high' : bestMatch.score > 20 ? 'medium' : 'low',
  }
}

/**
 * Insert a shortcode into content at specified position
 * @param {string} content - HTML content
 * @param {string} shortcode - Shortcode to insert
 * @param {string} position - Position: 'after_intro', 'mid_content', 'pre_conclusion'
 * @returns {string} Modified content
 */
export function insertShortcodeInContent(content, shortcode, position = 'after_intro') {
  if (!content || !shortcode) return content

  // Wrap shortcode in paragraph for proper display
  const wrappedShortcode = `\n<p class="monetization-block">${shortcode}</p>\n`

  switch (position) {
    case 'after_intro': {
      // Insert after first </p> or </h2>
      const firstParagraphEnd = content.indexOf('</p>')
      if (firstParagraphEnd !== -1) {
        return content.slice(0, firstParagraphEnd + 4) + wrappedShortcode + content.slice(firstParagraphEnd + 4)
      }
      // Fallback: insert at beginning
      return wrappedShortcode + content
    }

    case 'mid_content': {
      // Find middle H2 and insert after it
      const h2Matches = [...content.matchAll(/<h2[^>]*>.*?<\/h2>/gi)]
      if (h2Matches.length >= 2) {
        const midIndex = Math.floor(h2Matches.length / 2)
        const midH2 = h2Matches[midIndex]
        const insertPos = midH2.index + midH2[0].length
        return content.slice(0, insertPos) + wrappedShortcode + content.slice(insertPos)
      }
      // Fallback: insert in middle of content
      const midPoint = Math.floor(content.length / 2)
      const nextParagraph = content.indexOf('</p>', midPoint)
      if (nextParagraph !== -1) {
        return content.slice(0, nextParagraph + 4) + wrappedShortcode + content.slice(nextParagraph + 4)
      }
      return content + wrappedShortcode
    }

    case 'pre_conclusion': {
      // Insert before last H2 or before FAQ section
      const faqStart = content.indexOf('<h2')
      const lastH2Index = content.lastIndexOf('<h2')
      if (lastH2Index > 0 && lastH2Index !== faqStart) {
        return content.slice(0, lastH2Index) + wrappedShortcode + content.slice(lastH2Index)
      }
      // Fallback: insert near end
      const lastParagraph = content.lastIndexOf('</p>')
      if (lastParagraph !== -1) {
        return content.slice(0, lastParagraph + 4) + wrappedShortcode + content.slice(lastParagraph + 4)
      }
      return content + wrappedShortcode
    }

    default:
      return content + wrappedShortcode
  }
}

/**
 * Create an internal link shortcode
 * @param {string} url - GetEducated URL path
 * @param {string} anchorText - Link text
 * @returns {string} Internal link shortcode
 */
export function createInternalLinkShortcode(url, anchorText) {
  // Ensure URL is relative and on GetEducated
  let cleanUrl = url
  if (url.includes('geteducated.com')) {
    cleanUrl = url.replace(/https?:\/\/(www\.)?geteducated\.com/, '')
  }

  return `[ge_internal_link url="${cleanUrl}"]${anchorText}[/ge_internal_link]`
}

/**
 * Create an external citation shortcode
 * @param {string} url - External URL (must be on approved list)
 * @param {string} anchorText - Link text
 * @returns {string} External citation shortcode
 */
export function createExternalCitationShortcode(url, anchorText) {
  return `[ge_external_cited url="${url}"]${anchorText}[/ge_external_cited]`
}

/**
 * Check if content has required monetization shortcodes
 * @param {string} content - HTML content
 * @returns {Object} Check result
 */
export function checkMonetizationCompliance(content) {
  const shortcodes = extractShortcodes(content)

  // All monetization-related shortcode types
  const monetizationTypes = [
    SHORTCODE_TYPES.MONETIZATION,
    SHORTCODE_TYPES.DEGREE_TABLE,
    SHORTCODE_TYPES.DEGREE_OFFER,
  ]

  const monetizationShortcodes = shortcodes.filter(s => monetizationTypes.includes(s.type))
  const degreeTableCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.DEGREE_TABLE).length
  const degreeOfferCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.DEGREE_OFFER).length
  const legacyCount = shortcodes.filter(s => s.type === SHORTCODE_TYPES.MONETIZATION).length

  return {
    hasMonetization: monetizationShortcodes.length > 0,
    monetizationCount: monetizationShortcodes.length,
    shortcodes: monetizationShortcodes,
    isCompliant: monetizationShortcodes.length >= 1,
    breakdown: {
      degreeTable: degreeTableCount,
      degreeOffer: degreeOfferCount,
      legacy: legacyCount,
    },
    recommendation: monetizationShortcodes.length === 0
      ? 'Add at least one monetization shortcode (degree_table or degree_offer recommended)'
      : legacyCount > 0 && degreeTableCount === 0 && degreeOfferCount === 0
        ? 'Consider upgrading legacy ge_monetization shortcodes to degree_table or degree_offer format'
        : null,
  }
}

/**
 * Get all monetization shortcode types (for filtering)
 */
export function getMonetizationTypes() {
  return [
    SHORTCODE_TYPES.MONETIZATION,
    SHORTCODE_TYPES.DEGREE_TABLE,
    SHORTCODE_TYPES.DEGREE_OFFER,
  ]
}

/**
 * Check if a shortcode type is a monetization type
 */
export function isMonetizationType(type) {
  return getMonetizationTypes().includes(type)
}

/**
 * Extract ALL shortcode-like tokens from content
 * This catches any pattern that looks like a shortcode: [tag ...] or [/tag]
 * Used to detect unknown/hallucinated shortcodes that aren't in our allowlist
 * @param {string} content - HTML content
 * @returns {Array} Array of token objects with tag, raw, isClosing, position
 */
export function extractAllShortcodeLikeTokens(content) {
  if (!content) return []

  const tokens = []
  // Match patterns like [tag], [tag attr="val"], [/tag]
  // This regex captures: opening/closing slash, tag name, and attributes
  const shortcodeRegex = /\[(\/?)([\w-]+)([^\]]*)\]/gi
  let match

  while ((match = shortcodeRegex.exec(content)) !== null) {
    tokens.push({
      raw: match[0],
      tag: match[2].toLowerCase(),
      isClosing: match[1] === '/',
      attributes: match[3].trim(),
      position: match.index,
    })
  }

  return tokens
}

/**
 * Find unknown/invalid shortcodes in content
 * These are shortcode-like patterns that are NOT in our allowlist
 * @param {string} content - HTML content
 * @param {Array} customAllowlist - Optional additional allowed tags
 * @returns {Array} Array of unknown shortcode tokens
 */
export function findUnknownShortcodes(content, customAllowlist = []) {
  const allTokens = extractAllShortcodeLikeTokens(content)
  const allowedTags = [...ALLOWED_SHORTCODE_TAGS, ...customAllowlist].map(t => t.toLowerCase())

  return allTokens.filter(token => !allowedTags.includes(token.tag))
}

/**
 * Validate that content contains no unknown shortcodes
 * Returns a structured validation result for use in pre-publish checks
 * @param {string} content - HTML content
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid, unknownShortcodes, message
 */
export function validateNoUnknownShortcodes(content, options = {}) {
  const { customAllowlist = [], blockOnUnknown = true } = options

  const unknownShortcodes = findUnknownShortcodes(content, customAllowlist)

  if (unknownShortcodes.length === 0) {
    return {
      isValid: true,
      unknownShortcodes: [],
      message: 'All shortcodes are valid',
    }
  }

  // Get unique unknown tags for the message
  const uniqueTags = [...new Set(unknownShortcodes.map(s => s.tag))]

  return {
    isValid: !blockOnUnknown,
    unknownShortcodes,
    uniqueTags,
    message: `Found ${unknownShortcodes.length} unknown shortcode(s): ${uniqueTags.join(', ')}`,
    details: unknownShortcodes.map(s => ({
      tag: s.tag,
      raw: s.raw.substring(0, 100) + (s.raw.length > 100 ? '...' : ''),
      position: s.position,
    })),
  }
}

export default {
  SHORTCODE_TYPES,
  ALLOWED_SHORTCODE_TAGS,
  generateShortcode,
  generateDegreeTableShortcode,
  generateDegreeOfferShortcode,
  parseShortcode,
  extractShortcodes,
  validateShortcodeParams,
  matchTopicToMonetization,
  insertShortcodeInContent,
  createInternalLinkShortcode,
  createExternalCitationShortcode,
  checkMonetizationCompliance,
  getMonetizationTypes,
  isMonetizationType,
  extractAllShortcodeLikeTokens,
  findUnknownShortcodes,
  validateNoUnknownShortcodes,
}
