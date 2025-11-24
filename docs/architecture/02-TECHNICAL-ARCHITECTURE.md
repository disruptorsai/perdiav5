# Perdia Content Engine - Technical Architecture

**Version:** 2.0
**Date:** January 2025
**Status:** Planning Phase

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Data Architecture](#data-architecture)
7. [AI Integration Architecture](#ai-integration-architecture)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Technology Stack](#technology-stack)

---

## System Overview

Perdia is a modern, cloud-native web application built on a JAMstack architecture with serverless backend services. The system leverages Supabase for backend infrastructure, React for the frontend, and integrates with multiple AI providers for content generation.

### Architecture Style

- **Frontend:** Single Page Application (SPA) with React
- **Backend:** Serverless (Supabase Edge Functions + PostgreSQL)
- **Database:** PostgreSQL with Row Level Security
- **API:** RESTful + Real-time subscriptions
- **Deployment:** Distributed (Netlify CDN + Supabase Cloud)

### Key Design Decisions

1. **Supabase over Base44:** Open-source, PostgreSQL-based, better scaling, no vendor lock-in
2. **Direct AI API calls:** No wrapper services, better control, lower latency
3. **Two-model AI strategy:** Specialized models for different tasks (Grok + Claude)
4. **Real-time updates:** Supabase subscriptions for collaborative features
5. **Edge computing:** Netlify Edge + Supabase Edge for global performance

---

## Architecture Principles

### 1. Separation of Concerns

- **Presentation Layer:** React components (UI only)
- **Business Logic Layer:** Custom hooks, services, utilities
- **Data Layer:** Supabase client, API wrappers
- **AI Layer:** Separate service for AI provider integrations

### 2. Scalability

- **Horizontal scaling:** Serverless functions scale automatically
- **Database scaling:** PostgreSQL with connection pooling
- **Caching:** React Query for client-side, CDN for assets
- **Async processing:** Queue-based generation for long-running tasks

### 3. Maintainability

- **Modular architecture:** Feature-based folder structure
- **Type safety:** TypeScript (recommended) or JSDoc
- **Code reusability:** Shared components, custom hooks
- **Documentation:** Inline comments, README files

### 4. Security First

- **Zero-trust model:** Every request authenticated and authorized
- **Row Level Security:** Database-level access control
- **Secrets management:** Environment variables, no hardcoded keys
- **Input validation:** Client and server-side validation

### 5. Performance

- **Code splitting:** Lazy loading for routes and components
- **Optimistic updates:** Immediate UI feedback
- **Debouncing/throttling:** Reduce unnecessary API calls
- **Image optimization:** Lazy loading, compression

### 6. Developer Experience

- **Hot reload:** Vite dev server
- **Clear error messages:** Helpful debugging
- **Consistent patterns:** Reusable code patterns
- **Fast feedback:** Quick build and test cycles

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              React SPA (Vite)                              │ │
│  │  - Components (UI)                                         │ │
│  │  - React Query (State Management)                          │ │
│  │  - React Router (Navigation)                               │ │
│  │  - Supabase Client (Data)                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NETLIFY CDN                                 │
│  - Static Assets (JS, CSS, Images)                              │
│  - Edge Functions (Optional)                                    │
│  - Continuous Deployment from Git                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   SUPABASE CLOUD     │              │   AI PROVIDERS       │
│                      │              │                      │
│ ┌────────────────┐   │              │ ┌────────────────┐  │
│ │  PostgreSQL DB │   │              │ │   xAI Grok     │  │
│ │  - 14 Entities │   │              │ │  (Drafting)    │  │
│ │  - RLS Policies│   │              │ └────────────────┘  │
│ │  - Indexes     │   │              │                      │
│ └────────────────┘   │              │ ┌────────────────┐  │
│                      │              │ │ Anthropic      │  │
│ ┌────────────────┐   │              │ │  Claude        │  │
│ │  Supabase Auth │   │              │ │ (Humanization) │  │
│ │  - JWT Tokens  │   │              │ └────────────────┘  │
│ └────────────────┘   │              └──────────────────────┘
│                      │                         │
│ ┌────────────────┐   │                         │
│ │ Edge Functions │◄──┼─────────────────────────┘
│ │  - AI Orchestr.│   │        AI API Calls
│ │  - WP Publish  │   │
│ └────────────────┘   │
│                      │
│ ┌────────────────┐   │
│ │  Storage       │   │
│ │  - Images      │   │
│ │  - Files       │   │
│ └────────────────┘   │
└──────────────────────┘
           │
           │ WordPress REST API
           ▼
┌──────────────────────┐
│   WORDPRESS SITE     │
│ - GetEducated.com    │
│ - REST API v2        │
│ - Yoast SEO          │
└──────────────────────┘
```

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn UI components (Button, Card, etc.)
│   ├── layout/                # Layout components (Header, Sidebar, etc.)
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── KanbanBoard.jsx
│   │   ├── ArticleCard.jsx
│   │   ├── GeneratingOverlay.jsx
│   │   └── SourceSelector.jsx
│   ├── editor/                # Article editor components
│   │   ├── RichTextEditor.jsx
│   │   ├── QualityChecklist.jsx
│   │   ├── SchemaGenerator.jsx
│   │   └── ProductionPreview.jsx
│   ├── article/               # Article-related components
│   │   ├── PromptBuilder.jsx
│   │   ├── AutoLinker.jsx
│   │   └── ContributorAssignment.jsx
│   ├── workflow/              # Workflow components
│   ├── analytics/             # Analytics components
│   └── shared/                # Shared/reusable components
│
├── pages/                     # Page components (routes)
│   ├── Dashboard.jsx
│   ├── ContentLibrary.jsx
│   ├── ArticleEditor.jsx
│   ├── Analytics.jsx
│   ├── Settings.jsx
│   └── ...
│
├── hooks/                     # Custom React hooks
│   ├── useArticles.js         # Article data fetching
│   ├── useGeneration.js       # Generation state management
│   ├── useSupabase.js         # Supabase client wrapper
│   ├── useAI.js               # AI API integration
│   └── useWordPress.js        # WordPress API integration
│
├── services/                  # Business logic services
│   ├── supabaseClient.js      # Supabase initialization
│   ├── aiService.js           # AI provider orchestration
│   ├── wordpressService.js    # WordPress API wrapper
│   ├── generationService.js   # Article generation logic
│   └── validationService.js   # Content validation
│
├── lib/                       # Utilities and helpers
│   ├── utils.js               # General utilities (cn, etc.)
│   ├── constants.js           # App constants
│   ├── validation.js          # Validation schemas (Zod)
│   └── formatting.js          # Text formatting utilities
│
├── contexts/                  # React contexts
│   ├── AuthContext.jsx        # Authentication state
│   ├── ThemeContext.jsx       # Theme (dark/light mode)
│   └── GenerationContext.jsx  # Generation queue state
│
├── types/                     # TypeScript types (if using TS)
│   ├── database.types.ts      # Supabase generated types
│   ├── api.types.ts           # API response types
│   └── component.types.ts     # Component prop types
│
├── App.jsx                    # Root component
├── main.jsx                   # Entry point
└── index.css                  # Global styles
```

### Data Flow Architecture

**React Query Pattern:**

```javascript
// 1. Custom hook wraps useQuery
export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 30000, // 30 seconds
  });
}

// 2. Component uses the hook
function ContentLibrary() {
  const { data: articles, isLoading, error } = useArticles();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <ArticleList articles={articles} />;
}

// 3. Mutations update data and invalidate cache
function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
```

### State Management Strategy

**Global State (React Context):**
- Authentication state (user, session)
- Theme preferences (dark/light)
- Generation queue state

**Server State (React Query):**
- Articles, ideas, contributors (database entities)
- Cached with automatic background refetch
- Optimistic updates for better UX

**Local State (useState):**
- Form inputs
- UI state (modals, dropdowns)
- Temporary data

**URL State (React Router):**
- Current page/route
- Search filters
- Article ID being edited

### Routing Structure

```javascript
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />

    {/* Protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/library" element={<ContentLibrary />} />
      <Route path="/editor/:id?" element={<ArticleEditor />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/ideas" element={<IdeaGenerator />} />
      <Route path="/contributors" element={<ContributorSetup />} />
      <Route path="/catalog" element={<SiteCatalog />} />
      <Route path="/review" element={<ReviewQueue />} />
      <Route path="/training" element={<AITraining />} />
      <Route path="/keywords" element={<KeywordsAndClusters />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## Backend Architecture

### Supabase Services

**1. PostgreSQL Database**
- Primary data store
- ACID compliance
- JSON/JSONB support for flexible schemas
- Full-text search
- PostGIS for geo data (future)

**2. Authentication**
- JWT-based authentication
- Email/password, OAuth providers
- Row Level Security integration
- Session management
- Password reset flows

**3. Storage**
- S3-compatible object storage
- Image uploads and serving
- Access control policies
- CDN integration

**4. Edge Functions (Deno Runtime)**
- Serverless TypeScript/JavaScript
- Global distribution
- Environment secrets
- CORS handling

**5. Realtime**
- WebSocket subscriptions
- Database change notifications
- Presence (who's online)
- Broadcast messages

### Edge Functions Architecture

```
supabase/
└── functions/
    ├── generate-article/
    │   ├── index.ts              # Main handler
    │   ├── drafting.ts           # Grok drafting logic
    │   ├── humanization.ts       # Claude humanization
    │   ├── quality-check.ts      # QA validation
    │   └── auto-fix.ts           # Auto-fix logic
    │
    ├── publish-to-wordpress/
    │   ├── index.ts              # WordPress API handler
    │   ├── auth.ts               # WP authentication
    │   └── payload-builder.ts    # Post payload construction
    │
    ├── generate-ideas/
    │   ├── index.ts              # Idea generation handler
    │   └── similarity-check.ts   # Duplicate detection
    │
    ├── import-site-articles/
    │   ├── index.ts              # Bulk import handler
    │   └── scraper.ts            # Article scraping logic
    │
    └── _shared/
        ├── supabase-client.ts    # Authenticated Supabase client
        ├── ai-clients.ts         # Grok + Claude clients
        ├── error-handling.ts     # Centralized error handling
        └── validation.ts         # Input validation schemas
```

### API Endpoints

**Database (Auto-generated REST API):**
```
GET    /rest/v1/articles                  # List articles
GET    /rest/v1/articles?id=eq.123       # Get article by ID
POST   /rest/v1/articles                  # Create article
PATCH  /rest/v1/articles?id=eq.123       # Update article
DELETE /rest/v1/articles?id=eq.123       # Delete article

# Similar endpoints for all 14 entities
```

**Edge Functions (Custom Business Logic):**
```
POST /functions/v1/generate-article
  Body: { ideaId: string }
  Response: { articleId: string, status: string }

POST /functions/v1/publish-to-wordpress
  Body: { articleId: string, connectionId: string }
  Response: { wordpressPostId: number, url: string }

POST /functions/v1/generate-ideas
  Body: { sources: string[], customTopic?: string }
  Response: { ideas: Idea[] }

POST /functions/v1/import-site-articles
  Body: { urls: string[] }
  Response: { imported: number, failed: number }

POST /functions/v1/auto-fix-article
  Body: { articleId: string, issues: string[] }
  Response: { success: boolean, updatedContent: string }
```

### Database Connection Pattern

```javascript
// Service layer (backend)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Service role client (bypasses RLS, for backend use)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Frontend client (respects RLS, for client use)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Data Architecture

### Entity Relationship Diagram

```
┌─────────────────┐
│     User        │
│  (Supabase Auth)│
└────────┬────────┘
         │
         │ created_by
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Article                              │
│  - id, title, slug, content, excerpt                        │
│  - contributor_id → ArticleContributor                      │
│  - cluster_id → Cluster                                     │
│  - wordpress_site_id → WordPressConnection                  │
│  - status, type, quality_score, risk_flags                  │
└────────┬─────────────────────────────┬──────────────────────┘
         │                             │
         │                             │ article_id
         │                             ▼
         │                     ┌──────────────────┐
         │                     │ ArticleRevision  │
         │                     │  - comment       │
         │                     │  - severity      │
         │                     │  - category      │
         │                     └──────────────────┘
         │
         │ article_id                  ┌──────────────────┐
         └────────────────────────────►│ TrainingData     │
                                       │  - original      │
                                       │  - revised       │
                                       │  - feedback      │
                                       └──────────────────┘

┌─────────────────┐
│  ContentIdea    │        ┌─────────────────────┐
│  - title        │────────│  ArticleContributor │
│  - keywords     │        │  - name, expertise  │
│  - status       │        │  - style_profile    │
│  - article_id   │        │  - wp_user_id       │
└─────────────────┘        └─────────────────────┘
         │
         │ cluster_id
         ▼
┌─────────────────┐
│    Cluster      │
│  - name         │
│  - description  │
│  - parent_id    │◄───┐ (self-referencing)
└─────────────────┘    │
         │             │
         └─────────────┘
         │
         │ cluster_id
         ▼
┌─────────────────┐
│    Keyword      │
│  - keyword      │
│  - intent       │
│  - difficulty   │
└─────────────────┘

┌─────────────────────┐
│   SiteArticle       │
│  - url, title       │
│  - category, topics │
│  - excerpt          │
└─────────────────────┘

┌──────────────────────┐
│ WordPressConnection  │
│  - site_url          │
│  - auth_type         │
│  - credentials       │
└──────────────────────┘

┌─────────────────┐
│ SystemSetting   │
│  - setting_key  │
│  - setting_value│
└─────────────────┘

┌─────────────────┐
│   Shortcode     │
│  - name, syntax │
│  - validation   │
└─────────────────┘
```

### Database Schema Design Patterns

**1. Timestamp Pattern (All Tables)**
```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**2. Soft Delete Pattern (Where Applicable)**
```sql
deleted_at TIMESTAMP WITH TIME ZONE
is_active BOOLEAN DEFAULT TRUE
```

**3. JSON Column Pattern (Flexible Data)**
```sql
-- Arrays
target_keywords TEXT[]
risk_flags TEXT[]

-- Objects
faqs JSONB  -- [{ question: string, answer: string }]
seo_meta JSONB  -- { title: string, description: string }
```

**4. Foreign Key Pattern (Relationships)**
```sql
contributor_id UUID REFERENCES article_contributors(id) ON DELETE SET NULL
cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL
```

**5. Enum Pattern (Controlled Values)**
```sql
-- Create enum type
CREATE TYPE article_status AS ENUM (
  'idea', 'drafting', 'refinement', 'qa', 'approved', 'published', 'rejected'
);

-- Use in table
status article_status DEFAULT 'idea'
```

### Indexing Strategy

**Primary Indexes:**
```sql
-- Frequent lookups
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_contributor ON articles(contributor_id);
CREATE INDEX idx_articles_created ON articles(created_at DESC);

-- Search
CREATE INDEX idx_articles_title_search ON articles USING GIN(to_tsvector('english', title));
CREATE INDEX idx_articles_content_search ON articles USING GIN(to_tsvector('english', content));

-- Relationships
CREATE INDEX idx_revisions_article ON article_revisions(article_id);
CREATE INDEX idx_keywords_cluster ON keywords(cluster_id);
```

**Composite Indexes:**
```sql
-- Common queries
CREATE INDEX idx_articles_status_created ON articles(status, created_at DESC);
CREATE INDEX idx_ideas_status_priority ON content_ideas(status, priority);
```

---

## AI Integration Architecture

### Multi-Provider Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Service Layer                          │
│                    (aiService.js)                            │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌──────────────────────────┐
│   Grok Provider       │         │   Claude Provider        │
│   (grokClient.js)     │         │   (claudeClient.js)      │
├───────────────────────┤         ├──────────────────────────┤
│ - API: api.x.ai       │         │ - API: api.anthropic.com │
│ - Model: grok-beta    │         │ - Model: claude-3.5      │
│ - Use: Drafting       │         │ - Use: Humanization      │
│ - Features:           │         │ - Features:              │
│   • Long context      │         │   • Creative writing     │
│   • Structured output │         │   • Instruction following│
│   • Web search        │         │   • Long context         │
└───────────────────────┘         └──────────────────────────┘
```

### AI Client Implementation

**Grok Client:**
```javascript
// services/ai/grokClient.js
import Anthropic from "@anthropic-ai/sdk";

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROK_API_BASE = "https://api.x.ai/v1";

export class GrokClient {
  constructor() {
    this.apiKey = GROK_API_KEY;
    this.baseUrl = GROK_API_BASE;
  }

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
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4096,
        stream: options.stream || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Grok API error: ${error.message}`);
    }

    return await response.json();
  }

  async generateArticleDraft(prompt, schema) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert educational content writer...',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.chat(messages, {
      temperature: 0.8,
      maxTokens: 8000,
    });

    // Parse JSON response
    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }
}

