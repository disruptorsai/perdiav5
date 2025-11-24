-- Seed System Settings
-- Default configuration for the Perdia Content Engine

-- AI Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('grok_model', 'grok-beta', 'ai', 'Grok model to use for draft generation'),
('claude_model', 'claude-3-5-sonnet-20250122', 'ai', 'Claude model to use for humanization'),
('ai_temperature', '0.8', 'ai', 'Temperature for AI generation (0-2, higher = more creative)'),
('max_tokens_draft', '4000', 'ai', 'Max tokens for draft generation'),
('max_tokens_humanize', '4500', 'ai', 'Max tokens for humanization'),
('enable_anti_ai_detection', 'true', 'ai', 'Enable anti-AI-detection techniques');

-- SEO Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('target_word_count_min', '1500', 'seo', 'Minimum word count for articles'),
('target_word_count_max', '2500', 'seo', 'Maximum word count for articles'),
('min_internal_links', '3', 'seo', 'Minimum internal links per article'),
('max_internal_links', '5', 'seo', 'Maximum internal links per article'),
('min_external_links', '2', 'seo', 'Minimum external citations per article'),
('min_faq_count', '3', 'seo', 'Minimum FAQ items per article');

-- WordPress Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('default_wp_status', 'draft', 'wordpress', 'Default post status when publishing'),
('enable_yoast_seo', 'true', 'wordpress', 'Enable Yoast SEO meta fields'),
('wp_post_type', 'post', 'wordpress', 'WordPress post type to use'),
('enable_featured_image', 'false', 'wordpress', 'Auto-set featured images'),
('dry_run_mode', 'false', 'wordpress', 'Test mode without actual publishing');

-- Automation Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('automation_mode', 'manual', 'automation', 'Automation mode: manual, semi_auto, or full_auto'),
('min_idea_queue_size', '5', 'automation', 'Min ideas in queue before auto-generating more'),
('max_generation_parallel', '1', 'automation', 'Max articles to generate in parallel'),
('quality_threshold_publish', '85', 'automation', 'Min quality score for auto-publish'),
('quality_threshold_review', '75', 'automation', 'Min quality score to avoid rejection'),
('max_auto_fix_attempts', '3', 'automation', 'Max times to retry auto-fix'),
('cycle_interval_seconds', '300', 'automation', 'Seconds between automation cycles (5 min default)'),
('enable_auto_publish', 'false', 'automation', 'Enable auto-publishing to WordPress'),
('enable_auto_idea_generation', 'true', 'automation', 'Auto-generate ideas when queue low');

-- Quality Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('min_quality_score', '75', 'quality', 'Minimum acceptable quality score'),
('enable_auto_fix', 'true', 'quality', 'Enable automatic quality issue fixing'),
('check_readability', 'true', 'quality', 'Check Flesch-Kincaid readability'),
('check_heading_structure', 'true', 'quality', 'Validate heading hierarchy'),
('check_link_compliance', 'true', 'quality', 'Validate internal/external link counts');

-- Content Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('default_content_type', 'guide', 'content', 'Default content type for generation'),
('enable_faqs', 'true', 'content', 'Auto-generate FAQ sections'),
('enable_table_of_contents', 'false', 'content', 'Auto-generate table of contents'),
('banned_phrases', '["As an AI", "In conclusion", "It is important to note"]', 'content', 'Phrases to avoid in content');

-- DataForSEO Settings
INSERT INTO system_settings (key, value, category, description) VALUES
('dataforseo_enabled', 'true', 'dataforseo', 'Enable DataForSEO keyword research'),
('dataforseo_location', 'United States', 'dataforseo', 'Default location for keyword research'),
('dataforseo_language', 'English', 'dataforseo', 'Default language for keyword research'),
('dataforseo_min_search_volume', '100', 'dataforseo', 'Minimum search volume to consider'),
('dataforseo_max_difficulty', '70', 'dataforseo', 'Maximum difficulty score to consider'),
('dataforseo_cache_duration_hours', '168', 'dataforseo', 'Cache keyword data for 7 days');
