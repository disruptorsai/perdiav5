/**
 * Content Rules Engine
 *
 * Manages and applies content rules for domain validation,
 * source whitelisting, author mapping, and shortcode insertion.
 */

import { supabase } from './supabaseClient'

class RulesEngine {
  constructor() {
    this.rules = null
    this.rulesLoaded = false
  }

  /**
   * Load all rules from database
   */
  async loadRules(userId) {
    const { data, error } = await supabase
      .from('content_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) throw error

    // Organize rules by type
    this.rules = {
      domainWhitelist: data.filter(r => r.rule_type === 'domain_whitelist').map(r => r.rule_key),
      domainBlacklist: data.filter(r => r.rule_type === 'domain_blacklist').map(r => r.rule_key),
      sourceWhitelist: data.filter(r => r.rule_type === 'source_whitelist').map(r => r.rule_key),
      authorMapping: data.filter(r => r.rule_type === 'author_mapping').reduce((acc, r) => {
        acc[r.rule_key] = r.rule_value
        return acc
      }, {}),
      blockedPatterns: data.filter(r => r.rule_type === 'blocked_pattern').map(r => r.rule_key),
      shortcodeRules: data.filter(r => r.rule_type === 'shortcode_rule').reduce((acc, r) => {
        acc[r.rule_key] = r.rule_value
        return acc
      }, {}),
    }

    this.rulesLoaded = true
    return this.rules
  }

  /**
   * Validate if a domain is allowed
   */
  validateDomain(url) {
    if (!this.rulesLoaded) {
      console.warn('Rules not loaded, allowing by default')
      return { valid: true, reason: 'rules_not_loaded' }
    }

    try {
      const domain = new URL(url).hostname.toLowerCase()

      // Check blacklist first
      if (this.rules.domainBlacklist.some(blocked => domain.includes(blocked.toLowerCase()))) {
        return { valid: false, reason: 'domain_blacklisted', domain }
      }

      // If whitelist is empty, allow all non-blacklisted domains
      if (this.rules.domainWhitelist.length === 0) {
        return { valid: true, reason: 'no_whitelist' }
      }

      // Check whitelist
      if (this.rules.domainWhitelist.some(allowed => domain.includes(allowed.toLowerCase()))) {
        return { valid: true, reason: 'domain_whitelisted', domain }
      }

      return { valid: false, reason: 'domain_not_whitelisted', domain }
    } catch (e) {
      return { valid: false, reason: 'invalid_url', error: e.message }
    }
  }

  /**
   * Validate if an external source is allowed
   */
  validateExternalSource(source) {
    if (!this.rulesLoaded) {
      return { valid: true, reason: 'rules_not_loaded' }
    }

    // If whitelist is empty, allow all sources
    if (this.rules.sourceWhitelist.length === 0) {
      return { valid: true, reason: 'no_whitelist' }
    }

    const normalizedSource = source.toLowerCase()
    if (this.rules.sourceWhitelist.some(allowed => normalizedSource.includes(allowed.toLowerCase()))) {
      return { valid: true, reason: 'source_whitelisted', source }
    }

    return { valid: false, reason: 'source_not_whitelisted', source }
  }

  /**
   * Get the correct author for a content type
   */
  getAuthorForContentType(contentType, topics = []) {
    if (!this.rulesLoaded) {
      return null
    }

    // Check for direct content type mapping
    if (this.rules.authorMapping[contentType]) {
      return this.rules.authorMapping[contentType]
    }

    // Check for topic-based mapping
    for (const topic of topics) {
      if (this.rules.authorMapping[topic]) {
        return this.rules.authorMapping[topic]
      }
    }

    // Check for default mapping
    if (this.rules.authorMapping['default']) {
      return this.rules.authorMapping['default']
    }

    return null
  }

  /**
   * Get applicable shortcodes for content type
   */
  getShortcodesForType(contentType, context = {}) {
    if (!this.rulesLoaded) {
      return []
    }

    const applicableShortcodes = []

    // Check each shortcode rule
    for (const [shortcodeType, rule] of Object.entries(this.rules.shortcodeRules)) {
      if (rule.contentTypes && rule.contentTypes.includes(contentType)) {
        applicableShortcodes.push({
          type: shortcodeType,
          code: rule.code,
          position: rule.position || 'end',
          context: { ...context, ...rule.defaultContext },
        })
      }
    }

    return applicableShortcodes
  }

  /**
   * Check if content contains blocked patterns
   */
  checkBlockedPatterns(content) {
    if (!this.rulesLoaded || this.rules.blockedPatterns.length === 0) {
      return { hasBlocked: false, patterns: [] }
    }

    const foundPatterns = []
    const lowerContent = content.toLowerCase()

    for (const pattern of this.rules.blockedPatterns) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        foundPatterns.push(pattern)
      }
    }