export const grokClient = new GrokClient();
```

**Claude Client:**
```javascript
// services/ai/claudeClient.js
import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export class ClaudeClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: CLAUDE_API_KEY,
      dangerouslyAllowBrowser: true, // For frontend use
    });
  }

  async createMessage(messages, options = {}) {
    const response = await this.client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20250122',
      max_tokens: options.maxTokens || 8000,
      temperature: options.temperature || 1.0,
      messages,
    });

    return response.content[0].text;
  }

  async humanizeContent(content, styleProfile) {
    const messages = [
      {
        role: 'user',
        content: `
          Rewrite the following article to make it more human-like...

          ARTICLE:
          ${content}

          STYLE PROFILE:
          ${styleProfile}

          Return ONLY the rewritten HTML content.
        `,
      },
    ];

    const humanizedContent = await this.createMessage(messages, {
      temperature: 1.0, // Higher for more creativity
      maxTokens: 8000,
    });

    return humanizedContent;
  }
}

export const claudeClient = new ClaudeClient();
```

**AI Service Orchestrator:**
```javascript
// services/aiService.js
import { grokClient } from './ai/grokClient';
import { claudeClient } from './ai/claudeClient';

export class AIService {
  // Generate article draft using Grok
  async generateDraft(idea, contributor, siteArticles) {
    const prompt = buildDraftPrompt(idea, contributor, siteArticles);

    try {
      const draft = await grokClient.generateArticleDraft(prompt, {
        title: 'string',
        excerpt: 'string',
        content: 'string',
        faqs: 'array',
      });

      return draft;
    } catch (error) {
      console.error('Draft generation failed:', error);
      throw new Error('Failed to generate article draft');
    }
  }

