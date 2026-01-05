/**
 * Sitemap Crawler Service
 *
 * Fetches and parses sitemaps to populate site_articles,
 * with special handling for online-degrees and sponsored schools.
 */

import { supabase } from './supabaseClient'

class SitemapCrawler {
  constructor() {
    this.defaultSitemapUrl = 'https://www.geteducated.com/sitemap.xml'
    this.prioritySections = ['online-degrees', 'best-accredited', 'rankings']
  }

  /**
   * Parse XML sitemap into URL list
   */
  async parseSitemap(sitemapUrl) {
    try {
      const response = await fetch(sitemapUrl)
      const text = await response.text()

      // Parse XML using DOMParser
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')

      // Check for sitemap index (contains other sitemaps)
      const sitemapElements = xmlDoc.getElementsByTagName('sitemap')
      if (sitemapElements.length > 0) {
        // This is a sitemap index, fetch each sub-sitemap
        const subSitemaps = []
        for (const sitemap of sitemapElements) {
          const loc = sitemap.getElementsByTagName('loc')[0]?.textContent
          if (loc) subSitemaps.push(loc)
        }

        // Recursively parse sub-sitemaps
        const allUrls = []
        for (const subUrl of subSitemaps) {
          const subUrls = await this.parseSitemap(subUrl)
          allUrls.push(...subUrls)
        }
        return allUrls
      }

      // Parse regular sitemap URLs
      const urlElements = xmlDoc.getElementsByTagName('url')
      const urls = []

      for (const urlEl of urlElements) {
        const loc = urlEl.getElementsByTagName('loc')[0]?.textContent
        const lastmod = urlEl.getElementsByTagName('lastmod')[0]?.textContent
        const priority = urlEl.getElementsByTagName('priority')[0]?.textContent

        if (loc) {
          urls.push({
            url: loc,
            lastModified: lastmod ? new Date(lastmod) : null,
            sitemapPriority: priority ? parseFloat(priority) : 0.5,
          })
        }
      }

      return urls
    } catch (error) {
      console.error('Error parsing sitemap:', error)
      throw error
    }
  }

  /**
   * Extract section from URL path
   */
  extractSection(url) {
    try {
      const pathname = new URL(url).pathname
      const parts = pathname.split('/').filter(Boolean)
      return parts[0] || 'home'
    } catch {
      return 'unknown'
    }
  }

  /**
   * Determine priority score based on URL characteristics
   */
  calculatePriorityScore(urlData) {
    let score = 0
    const section = this.extractSection(urlData.url)

    // Section-based priority
    if (this.prioritySections.includes(section)) {
      score += 10
    }

    // Sitemap priority boost
    score += Math.floor((urlData.sitemapPriority || 0.5) * 5)

    // Freshness boost (modified in last 30 days)
    if (urlData.lastModified) {
      const daysSinceModified = (Date.now() - new Date(urlData.lastModified).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceModified < 30) score += 3
      else if (daysSinceModified < 90) score += 1
    }

    return score
  }

  /**
   * Extract page metadata (title, description) from URL
   */
  async fetchPageMetadata(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Perdia Content Crawler/1.0' },
      })
      const html = await response.text()

      // Parse HTML for metadata
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      const title = doc.querySelector('title')?.textContent || ''
      const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      const hasLogo = doc.querySelector('.school-logo, .sponsored-logo, img[class*="logo"]') !== null

      // Check for school priority indicator
      const priorityMeta = doc.querySelector('meta[name="school-priority"]')?.getAttribute('content')
      const schoolPriority = priorityMeta ? parseInt(priorityMeta, 10) : 0

      return {
        title: title.trim(),
        description: description.trim(),
        hasLogo,
        schoolPriority,
        isSponsored: hasLogo || schoolPriority >= 5,
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata for ${url}:`, error.message)
      return null
    }
  }

  /**
   * Crawl sitemap and update database
   */
  async crawl(userId, options = {}) {
    const {
      sitemapUrl = this.defaultSitemapUrl,
      fetchMetadata = false,
      maxUrls = 1000,
    } = options

    // Create crawl log entry
    const { data: crawlLog, error: logError } = await supabase
      .from('sitemap_crawl_log')
      .insert({
        user_id: userId,
        sitemap_url: sitemapUrl,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (logError) throw logError

    try {
      // Parse sitemap
      const urls = await this.parseSitemap(sitemapUrl)
      const urlsToProcess = urls.slice(0, maxUrls)

      let urlsAdded = 0
      let urlsUpdated = 0
      let sponsoredFound = 0

      // Process each URL
      for (const urlData of urlsToProcess) {
        const section = this.extractSection(urlData.url)
        const priorityScore = this.calculatePriorityScore(urlData)

        let metadata = null
        if (fetchMetadata) {
          metadata = await this.fetchPageMetadata(urlData.url)
        }

        const articleData = {
          user_id: userId,
          url: urlData.url,
          title: metadata?.title || this.titleFromUrl(urlData.url),
          section,
          school_priority: metadata?.schoolPriority || priorityScore,
          has_logo: metadata?.hasLogo || false,
          is_sponsored: metadata?.isSponsored || priorityScore >= 5,
          last_crawled_at: new Date().toISOString(),
        }

        if (articleData.is_sponsored) sponsoredFound++

        // Upsert into site_articles
        const { data: existingArticle } = await supabase
          .from('site_articles')
          .select('id')
          .eq('url', urlData.url)
          .eq('user_id', userId)
          .single()

        if (existingArticle) {
          await supabase
            .from('site_articles')
            .update(articleData)
            .eq('id', existingArticle.id)
          urlsUpdated++
        } else {
          await supabase
            .from('site_articles')
            .insert(articleData)
          urlsAdded++
        }
      }

      // Update crawl log with results
      await supabase
        .from('sitemap_crawl_log')
        .update({
          status: 'completed',
          urls_found: urls.length,
          urls_added: urlsAdded,
          urls_updated: urlsUpdated,
          sponsored_found: sponsoredFound,
          completed_at: new Date().toISOString(),
        })
        .eq('id', crawlLog.id)

      return {
        success: true,
        crawlId: crawlLog.id,
        urlsFound: urls.length,
        urlsAdded,
        urlsUpdated,
        sponsoredFound,
      }
    } catch (error) {
      // Update crawl log with error
      await supabase
        .from('sitemap_crawl_log')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', crawlLog.id)

      throw error
    }
  }

  /**
   * Generate title from URL path
   */
  titleFromUrl(url) {
    try {
      const pathname = new URL(url).pathname
      const lastPart = pathname.split('/').filter(Boolean).pop() || 'Home'
      return lastPart
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
    } catch {
      return 'Untitled'
    }
  }

  /**
   * Get sponsored schools from database
   */
  async getSponsoredSchools(userId, limit = 50) {
    const { data, error } = await supabase
      .from('site_articles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_sponsored', true)
      .order('school_priority', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  /**
   * Get high-priority articles for internal linking
   */
  async getPriorityArticles(userId, section = null, limit = 100) {
    let query = supabase
      .from('site_articles')
      .select('*')
      .eq('user_id', userId)
      .order('school_priority', { ascending: false })
      .limit(limit)

    if (section) {
      query = query.eq('section', section)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }
}

export default SitemapCrawler
