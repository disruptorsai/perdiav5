-- Migration: Meeting Requirements from Dec 18 & Dec 22, 2025
-- Adds tables and columns for sitemap crawling, content rules, feedback, and enhanced features

-- ============================================================================
-- SECTION 1: New Tables
-- ============================================================================

-- Content Rules table for domain/source whitelisting and author mapping
CREATE TABLE content_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('domain_whitelist', 'domain_blacklist', 'source_whitelist', 'author_mapping', 'blocked_pattern', 'shortcode_rule')),
  rule_key TEXT NOT NULL,
  rule_value JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Feedback table for thumbs up/down with comments
CREATE TABLE article_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Sitemap Crawl Log table for tracking crawl history
CREATE TABLE sitemap_crawl_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sitemap_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  urls_found INTEGER DEFAULT 0,
  urls_added INTEGER DEFAULT 0,
  urls_updated INTEGER DEFAULT 0,
  sponsored_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: Column Additions to Existing Tables
-- ============================================================================

-- Add reasoning column to articles for AI transparency
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reasoning JSONB;

-- Add generation metadata to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add WordPress author ID to contributors
ALTER TABLE article_contributors ADD COLUMN IF NOT EXISTS wordpress_author_id INTEGER;

-- Add sponsored school detection fields to site_articles
ALTER TABLE site_articles ADD COLUMN IF NOT EXISTS school_priority INTEGER DEFAULT 0;
ALTER TABLE site_articles ADD COLUMN IF NOT EXISTS has_logo BOOLEAN DEFAULT false;
ALTER TABLE site_articles ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE site_articles ADD COLUMN IF NOT EXISTS section TEXT;

-- Add generation track to content_ideas (monetization vs user-initiated)
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS generation_track TEXT DEFAULT 'user-initiated' CHECK (generation_track IN ('monetization', 'user-initiated'));
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS auto_generate_title BOOLEAN DEFAULT false;
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS suggested_titles JSONB DEFAULT '[]';

-- ============================================================================
-- SECTION 3: Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_rules_user_type ON content_rules(user_id, rule_type);
CREATE INDEX IF NOT EXISTS idx_content_rules_active ON content_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_article_feedback_article ON article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_article_feedback_user ON article_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_sitemap_crawl_log_user ON sitemap_crawl_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sitemap_crawl_log_status ON sitemap_crawl_log(status);
CREATE INDEX IF NOT EXISTS idx_site_articles_sponsored ON site_articles(is_sponsored) WHERE is_sponsored = true;
CREATE INDEX IF NOT EXISTS idx_site_articles_section ON site_articles(section);
CREATE INDEX IF NOT EXISTS idx_content_ideas_track ON content_ideas(generation_track);

-- ============================================================================
-- SECTION 4: Row Level Security Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE content_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_crawl_log ENABLE ROW LEVEL SECURITY;

-- Content Rules policies
CREATE POLICY "Users can view their own content rules"
  ON content_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content rules"
  ON content_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content rules"
  ON content_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content rules"
  ON content_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Article Feedback policies
CREATE POLICY "Users can view feedback on their articles"
  ON article_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_feedback.article_id
      AND articles.user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own feedback"
  ON article_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON article_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON article_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Sitemap Crawl Log policies
CREATE POLICY "Users can view their own crawl logs"
  ON sitemap_crawl_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crawl logs"
  ON sitemap_crawl_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crawl logs"
  ON sitemap_crawl_log FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: Triggers for Updated Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_rules_updated_at
    BEFORE UPDATE ON content_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_feedback_updated_at
    BEFORE UPDATE ON article_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 6: Seed Default Content Rules
-- ============================================================================

-- Note: These will be inserted per-user, but we can seed some system defaults
-- In a production setup, you'd insert these when a user is created

-- ============================================================================
-- SECTION 7: Seed GetEducated-Specific Shortcodes
-- ============================================================================

-- Insert GetEducated shortcodes (if shortcodes table exists and is empty)
INSERT INTO shortcodes (name, code, description, category)
SELECT * FROM (VALUES
  ('GECTAPDF', '[GECTAPDF school="{{school_name}}" program="{{program}}"]', 'GetEducated CTA with PDF download for school programs', 'cta'),
  ('GE_CTA', '[ge_cta type="{{type}}" school="{{school}}"]', 'General GetEducated call-to-action', 'cta'),
  ('School_Comparison', '[school_comparison schools="{{school_list}}" program="{{program}}"]', 'School comparison table widget', 'comparison'),
  ('Program_Finder', '[program_finder category="{{category}}"]', 'Interactive program finder widget', 'widget'),
  ('Sponsored_Badge', '[sponsored_badge]', 'Badge indicating sponsored content', 'badge'),
  ('Online_Degrees_CTA', '[online_degrees_cta degree="{{degree_type}}"]', 'CTA specific to online degrees section', 'cta')
) AS v(name, code, description, category)
WHERE NOT EXISTS (SELECT 1 FROM shortcodes WHERE name = 'GECTAPDF');

-- ============================================================================
-- SECTION 8: Update Contributors with WordPress Author IDs
-- ============================================================================

-- Update existing contributors with GetEducated WordPress author mappings
-- Tony = Rankings, Kaylee = Professional Programs, Sarah = STEM
-- (These IDs should be updated with actual WordPress user IDs)

UPDATE article_contributors
SET wordpress_author_id = CASE
  WHEN name = 'Alex Chen' THEN 1  -- Tech contributor
  WHEN name = 'Sarah Martinez' THEN 2  -- Finance/Business
  WHEN name = 'Emma Wilson' THEN 3  -- Education specialist
  ELSE NULL
END
WHERE wordpress_author_id IS NULL;

-- Add GetEducated-specific contributors if they don't exist
INSERT INTO article_contributors (name, bio, expertise_areas, content_types, writing_style_profile, wordpress_author_id)
SELECT * FROM (VALUES
  (
    'Tony Richardson',
    'Education rankings specialist with deep expertise in college program evaluations and comparison methodologies.',
    ARRAY['rankings', 'education', 'college', 'programs'],
    ARRAY['ranking', 'listicle', 'comparison'],
    '{"tone": "authoritative", "complexity_level": "intermediate", "sentence_length_preference": "medium"}'::jsonb,
    101
  ),
  (
    'Kaylee Morgan',
    'Career development expert focusing on professional programs, certifications, and workforce education.',
    ARRAY['professional-development', 'career', 'certifications', 'nursing', 'healthcare'],
    ARRAY['guide', 'how-to', 'career-advice'],
    '{"tone": "supportive", "complexity_level": "beginner", "sentence_length_preference": "short"}'::jsonb,
    102
  ),
  (
    'Sarah Chen',
    'STEM education advocate specializing in technology, engineering, and science degree programs.',
    ARRAY['stem', 'technology', 'engineering', 'science', 'computer-science'],
    ARRAY['explainer', 'guide', 'analysis'],
    '{"tone": "educational", "complexity_level": "intermediate", "sentence_length_preference": "medium"}'::jsonb,
    103
  )
) AS v(name, bio, expertise_areas, content_types, writing_style_profile, wordpress_author_id)
WHERE NOT EXISTS (SELECT 1 FROM article_contributors WHERE name = 'Tony Richardson');