  // Humanize content using Claude
  async humanizeArticle(content, contributor) {
    try {
      const humanized = await claudeClient.humanizeContent(
        content,
        contributor.writing_style_profile
      );

      return humanized;
    } catch (error) {
      console.error('Humanization failed:', error);
      // Fallback: return original content
      return content;
    }
  }

  // Generate SEO metadata (can use either model)
  async generateSEOMetadata(title, content) {
    const prompt = `
      Generate SEO metadata for this article:
      Title: ${title}
      Content: ${content.substring(0, 500)}...

      Return JSON: { seo_title: string, seo_description: string, keywords: string[] }
    `;

    try {
      const response = await grokClient.chat([
        { role: 'user', content: prompt }
      ]);

      const metadata = JSON.parse(response.choices[0].message.content);
      return metadata;
    } catch (error) {
      console.error('SEO metadata generation failed:', error);
      return {
        seo_title: title,
        seo_description: content.substring(0, 160),
        keywords: [],
      };
    }
  }

  // Generate content ideas (Grok with web search)
  async generateIdeas(sources, customTopic) {
    const prompt = buildIdeasPrompt(sources, customTopic);

    const response = await grokClient.chat([
      { role: 'system', content: 'You are a content strategist...' },
      { role: 'user', content: prompt },
    ], {
      webSearch: true, // If Grok supports web search
    });

    const ideas = JSON.parse(response.choices[0].message.content);
    return ideas;
  }
}

