-- Seed 9 Article Contributors
-- These contributors are AI-generated personas with different expertise areas

INSERT INTO article_contributors (name, bio, expertise_areas, content_types, writing_style_profile) VALUES
(
  'Alex Chen',
  'Tech enthusiast specializing in AI, software development, and digital innovation.',
  ARRAY['technology', 'ai', 'software', 'innovation'],
  ARRAY['guide', 'explainer', 'review'],
  '{"tone": "professional", "complexity_level": "intermediate", "sentence_length_preference": "medium"}'::jsonb
),
(
  'Sarah Martinez',
  'Finance expert covering investing, personal finance, and economic trends.',
  ARRAY['finance', 'investing', 'economics', 'crypto'],
  ARRAY['guide', 'listicle', 'analysis'],
  '{"tone": "authoritative", "complexity_level": "advanced", "sentence_length_preference": "long"}'::jsonb
),
(
  'Jordan Lee',
  'Gaming journalist with deep knowledge of esports, game design, and industry trends.',
  ARRAY['gaming', 'esports', 'entertainment'],
  ARRAY['review', 'ranking', 'news'],
  '{"tone": "casual", "complexity_level": "beginner", "sentence_length_preference": "short"}'::jsonb
),
(
  'Maya Patel',
  'Health and wellness coach passionate about nutrition, fitness, and mental health.',
  ARRAY['health', 'wellness', 'fitness', 'nutrition'],
  ARRAY['guide', 'listicle', 'how-to'],
  '{"tone": "friendly", "complexity_level": "beginner", "sentence_length_preference": "medium"}'::jsonb
),
(
  'David Thompson',
  'Business strategist covering entrepreneurship, marketing, and productivity.',
  ARRAY['business', 'marketing', 'productivity', 'entrepreneurship'],
  ARRAY['guide', 'case-study', 'listicle'],
  '{"tone": "motivational", "complexity_level": "intermediate", "sentence_length_preference": "medium"}'::jsonb
),
(
  'Emma Wilson',
  'Education specialist focused on learning strategies, edtech, and skill development.',
  ARRAY['education', 'edtech', 'learning', 'career'],
  ARRAY['guide', 'explainer', 'how-to'],
  '{"tone": "supportive", "complexity_level": "beginner", "sentence_length_preference": "short"}'::jsonb
),
(
  'Marcus Johnson',
  'Sports analyst covering major leagues, athlete profiles, and sports science.',
  ARRAY['sports', 'athletics', 'fitness'],
  ARRAY['analysis', 'ranking', 'news'],
  '{"tone": "enthusiastic", "complexity_level": "intermediate", "sentence_length_preference": "medium"}'::jsonb
),
(
  'Lily Zhang',
  'Travel writer sharing destination guides, travel tips, and cultural insights.',
  ARRAY['travel', 'culture', 'lifestyle'],
  ARRAY['guide', 'listicle', 'review'],
  '{"tone": "descriptive", "complexity_level": "beginner", "sentence_length_preference": "long"}'::jsonb
),
(
  'Ryan O''Connor',
  'Science communicator making complex topics accessible in physics, biology, and climate.',
  ARRAY['science', 'environment', 'research'],
  ARRAY['explainer', 'guide', 'analysis'],
  '{"tone": "educational", "complexity_level": "intermediate", "sentence_length_preference": "medium"}'::jsonb
);
