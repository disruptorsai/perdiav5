# Perdia Content Engine - Database Schema & SQL Migrations

**Version:** 2.0
**Database:** PostgreSQL 15+
**Platform:** Supabase
**Date:** January 2025

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Definitions](#entity-definitions)
3. [SQL Migrations](#sql-migrations)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Row Level Security Policies](#row-level-security-policies)
7. [Database Functions & Triggers](#database-functions--triggers)

---

## Schema Overview

### Entity Summary

| Entity | Purpose | Primary Relations |
|--------|---------|-------------------|
| `users` | User accounts (Supabase Auth) | Created articles, revisions |
| `articles` | Published and draft articles | Contributor, cluster, WordPress connection |
| `content_ideas` | Article ideas and generation queue | Articles, clusters |
| `article_contributors` | Author personas with writing styles | Articles |
| `clusters` | Topic clusters for content organization | Articles, keywords, ideas |
| `keywords` | SEO keywords and search terms | Clusters |
| `site_articles` | External article catalog for internal linking | Articles (optional mapping) |
| `wordpress_connections` | WordPress site configurations | Articles |
| `system_settings` | Application configuration | N/A |
| `article_revisions` | Editorial feedback and comments | Articles, users |
| `training_data` | AI improvement training records | Articles |
| `detection_research_logs` | AI detection research tracking | N/A |
| `article_workflow_configs` | Workflow prompt configurations | N/A |
| `shortcodes` | WordPress shortcode definitions | N/A |

### Schema Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌────────────────────┐
│    users     │─────────│    articles      │─────────│article_contributors│
│(Supabase Auth│  1:N    │                  │  N:1    │                    │
└──────────────┘         └────────┬─────────┘         └────────────────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
                  │               │               │
              ┌───▼────┐    ┌────▼─────┐   ┌─────▼──────────┐
              │clusters│    │wordpress_│   │article_revisions│
              │        │    │connections│   │                │
              └───┬────┘    └──────────┘   └────────────────┘
                  │
            ┌─────┼─────┐
            │           │
        ┌───▼──┐   ┌────▼──────┐
        │keywords│   │content_   │
        │      │   │ideas      │
        └──────┘   └───────────┘
```

---

## Entity Definitions

### 1. articles

**Purpose:** Core entity for all article content (drafts, published, archived).

```sql
CREATE TABLE articles (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 200),
  slug TEXT UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,

  -- Classification
  type TEXT NOT NULL CHECK (type IN ('listicle', 'guide', 'ranking', 'faq', 'degree_page')),
  status TEXT NOT NULL DEFAULT 'drafting'
    CHECK (status IN ('idea', 'drafting', 'refinement', 'qa', 'approved', 'published', 'rejected')),

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  target_keywords TEXT[],

  -- Quality
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  risk_flags TEXT[],
  word_count INTEGER,
  internal_links_count INTEGER DEFAULT 0,
  external_citations_count INTEGER DEFAULT 0,

  -- Relationships
  contributor_id UUID REFERENCES article_contributors(id) ON DELETE SET NULL,
  contributor_name TEXT, -- Cached for performance
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- FAQs (JSON)
  faqs JSONB, -- [{ question: string, answer: string }]

  -- Validation
  schema_valid BOOLEAN DEFAULT FALSE,
  shortcode_valid BOOLEAN DEFAULT FALSE,

  -- Generation metadata
  model_used TEXT,
  generation_prompt TEXT,
  revision_number INTEGER DEFAULT 1,

  -- WordPress integration
  publish_status TEXT CHECK (publish_status IN ('pending', 'queued', 'published', 'failed')),
  wordpress_site_id UUID REFERENCES wordpress_connections(id) ON DELETE SET NULL,
  wordpress_post_id INTEGER,
  wordpress_url TEXT,
  last_publish_error TEXT,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Performance tracking (future integration)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2),
  avg_position NUMERIC(5,2),

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes:**
```sql
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_contributor ON articles(contributor_id);
CREATE INDEX idx_articles_cluster ON articles(cluster_id);
CREATE INDEX idx_articles_created ON articles(created_at DESC);
CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_articles_slug ON articles(slug);

-- Full-text search
CREATE INDEX idx_articles_title_search ON articles USING GIN(to_tsvector('english', title));
CREATE INDEX idx_articles_content_search ON articles USING GIN(to_tsvector('english', content));
```

---

### 2. content_ideas

**Purpose:** Article ideas in various stages of approval and generation.

```sql
CREATE TABLE content_ideas (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,

  -- AI-generated suggestions
  suggested_title TEXT,
  suggested_description TEXT,
  suggested_keywords TEXT[],

  -- Source tracking
  source TEXT CHECK (source IN ('reddit', 'twitter', 'news', 'trends', 'manual', 'ai_generated', 'dataforseo')),
  source_url TEXT,

  -- Classification
  keywords TEXT[],
  content_type TEXT CHECK (content_type IN ('listicle', 'guide', 'ranking', 'faq', 'degree_page')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- DataForSEO keyword research data (JSONB)
  keyword_research_data JSONB, -- { primary_keyword, search_volume, difficulty, competition, cpc, trend, opportunity_score, monthly_searches }

  -- Status tracking
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),

  -- Relationships
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,
  rejection_reason TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_ideas_status ON content_ideas(status);
CREATE INDEX idx_ideas_priority ON content_ideas(priority);
CREATE INDEX idx_ideas_cluster ON content_ideas(cluster_id);
CREATE INDEX idx_ideas_article ON content_ideas(article_id);
CREATE INDEX idx_ideas_created ON content_ideas(created_at DESC);
```

---

### 3. article_contributors

**Purpose:** Author personas with expertise areas and writing style profiles.

```sql
CREATE TABLE article_contributors (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Profile
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,

  -- Expertise
  expertise_areas TEXT[], -- Keywords for auto-assignment
  credentials TEXT,
  years_of_experience INTEGER,

  -- AI prompting
  writing_style_profile TEXT, -- Detailed instructions for AI

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- WordPress integration
  wordpress_user_id INTEGER, -- Maps to WP author
  wordpress_meta_key TEXT,   -- Future: custom fields
  wordpress_meta_value TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_contributors_active ON article_contributors(is_active);
CREATE INDEX idx_contributors_slug ON article_contributors(slug);
```

---

### 4. clusters

**Purpose:** Topic clusters for content organization and SEO strategy.

```sql
CREATE TABLE clusters (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core
  name TEXT NOT NULL,
  description TEXT,

  -- Hierarchy
  parent_cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- Strategy
  target_audience TEXT,
  content_brief TEXT,

  -- Internal linking targets
  internal_link_targets TEXT[], -- URLs to prioritize for linking

  -- External sources (JSONB for structured data)
  external_sources JSONB, -- [{ source: string, url: string, type: string }]

  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_clusters_parent ON clusters(parent_cluster_id);
CREATE INDEX idx_clusters_status ON clusters(status);
CREATE INDEX idx_clusters_priority ON clusters(priority);
```

---

### 5. keywords

**Purpose:** SEO keywords with search intent and difficulty tracking.

```sql
CREATE TABLE keywords (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Keyword
  keyword TEXT NOT NULL UNIQUE,

  -- Classification
  intent TEXT CHECK (intent IN ('informational', 'commercial', 'transactional', 'navigational')),

  -- Relationship
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- SEO metrics
  difficulty INTEGER CHECK (difficulty BETWEEN 0 AND 100),
  search_volume INTEGER,

  -- Targeting
  target_flag BOOLEAN DEFAULT FALSE, -- High priority keyword

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_keywords_cluster ON keywords(cluster_id);
CREATE INDEX idx_keywords_target ON keywords(target_flag) WHERE target_flag = TRUE;
CREATE INDEX idx_keywords_difficulty ON keywords(difficulty);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
```

---

### 6. site_articles

**Purpose:** Catalog of existing site articles for internal linking.

```sql
CREATE TABLE site_articles (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Article info
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,

  -- Classification
  category TEXT CHECK (category IN (
    'degree_guides', 'career_guides', 'rankings', 'how_to',
    'accreditation', 'financial_aid', 'other'
  )),
  topics TEXT[], -- Topical keywords

  -- Author
  author_name TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Optional mapping to internal articles
  mapped_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_site_articles_url ON site_articles(url);
CREATE INDEX idx_site_articles_active ON site_articles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_site_articles_category ON site_articles(category);
CREATE INDEX idx_site_articles_topics ON site_articles USING GIN(topics);
```

---

### 7. wordpress_connections

**Purpose:** WordPress site connection configurations.

```sql
CREATE TABLE wordpress_connections (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Site info
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,

  -- Authentication
  auth_type TEXT NOT NULL CHECK (auth_type IN ('application_password', 'basic_auth', 'oauth')),

  -- Application Password
  username TEXT,
  app_password TEXT, -- Encrypted

  -- Basic Auth
  basic_auth_username TEXT,
  basic_auth_password TEXT, -- Encrypted

  -- OAuth (future)
  oauth_token TEXT,
  oauth_refresh_token TEXT,

  -- Default settings
  is_default BOOLEAN DEFAULT FALSE,
  default_post_status TEXT DEFAULT 'draft' CHECK (default_post_status IN ('draft', 'publish', 'pending')),
  default_post_type TEXT DEFAULT 'post',
  default_categories INTEGER[], -- WP category IDs
  default_tags TEXT[],

  -- Status
  connection_status TEXT DEFAULT 'disconnected'
    CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_connection_test TIMESTAMP WITH TIME ZONE,

  -- Testing
  dry_run_mode BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_wp_connections_default ON wordpress_connections(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_wp_connections_status ON wordpress_connections(connection_status);
```

---

### 8. system_settings

**Purpose:** Application-wide configuration key-value pairs.

```sql
CREATE TABLE system_settings (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,

  -- Metadata
  setting_type TEXT CHECK (setting_type IN ('workflow', 'quality', 'ai', 'integration', 'ui', 'other')),
  description TEXT,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Common Settings:**
```sql
-- Example settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  -- Workflow
  ('automation_level', 'manual', 'workflow', 'Automation mode: manual, semi_auto, full_auto'),
  ('sequential_generation', 'true', 'workflow', 'Generate one article at a time'),

  -- AI Models
  ('default_ai_model_draft', 'grok-beta', 'ai', 'Default model for drafting'),
  ('default_ai_model_humanize', 'claude-3-5-sonnet-20250122', 'ai', 'Default model for humanization'),
  ('default_ai_model_ideas', 'grok-beta', 'ai', 'Default model for idea generation'),

  -- Quality Thresholds
  ('min_word_count', '1200', 'quality', 'Minimum article word count'),
  ('max_word_count', '3000', 'quality', 'Maximum article word count (warning only)'),
  ('min_internal_links', '3', 'quality', 'Minimum internal links required'),
  ('min_external_citations', '2', 'quality', 'Minimum external citations required'),
  ('min_faqs', '3', 'quality', 'Minimum FAQ count'),
  ('target_readability_grade', '10', 'quality', 'Target Flesch-Kincaid grade level'),
  ('max_ai_detection_score', '30', 'quality', 'Maximum acceptable AI detection percentage'),

  -- Automatic Mode Settings
  ('min_idea_queue_size', '5', 'automation', 'Min ideas in queue before auto-generating more'),
  ('max_generation_parallel', '1', 'automation', 'Max articles to generate in parallel'),
  ('quality_threshold_publish', '85', 'automation', 'Min quality score for auto-publish'),
  ('quality_threshold_review', '75', 'automation', 'Min quality score to avoid rejection'),
  ('max_auto_fix_attempts', '3', 'automation', 'Max times to retry auto-fix'),
  ('cycle_interval_seconds', '300', 'automation', 'Seconds between automation cycles (5 min default)'),
  ('enable_auto_publish', 'false', 'automation', 'Enable auto-publishing to WordPress'),
  ('enable_auto_idea_generation', 'true', 'automation', 'Auto-generate ideas when queue low'),

  -- Auto-fix
  ('auto_fix_enabled', 'true', 'workflow', 'Enable auto-fix for quality issues'),
  ('auto_fix_max_retries', '1', 'workflow', 'Max retries for auto-fix'),

  -- Publishing
  ('auto_publish_enabled', 'false', 'integration', 'Auto-publish approved articles'),
  ('dry_run_default', 'true', 'integration', 'Default WordPress publish to dry run');
```

---

### 9. article_revisions

**Purpose:** Editorial feedback and revision tracking.

```sql
CREATE TABLE article_revisions (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Revision info
  revision_type TEXT CHECK (revision_type IN ('comment', 'revision_request', 'approval', 'rejection')),

  -- Comment details
  comment TEXT NOT NULL,
  selected_text TEXT,
  section TEXT, -- Heading/section context
  position INTEGER, -- Character position in content

  -- Classification
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  category TEXT CHECK (category IN (
    'accuracy', 'tone', 'structure', 'seo', 'compliance',
    'grammar', 'style', 'formatting'
  )),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'addressed', 'ignored')),

  -- Reviewer
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_email TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_revisions_article ON article_revisions(article_id);
CREATE INDEX idx_revisions_status ON article_revisions(status);
CREATE INDEX idx_revisions_reviewer ON article_revisions(reviewer_id);
```

---

### 10. training_data

**Purpose:** AI training records from editorial feedback.

```sql
CREATE TABLE training_data (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source article
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  article_title TEXT,
  content_type TEXT,

  -- Content versions
  original_content TEXT NOT NULL,
  revised_content TEXT NOT NULL,

  -- Feedback (JSONB array)
  feedback_items JSONB, -- [{ selected_text, comment, category, severity }]

  -- Pattern analysis
  pattern_type TEXT CHECK (pattern_type IN (
    'tone_adjustment', 'structure_improvement', 'seo_optimization',
    'factual_correction', 'style_refinement', 'link_addition', 'other'
  )),
  lesson_learned TEXT,

  -- Application tracking
  applied_to_system BOOLEAN DEFAULT FALSE,
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),

  -- Status
  status TEXT DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'applied', 'archived')),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_training_article ON training_data(article_id);