export const aiService = new AIService();
```

### Error Handling & Retry Logic

```javascript
// services/ai/retryHandler.js
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoff = 2,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoff, attempt),
          maxDelay
        );

        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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

---

## Security Architecture

### Authentication Flow

```
1. User enters email/password
2. Supabase Auth validates credentials
3. Returns JWT access token + refresh token
4. Frontend stores tokens in localStorage (or secure cookie)
5. All requests include: Authorization: Bearer <token>
6. Supabase validates JWT on every request
7. RLS policies enforce data access rules
8. Token expires after 1 hour → refresh with refresh token
```

### Row Level Security (RLS) Policies

**Example: Articles Table**
```sql
-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all articles
CREATE POLICY "Users can view articles"
  ON articles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Users can create articles
CREATE POLICY "Users can create articles"
  ON articles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own articles
CREATE POLICY "Users can update own articles"
  ON articles
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Admins can update all articles
CREATE POLICY "Admins can update all articles"
  ON articles
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Users can delete their own articles
CREATE POLICY "Users can delete own articles"
  ON articles
  FOR DELETE
  USING (created_by = auth.uid());
```

### API Key Management

**Environment Variables:**
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...  # Public, safe to expose
VITE_GROK_API_KEY=...              # DANGER: Should be backend-only
VITE_CLAUDE_API_KEY=...            # DANGER: Should be backend-only

