# Perdia - DataForSEO API Integration Guide

**Version:** 2.0
**API Provider:** DataForSEO
**Date:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [DataForSEO Setup](#dataforseo-setup)
3. [API Endpoints Used](#api-endpoints-used)
4. [Client Implementation](#client-implementation)
5. [Keyword Research Workflow](#keyword-research-workflow)
6. [Integration with Idea Generator](#integration-with-idea-generator)
7. [Cost Optimization](#cost-optimization)
8. [Rate Limiting & Caching](#rate-limiting--caching)
9. [Error Handling](#error-handling)
10. [Testing & Validation](#testing--validation)

---

## Overview

DataForSEO provides comprehensive SEO data including:
- **Keyword research** - Search volume, competition, CPC
- **SERP analysis** - Top ranking pages, domain authority
- **Trending keywords** - Rising search terms
- **Related keywords** - "People also search for" data
- **Historical trends** - 12-month search patterns

### Why DataForSEO?

Unlike generic keyword tools, DataForSEO provides:
- ✅ Real Google Ads data (not estimates)
- ✅ Long-tail keyword suggestions (crucial for low competition)
- ✅ SERP competitor analysis
- ✅ API-first design (perfect for automation)
- ✅ Affordable pricing ($0.001 per keyword)

### Use Case in Perdia

**Problem:** Generating content ideas without knowing what people actually search for wastes AI tokens and produces low-traffic content.

**Solution:** Use DataForSEO to find high-volume, low-competition long-tail keywords BEFORE generating ideas, ensuring every article targets real search demand.

---

## DataForSEO Setup

### 1. Create Account

1. Go to [https://app.dataforseo.com/register](https://app.dataforseo.com/register)
2. Sign up for an account
3. Verify your email
4. Add credits (minimum $10)

### 2. Get API Credentials

1. Go to **Dashboard → API Access**
2. Copy your credentials:
   ```
   Login (username): your_login
   Password: your_password
   ```
3. **Store securely** - these are used for Basic Auth

### 3. Pricing Overview

**Keywords Data API:**
- Keyword Suggestions: $0.0005 per keyword
- Search Volume: $0.001 per keyword
- SERP Data: $0.003 per request

**Example Monthly Cost (100 articles):**
- 100 topics × 50 keywords each = 5,000 keywords
- 5,000 × $0.0005 = **$2.50/month**

Very affordable compared to AI generation costs!

---

## API Endpoints Used

### Primary Endpoints

**1. Keywords Suggestions (Keywords For Keywords)**
```
POST https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live
```
**Purpose:** Get related keyword suggestions from seed keyword
**Cost:** $0.0005 per keyword

**2. Search Volume**
```
POST https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live
```
**Purpose:** Get exact search volume and competition data
**Cost:** $0.001 per keyword

**3. SERP Data (Optional)**
```
POST https://api.dataforseo.com/v3/serp/google/organic/live/advanced
```
**Purpose:** Analyze current top-ranking pages for competition assessment
**Cost:** $0.003 per request

---

## Client Implementation

### DataForSEO Client

```javascript
// src/services/dataForSEO/dataForSEOClient.js

export class DataForSEOClient {
  constructor(username, password) {
    this.username = username || import.meta.env.VITE_DATAFORSEO_USERNAME;
    this.password = password || import.meta.env.VITE_DATAFORSEO_PASSWORD;
    this.baseUrl = 'https://api.dataforseo.com/v3';
  }

  /**
   * Create Basic Auth header
   */
  getAuthHeader() {
    return 'Basic ' + btoa(`${this.username}:${this.password}`);
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, payload) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DataForSEO API Error: ${error.status_message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Check for task-level errors
    if (data.tasks && data.tasks[0]?.status_code !== 20000) {
      throw new Error(`Task Error: ${data.tasks[0]?.status_message}`);
    }

    return data;
  }

  /**
   * Get keyword suggestions from seed keyword(s)
   * @param {string|string[]} seedKeywords - One or more seed keywords
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of keyword objects
   */
  async getKeywordSuggestions(seedKeywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
      limit = 100,
      includeSerp = true,
      sortBy = 'search_volume', // or 'relevance' or 'competition'
    } = options;

    // Ensure seedKeywords is array
    const keywords = Array.isArray(seedKeywords) ? seedKeywords : [seedKeywords];

    const payload = [{
      location_name: location,
      language_name: language,
      keywords: keywords,
      include_serp_info: includeSerp,
      sort_by: sortBy,
    }];

    const data = await this.request('/keywords_data/google_ads/keywords_for_keywords/live', payload);

    // Parse results
    const results = data.tasks[0]?.result?.[0]?.items || [];

    return results
      .filter(item => item.search_volume > 0) // Only keywords with search volume
      .map(item => ({
        keyword: item.keyword,
        search_volume: item.search_volume,
        competition: item.competition, // 0-1 scale
        competition_level: item.competition_level, // 'LOW', 'MEDIUM', 'HIGH'
        cpc: item.cpc, // Cost per click in USD
        monthly_searches: item.monthly_searches, // 12-month trend array
        trend: this.calculateTrend(item.monthly_searches),
        difficulty: this.calculateDifficulty(item),
        opportunity_score: this.calculateOpportunityScore(item),
      }))
      .slice(0, limit);
  }

  /**
   * Get exact search volume for specific keywords
   * @param {string[]} keywords - Array of keywords to check
   * @param {Object} options - Location and language
   * @returns {Promise<Array>} Array with volume data
   */
  async getSearchVolume(keywords, options = {}) {
    const {
      location = 'United States',
      language = 'English',
    } = options;

    const payload = [{
      location_name: location,
      language_name: language,
      keywords: keywords,
    }];

    const data = await this.request('/keywords_data/google_ads/search_volume/live', payload);

    const results = data.tasks[0]?.result?.[0]?.items || [];

    return results.map(item => ({
      keyword: item.keyword,
      search_volume: item.search_volume,
      competition: item.competition,
      competition_level: item.competition_level,
      cpc: item.cpc,
      monthly_searches: item.monthly_searches,
    }));
  }

  /**
   * Get SERP analysis for a keyword
   * @param {string} keyword - Keyword to analyze
   * @param {Object} options - Options
   * @returns {Promise<Object>} SERP analysis data
   */
  async getSerpAnalysis(keyword, options = {}) {
    const {
      location = 'United States',
      language = 'English',
      depth = 100, // Number of results to fetch
    } = options;

    const payload = [{
      keyword: keyword,
      location_name: location,
      language_name: language,
      device: 'desktop',
      os: 'windows',
      depth: depth,
    }];

    const data = await this.request('/serp/google/organic/live/advanced', payload);

    const items = data.tasks[0]?.result?.[0]?.items || [];

    return this.analyzeSerpResults(items);
  }

  /**
   * Calculate keyword difficulty (0-100)
   * Lower = easier to rank
   */
  calculateDifficulty(keywordData) {
    const { competition, competition_level, cpc, search_volume } = keywordData;

    let score = 0;

    // Competition level (0-40 points)
    if (competition_level === 'LOW') score += 10;
    else if (competition_level === 'MEDIUM') score += 25;
    else if (competition_level === 'HIGH') score += 40;

    // CPC indicates commercial intent and competition (0-30 points)
    if (cpc < 0.5) score += 5;
    else if (cpc < 2) score += 15;
    else if (cpc < 5) score += 25;
    else score += 30;

    // Search volume factor (0-30 points)
    if (search_volume < 500) score += 5;
    else if (search_volume < 2000) score += 15;
    else if (search_volume < 10000) score += 25;
    else score += 30;

    return Math.min(100, score);
  }

  /**
   * Calculate opportunity score (0-100)
   * Higher = better opportunity
   */
  calculateOpportunityScore(keywordData) {
    const { search_volume, competition, difficulty } = keywordData;

    // High volume, low competition = high opportunity
    const volumeScore = Math.min(50, search_volume / 100); // Max 50 points
    const competitionScore = (1 - competition) * 30; // Max 30 points
    const difficultyScore = (100 - difficulty) * 0.2; // Max 20 points

    return Math.round(volumeScore + competitionScore + difficultyScore);
  }

  /**
   * Calculate trend (growing, stable, declining)
   */
  calculateTrend(monthlySearches) {
    if (!monthlySearches || monthlySearches.length < 3) {
      return 'stable';
    }

    // Compare last 3 months average vs previous 3 months
    const recent = monthlySearches.slice(-3);
    const previous = monthlySearches.slice(-6, -3);

    const recentAvg = recent.reduce((sum, m) => sum + m.search_volume, 0) / 3;
    const previousAvg = previous.reduce((sum, m) => sum + m.search_volume, 0) / 3;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (change > 20) return 'growing';
    if (change < -20) return 'declining';
    return 'stable';
  }

  /**
   * Analyze SERP results for competition
   */
  analyzeSerpResults(serpItems) {
    const top10 = serpItems.slice(0, 10);

    return {
      total_results: serpItems.length,
      top_domains: top10.map(item => ({
        domain: item.domain,
        url: item.url,
        title: item.title,
        rank_absolute: item.rank_absolute,
      })),
      edu_sites: serpItems.filter(item => item.domain?.endsWith('.edu')).length,
      gov_sites: serpItems.filter(item => item.domain?.endsWith('.gov')).length,
      authority_domains: top10.filter(item => {
        // Check for high-authority domains (you'd integrate with a domain authority API)
        const highAuthDomains = ['wikipedia.org', 'harvard.edu', 'mit.edu', 'nytimes.com'];
        return highAuthDomains.some(d => item.domain?.includes(d));
      }).length,
      competition_level: this.assessSerpCompetition(top10),
    };
  }

  /**
   * Assess SERP competition level
   */
  assessSerpCompetition(top10Results) {
    let score = 0;

    // Check for strong indicators
    top10Results.forEach(result => {
      if (result.domain?.endsWith('.edu')) score += 3;
      if (result.domain?.endsWith('.gov')) score += 3;
      if (result.domain?.includes('wikipedia')) score += 2;
    });

    if (score > 15) return 'HIGH';
    if (score > 8) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get keyword ideas from multiple seed topics
   * Useful for generating content ideas across multiple clusters
   */
  async batchKeywordResearch(seedTopics, options = {}) {
    const results = await Promise.all(
      seedTopics.map(topic => this.getKeywordSuggestions(topic, options))
    );

    // Flatten and deduplicate
    const allKeywords = results.flat();
    const uniqueKeywords = Array.from(
      new Map(allKeywords.map(kw => [kw.keyword, kw])).values()
    );

    // Sort by opportunity score
    return uniqueKeywords.sort((a, b) => b.opportunity_score - a.opportunity_score);
  }
}

export const dataForSEOClient = new DataForSEOClient();
```

---

## Keyword Research Workflow

### Step-by-Step Process

```javascript
// src/services/keywordResearch.js

import { dataForSEOClient } from './dataForSEO/dataForSEOClient';
import { grokClient } from './ai/grokClient';
import { supabase } from './supabaseClient';

/**
 * Complete keyword research and idea generation workflow
 */
export async function researchAndGenerateIdeas(seedTopic, options = {}) {
  const {
    minSearchVolume = 200,
    maxDifficulty = 70,
    limit = 10,
  } = options;

  console.log(`🔍 Researching keywords for: "${seedTopic}"`);

  // ═══════════════════════════════════════════════════
  // STEP 1: Get keyword suggestions
  // ═══════════════════════════════════════════════════

  const keywords = await dataForSEOClient.getKeywordSuggestions(seedTopic, {
    limit: 100,
    includeSerp: true,
  });

  console.log(`Found ${keywords.length} total keywords`);

  // ═══════════════════════════════════════════════════
  // STEP 2: Filter for opportunities
  // ═══════════════════════════════════════════════════

  const opportunities = keywords.filter(kw =>
    kw.search_volume >= minSearchVolume &&
    kw.difficulty <= maxDifficulty &&
    kw.opportunity_score > 50
  );

  console.log(`Filtered to ${opportunities.length} opportunities`);

  if (opportunities.length === 0) {
    throw new Error('No keyword opportunities found with current criteria');
  }

  // Sort by opportunity score
  const topOpportunities = opportunities
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, limit);

  // ═══════════════════════════════════════════════════
  // STEP 3: Check for existing content (avoid duplicates)
  // ═══════════════════════════════════════════════════

  const existingArticles = await supabase
    .from('articles')
    .select('title, target_keywords')
    .limit(1000);

  const filteredOpportunities = topOpportunities.filter(kw => {
    // Check if keyword already targeted
    const alreadyTargeted = existingArticles.data?.some(article =>
      article.target_keywords?.includes(kw.keyword) ||
      article.title?.toLowerCase().includes(kw.keyword.toLowerCase())
    );
    return !alreadyTargeted;
  });

  console.log(`${filteredOpportunities.length} keywords without existing content`);

  // ═══════════════════════════════════════════════════
  // STEP 4: Generate content ideas with AI
  // ═══════════════════════════════════════════════════

  const ideas = await Promise.all(
    filteredOpportunities.map(async (kw) => {
      const prompt = `Generate a compelling content idea for this keyword: "${kw.keyword}"

KEYWORD DATA:
- Search Volume: ${kw.search_volume}/month
- Competition: ${kw.competition_level}
- Trend: ${kw.trend}
- CPC: $${kw.cpc}
- Difficulty: ${kw.difficulty}/100
- Opportunity Score: ${kw.opportunity_score}/100

REQUIREMENTS:
- Create an SEO-optimized title that naturally includes the keyword
- Write a compelling description (150-200 words) of what the article will cover
- Suggest 3-5 related keywords to target
- Choose the best content type (listicle, guide, ranking, faq, degree_page)
- Estimate potential monthly traffic

RESPOND WITH VALID JSON ONLY:
{
  "title": "SEO-optimized title with keyword",
  "description": "Detailed description of article content",
  "target_keywords": ["primary", "secondary", "tertiary"],
  "content_type": "listicle|guide|ranking|faq|degree_page",
  "estimated_traffic": number,
  "seo_angle": "What makes this article unique/valuable"
}`;

      try {
        const response = await grokClient.chat([
          {
            role: 'system',
            content: 'You are an expert SEO content strategist. Respond ONLY with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ], {
          temperature: 0.8,
          maxTokens: 1000,
        });

        let content = response.choices[0].message.content;
        content = content.replace(/^```json\s*/gim, '').replace(/^```\s*/gim, '').replace(/\s*```$/gim, '').trim();

        const aiIdea = JSON.parse(content);

        return {
          ...aiIdea,
          source: 'dataforseo',
          keyword_data: {
            primary_keyword: kw.keyword,
            search_volume: kw.search_volume,
            difficulty: kw.difficulty,
            competition: kw.competition_level,
            cpc: kw.cpc,
            trend: kw.trend,
            opportunity_score: kw.opportunity_score,
            monthly_searches: kw.monthly_searches,
          },
          priority: this.calculatePriority(kw, aiIdea),
        };
      } catch (error) {
        console.error(`Failed to generate idea for "${kw.keyword}":`, error);
        return null;
      }
    })
  );

  // Filter out failed generations
  const validIdeas = ideas.filter(idea => idea !== null);

  // ═══════════════════════════════════════════════════
  // STEP 5: Score and rank ideas
  // ═══════════════════════════════════════════════════

  const scoredIdeas = validIdeas.map(idea => ({
    ...idea,
    final_score: this.calculateFinalScore(idea),
  }));

  // Sort by final score
  scoredIdeas.sort((a, b) => b.final_score - a.final_score);

  console.log(`✅ Generated ${scoredIdeas.length} content ideas`);

  return scoredIdeas;
}

/**
 * Calculate priority based on keyword data
 */
function calculatePriority(keywordData, aiIdea) {
  const score = keywordData.opportunity_score;

  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Calculate final score combining keyword and AI analysis
 */
function calculateFinalScore(idea) {
  const kw = idea.keyword_data;

  // Weighted scoring
  const volumeWeight = 0.3;
  const opportunityWeight = 0.4;
  const trendWeight = 0.2;
  const trafficWeight = 0.1;

  const volumeScore = Math.min(100, (kw.search_volume / 50)); // Normalize
  const opportunityScore = kw.opportunity_score;
  const trendScore = kw.trend === 'growing' ? 100 : kw.trend === 'stable' ? 70 : 40;
  const trafficScore = Math.min(100, (idea.estimated_traffic / 30));

  return Math.round(
    volumeScore * volumeWeight +
    opportunityScore * opportunityWeight +
    trendScore * trendWeight +
    trafficScore * trafficWeight
  );
}
```

---

## Integration with Idea Generator

### Enhanced Source Selector Component

```javascript
// src/components/workflow/SourceSelector.jsx

import { useState } from 'react';
import { researchAndGenerateIdeas } from '@/services/keywordResearch';

export default function SourceSelector({ onIdeasGenerated }) {
  const [loading, setLoading] = useState(false);
  const [seedTopic, setSeedTopic] = useState('');
  const [options, setOptions] = useState({
    minSearchVolume: 200,
    maxDifficulty: 70,
    limit: 10,
  });

  async function handleGenerateIdeas() {
    setLoading(true);

    try {
      const ideas = await researchAndGenerateIdeas(seedTopic, options);
      onIdeasGenerated(ideas);
    } catch (error) {
      console.error('Idea generation failed:', error);
      alert(`Failed to generate ideas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Generate Content Ideas</h2>

      {/* Seed Topic Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Seed Topic or Keyword
        </label>
        <input
          type="text"
          value={seedTopic}
          onChange={(e) => setSeedTopic(e.target.value)}
          placeholder="e.g., online MBA programs"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Min Search Volume
          </label>
          <input
            type="number"
            value={options.minSearchVolume}
            onChange={(e) => setOptions({ ...options, minSearchVolume: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Max Difficulty
          </label>
          <input
            type="number"
            value={options.maxDifficulty}
            onChange={(e) => setOptions({ ...options, maxDifficulty: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Ideas
          </label>
          <input
            type="number"
            value={options.limit}
            onChange={(e) => setOptions({ ...options, limit: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateIdeas}
        disabled={loading || !seedTopic}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Researching Keywords...' : 'Generate Ideas with Keyword Research'}
      </button>

      {loading && (
        <div className="mt-4 text-sm text-gray-600">
          <p>🔍 Analyzing search data from DataForSEO...</p>
          <p>🤖 Generating content ideas with AI...</p>
        </div>
      )}
    </div>
  );
}
```

---

## Cost Optimization

### 1. **Caching Strategy**

```javascript
// Cache keyword research results to avoid duplicate API calls

const keywordCache = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getCachedKeywordData(seedKeyword) {
  const cacheKey = `keyword:${seedKeyword}`;
  const cached = keywordCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached keyword data');
    return cached.data;
  }

  // Fetch fresh data
  const data = await dataForSEOClient.getKeywordSuggestions(seedKeyword);

  // Cache it
  keywordCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  return data;
}
```

### 2. **Batch Processing**

```javascript
// Process multiple topics in one go to reduce overhead

async function batchResearch(topics) {
  // Group into batches of 5
  const batches = [];
  for (let i = 0; i < topics.length; i += 5) {
    batches.push(topics.slice(i, i + 5));
  }

  const results = [];
  for (const batch of batches) {
    const batchResults = await dataForSEOClient.batchKeywordResearch(batch);
    results.push(...batchResults);

    // Wait 1 second between batches to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
```

### 3. **Smart Filtering**

```javascript
// Filter keywords BEFORE expensive SERP analysis

const worthAnalyzing = keywords.filter(kw =>
  kw.search_volume > 500 && // High enough volume
  kw.difficulty < 50 && // Low enough difficulty
  kw.opportunity_score > 70 // High opportunity
);

// Only analyze top candidates
for (const kw of worthAnalyzing.slice(0, 5)) {
  const serpData = await dataForSEOClient.getSerpAnalysis(kw.keyword);
  // ... process
}
```

---

## Rate Limiting & Caching

### Rate Limiter Implementation

```javascript
// src/services/dataForSEO/rateLimiter.js

export class RateLimiter {
  constructor(maxRequests = 10, perSeconds = 1) {
    this.maxRequests = maxRequests;
    this.perSeconds = perSeconds;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();

    // Remove requests older than perSeconds
    this.requests = this.requests.filter(
      time => now - time < this.perSeconds * 1000
    );

    // If at limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = (this.perSeconds * 1000) - (now - oldestRequest);

      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      return this.throttle(); // Retry
    }

    // Add this request
    this.requests.push(now);
  }
}

// Usage
const rateLimiter = new RateLimiter(10, 1); // 10 requests per second

export async function makeThrottledRequest(fn) {
  await rateLimiter.throttle();
  return await fn();
}
```

---

## Error Handling

### Comprehensive Error Handling

```javascript
export async function safeKeywordResearch(seedTopic, options) {
  try {
    return await researchAndGenerateIdeas(seedTopic, options);
  } catch (error) {
    console.error('Keyword research failed:', error);

    // Handle specific error types
    if (error.message.includes('authentication')) {
      throw new Error('DataForSEO authentication failed. Check your credentials.');
    }

    if (error.message.includes('balance')) {
      throw new Error('Insufficient DataForSEO credits. Please add funds to your account.');
    }

    if (error.message.includes('rate limit')) {
      console.log('Rate limited. Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return safeKeywordResearch(seedTopic, options); // Retry
    }

    // Generic fallback
    throw new Error(`Keyword research failed: ${error.message}`);
  }
}
```

---

## Testing & Validation

### Unit Tests

```javascript
// __tests__/dataForSEO.test.js

import { DataForSEOClient } from '../services/dataForSEO/dataForSEOClient';

describe('DataForSEOClient', () => {
  let client;

  beforeEach(() => {
    client = new DataForSEOClient('test_user', 'test_pass');
  });

  test('calculates difficulty correctly', () => {
    const keyword = {
      competition: 0.8,
      competition_level: 'HIGH',
      cpc: 5.5,
      search_volume: 5000,
    };

    const difficulty = client.calculateDifficulty(keyword);
    expect(difficulty).toBeGreaterThan(50); // Should be difficult
  });

  test('calculates opportunity score correctly', () => {
    const keyword = {
      search_volume: 2000,
      competition: 0.2, // Low competition
      difficulty: 30, // Easy to rank
    };

    const score = client.calculateOpportunityScore(keyword);
    expect(score).toBeGreaterThan(70); // Should be high opportunity
  });

  test('identifies growing trends', () => {
    const monthlySearches = [
      { search_volume: 100 },
      { search_volume: 120 },
      { search_volume: 150 },
      { search_volume: 200 },
      { search_volume: 250 },
      { search_volume: 300 },
    ];

    const trend = client.calculateTrend(monthlySearches);
    expect(trend).toBe('growing');
  });
});
```

### Integration Test

```javascript
// Manual test script

async function testDataForSEO() {
  const client = new DataForSEOClient();

  try {
    console.log('Testing keyword suggestions...');
    const keywords = await client.getKeywordSuggestions('online MBA', {
      limit: 10,
    });

    console.log(`✅ Found ${keywords.length} keywords`);
    console.log('Sample:', keywords[0]);

    console.log('\nTesting search volume...');
    const volumes = await client.getSearchVolume(['online MBA programs', 'best online MBA']);

    console.log(`✅ Got volume data for ${volumes.length} keywords`);
    console.log('Sample:', volumes[0]);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDataForSEO();
```

---

## Environment Variables

```bash
# .env.local (Frontend - NOT RECOMMENDED, use backend)
VITE_DATAFORSEO_USERNAME=your_username
VITE_DATAFORSEO_PASSWORD=your_password

# Supabase Secrets (Recommended)
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
```

**Security Note:** Store credentials in Supabase Edge Function secrets, not frontend .env!

```bash
# Set secrets
supabase secrets set DATAFORSEO_USERNAME=your_username
supabase secrets set DATAFORSEO_PASSWORD=your_password
```

---

## Next Steps

1. ✅ Set up DataForSEO account and get credentials
2. ✅ Implement DataForSEOClient in your project
3. ✅ Test with a few seed keywords
4. ✅ Integrate with idea generation workflow
5. ✅ Monitor costs and optimize caching
6. ✅ Set up error alerts for API failures

---

**Document Status:** Complete
**Related Documents:**
- AI Integration Strategy (04-AI-INTEGRATION-STRATEGY.md)
- Automatic Mode Specification (09-AUTOMATIC-MODE-SPECIFICATION.md)
