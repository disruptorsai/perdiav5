# Perdia - Automatic Mode Specification

**Version:** 2.0
**Date:** January 2025
**Status:** Core Feature

---

## Table of Contents

1. [Overview](#overview)
2. [Mode Comparison](#mode-comparison)
3. [Automatic Mode Architecture](#automatic-mode-architecture)
4. [End-to-End Workflow](#end-to-end-workflow)
5. [Decision Trees & Quality Gates](#decision-trees--quality-gates)
6. [Closed-Loop Self-Correction](#closed-loop-self-correction)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Monitoring & Notifications](#monitoring--notifications)
9. [Configuration & Settings](#configuration--settings)
10. [Implementation Guide](#implementation-guide)

---

## Overview

### What is Automatic Mode?

**Automatic Mode** is a fully autonomous operation mode where Perdia generates, quality-checks, corrects, and publishes articles with **zero human intervention**.

### Key Principles

1. **Fully Autonomous** - Runs from idea to published article without human input
2. **Self-Correcting** - Detects and fixes quality issues automatically
3. **Quality-Gated** - Only publishes articles meeting quality thresholds
4. **Self-Improving** - Learns from successes and failures
5. **Transparent** - Logs all decisions for audit trail

### When to Use

**Automatic Mode:**
- High-volume content production (50-200 articles/month)
- Well-defined content types and clusters
- Proven prompt quality (tested in Manual Mode first)
- Trusted AI models

**Manual Mode:**
- Testing new prompts
- Sensitive or complex topics
- Brand-critical content
- Learning phase

---

## Mode Comparison

| Feature | Manual Mode | Semi-Auto Mode | **Full Auto Mode** |
|---------|-------------|----------------|-------------------|
| **Idea Generation** | User triggers | Auto when queue < 5 | **Fully automatic** |
| **Idea Approval** | User reviews | User reviews | **Auto-approve top 5** |
| **Article Generation** | User triggers | Auto when approved | **Fully automatic** |
| **Quality Checks** | User runs | Automatic | **Automatic + auto-fix** |
| **Auto-Fix Issues** | User triggers | Auto-suggest | **Automatic (3 retries)** |
| **Review & Approval** | Required | Required if quality < 85 | **Auto if quality ≥ 85** |
| **Publishing** | User triggers | User triggers | **Auto if quality ≥ 85** |
| **Error Handling** | User resolves | Notifications | **Auto-retry + fallbacks** |
| **Learning** | Manual analysis | Semi-automatic | **Fully automatic** |

---

## Automatic Mode Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTOMATIC MODE ENGINE                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. IDEA GENERATION LOOP                               │ │
│  │     - Monitor idea queue                               │ │
│  │     - Generate when queue < threshold                  │ │
│  │     - DataForSEO keyword research                      │ │
│  │     - AI idea generation                               │ │
│  │     - Similarity filtering                             │ │
│  │     - Auto-approve top ideas                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. GENERATION LOOP                                    │ │
│  │     - Pick approved idea                               │ │
│  │     - Auto-assign contributor                          │ │
│  │     - Grok drafting                                    │ │
│  │     - Claude humanization                              │ │
│  │     - SEO metadata generation                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. QUALITY ASSURANCE LOOP (CLOSED-LOOP)               │ │
│  │     - Calculate quality metrics                        │ │
│  │     - Identify issues                                  │ │
│  │     ┌─────────────────────────────┐                   │ │
│  │     │  If issues found:           │                   │ │
│  │     │  → Auto-fix with Claude     │                   │ │
│  │     │  → Re-validate              │                   │ │
│  │     │  → Retry up to 3 times      │                   │ │
│  │     └─────────────────────────────┘                   │ │
│  │     - Set risk flags if not fixable                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  4. DECISION GATE                                      │ │
│  │     Quality ≥ 85? ──Yes──→ Auto-publish                │ │
│  │                                                          │ │
│  │     Quality 75-84? ────→ Manual review queue           │ │
│  │                                                          │ │
│  │     Quality < 75? ─────→ Reject, analyze failure       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  5. PUBLISHING LOOP                                    │ │
│  │     - Publish to WordPress                             │ │
│  │     - Handle errors                                    │ │
│  │     - Update article status                            │ │
│  │     - Log to analytics                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  6. LEARNING LOOP                                      │ │
│  │     - Analyze performance                              │ │
│  │     - Update success patterns                          │ │
│  │     - Refine prompts                                   │ │
│  │     - Adjust quality thresholds                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ↻ REPEAT CONTINUOUSLY                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## End-to-End Workflow

### Complete Automatic Mode Implementation

```javascript
// src/services/automation/automaticModeEngine.js

import { dataForSEOClient } from '../dataForSEO/dataForSEOClient';
import { grokClient } from '../ai/grokClient';
import { claudeClient } from '../ai/claudeClient';
import { supabase } from '../supabaseClient';
import { publishToWordPress } from '../wordpress/wordpressService';

export class AutomaticModeEngine {
  constructor() {
    this.isRunning = false;
    this.settings = null;
    this.stats = {
      cycles: 0,
      articlesGenerated: 0,
      articlesPublished: 0,
      failures: 0,
    };
  }

  /**
   * Start automatic mode
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Automatic mode already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Starting Automatic Mode...');

    // Load settings
    await this.loadSettings();

    // Start main loop
    while (this.isRunning) {
      try {
        await this.runCycle();
        this.stats.cycles++;

        // Wait before next cycle
        const waitTime = this.settings.cycle_interval_seconds * 1000;
        await this.sleep(waitTime);
      } catch (error) {
        console.error('❌ Cycle error:', error);
        await this.handleCycleError(error);
      }
    }
  }

  /**
   * Stop automatic mode
   */
  stop() {
    console.log('🛑 Stopping Automatic Mode...');
    this.isRunning = false;
  }

  /**
   * Load automation settings
   */
  async loadSettings() {
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('setting_type', 'automation');

    this.settings = {
      automation_level: 'full_auto',
      min_idea_queue_size: 5,
      max_generation_parallel: 1, // Sequential for now
      quality_threshold_publish: 85,
      quality_threshold_review: 75,
      max_auto_fix_attempts: 3,
      cycle_interval_seconds: 300, // 5 minutes
      enable_auto_publish: true,
      ...Object.fromEntries(settings.map(s => [s.setting_key, s.setting_value])),
    };

    console.log('📋 Loaded settings:', this.settings);
  }

  /**
   * Run one complete cycle
   */
  async runCycle() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`🔄 Cycle ${this.stats.cycles + 1} starting...`);
    console.log('═══════════════════════════════════════════════════\n');

    // ═══════════════════════════════════════════════════
    // STAGE 1: ENSURE IDEA QUEUE HAS IDEAS
    // ═══════════════════════════════════════════════════

    await this.ensureIdeaQueue();

    // ═══════════════════════════════════════════════════
    // STAGE 2: PICK NEXT IDEA
    // ═══════════════════════════════════════════════════

    const idea = await this.getNextIdea();

    if (!idea) {
      console.log('⏸️ No approved ideas available. Waiting...');
      return;
    }

    console.log(`📝 Processing idea: "${idea.title}"`);

    // ═══════════════════════════════════════════════════
    // STAGE 3: GENERATE ARTICLE
    // ═══════════════════════════════════════════════════

    const article = await this.generateArticle(idea);

    if (!article) {
      console.log('❌ Article generation failed');
      this.stats.failures++;
      return;
    }

    // ═══════════════════════════════════════════════════
    // STAGE 4: QUALITY ASSURANCE (CLOSED-LOOP)
    // ═══════════════════════════════════════════════════

    const qaResult = await this.qualityAssuranceLoop(article);

    // ═══════════════════════════════════════════════════
    // STAGE 5: SAVE ARTICLE
    // ═══════════════════════════════════════════════════

    const savedArticle = await this.saveArticle(qaResult.article, idea);

    this.stats.articlesGenerated++;

    // ═══════════════════════════════════════════════════
    // STAGE 6: PUBLISH IF QUALITY THRESHOLD MET
    // ═══════════════════════════════════════════════════

    if (
      this.settings.enable_auto_publish &&
      savedArticle.quality_score >= this.settings.quality_threshold_publish
    ) {
      await this.autoPublish(savedArticle);
    } else {
      console.log(`⏸️ Article quality (${savedArticle.quality_score}) below publish threshold. Moving to review queue.`);
    }

    // ═══════════════════════════════════════════════════
    // STAGE 7: LEARNING
    // ═══════════════════════════════════════════════════

    await this.updateLearning(savedArticle, qaResult);

    console.log('\n✅ Cycle complete!');
    console.log(`Stats: Generated=${this.stats.articlesGenerated}, Published=${this.stats.articlesPublished}, Failures=${this.stats.failures}`);
  }

  /**
   * STAGE 1: Ensure idea queue has enough ideas
   */
  async ensureIdeaQueue() {
    const { data: ideas, count } = await supabase
      .from('content_ideas')
      .select('*', { count: 'exact' })
      .eq('status', 'approved');

    console.log(`📊 Idea queue: ${count} approved ideas`);

    if (count < this.settings.min_idea_queue_size) {
      console.log(`🔍 Queue below threshold (${this.settings.min_idea_queue_size}). Generating new ideas...`);

      await this.autoGenerateIdeas();
    }
  }

  /**
   * Auto-generate ideas using DataForSEO + AI
   */
  async autoGenerateIdeas() {
    // Get random cluster to research
    const { data: clusters } = await supabase
      .from('clusters')
      .select('*')
      .eq('status', 'active')
      .limit(5);

    if (!clusters || clusters.length === 0) {
      console.log('⚠️ No active clusters found');
      return;
    }

    // Pick random cluster
    const cluster = clusters[Math.floor(Math.random() * clusters.length)];
    const seedTopic = cluster.name;

    console.log(`🔎 Researching keywords for: "${seedTopic}"`);

    // Get keyword opportunities from DataForSEO
    const keywords = await dataForSEOClient.getKeywordSuggestions(seedTopic, {
      limit: 50,
      includeSerp: true,
    });

    // Filter for best opportunities
    const opportunities = keywords
      .filter(kw =>
        kw.search_volume >= 200 &&
        kw.difficulty <= 70 &&
        kw.opportunity_score > 60
      )
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 10);

    console.log(`✅ Found ${opportunities.length} keyword opportunities`);

    // Generate ideas from keywords
    const ideas = [];

    for (const kw of opportunities) {
      const prompt = `Generate a content idea for: "${kw.keyword}"

Keyword Data:
- Search Volume: ${kw.search_volume}/month
- Competition: ${kw.competition_level}
- Opportunity Score: ${kw.opportunity_score}/100

Return JSON:
{
  "title": "SEO-optimized title",
  "description": "Article description",
  "target_keywords": ["primary", "secondary"],
  "content_type": "listicle|guide|ranking|faq|degree_page",
  "estimated_traffic": number
}`;

      try {
        const response = await grokClient.chat([
          { role: 'user', content: prompt }
        ], { temperature: 0.8 });

        let content = response.choices[0].message.content;
        content = content.replace(/^```json\s*/gim, '').replace(/^```\s*/gim, '').replace(/\s*```$/gim, '').trim();

        const aiIdea = JSON.parse(content);

        ideas.push({
          ...aiIdea,
          source: 'ai_generated',
          cluster_id: cluster.id,
          priority: kw.opportunity_score > 80 ? 'high' : 'medium',
          keyword_data: {
            primary_keyword: kw.keyword,
            search_volume: kw.search_volume,
            difficulty: kw.difficulty,
            opportunity_score: kw.opportunity_score,
          },
        });
      } catch (error) {
        console.error(`Failed to generate idea for "${kw.keyword}":`, error);
      }
    }

    // Check for duplicates against existing content
    const filteredIdeas = await this.filterDuplicateIdeas(ideas);

    // Auto-approve top 5 ideas
    const topIdeas = filteredIdeas.slice(0, 5);

    if (topIdeas.length > 0) {
      await supabase.from('content_ideas').insert(
        topIdeas.map(idea => ({
          ...idea,
          status: 'approved',
        }))
      );

      console.log(`✅ Auto-generated and approved ${topIdeas.length} ideas`);
    }
  }

  /**
   * Filter out duplicate ideas
   */
  async filterDuplicateIdeas(ideas) {
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title, target_keywords')
      .limit(1000);

    const { data: existingIdeas } = await supabase
      .from('content_ideas')
      .select('title, suggested_keywords')
      .in('status', ['approved', 'in_progress'])
      .limit(500);

    return ideas.filter(idea => {
      // Check against existing articles
      const isDuplicateArticle = existingArticles?.some(article =>
        this.calculateSimilarity(idea.title, article.title) > 0.7
      );

      // Check against existing ideas
      const isDuplicateIdea = existingIdeas?.some(existingIdea =>
        this.calculateSimilarity(idea.title, existingIdea.title) > 0.7
      );

      return !isDuplicateArticle && !isDuplicateIdea;
    });
  }

  /**
   * Calculate string similarity (0-1)
   */
  calculateSimilarity(str1, str2) {
    // Simple word overlap similarity
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const intersection = words1.filter(w => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * STAGE 2: Get next approved idea
   */
  async getNextIdea() {
    const { data: ideas } = await supabase
      .from('content_ideas')
      .select('*, clusters(*)')
      .eq('status', 'approved')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    return ideas?.[0] || null;
  }

  /**
   * STAGE 3: Generate article
   */
  async generateArticle(idea) {
    console.log('📝 Starting article generation...');

    // Update idea status
    await supabase
      .from('content_ideas')
      .update({ status: 'in_progress' })
      .eq('id', idea.id);

    try {
      // 3.1: Auto-assign contributor
      const contributor = await this.autoAssignContributor(idea);
      console.log(`👤 Assigned contributor: ${contributor.name}`);

      // 3.2: Get site articles for internal linking
      const siteArticles = await this.getRelevantSiteArticles(idea, 50);

      // 3.3: Generate draft with Grok
      console.log('🤖 Generating draft with Grok...');
      const prompt = this.buildDraftPrompt(idea, contributor, siteArticles);

      const draft = await grokClient.generateArticleDraft(prompt);

      // 3.4: Validate draft
      if (!this.validateDraft(draft)) {
        throw new Error('Draft validation failed');
      }

      // 3.5: Humanize with Claude
      console.log('✨ Humanizing content with Claude...');
      const humanized = await claudeClient.humanizeContent(
        draft.content,
        contributor.writing_style_profile
      );

      // 3.6: Generate SEO metadata
      console.log('🔍 Generating SEO metadata...');
      const seoMeta = await grokClient.generateSEOMetadata(draft.title, humanized);

      return {
        ...draft,
        content: humanized,
        ...seoMeta,
        contributor_id: contributor.id,
        contributor_name: contributor.name,
        cluster_id: idea.cluster_id,
        type: idea.content_type || 'guide',
        status: 'qa',
      };
    } catch (error) {
      console.error('Generation failed:', error);

      // Update idea status
      await supabase
        .from('content_ideas')
        .update({
          status: 'rejected',
          notes: `Generation failed: ${error.message}`,
        })
        .eq('id', idea.id);

      return null;
    }
  }

  /**
   * STAGE 4: Quality assurance with closed-loop auto-fix
   */
  async qualityAssuranceLoop(article) {
    console.log('🔍 Starting quality assurance loop...');

    let currentArticle = { ...article };
    let attempt = 0;
    const maxAttempts = this.settings.max_auto_fix_attempts;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`\n🔄 QA Attempt ${attempt}/${maxAttempts}`);

      // Calculate quality metrics
      const metrics = this.calculateQualityMetrics(currentArticle);
      console.log(`Quality Score: ${metrics.score}/100`);

      // Identify issues
      const issues = this.identifyQualityIssues(metrics);

      if (issues.length === 0) {
        console.log('✅ All quality checks passed!');
        currentArticle.quality_score = metrics.score;
        currentArticle.risk_flags = [];
        break;
      }

      console.log(`⚠️ Found ${issues.length} issues:`);
      issues.forEach(issue => console.log(`  - ${issue.type}: ${issue.description}`));

      if (attempt === maxAttempts) {
        console.log('⚠️ Max attempts reached. Flagging issues.');
        currentArticle.quality_score = metrics.score;
        currentArticle.risk_flags = issues.map(i => i.type);
        break;
      }

      // Auto-fix issues
      console.log('🔧 Auto-fixing issues...');

      try {
        const fixedContent = await claudeClient.autoFixQualityIssues(
          currentArticle.content,
          issues,
          await this.getRelevantSiteArticles(currentArticle, 30)
        );

        currentArticle.content = fixedContent;

        // Re-calculate metrics
        const newMetrics = this.calculateQualityMetrics(currentArticle);

        if (newMetrics.score > metrics.score) {
          console.log(`✅ Improvement: ${metrics.score} → ${newMetrics.score}`);
        } else {
          console.log(`⚠️ No improvement detected`);
        }
      } catch (error) {
        console.error('Auto-fix failed:', error);
        currentArticle.risk_flags = issues.map(i => i.type);
        break;
      }
    }

    return {
      article: currentArticle,
      attempts: attempt,
      finalScore: currentArticle.quality_score,
    };
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics(article) {
    const metrics = {
      word_count: this.countWords(article.content),
      internal_links: this.countInternalLinks(article.content),
      external_links: this.countExternalLinks(article.content),
      faq_count: article.faqs?.length || 0,
      has_h1: /<h1/i.test(article.content),
      h2_count: (article.content.match(/<h2/gi) || []).length,
      readability: this.calculateReadability(article.content),
    };

    // Calculate score
    let score = 100;

    // Word count (max -20)
    if (metrics.word_count < 1200) score -= 20;
    else if (metrics.word_count < 1500) score -= 10;

    // Internal links (max -15)
    if (metrics.internal_links < 3) score -= 15;
    else if (metrics.internal_links < 5) score -= 5;

    // External links (max -15)
    if (metrics.external_links < 2) score -= 15;
    else if (metrics.external_links < 3) score -= 5;

    // FAQs (max -10)
    if (metrics.faq_count < 3) score -= 10;
    else if (metrics.faq_count < 5) score -= 5;

    // Structure (max -10)
    if (!metrics.has_h1) score -= 5;
    if (metrics.h2_count < 3) score -= 5;

    // Readability (max -10)
    if (metrics.readability < 60) score -= 10;

    metrics.score = Math.max(0, score);

    return metrics;
  }

  /**
   * Identify specific quality issues
   */
  identifyQualityIssues(metrics) {
    const issues = [];

    if (metrics.word_count < 1200) {
      issues.push({
        type: 'word_count',
        description: `Article is ${1200 - metrics.word_count} words short`,
        severity: 'high',
      });
    }

    if (metrics.internal_links < 3) {
      issues.push({
        type: 'internal_links',
        description: `Need ${3 - metrics.internal_links} more internal links`,
        severity: 'medium',
      });
    }

    if (metrics.external_links < 2) {
      issues.push({
        type: 'external_citations',
        description: `Need ${2 - metrics.external_links} more external citations`,
        severity: 'medium',
      });
    }

    if (metrics.faq_count < 3) {
      issues.push({
        type: 'faqs',
        description: `Need ${3 - metrics.faq_count} more FAQs`,
        severity: 'low',
      });
    }

    if (metrics.h2_count < 3) {
      issues.push({
        type: 'structure',
        description: 'Need more H2 headings for better structure',
        severity: 'low',
      });
    }

    return issues;
  }

  /**
   * Helper: Count words
   */
  countWords(html) {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    return text.split(' ').filter(w => w.length > 0).length;
  }

  /**
   * Helper: Count internal links
   */
  countInternalLinks(html) {
    // Count links to your domain (configure your domain)
    const regex = /href="[^"]*geteducated\.com[^"]*"/gi;
    return (html.match(regex) || []).length;
  }

  /**
   * Helper: Count external links
   */
  countExternalLinks(html) {
    const totalLinks = (html.match(/href="http/gi) || []).length;
    const internalLinks = this.countInternalLinks(html);
    return totalLinks - internalLinks;
  }

  /**
   * Helper: Calculate readability (Flesch-Kincaid)
   */
  calculateReadability(html) {
    // Simplified readability score
    const text = html.replace(/<[^>]*>/g, ' ');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper: Count syllables (approximation)
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * STAGE 5: Save article
   */
  async saveArticle(article, idea) {
    console.log('💾 Saving article...');

    const { data: savedArticle } = await supabase
      .from('articles')
      .insert({
        ...article,
        created_by: null, // System-generated
      })
      .select()
      .single();

    // Update idea
    await supabase
      .from('content_ideas')
      .update({
        status: 'completed',
        article_id: savedArticle.id,
      })
      .eq('id', idea.id);

    console.log(`✅ Article saved: ${savedArticle.id}`);

    return savedArticle;
  }

  /**
   * STAGE 6: Auto-publish
   */
  async autoPublish(article) {
    console.log('🚀 Auto-publishing to WordPress...');

    try {
      // Get default WordPress connection
      const { data: wpConnection } = await supabase
        .from('wordpress_connections')
        .select('*')
        .eq('is_default', true)
        .single();

      if (!wpConnection) {
        throw new Error('No default WordPress connection configured');
      }

      // Publish
      const result = await publishToWordPress(article.id, wpConnection.id);

      if (result.success) {
        console.log(`✅ Published: ${result.wordpress_url}`);

        // Update article
        await supabase
          .from('articles')
          .update({
            status: 'published',
            publish_status: 'published',
            wordpress_post_id: result.post_id,
            wordpress_url: result.wordpress_url,
            published_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        this.stats.articlesPublished++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Publishing failed:', error);

      // Update with error
      await supabase
        .from('articles')
        .update({
          publish_status: 'failed',
          last_publish_error: error.message,
        })
        .eq('id', article.id);
    }
  }

  /**
   * STAGE 7: Update learning
   */
  async updateLearning(article, qaResult) {
    console.log('🧠 Updating system learning...');

    // Analyze what worked well
    const learningData = {
      article_id: article.id,
      quality_score: article.quality_score,
      attempts_needed: qaResult.attempts,
      risk_flags: article.risk_flags || [],
      contributor_id: article.contributor_id,
      content_type: article.type,
      word_count: article.word_count,
      success: article.quality_score >= this.settings.quality_threshold_publish,
      timestamp: new Date().toISOString(),
    };

    // TODO: Implement learning algorithm
    // - Identify patterns in successful articles
    // - Update prompt templates
    // - Adjust quality thresholds
    // - Refine contributor assignments

    console.log('Learning data logged');
  }

  /**
   * Helper: Auto-assign contributor
   */
  async autoAssignContributor(idea) {
    const { data: contributors } = await supabase
      .from('article_contributors')
      .select('*')
      .eq('is_active', true);

    // Simple scoring based on expertise match
    const scored = contributors.map(contributor => {
      let score = 0;

      // Check keyword matches
      const ideaKeywords = [
        ...(idea.keywords || []),
        ...(idea.suggested_keywords || []),
        idea.title.toLowerCase(),
      ];

      contributor.expertise_areas?.forEach(expertise => {
        if (ideaKeywords.some(kw => kw.toLowerCase().includes(expertise.toLowerCase()))) {
          score += 10;
        }
      });

      return { contributor, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return highest scoring, or default to first
    return scored[0]?.contributor || contributors[0];
  }

  /**
   * Helper: Get relevant site articles
   */
  async getRelevantSiteArticles(item, limit = 50) {
    const { data: articles } = await supabase
      .from('site_articles')
      .select('*')
      .eq('is_active', true)
      .limit(limit);

    return articles || [];
  }

  /**
   * Helper: Build draft prompt
   */
  buildDraftPrompt(idea, contributor, siteArticles) {
    // Use the same prompt builder as manual mode
    // See 04-AI-INTEGRATION-STRATEGY.md for full prompt
    return `Generate article for: "${idea.title}"
Contributor: ${contributor.name}
Style: ${contributor.writing_style_profile}
...full prompt here...`;
  }

  /**
   * Helper: Validate draft
   */
  validateDraft(draft) {
    if (!draft.title || draft.title.length < 10 || draft.title.length > 200) {
      return false;
    }

    if (!draft.content || draft.content.length < 500) {
      return false;
    }

    return true;
  }

  /**
   * Handle cycle errors
   */
  async handleCycleError(error) {
    console.error('Cycle error:', error);

    // TODO: Send notification
    // TODO: Log to error tracking

    // Wait before retrying
    await this.sleep(60000); // 1 minute
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const automaticModeEngine = new AutomaticModeEngine();
```

---

## Decision Trees & Quality Gates

### Decision Tree: Publish or Review?

```
Article Quality Score
        │
        ▼
    [Calculate]
        │
        ├─── Score ≥ 85 ────────────► Auto-Publish ✅
        │                              │
        │                              └─► WordPress
        │                                  │
        │                                  ├─ Success → Status: Published
        │                                  └─ Failure → Status: Failed (retry)
        │
        ├─── Score 75-84 ───────────► Manual Review Queue 👤
        │                              │
        │                              └─► Notify editors
        │
        └─── Score < 75 ────────────► Reject ❌
                                       │
                                       └─► Analyze failure
                                           │
                                           ├─ Log to learning
                                           └─ Mark idea as rejected
```

### Decision Tree: Auto-Fix Loop

```
Quality Issues Found?
        │
        ├─── NO ──────────► ✅ Pass QA → Save Article
        │
        └─── YES ─────────► Attempt < 3?
                              │
                              ├─── YES ──────► Auto-Fix with Claude
                              │                 │
                              │                 └─► Re-validate
                              │                     │
                              │                     └─► [Loop back]
                              │
                              └─── NO (Max attempts) ──► Set Risk Flags
                                                          │
                                                          └─► Save with warnings
```

---

## Closed-Loop Self-Correction

### The Feedback Loop

```
1. Generate Article
        ↓
2. Calculate Metrics ───────────────────┐
        ↓                                │
3. Issues Found? ──NO──► Save & Publish │
        │                                │
       YES                               │
        ↓                                │
4. Auto-Fix with AI                     │
        ↓                                │
5. Re-Calculate Metrics ────────────────┘
        ↓
6. Improved? ──YES──► Continue
        │
       NO
        ↓
7. Retry? ──YES──► Back to Step 4
        │
       NO (Max attempts)
        ↓
8. Flag Issues & Save
```

### Self-Correction Example

```javascript
// Example: Article initially has 900 words, needs 1200

// Iteration 1:
// - Issues: word_count (300 words short), internal_links (0)
// - Fix: "Expand content by 300 words and add 3 internal links"
// - Result: 1,150 words, 2 internal links
// - Improvement: YES → Continue

// Iteration 2:
// - Issues: word_count (50 words short), internal_links (1 more needed)
// - Fix: "Add 50 words and 1 more internal link"
// - Result: 1,220 words, 3 internal links
// - Improvement: YES → PASS ✅

// No more iterations needed!
```

---

## Error Handling & Recovery

### Error Types & Responses

| Error Type | Response | Recovery |
|------------|----------|----------|
| **AI API Failure** | Retry 3x with exponential backoff | Fallback to alternative model |
| **WordPress Publish Failure** | Log error, set status to 'failed' | Manual retry or investigate |
| **Quality Below Threshold** | Flag for manual review | Don't auto-publish |
| **Duplicate Content** | Skip generation | Remove from queue |
| **Validation Failure** | Reject idea | Log pattern for learning |
| **Database Error** | Retry 3x | Alert admin if persists |

### Graceful Degradation

```javascript
// If Grok fails, try Claude
try {
  draft = await grokClient.generateArticleDraft(prompt);
} catch (error) {
  console.log('Grok failed, trying Claude...');
  draft = await claudeClient.generateArticleDraft(prompt);
}

// If both fail, log and move to next idea
if (!draft) {
  console.log('All AI providers failed. Skipping this idea.');
  await markIdeaAsRejected(idea.id, 'AI generation failed');
  return null;
}
```

---

## Monitoring & Notifications

### Dashboard Metrics

```javascript
// Real-time automatic mode dashboard

{
  "status": "running",
  "uptime": "2h 34m",
  "current_cycle": 31,
  "stats": {
    "ideas_generated": 15,
    "articles_generated": 12,
    "articles_published": 10,
    "articles_in_review": 2,
    "failures": 0,
    "success_rate": 100
  },
  "current_task": "Generating article: 'Best Online MBA Programs'",
  "queue": {
    "ideas_pending": 8,
    "next_cycle_in": "3m 15s"
  },
  "health": {
    "ai_apis": "operational",
    "database": "operational",
    "wordpress": "operational"
  }
}
```

### Notification Triggers

**Email/Slack Alerts:**
- ❌ Automatic mode stopped unexpectedly
- ⚠️ Quality score below 70 (recurring pattern)
- ⚠️ Publishing failure rate > 10%
- ⚠️ AI API costs spike > $50/day
- ✅ Daily summary: X articles generated, Y published

---

## Configuration & Settings

### System Settings Table

```sql
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
  ('automation_level', 'full_auto', 'automation'),
  ('min_idea_queue_size', '5', 'automation'),
  ('max_generation_parallel', '1', 'automation'),
  ('quality_threshold_publish', '85', 'automation'),
  ('quality_threshold_review', '75', 'automation'),
  ('max_auto_fix_attempts', '3', 'automation'),
  ('cycle_interval_seconds', '300', 'automation'),
  ('enable_auto_publish', 'true', 'automation'),
  ('enable_auto_idea_generation', 'true', 'automation');
```

### UI Toggle

```javascript
// Simple toggle in UI

<div className="flex items-center gap-4">
  <span className="font-medium">Automatic Mode:</span>
  <button
    onClick={() => toggleAutomaticMode()}
    className={`px-4 py-2 rounded-lg ${
      isAutoMode ? 'bg-green-600 text-white' : 'bg-gray-200'
    }`}
  >
    {isAutoMode ? '⚡ ENABLED' : 'OFF'}
  </button>
</div>

{isAutoMode && (
  <div className="mt-4 p-4 bg-green-50 rounded-lg">
    <p>🤖 Automatic mode is running</p>
    <p className="text-sm text-gray-600">
      Next cycle in: {nextCycleCountdown}
    </p>
  </div>
)}
```

---

## Implementation Guide

### Step 1: Backend Setup

```bash
# Create Edge Function
supabase functions new automatic-mode-engine

# Deploy
supabase functions deploy automatic-mode-engine
```

### Step 2: Frontend Integration

```javascript
// src/hooks/useAutomaticMode.js

export function useAutomaticMode() {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState(null);

  async function start() {
    // Call Edge Function to start engine
    await supabase.functions.invoke('automatic-mode-engine', {
      body: { action: 'start' },
    });
    setIsRunning(true);
  }

  async function stop() {
    await supabase.functions.invoke('automatic-mode-engine', {
      body: { action: 'stop' },
    });
    setIsRunning(false);
  }

  // Poll for stats
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(async () => {
        const { data } = await supabase.functions.invoke('automatic-mode-engine', {
          body: { action: 'status' },
        });
        setStats(data);
      }, 5000); // Every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  return { isRunning, stats, start, stop };
}
```

### Step 3: Testing

```javascript
// Test with single cycle

await automaticModeEngine.runCycle();

// Check results
console.log(automaticModeEngine.stats);
```

---

**Document Status:** Complete
**Related Documents:**
- AI Integration Strategy (04-AI-INTEGRATION-STRATEGY.md)
- DataForSEO Integration (08-DATAFORSEO-INTEGRATION.md)
- Implementation Roadmap (05-IMPLEMENTATION-ROADMAP.md)