# Backend (Supabase secrets)
SUPABASE_SERVICE_ROLE_KEY=...     # Never expose to frontend
GROK_API_KEY=...
CLAUDE_API_KEY=...
WORDPRESS_APP_PASSWORD=...
```

**Secure Pattern:**
- AI API calls should go through Edge Functions (backend)
- Frontend calls Edge Function, Edge Function calls AI API
- Keeps API keys secure

### Input Validation

**Client-Side (Zod):**
```javascript
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(1200),
  type: z.enum(['listicle', 'guide', 'ranking', 'faq', 'degree_page']),
  contributor_id: z.string().uuid(),
});

// Validate before sending to API
try {
  articleSchema.parse(formData);
} catch (error) {
  // Show validation errors to user
  showErrors(error.errors);
}
```

**Server-Side (Edge Functions):**
```typescript
// Always validate even if client validated
const { data, error } = articleSchema.safeParse(requestBody);
if (error) {
  return new Response(
    JSON.stringify({ error: 'Invalid input', details: error.errors }),
    { status: 400 }
  );
}
```

---

## Deployment Architecture

### Netlify Deployment

```
┌────────────────────────────────────────┐
│          GitHub Repository              │
│  - Push to main branch                 │
└───────────────┬────────────────────────┘
                │
                │ Webhook
                ▼
