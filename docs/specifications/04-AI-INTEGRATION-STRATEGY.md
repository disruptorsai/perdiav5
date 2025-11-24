# Perdia Content Engine - AI Integration Strategy

**Version:** 2.0
**AI Models:** xAI Grok + Anthropic Claude
**Date:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Multi-Model Strategy](#multi-model-strategy)
3. [Grok Integration](#grok-integration)
4. [Claude Integration](#claude-integration)
5. [Prompt Engineering](#prompt-engineering)
6. [Anti-AI-Detection Techniques](#anti-ai-detection-techniques)
7. [Error Handling & Resilience](#error-handling--resilience)
8. [Cost Optimization](#cost-optimization)
9. [Implementation Guide](#implementation-guide)

---

## Overview

### AI Strategy Philosophy

Perdia uses a **two-model, two-pass approach** to content generation:

1. **Grok (xAI) - Drafting Phase**
   - Initial content creation
   - Structured output generation
   - Context-aware writing with web search capabilities
   - Strong performance on educational content

2. **Claude (Anthropic) - Humanization Phase**
   - Content refinement and naturalness
   - Removing AI detection signatures
   - Style adaptation and voice injection
   - Creative language enhancement

This separation allows each model to excel at its strengths while producing undetectable, high-quality content.

### Key Principles

1. **Specialization Over Generalization:** Use the right model for the right task
2. **Layered Processing:** Multiple passes improve quality more than a single complex prompt
3. **Graceful Degradation:** Fallbacks ensure system continues operating if one model fails
4. **Cost Awareness:** Balance quality with token efficiency
5. **Continuous Improvement:** Learn from feedback and update prompts

---

## Multi-Model Strategy

### Task Assignment Matrix

| Task | Primary Model | Fallback Model | Rationale |
|------|---------------|----------------|-----------|
| Article Drafting | **Grok** | Claude | Structured output, web context |
| Content Humanization | **Claude** | Grok | Best at natural language |
| Idea Generation | **Grok** | Claude | Web search for trends |
| SEO Metadata | **Grok** | Claude | Structured JSON output |
| Content Revision | **Claude** | Grok | Instruction following |
| Quality Auto-Fix | **Claude** | Grok | Creative problem-solving |

### Two-Pass Generation Workflow

```
┌────────────────────────────────────────────────────────────┐
│                    CONTENT IDEA                             │
│  Input: Title, keywords, cluster, contributor              │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│              PASS 1: GROK DRAFTING                          │
│                                                             │
│  Prompt: Detailed instructions + context                   │
│  - Author voice profile                                    │
│  - Topic analysis                                          │
│  - Internal linking context (top 50 articles)              │
│  - Structure requirements                                  │
│  - E-E-A-T guidelines                                      │
│                                                             │
│  Output (JSON):                                            │
│  - title: string                                           │
│  - excerpt: string                                         │
│  - content: HTML string                                    │
│  - faqs: [{ question, answer }]                            │
│                                                             │
│  Time: ~60-90 seconds                                      │
│  Tokens: ~6000-10000                                       │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│          PASS 2: CLAUDE HUMANIZATION                        │
│                                                             │
│  Prompt: Rewrite for human-like quality                   │
│  - Increase perplexity (varied vocabulary)                 │
│  - Increase burstiness (varied sentence lengths)           │
│  - Remove AI signature phrases                             │
│  - Inject personal voice/opinions                          │
│  - Maintain factual accuracy                               │
│  - Keep HTML structure                                     │
│                                                             │
│  Input: Grok's HTML content                                │
│  Output: Humanized HTML content                            │
│                                                             │
│  Time: ~30-60 seconds                                      │
│  Tokens: ~4000-8000                                        │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│                SEO METADATA GENERATION                      │
│                  (Grok)                                     │
│                                                             │
│  Prompt: Generate SEO meta from content                    │
│  Output (JSON):                                            │
│  - seo_title: string                                       │
│  - seo_description: string                                 │
│  - keywords: string[]                                      │
│                                                             │
│  Time: ~10-15 seconds                                      │
│  Tokens: ~500-1000                                         │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│              QUALITY CHECK & AUTO-FIX                       │
│                  (Claude if needed)                         │
│                                                             │
│  - Word count validation                                   │
│  - Link count validation                                   │
│  - FAQ validation                                          │
│  - If issues: Claude auto-fix with targeted prompt         │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│                   FINAL ARTICLE                             │
│  Saved to database with all metadata                       │
└────────────────────────────────────────────────────────────┘

Total Time: ~2-4 minutes per article
Total Cost: ~$0.10-0.30 per article (estimated)
```

---

## Grok Integration

### Grok API Configuration

**Endpoint:**
```
POST https://api.x.ai/v1/chat/completions
```

**Authentication:**
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${GROK_API_KEY}`
}
```

**Available Models:**
- `grok-beta` (recommended for production)
- `grok-2` (more capable, slower)
- `grok-vision-beta` (future: image analysis)

### Grok Client Implementation

```javascript
// services/ai/grokClient.js

export class GrokClient {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_GROK_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
  }

  /**
   * Send chat completion request to Grok
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async chat(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'grok-beta',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 8000,
        stream: options.stream || false,
        // Grok-specific features
        web_search: options.webSearch || false, // Enable web search
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Grok API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Generate article draft with structured JSON output
   * @param {string} prompt - Generation prompt
   * @param {Object} schema - Expected JSON schema
   * @returns {Promise<Object>} Parsed article data
   */
  async generateArticleDraft(prompt, schema = {}) {
    const systemPrompt = `You are an expert educational content writer. You MUST respond with ONLY valid JSON matching the specified schema. Do not include any text before or after the JSON.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `${prompt}\n\nRespond with JSON only:
{
  "title": "string (10-200 chars)",
  "excerpt": "string (150-300 chars)",
  "content": "string (HTML, 1500-2500 words)",
  "faqs": [
    { "question": "string", "answer": "string" }
  ]
}`,
      },
    ];

    try {
      const response = await this.chat(messages, {
        temperature: 0.8, // Higher for creativity
        maxTokens: 12000, // Longer articles
        webSearch: true, // Enable web context
      });

      // Extract content from response
      let content = response.choices[0].message.content;

      // Clean potential markdown wrappers
      content = content.replace(/^```json\s*/gim, '');
      content = content.replace(/^```\s*/gim, '');
      content = content.replace(/\s*```$/gim, '');
      content = content.trim();

      // Parse JSON
      const articleData = JSON.parse(content);

      // Validate required fields
      if (!articleData.title || !articleData.content) {
        throw new Error('Missing required fields in Grok response');
      }

      // Validate title length
      if (articleData.title.length < 10 || articleData.title.length > 200) {
        throw new Error(`Invalid title length: ${articleData.title.length}`);
      }

      return articleData;

    } catch (error) {
      console.error('Grok draft generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate content ideas from sources
   * @param {Object} params - Generation parameters
   * @returns {Promise<Array>} Array of ideas
   */
  async generateIdeas({ sources, customTopic, count = 5 }) {
    const sourceContext = sources?.length
      ? `Research these sources: ${sources.join(', ')}`
      : '';

    const prompt = `${sourceContext}

Generate ${count} unique, high-value content ideas for GetEducated.com (educational content site).

${customTopic ? `Focus on: ${customTopic}` : ''}

For each idea, provide:
- title: Compelling, SEO-friendly title (10-70 chars)
- description: What the article will cover (100-200 words)
- keywords: Array of 3-5 target keywords
- content_type: "listicle" | "guide" | "ranking" | "faq" | "degree_page"
- priority: "high" | "medium" | "low"
- target_audience: Who will read this

Respond with JSON array only.`;

    const messages = [
      {
        role: 'system',
        content: 'You are a content strategist specializing in educational content.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.chat(messages, {
      temperature: 0.9, // High creativity for ideas
      webSearch: true, // Get latest trends
    });

    let content = response.choices[0].message.content;
    content = content.replace(/^```json\s*/gim, '').replace(/^```\s*/gim, '').replace(/\s*```$/gim, '').trim();

    const ideas = JSON.parse(content);
    return Array.isArray(ideas) ? ideas : [ideas];
  }

  /**
   * Generate SEO metadata
   * @param {string} title - Article title
   * @param {string} content - Article content (first 1000 chars)
   * @returns {Promise<Object>} SEO metadata
   */
  async generateSEOMetadata(title, content) {
    const prompt = `Generate SEO metadata for this article:

TITLE: ${title}
CONTENT PREVIEW: ${content.substring(0, 1000)}...

Respond with JSON only:
{
  "seo_title": "string (50-60 chars, optimized for Google)",
  "seo_description": "string (150-160 chars, compelling meta description)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const messages = [
      { role: 'user', content: prompt },
    ];

    const response = await this.chat(messages, {
      temperature: 0.5, // Lower for consistency
      maxTokens: 500,
    });

    let content_text = response.choices[0].message.content;
    content_text = content_text.replace(/^```json\s*/gim, '').replace(/^```\s*/gim, '').replace(/\s*```$/gim, '').trim();

    return JSON.parse(content_text);
  }
}

export const grokClient = new GrokClient();
```

### Grok Usage Patterns

**Pattern 1: Structured Output (Preferred)**
```javascript
const articleData = await grokClient.generateArticleDraft(prompt, schema);
// Returns clean JSON object
```

**Pattern 2: Streaming (Future Enhancement)**
```javascript
const stream = await grokClient.chat(messages, { stream: true });
// Real-time updates to UI
```

---

## Claude Integration

### Claude API Configuration

**SDK:**
```bash
npm install @anthropic-ai/sdk
```

**Authentication:**
```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});
```

**Recommended Model:**
- `claude-3-5-sonnet-20250122` (latest Sonnet 3.5)
- High intelligence, excellent instruction-following
- Strong creative writing capabilities
- 200K context window

### Claude Client Implementation

```javascript
// services/ai/claudeClient.js
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  constructor(apiKey) {
    this.client = new Anthropic({
      apiKey: apiKey || import.meta.env.VITE_CLAUDE_API_KEY,
      // For frontend use (NOT RECOMMENDED - move to backend)
      dangerouslyAllowBrowser: true,
    });
    this.model = 'claude-3-5-sonnet-20250122';
  }

  /**
   * Create a message with Claude
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Response text
   */
  async createMessage(messages, options = {}) {
    try {
      const response = await this.client.messages.create({
        model: options.model || this.model,
        max_tokens: options.maxTokens || 8000,
        temperature: options.temperature ?? 1.0, // Default high for creativity
        messages,
        system: options.systemPrompt || undefined,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Humanize AI-generated content
   * @param {string} content - Original HTML content
   * @param {string} styleProfile - Author's writing style profile
   * @returns {Promise<string>} Humanized HTML content
   */
  async humanizeContent(content, styleProfile) {
    const systemPrompt = `You are a master content editor specializing in making AI-generated text indistinguishable from human writing.

Your expertise:
- Increasing perplexity (unpredictable word choices)
- Increasing burstiness (varied sentence lengths)
- Removing AI detection signatures
- Injecting personal voice and opinions
- Maintaining factual accuracy

CRITICAL: Preserve all HTML tags and structure. Only modify the text content.`;

    const prompt = `Rewrite this article to make it completely undetectable as AI-generated while maintaining all information and structure.

ORIGINAL CONTENT:
${content}

AUTHOR STYLE PROFILE:
${styleProfile}

HUMANIZATION REQUIREMENTS:

1. PERPLEXITY (Unpredictability):
   - Replace predictable word choices with unexpected but appropriate alternatives
   - Vary vocabulary throughout (avoid repetitive phrasing)
   - Use less common synonyms occasionally
   - Mix formal and casual language naturally

2. BURSTINESS (Sentence Variation):
   - Create dramatic variation in sentence length
   - Short punchy sentences. Like this.
   - Followed by longer, more complex sentences that develop ideas with multiple clauses and provide detailed explanations or examples.
   - Then medium sentences for balance.
   - Avoid consistent, uniform sentence patterns

3. REMOVE AI SIGNATURES:
   - NEVER use: "Furthermore", "Moreover", "Indeed", "In conclusion", "It's important to note"
   - NEVER start consecutive paragraphs the same way
   - NEVER use formulaic transitions
   - NEVER write in perfect, mechanical patterns

4. INJECT HUMAN ELEMENTS:
   - Add occasional personal touches ("I think", "In my experience")
   - Include subtle opinions or perspectives
   - Use contractions naturally (don't, it's, you're)
   - Start some sentences with "And" or "But"
   - Use em-dashes — like this — for emphasis
   - Add occasional ellipses... for trailing thoughts

5. MAINTAIN:
   - All factual information and data
   - HTML structure and tags
   - Overall message and purpose
   - Professional quality

Return ONLY the rewritten HTML content. No explanations.`;

    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const humanizedContent = await this.createMessage(messages, {
        temperature: 1.0, // Maximum creativity
        maxTokens: 8000,
        systemPrompt,
      });

      // Clean any potential markdown artifacts
      return humanizedContent
        .replace(/^```html\s*/gim, '')
        .replace(/^```\s*/gim, '')
        .replace(/\s*```$/gim, '')
        .trim();

    } catch (error) {
      console.error('Humanization failed:', error);
      // Fallback: return original content
      return content;
    }
  }

  /**
   * Revise content based on editorial feedback
   * @param {string} content - Original content
   * @param {Array} feedback - Array of feedback items
   * @returns {Promise<string>} Revised content
   */
  async reviseWithFeedback(content, feedback) {
    const feedbackText = feedback.map((item, index) =>
      `${index + 1}. [${item.category}] (${item.severity}): "${item.selected_text}"
   Comment: ${item.comment}`
    ).join('\n\n');

    const prompt = `Revise this article based on editorial feedback:

ORIGINAL CONTENT:
${content}

EDITORIAL FEEDBACK:
${feedbackText}

ADDRESS ALL FEEDBACK ITEMS:
- Make necessary factual corrections
- Adjust tone and style as requested
- Fix structural issues
- Add missing elements (links, citations, etc.)
- Improve clarity and readability

Return ONLY the fully revised HTML content.`;

    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const revised = await this.createMessage(messages, {
      temperature: 0.7,
      maxTokens: 10000,
    });

    return revised
      .replace(/^```html\s*/gim, '')
      .replace(/^```\s*/gim, '')
      .replace(/\s*```$/gim, '')
      .trim();
  }

  /**
   * Auto-fix quality issues
   * @param {string} content - Original content
   * @param {Array} issues - Array of quality issues
   * @param {Array} siteArticles - Available articles for internal linking
   * @returns {Promise<string>} Fixed content
   */
  async autoFixQualityIssues(content, issues, siteArticles = []) {
    const issuesText = issues.join('\n- ');

    const linksContext = siteArticles.length > 0
      ? `\n\nAVAILABLE ARTICLES FOR INTERNAL LINKING:\n${siteArticles.map(a => `- "${a.title}" (${a.url})`).join('\n')}`
      : '';

    const prompt = `Fix the following quality issues in this article:

ISSUES TO FIX:
- ${issuesText}

ORIGINAL CONTENT:
${content}
${linksContext}

REQUIREMENTS:
- Add content naturally to meet word count if needed
- Add 3-5 relevant internal links using the provided article list (use natural anchor text from existing content)
- Add 2-4 external citations from authoritative sources (.gov, .edu, BLS, NCES)
- Add or expand FAQs to have at least 3 high-quality question-answer pairs
- Maintain existing content quality and voice
- Preserve all HTML structure

Return ONLY the complete, improved HTML content.`;

    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const fixed = await this.createMessage(messages, {
      temperature: 0.8,
      maxTokens: 12000,
    });

    return fixed
      .replace(/^```html\s*/gim, '')
      .replace(/^```\s*/gim, '')
      .replace(/\s*```$/gim, '')
      .trim();
  }
}

export const claudeClient = new ClaudeClient();
```

---

## Prompt Engineering

### Draft Prompt Structure (Grok)

```javascript
// services/ai/promptBuilder.js

export function buildDraftPrompt({
  idea,
  contributor,
  cluster,
  siteArticles,
  keywords,
}) {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `# EDUCATIONAL ARTICLE GENERATION

## ASSIGNMENT
Write a comprehensive, SEO-optimized article about: "${idea.title}"

${idea.description ? `\nDescription: ${idea.description}` : ''}

## CONTENT TYPE
${idea.content_type || 'guide'}

## TARGET KEYWORDS
${keywords?.join(', ') || idea.keywords?.join(', ') || 'N/A'}

## CLUSTER CONTEXT
${cluster ? `Topic Cluster: ${cluster.name}\n${cluster.content_brief || ''}` : 'N/A'}

---

## WRITE LIKE A HUMAN FROM THE START

This is CRITICAL: You must write in a way that is completely indistinguishable from human writing.

### PERPLEXITY (Unpredictability):
- Use varied, sometimes unexpected word choices
- Avoid predictable, formulaic phrasing
- Mix vocabulary levels naturally
- Don't repeat the same expressions

### BURSTINESS (Sentence Variation):
- Dramatically vary sentence length
- Short sentences. Quick points.
- Then longer, more flowing sentences that develop complex ideas with multiple clauses and rich detail.
- Mix it up constantly.

### BANNED AI PHRASES (NEVER USE):
- "Furthermore" / "Moreover" / "Additionally"
- "It's important to note that"
- "In conclusion" / "To summarize"
- "Indeed" / "Notably"
- "Delve into"
- "It's worth noting"
- Perfect, mechanical transitions

### HUMAN TOUCHES (ALWAYS INCLUDE):
- Contractions (don't, it's, you're, we'll)
- Occasional "And" or "But" starting sentences
- Personal perspectives when appropriate
- Conversational asides
- Em-dashes — for emphasis
- Natural, imperfect flow

---

## AUTHOR VOICE & STYLE PROFILE (CRITICAL)

Author: ${contributor.name}
Expertise: ${contributor.expertise_areas?.join(', ')}

${contributor.writing_style_profile}

YOU MUST write in this author's distinctive voice. This is not optional.

---

## GOOGLE QUALITY ALIGNMENT (MANDATORY)

### E-E-A-T Requirements:
1. **Experience**: Include practical insights and real-world applications
2. **Expertise**: Demonstrate subject matter knowledge with specific details
3. **Authoritativeness**: Reference authoritative sources (cite BLS, NCES, .gov, .edu)
4. **Trustworthiness**: Provide accurate, verifiable information

### Content Quality Standards:
- Accurate, fact-checked information
- Clear, helpful advice for readers
- Original insights and analysis
- Well-structured with clear headings
- Comprehensive coverage of topic

---

## QUALITY GUARDRAILS (Spam Prevention)

DO NOT:
- Stuff keywords unnaturally
- Create thin, low-value content
- Copy content from other sources
- Use manipulative tactics
- Generate misleading information
- Create doorway pages
- Use hidden text or links

DO:
- Write for humans first, search engines second
- Provide genuine value to readers
- Use keywords naturally in context
- Create comprehensive, helpful content
- Maintain high editorial standards

---

## STRUCTURE REQUIREMENTS

### Word Count:
- Target: 1500-2500 words
- Minimum: 1200 words

### Required Elements:
1. **Compelling Introduction** (150-200 words)
   - Hook the reader immediately
   - Clearly state what they'll learn
   - Set context and relevance

2. **Well-Organized Body** (Use H2 and H3 headings)
   - ${idea.content_type === 'listicle' ? 'Create 7-10 list items with detailed explanations' : ''}
   - ${idea.content_type === 'guide' ? 'Create step-by-step sections or thematic divisions' : ''}
   - ${idea.content_type === 'ranking' ? 'Rank 5-10 items with clear criteria and detailed analysis' : ''}
   - ${idea.content_type === 'faq' ? 'Organize around 8-12 key questions with comprehensive answers' : ''}
   - Use specific examples and data
   - Include statistics where relevant (cite sources)
   - Break up long paragraphs

3. **Strong Conclusion** (100-150 words)
   - Summarize key takeaways
   - Provide actionable next steps
   - End with encouragement or call-to-action

4. **FAQ Section** (3-5 questions minimum)
   - Answer common questions not covered in main content
   - Use natural language questions
   - Provide concise, helpful answers

### Internal Links Context:
${siteArticles?.length > 0 ? `
You should reference and link to these existing articles where naturally relevant:

${siteArticles.slice(0, 15).map(a => `- "${a.title}" - ${a.url} (${a.category})`).join('\n')}

Use natural anchor text, NOT generic "click here" or "read more".
` : 'Internal linking will be added in post-processing.'}

### External Citations:
- Include 2-4 citations to authoritative sources
- Prefer: BLS.gov, NCES.ed.gov, other .gov, .edu sites
- Format: Inline mentions with context
- Example: "According to the Bureau of Labor Statistics, median salary..."

---

## OUTPUT FORMAT

Respond with ONLY valid JSON (no markdown, no extra text):

{
  "title": "SEO-optimized title (10-70 characters)",
  "excerpt": "Compelling summary for meta description (150-300 characters)",
  "content": "Full HTML content with proper heading tags, paragraphs, lists, etc.",
  "faqs": [
    {
      "question": "Natural language question",
      "answer": "Comprehensive answer (50-150 words)"
    }
  ]
}

### HTML Content Guidelines:
- Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>
- Do NOT use <h1> (reserved for page title)
- Start with engaging introduction paragraphs
- Use headings to organize sections
- Break content into scannable chunks
- Include bullet points and numbered lists where appropriate

---

## FINAL CHECKLIST

Before responding, verify:
- [ ] Written in ${contributor.name}'s voice
- [ ] High perplexity (varied, unexpected language)
- [ ] High burstiness (dramatic sentence length variation)
- [ ] No AI signature phrases
- [ ] Human touches included (contractions, etc.)
- [ ] Accurate, helpful, original content
- [ ] 1500-2500 words
- [ ] Proper HTML structure
- [ ] 3+ FAQs included
- [ ] E-E-A-T principles followed
- [ ] Valid JSON format

Current Date: ${currentDate} (use for any time-sensitive information)
Current Year: ${currentYear}

BEGIN WRITING.`;
}
```

### Humanization Prompt (Claude)

```javascript
export function buildHumanizationPrompt(content, contributor) {
  return `Rewrite this article to make it completely undetectable as AI-generated.

${content}

AUTHOR VOICE:
${contributor.writing_style_profile}

Apply these transformations:

1. PERPLEXITY: Replace 20-30% of word choices with less predictable alternatives
2. BURSTINESS: Create extreme sentence length variation (3-word sentences, then 50-word sentences)
3. REMOVE AI TELLS: Eliminate any remaining "Furthermore", "Moreover", "Indeed", etc.
4. ADD HUMANITY: Inject personal voice, opinions, contractions, conversational elements
5. MAINTAIN FACTS: Keep all data, statistics, and factual claims accurate

Return ONLY the rewritten HTML. No explanations.`;
}
```

---

## Anti-AI-Detection Techniques

### Research-Backed Methods

Based on latest AI detection research (GPTZero, Originality.ai, Turnitin):

1. **Perplexity Enhancement**
   - Definition: Measure of text unpredictability
   - Human writing: High perplexity (varied word choices)
   - AI writing: Low perplexity (predictable patterns)
   - **Solution:** Force LLM to use unexpected vocabulary

2. **Burstiness Increase**
   - Definition: Variation in sentence lengths
   - Human writing: High burstiness (3 words. Then 45 words...)
   - AI writing: Low burstiness (consistent 15-20 word sentences)
   - **Solution:** Explicitly instruct varied sentence structure

3. **AI Signature Removal**
   - Certain phrases are AI tells: "Furthermore", "Moreover", "Indeed"
   - Transition patterns that are too perfect
   - **Solution:** Ban specific phrases, require imperfect transitions

4. **Voice Injection**
   - Humans have opinions, biases, personal experiences
   - AI tends toward neutral, objective tone
   - **Solution:** Require personal perspectives and voice

5. **Natural Imperfections**
   - Humans use contractions, start sentences with "And"/"But"
   - Humans use em-dashes, ellipses, parenthetical asides
   - **Solution:** Explicitly require these elements

### Detection Testing Workflow

```javascript
// services/detectionTesting.js

export async function testAIDetection(content, articleId) {
  // Placeholder for future integration
  // Will integrate with GPTZero API, Originality.ai, etc.

  const results = {
    article_id: articleId,
    tested_at: new Date().toISOString(),
    scores: [],
  };

  // GPTZero API call (example)
  // const gptzeroScore = await fetch('https://api.gptzero.me/v2/predict/text', {
  //   method: 'POST',
  //   headers: { 'x-api-key': GPTZERO_API_KEY },
  //   body: JSON.stringify({ document: content }),
  // });

  // results.scores.push({
  //   tool_name: 'GPTZero',
  //   raw_score: gptzeroScore.completely_generated_prob,
  //   interpretation: gptzeroScore.completely_generated_prob < 0.3 ? 'PASS' : 'FAIL',
  // });

  // Save to detection_research_logs table
  // await supabase.from('detection_test_results').insert(results);

  return results;
}
```

---

## Error Handling & Resilience

### Retry Strategy with Exponential Backoff

```javascript
// services/ai/retryHandler.js

export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableErrors = [429, 500, 502, 503, 504], // HTTP status codes
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error.status && retryableErrors.includes(error.status) ||
        error.message?.includes('timeout') ||
        error.message?.includes('network');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const draft = await withRetry(
  () => grokClient.generateArticleDraft(prompt),
  { maxRetries: 3 }
);
```

### Fallback Strategy

```javascript
// services/aiService.js

export class AIService {
  async generateDraft(idea, contributor, siteArticles) {
    try {
      // Primary: Grok
      return await withRetry(() =>
        grokClient.generateArticleDraft(
          buildDraftPrompt({ idea, contributor, siteArticles })
        )
      );
    } catch (error) {
      console.error('Grok failed, falling back to Claude:', error);

      // Fallback: Claude
      try {
        const prompt = buildDraftPrompt({ idea, contributor, siteArticles });
        const content = await claudeClient.createMessage([
          { role: 'user', content: prompt }
        ]);

        // Parse Claude's response (may not be JSON)
        // Manual JSON extraction logic here...
        return parsedContent;
      } catch (fallbackError) {
        console.error('Both AI providers failed:', fallbackError);
        throw new Error('Article generation failed: All AI providers unavailable');
      }
    }
  }

  async humanizeArticle(content, contributor) {
    try {
      // Primary: Claude
      return await withRetry(() =>
        claudeClient.humanizeContent(content, contributor.writing_style_profile)
      );
    } catch (error) {
      console.error('Claude humanization failed:', error);

      // Fallback: Grok (less ideal)
      try {
        const prompt = buildHumanizationPrompt(content, contributor);
        const response = await grokClient.chat([
          { role: 'user', content: prompt }
        ]);
        return response.choices[0].message.content;
      } catch (fallbackError) {
        console.error('Humanization completely failed:', fallbackError);
        // Last resort: return original content
        return content;
      }
    }
  }
}
```

---

## Cost Optimization

### Token Usage Tracking

```javascript
// services/ai/tokenTracker.js

export class TokenTracker {
  constructor() {
    this.usage = {
      grok: { total_tokens: 0, cost: 0 },
      claude: { total_tokens: 0, cost: 0 },
    };
  }

  trackGrok(promptTokens, completionTokens) {
    const total = promptTokens + completionTokens;
    // Grok pricing (estimate): $5 per 1M tokens
    const cost = (total / 1000000) * 5;

    this.usage.grok.total_tokens += total;
    this.usage.grok.cost += cost;

    return cost;
  }

  trackClaude(inputTokens, outputTokens) {
    const total = inputTokens + outputTokens;
    // Claude Sonnet pricing: $3 per 1M input, $15 per 1M output
    const cost = (inputTokens / 1000000) * 3 + (outputTokens / 1000000) * 15;

    this.usage.claude.total_tokens += total;
    this.usage.claude.cost += cost;

    return cost;
  }

  getReport() {
    const totalCost = this.usage.grok.cost + this.usage.claude.cost;
    return {
      ...this.usage,
      total_cost: totalCost,
      breakdown: {
        grok_percentage: (this.usage.grok.cost / totalCost) * 100,
        claude_percentage: (this.usage.claude.cost / totalCost) * 100,
      },
    };
  }
}

export const tokenTracker = new TokenTracker();
```

### Cost-Saving Strategies

1. **Prompt Optimization:**
   - Remove unnecessary examples and verbosity
   - Use concise instructions
   - Cache frequently used prompt segments

2. **Context Window Management:**
   - Limit site articles context to top 15-20 (not 50)
   - Summarize cluster briefs instead of full text
   - Truncate content previews

3. **Smart Caching:**
   - Cache contributor style profiles
   - Cache cluster content briefs
   - Cache common prompt segments

4. **Batch Operations:**
   - Generate ideas in batches (5 at once, not 1 at a time)
   - Reuse context across similar articles

5. **Model Selection:**
   - Use smaller/faster models for simple tasks
   - Reserve premium models for critical steps

---

## Implementation Guide

### Step 1: Environment Setup

```bash
# .env.local
VITE_GROK_API_KEY=your_grok_api_key
VITE_CLAUDE_API_KEY=your_claude_api_key
```

### Step 2: Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### Step 3: Create Service Layer

```
src/services/ai/
├── grokClient.js
├── claudeClient.js
├── promptBuilder.js
├── retryHandler.js
├── tokenTracker.js
└── aiService.js (orchestrator)
```

### Step 4: Backend Edge Function (Recommended)

```typescript
// supabase/functions/generate-article/index.ts

import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { GrokClient } from './grokClient.ts';
import { ClaudeClient } from './claudeClient.ts';

serve(async (req) => {
  const { ideaId } = await req.json();

  // Initialize clients
  const grok = new GrokClient(Deno.env.get('GROK_API_KEY'));
  const claude = new ClaudeClient(Deno.env.get('CLAUDE_API_KEY'));

  // Fetch idea, contributor, etc from database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: idea } = await supabase
    .from('content_ideas')
    .select('*, clusters(*), article_contributors(*)')
    .eq('id', ideaId)
    .single();

  // Generate draft with Grok
  const draft = await grok.generateArticleDraft(buildDraftPrompt(idea));

  // Humanize with Claude
  const humanized = await claude.humanizeContent(
    draft.content,
    idea.article_contributors.writing_style_profile
  );

  // Save article
  const { data: article } = await supabase
    .from('articles')
    .insert({
      title: draft.title,
      content: humanized,
      excerpt: draft.excerpt,
      faqs: draft.faqs,
      contributor_id: idea.contributor_id,
      cluster_id: idea.cluster_id,
      status: 'qa',
    })
    .select()
    .single();

  return new Response(JSON.stringify({ article }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

**Document Status:** Complete
**Next Document:** Feature Specifications