CREATE INDEX idx_training_status ON training_data(status);
CREATE INDEX idx_training_applied ON training_data(applied_to_system);
CREATE INDEX idx_training_pattern ON training_data(pattern_type);
```

---

### 11. detection_research_logs

**Purpose:** Tracking AI detection research and trends.

```sql
CREATE TABLE detection_research_logs (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Research details
  date_checked DATE NOT NULL,
  sources TEXT[], -- URLs of research sources

  -- Findings
  key_trends_summary TEXT,
  detection_tools_mentioned TEXT[], -- Tool names
  recommended_changes TEXT,

  -- Implementation
  implemented BOOLEAN DEFAULT FALSE,
  implementation_notes TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 12. article_workflow_configs

**Purpose:** Workflow-specific prompt configurations.

```sql
CREATE TABLE article_workflow_configs (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Profile
  profile_name TEXT NOT NULL UNIQUE,

  -- Prompts
  outline_prompt TEXT,
  draft_prompt TEXT,
  humanization_prompt TEXT, -- Critical for anti-detection
  qa_prompt TEXT,

  -- Quality targets
  detection_target_score INTEGER, -- Max AI detection score (0-100)

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 13. shortcodes

**Purpose:** WordPress shortcode definitions and validation.

```sql
CREATE TABLE shortcodes (
  -- Primary
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shortcode info
  name TEXT NOT NULL UNIQUE,
  syntax TEXT NOT NULL,
  description TEXT,

  -- Classification
  category TEXT CHECK (category IN ('monetization', 'internal_link', 'button', 'widget', 'other')),

  -- Parameters
  required_params TEXT[],
  optional_params TEXT[],

  -- Usage
  example TEXT,
  validation_rules TEXT, -- Regex pattern

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## SQL Migrations

### Migration: Initial Schema Setup

```sql
-- File: supabase/migrations/20250101000000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE article_status AS ENUM (
  'idea', 'drafting', 'refinement', 'qa', 'approved', 'published', 'rejected'
);

CREATE TYPE content_type AS ENUM (
  'listicle', 'guide', 'ranking', 'faq', 'degree_page'
);

CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');

CREATE TYPE idea_status AS ENUM (
  'pending', 'approved', 'in_progress', 'completed', 'rejected'
);

-- Create tables (see full definitions above)
-- Note: Run in order to respect foreign key dependencies

-- 1. Independent tables (no foreign keys)
CREATE TABLE article_contributors (...);
CREATE TABLE clusters (...);
CREATE TABLE wordpress_connections (...);
CREATE TABLE system_settings (...);
CREATE TABLE article_workflow_configs (...);
CREATE TABLE shortcodes (...);
CREATE TABLE detection_research_logs (...);

-- 2. Tables with foreign keys to above
CREATE TABLE keywords (...);
CREATE TABLE site_articles (...);
CREATE TABLE content_ideas (...);
CREATE TABLE articles (...);

-- 3. Tables with foreign keys to articles
CREATE TABLE article_revisions (...);
CREATE TABLE training_data (...);

-- Create indexes (see index definitions above)

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (repeat for all tables with updated_at)
```

### Migration: Seed Contributors

```sql
-- File: supabase/migrations/20250101000001_seed_contributors.sql

INSERT INTO article_contributors (name, slug, title, bio, expertise_areas, writing_style_profile, wordpress_user_id, is_active) VALUES

('Tony Huffman', 'tony-huffman', 'Affordability Analyst',
  'Tony specializes in college cost analysis and affordability rankings.',
  ARRAY['rankings', 'affordability', 'cost', 'tuition', 'fees', 'financial aid'],
  'Write in a data-driven, analytical tone. Focus on concrete numbers and comparisons. Use tables and bullet points. Emphasize cost-benefit analysis.',
  4, TRUE),

('Kayleigh Gilbert', 'kayleigh-gilbert', 'Consumer Protection Specialist',
  'Kayleigh focuses on accreditation, consumer protection, and identifying diploma mills.',
  ARRAY['accreditation', 'diploma mill', 'scam', 'legitimacy', 'consumer protection', 'fraud'],
  'Write with authority and caution. Emphasize credibility and warning signs. Use strong, protective language. Include actionable advice.',
  4, TRUE),

('Dr. Julia Tell', 'julia-tell', 'Instructional Design Expert',
  'Dr. Tell has a PhD in Instructional Design and compares degree program structures.',
  ARRAY['instructional design', 'curriculum', 'pedagogy', 'degree comparison', 'program structure'],
  'Write academically but accessibly. Use educational terminology correctly. Compare and contrast programs. Emphasize learning outcomes.',
  4, TRUE),

('Kif Richmann', 'kif-richmann', 'Career Outcomes Analyst',
  'Kif analyzes career paths, job outcomes, and salary data for degree programs.',
  ARRAY['career', 'salary', 'job outlook', 'employment', 'career paths', 'BLS data'],
  'Focus on career ROI and practical outcomes. Use BLS statistics. Write in a motivational yet realistic tone. Include salary ranges.',
  4, TRUE),

('Melanie Krol', 'melanie-krol', 'Mission-Driven Education Specialist',
  'Melanie covers leadership programs, social work, and faith-based education.',
  ARRAY['leadership', 'ministry', 'faith-based', 'social work', 'mission-driven', 'nonprofit'],
  'Write with empathy and purpose. Emphasize mission and values. Use inspirational language. Highlight social impact.',
  4, TRUE),

('Alicia Carrasco', 'alicia-carrasco', 'Alternative Education Expert',
  'Alicia explores alternative, transformational, and non-traditional learning pathways.',
  ARRAY['alternative education', 'transformational learning', 'non-traditional', 'experiential', 'holistic'],
  'Write creatively and openly. Challenge traditional education norms. Emphasize personal growth and transformation.',
  4, TRUE),

('Daniel Catena', 'daniel-catena', 'Digital Marketing & SEO Specialist',
  'Daniel writes about online business programs, digital marketing, and entrepreneurship.',
  ARRAY['digital marketing', 'SEO', 'business', 'entrepreneurship', 'MBA', 'online learning'],
  'Write in a professional, business-focused tone. Use marketing terminology. Include strategies and frameworks.',
  4, TRUE),

('Sarah Raines', 'sarah-raines', 'Research & Accessibility Advocate',
  'Sarah focuses on research-intensive content and inclusive education practices.',
  ARRAY['accessibility', 'inclusive education', 'special education', 'research', 'evidence-based'],
  'Write thoroughly and cite sources extensively. Emphasize accessibility and inclusion. Use research-backed claims.',
  4, TRUE),

('Wei Luo', 'wei-luo', 'Online Learning Trends Analyst',
  'Wei covers online education trends, certificate programs, and distance learning.',
  ARRAY['online learning', 'distance education', 'certificates', 'trends', 'EdTech', 'MOOCs'],
  'Write in a forward-looking, tech-savvy tone. Discuss trends and innovations. Keep content current and future-focused.',
  4, TRUE);
```

### Migration: Seed System Settings

```sql
-- File: supabase/migrations/20250101000002_seed_settings.sql

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  -- Workflow
  ('automation_level', 'manual', 'workflow', 'Automation mode: manual, semi_auto, full_auto'),
  ('sequential_generation', 'true', 'workflow', 'Generate one article at a time'),

  -- AI Models
  ('default_ai_model_draft', 'grok-beta', 'ai', 'Default model for drafting'),
  ('default_ai_model_humanize', 'claude-3-5-sonnet-20250122', 'ai', 'Default model for humanization'),
  ('default_ai_model_ideas', 'grok-beta', 'ai', 'Default model for idea generation'),

  -- Quality Thresholds
  ('min_word_count', '1200', 'quality', 'Minimum article word count'),
  ('max_word_count', '3000', 'quality', 'Maximum article word count (warning only)'),
  ('min_internal_links', '3', 'quality', 'Minimum internal links required'),
  ('min_external_citations', '2', 'quality', 'Minimum external citations required'),
  ('min_faqs', '3', 'quality', 'Minimum FAQ count'),
  ('target_readability_grade', '10', 'quality', 'Target Flesch-Kincaid grade level'),

  -- AI Detection
  ('max_ai_detection_score', '30', 'quality', 'Maximum acceptable AI detection percentage'),

  -- Auto-fix
  ('auto_fix_enabled', 'true', 'workflow', 'Enable auto-fix for quality issues'),
  ('auto_fix_max_retries', '1', 'workflow', 'Max retries for auto-fix'),

  -- Publishing
  ('auto_publish_enabled', 'false', 'integration', 'Auto-publish approved articles'),
  ('dry_run_default', 'true', 'integration', 'Default WordPress publish to dry run');
```

---

## Relationships

### Entity Relationship Rules

**articles → article_contributors:**
- Each article has ONE contributor (or null)
- Each contributor can have MANY articles
- ON DELETE SET NULL (preserve article if contributor deleted)

**articles → clusters:**
- Each article belongs to ZERO OR ONE cluster
- Each cluster can have MANY articles
- ON DELETE SET NULL (preserve article if cluster deleted)

**articles → wordpress_connections:**
- Each article published to ZERO OR ONE WordPress site
- Each connection can publish MANY articles
- ON DELETE SET NULL (preserve article if connection deleted)

**content_ideas → articles:**
- Each idea can generate ZERO OR ONE article
- Each article generated from ZERO OR ONE idea
- ON DELETE SET NULL (preserve both if link broken)

**clusters → clusters (self-referencing):**
- Each cluster can have ONE parent cluster
- Each cluster can have MANY child clusters
- ON DELETE SET NULL (preserve child if parent deleted)

**keywords → clusters:**
- Each keyword belongs to ZERO OR ONE cluster
- Each cluster can have MANY keywords
- ON DELETE SET NULL (preserve keyword if cluster deleted)

**article_revisions → articles:**
- Each revision belongs to ONE article
- Each article can have MANY revisions
- ON DELETE CASCADE (delete revisions with article)

**training_data → articles:**
- Each training record relates to ZERO OR ONE article
- Each article can generate MULTIPLE training records
- ON DELETE SET NULL (preserve training data if article deleted)

---

## Indexes

### Performance Indexes

**Most Important Queries:**

1. **Dashboard Kanban Query:**
```sql
-- Fetch articles by status, ordered by created date
SELECT * FROM articles
WHERE status = 'drafting'
ORDER BY created_at DESC
LIMIT 50;

-- Supported by:
CREATE INDEX idx_articles_status_created ON articles(status, created_at DESC);
```

2. **Content Library Search:**
```sql
-- Full-text search
SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('education');

-- Supported by:
CREATE INDEX idx_articles_title_search ON articles USING GIN(to_tsvector('english', title));
CREATE INDEX idx_articles_content_search ON articles USING GIN(to_tsvector('english', content));
```

3. **Contributor Auto-Assignment:**
```sql
-- Find contributors with matching expertise
SELECT * FROM article_contributors
WHERE is_active = TRUE
AND expertise_areas && ARRAY['career', 'salary'];

-- Supported by:
CREATE INDEX idx_contributors_expertise ON article_contributors USING GIN(expertise_areas);
```

4. **Internal Linking (Site Catalog):**
```sql
-- Find relevant site articles by topic
SELECT * FROM site_articles
WHERE is_active = TRUE
AND topics && ARRAY['online learning', 'MBA'];

-- Supported by:
CREATE INDEX idx_site_articles_topics ON site_articles USING GIN(topics);
```

---

## Row Level Security Policies

### Enable RLS on All Tables

```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_research_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcodes ENABLE ROW LEVEL SECURITY;
```

### RLS Policies for `articles`

```sql
-- Read: All authenticated users can view all articles
CREATE POLICY "Users can view all articles"
  ON articles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create: All authenticated users can create articles
CREATE POLICY "Users can create articles"
  ON articles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Update: Users can update articles they created
CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (created_by = auth.uid());

-- Update: Admins can update any article
CREATE POLICY "Admins can update any article"
  ON articles FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Delete: Users can delete articles they created
CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  USING (created_by = auth.uid());

-- Delete: Admins can delete any article
CREATE POLICY "Admins can delete any article"
  ON articles FOR DELETE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

### RLS Policies for `system_settings`

```sql
-- Read: All authenticated users can view settings
CREATE POLICY "Users can view settings"
  ON system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Update: Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON system_settings FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

### RLS Policy Template for Other Tables

```sql
-- Standard read/write for authenticated users
CREATE POLICY "Users can view {table}"
  ON {table} FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert {table}"
  ON {table} FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update {table}"
  ON {table} FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete {table}"
  ON {table} FOR DELETE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
```

---

## Database Functions & Triggers

### Auto-Update `updated_at` Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repeat for all applicable tables
```

### Auto-Generate Slug from Title

```sql
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      lower(trim(NEW.title)),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_article_slug
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

CREATE TRIGGER generate_contributor_slug
  BEFORE INSERT OR UPDATE ON article_contributors
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();
```

### Cache Contributor Name on Article

```sql
CREATE OR REPLACE FUNCTION cache_contributor_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contributor_id IS NOT NULL THEN
    SELECT name INTO NEW.contributor_name
    FROM article_contributors
    WHERE id = NEW.contributor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cache_article_contributor_name
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION cache_contributor_name();
```

### Calculate Word Count on Article Save

```sql
CREATE OR REPLACE FUNCTION calculate_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count := array_length(
    regexp_split_to_array(
      regexp_replace(NEW.content, '<[^>]*>', '', 'g'), -- Strip HTML
      '\s+'
    ),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_article_word_count
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION calculate_word_count();
```

---

## Database Backup & Maintenance

### Supabase Automatic Backups

- **Daily backups:** Automatic (Supabase Pro plan)
- **Point-in-time recovery:** Last 7 days
- **Manual backups:** `pg_dump` via Supabase CLI

### Manual Backup Command

```bash
# Export entire database
supabase db dump -f backup.sql

# Restore from backup
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

---

**Document Status:** Complete
**Next Document:** AI Integration Strategy (Grok + Claude)