┌────────────────────────────────────────┐
│       Netlify Build Process            │
│  1. npm install                        │
│  2. npm run build (Vite)               │
│  3. Optimize assets                    │
│  4. Deploy to CDN                      │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│        Netlify CDN (Global)            │
│  - Static files served from edge       │
│  - Automatic HTTPS                     │
│  - Custom domain                       │
│  - Caching headers                     │
└────────────────────────────────────────┘
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
```

### Supabase Deployment

**Edge Functions:**
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-article

# Set secrets
supabase secrets set GROK_API_KEY=xxx
supabase secrets set CLAUDE_API_KEY=xxx
```

**Database Migrations:**
```bash
# Create migration
supabase migration new create_articles_table

# Apply migrations
supabase db push

# Reset database (local dev)
supabase db reset
```

### Environment Configuration

**Local Development:**
```
Frontend: http://localhost:5173 (Vite)
Supabase: http://localhost:54321 (Local Supabase)
Database: postgresql://localhost:54322
```

**Staging:**
```
Frontend: https://perdia-staging.netlify.app
Supabase: https://xxx.supabase.co
Database: Supabase managed PostgreSQL
```

**Production:**
```
Frontend: https://perdia.yourdomain.com
Supabase: https://yyy.supabase.co
Database: Supabase managed PostgreSQL
```