    return {
      hasBlocked: foundPatterns.length > 0,
      patterns: foundPatterns,
    }
  }

  /**
   * Apply all rules to an article
   */
  async applyRules(article, userId) {
    if (!this.rulesLoaded) {
      await this.loadRules(userId)
    }

    const results = {
      linksValidated: [],
      linksRemoved: [],
      authorAssigned: null,
      shortcodesAdded: [],
      blockedPatternsFound: [],
      contentModified: false,
    }

    let modifiedContent = article.content

    // 1. Validate and filter external links
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
    let match
    while ((match = linkRegex.exec(article.content)) !== null) {
      const url = match[1]
      if (url.startsWith('http')) {
        const validation = this.validateDomain(url)
        if (validation.valid) {
          results.linksValidated.push({ url, status: 'valid' })
        } else {
          results.linksRemoved.push({ url, reason: validation.reason })
          // Remove invalid links but keep the anchor text
          modifiedContent = modifiedContent.replace(match[0], match[0].replace(/<a[^>]+>([^<]*)<\/a>/i, '$1'))
          results.contentModified = true
        }
      }
    }

    // 2. Check for blocked patterns
    const patternCheck = this.checkBlockedPatterns(modifiedContent)
    results.blockedPatternsFound = patternCheck.patterns

    // 3. Assign author based on content type
    const authorMapping = this.getAuthorForContentType(
      article.content_type,
      article.topics || []
    )
    if (authorMapping) {
      results.authorAssigned = authorMapping
    }

    // 4. Get applicable shortcodes
    const shortcodes = this.getShortcodesForType(article.content_type, {
      title: article.title,
      topics: article.topics,
    })
    results.shortcodesAdded = shortcodes

    return {
      ...results,
      modifiedContent: results.contentModified ? modifiedContent : article.content,
    }
  }

  /**
   * Insert shortcodes into content
   */
  insertShortcodes(content, shortcodes) {
    if (!shortcodes || shortcodes.length === 0) {
      return content
    }

    let modifiedContent = content

    for (const shortcode of shortcodes) {
      const codeToInsert = this.formatShortcode(shortcode)

      switch (shortcode.position) {
        case 'start':
          modifiedContent = codeToInsert + '\n\n' + modifiedContent
          break
        case 'after_intro':
          // Insert after first paragraph
          const firstPEnd = modifiedContent.indexOf('</p>')
          if (firstPEnd !== -1) {
            modifiedContent = modifiedContent.slice(0, firstPEnd + 4) + '\n\n' + codeToInsert + modifiedContent.slice(firstPEnd + 4)
          }
          break
        case 'before_conclusion':
          // Insert before last H2
          const lastH2 = modifiedContent.lastIndexOf('<h2')
          if (lastH2 !== -1) {
            modifiedContent = modifiedContent.slice(0, lastH2) + codeToInsert + '\n\n' + modifiedContent.slice(lastH2)
          }
          break
        case 'end':
        default:
          modifiedContent = modifiedContent + '\n\n' + codeToInsert
          break
      }
    }

    return modifiedContent
  }

  /**
   * Format a shortcode with context values
   */
  formatShortcode(shortcode) {
    let code = shortcode.code
    const context = shortcode.context || {}

    // Replace template variables
    for (const [key, value] of Object.entries(context)) {
      code = code.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
    }

    return code
  }
}

export default RulesEngine