---

## Technology Stack

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | React | 18.2+ | UI library |
| Build Tool | Vite | 6.0+ | Fast build and dev server |
| Routing | React Router | 7.0+ | Client-side routing |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS |
| UI Components | Shadcn UI | Latest | Pre-built components |
| State Management | TanStack Query | 5.0+ | Server state management |
| Forms | React Hook Form | 7.54+ | Form handling |
| Validation | Zod | 3.24+ | Schema validation |
| Charts | Recharts | 2.15+ | Analytics visualizations |
| Animation | Framer Motion | 12.4+ | Animations and transitions |
| Icons | Lucide React | Latest | Icon library |
| Date Handling | date-fns | 3.6+ | Date utilities |
| Rich Text | React Quill / Tiptap | Latest | WYSIWYG editor |

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| BaaS Platform | Supabase | Latest | Backend infrastructure |
| Database | PostgreSQL | 15+ | Primary data store |
| Runtime | Deno | Latest | Edge Functions runtime |
| ORM | Supabase Client | 2.0+ | Database queries |
| Auth | Supabase Auth | Built-in | Authentication |
| Storage | Supabase Storage | Built-in | File storage |
| Realtime | Supabase Realtime | Built-in | WebSocket updates |

### AI Stack

| Provider | Model | Purpose |
|----------|-------|---------|
| xAI | Grok Beta / Grok-2 | Article drafting |
| Anthropic | Claude 3.5 Sonnet | Content humanization |

### DevOps Stack

| Category | Tool | Purpose |
|----------|------|---------|
| Version Control | Git + GitHub | Source control |
| CI/CD | Netlify CI / GitHub Actions | Automated deployments |
| Hosting | Netlify | Frontend hosting |
| Backend Hosting | Supabase Cloud | Database + Functions |
| Monitoring | Sentry (optional) | Error tracking |
| Analytics | Plausible (optional) | Privacy-friendly analytics |

---

## Performance Optimization Strategies

### Frontend Optimization

1. **Code Splitting:**
```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ArticleEditor = lazy(() => import('./pages/ArticleEditor'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/editor/:id" element={<ArticleEditor />} />
  </Routes>
</Suspense>
```

2. **Image Optimization:**
- Lazy loading with `loading="lazy"`
- WebP format with fallbacks
- Responsive images with `srcset`
- Compression before upload

3. **Bundle Optimization:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-*'],
          'charts': ['recharts'],
        },
      },
    },
  },
};
```

4. **Caching Strategy:**
```javascript
// React Query default config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### Backend Optimization

1. **Database Indexes:** (see Data Architecture section)
2. **Connection Pooling:** Supabase default (PgBouncer)
3. **Query Optimization:**
   - Select only needed columns
   - Use pagination
   - Avoid N+1 queries

4. **Edge Function Optimization:**
```typescript
// Reuse connections
let cachedClient;
function getSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createClient(url, key);
  }
  return cachedClient;
}
```

---

**Document Status:** Complete
**Next Document:** Database Schema & Entity Relationships
