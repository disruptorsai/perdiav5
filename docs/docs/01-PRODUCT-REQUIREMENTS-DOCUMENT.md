# Perdia Content Engine - Product Requirements Document (PRD)

**Version:** 2.0
**Date:** January 2025
**Status:** Planning Phase
**Platform:** Supabase + React + Netlify

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [Success Metrics](#success-metrics)
6. [Technical Requirements](#technical-requirements)
7. [User Stories](#user-stories)
8. [Feature Priorities](#feature-priorities)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [Constraints & Assumptions](#constraints--assumptions)

---

## Executive Summary

Perdia is an AI-powered content workflow application designed to streamline and automate article generation, editing, and publishing for educational content websites. The platform leverages advanced AI models (xAI Grok and Anthropic Claude) to generate human-like, SEO-optimized articles that pass AI detection tools while maintaining high editorial quality standards.

### Key Objectives

- **Automate Content Production**: Reduce manual article writing time by 80%
- **Ensure Quality**: Maintain human-like writing quality that passes AI detection
- **Scale Efficiently**: Enable production of 100+ articles per month with minimal human intervention
- **Maintain SEO Standards**: Ensure all content meets Google E-E-A-T guidelines
- **Direct Publishing**: Seamlessly publish to WordPress sites

### Target Market

Educational content publishers, digital marketing agencies, content teams producing high-volume SEO content.

---

## Product Vision

### Problem Statement

Creating high-quality, SEO-optimized educational content at scale is:
- **Time-intensive**: Manual writing takes 4-8 hours per article
- **Expensive**: Professional writers cost $100-500 per article
- **Inconsistent**: Quality varies across different writers
- **Detection Risk**: AI-generated content is often detectable and penalized by search engines

### Solution

Perdia provides an end-to-end content production pipeline that:
1. Generates content ideas from trending topics and keywords
2. Creates articles using a two-pass AI system (draft + humanization)
3. Automatically assigns content to specialized author personas
4. Adds intelligent internal linking and citations
5. Performs quality checks and auto-fixes common issues
6. Publishes directly to WordPress with proper SEO metadata
7. Learns from editorial feedback to continuously improve

### Unique Value Proposition

**"AI-powered content that reads like it was written by humans, published at scale with minimal manual intervention."**

Key Differentiators:
- **Two-pass AI generation** (Grok drafting + Claude humanization)
- **9 specialized author personas** with distinct writing styles
- **Anti-AI-detection techniques** (perplexity, burstiness, voice injection)
- **Intelligent internal linking** from 1000+ article catalog
- **Continuous learning** through editorial feedback loop
- **Complete workflow management** from idea to publication

---

## User Personas

### 1. Content Manager (Primary)

**Name:** Sarah
**Role:** Content Strategy Lead
**Goals:**
- Produce 50-100 articles per month
- Maintain consistent quality across all content
- Track content performance and identify gaps
- Optimize content workflow efficiency

**Pain Points:**
- Managing multiple freelance writers is time-consuming
- Quality is inconsistent across different writers
- Difficult to scale content production
- Manual SEO optimization is tedious

**How Perdia Helps:**
- Automated article generation and workflow management
- Kanban board for visual pipeline tracking
- Quality metrics and analytics dashboard
- One-click publishing to WordPress

### 2. Editor (Secondary)

**Name:** Michael
**Role:** Senior Content Editor
**Goals:**
- Ensure all published content meets quality standards
- Review and approve articles efficiently
- Provide feedback to improve future content
- Maintain brand voice consistency

**Pain Points:**
- Reviewing 50+ articles per month is overwhelming
- Repetitive quality issues slow down workflow
- Difficult to track feedback and improvements
- Manual content fixes are time-consuming

**How Perdia Helps:**
- Automated quality checklist and scoring
- AI-powered auto-fix for common issues
- Structured review system with contextual comments
- Training feedback loop to reduce recurring issues

### 3. SEO Specialist (Tertiary)

**Name:** Jessica
**Role:** SEO Manager
**Goals:**
- Optimize content for target keywords
- Maintain internal linking structure
- Track content performance in search
- Ensure E-E-A-T compliance

**Pain Points:**
- Manual keyword research and optimization
- Internal linking is inconsistent
- Difficult to track which content drives traffic
- Ensuring author credibility (E-E-A-T)

**How Perdia Helps:**
- Automated keyword clustering and targeting
- Intelligent internal linking from site catalog
- Performance analytics integration
- Author personas with credentials and expertise

---

## Core Features

### 1. Kanban Workflow Dashboard

**Description:** Visual pipeline management system for articles moving through production stages.

**Stages:**
1. **Idea Queue** - Approved content ideas awaiting generation
2. **Drafting** - Articles in initial draft phase
3. **Refinement** - Articles undergoing humanization and optimization
4. **QA & Review** - Articles undergoing quality checks
5. **Publishing** - Articles ready for or recently published

**Key Capabilities:**
- Drag-and-drop articles between stages
- Visual indicators for generating articles
- Risk flags for quality issues
- Quick actions: Retry, Force Approve
- Sequential generation queue
- Real-time progress overlay with step updates
- Automation mode toggle (Manual / Semi-Auto / Full-Auto)

**User Stories:**
- As a Content Manager, I want to see all articles in the pipeline so I can track progress
- As a Content Manager, I want to drag an idea to "Drafting" to initiate generation
- As an Editor, I want to see which articles need review so I can prioritize my work
- As a Content Manager, I want to enable automation mode so articles move through stages automatically

### 2. AI-Powered Article Generation

**Description:** Multi-stage AI pipeline that creates human-like articles using Grok and Claude.

**Generation Pipeline:**

**Stage 1: Analysis & Title Generation**
- Analyze topic and content requirements
- Generate optimized article title
- Determine content type (listicle, guide, ranking, FAQ, degree_page)
- Validate title (10-200 chars, no placeholders)

**Stage 2: Drafting (Grok)**
- Auto-assign ArticleContributor based on topic expertise
- Select relevant SiteArticle entities for internal linking context
- Construct detailed prompt with:
  - Human-like writing instructions
  - Author voice profile
  - Google E-E-A-T alignment
  - Anti-AI-detection techniques
  - Spam prevention guardrails
- Invoke Grok to generate: Title, Excerpt, Content (HTML), FAQs
- Validate response structure
- Clean markdown artifacts

**Stage 3: Refinement (Claude Humanization)**
- Use Claude to rewrite content for:
  - Natural language variability
  - Increased perplexity (unpredictable word choices)
  - Burstiness (varied sentence lengths)
  - Removal of AI-signature phrases
  - Personal voice injection
- Generate SEO metadata (title, description, keywords)

**Stage 4: Quality Assurance & Auto-Fix**
- Calculate metrics: word count, links, FAQs
- Identify quality issues
- Auto-fix process:
  - LLM attempts to correct content
  - Add internal links from SiteArticle catalog
  - Add external citations (.gov, .edu, BLS, NCES)
  - Retry if first fix doesn't meet requirements
- Set article status and risk_flags

**Stage 5: Saving**
- Create Article entity with all content and metadata
- Update ContentIdea to 'completed' with article_id link
- Or set to 'rejected' with failure notes

**Anti-AI-Detection Techniques:**
- Perplexity enhancement (varied vocabulary)
- Burstiness (varied sentence lengths)
- Voice injection (personal touches, opinions)
- Banned phrases list (AI tells)
- Natural imperfections (contractions, casual language)
- Author style profiles

**User Stories:**
- As a Content Manager, I want to generate an article from an idea so I can produce content quickly
- As an Editor, I want AI-generated content to read like human writing so it passes detection tools
- As an SEO Specialist, I want articles to include proper keywords and metadata automatically

### 3. Content Idea Generation

**Description:** AI-powered system to generate article ideas from multiple sources.

**Sources:**
- Reddit trends
- Trending News
- Google Trends
- General Topics
- Custom topic input

**Process:**
1. User selects sources and/or enters custom topic
2. AI (Grok or Claude) generates 5+ content ideas with:
   - Title
   - Description
   - Target audience
   - Priority (high/medium/low)
   - Content type
   - Keywords
3. Semantic similarity check filters duplicates
4. User reviews and selects ideas to add to queue
5. Selected ideas saved as ContentIdea entities

**User Stories:**
- As a Content Manager, I want to generate ideas from trending topics so I can stay current
- As a Content Manager, I want to see if an idea is similar to existing content to avoid duplicates
- As a Content Manager, I want to prioritize ideas so I can focus on high-value content

### 4. Article Contributor System

**Description:** 9 specialized author personas with distinct expertise and writing styles.

**Contributors:**
1. Tony Huffman - Rankings, affordability, cost analysis
2. Kayleigh Gilbert (DEFAULT) - Accreditation, consumer protection
3. Dr. Julia Tell - Instructional design, degree comparisons
4. Kif Richmann - Career guides, job outcomes, salary data
5. Melanie Krol - Leadership, social work, mission-driven fields
6. Alicia Carrasco - Alternative education, transformational learning
7. Daniel Catena - Online education, program finders
8. Sarah Raines - Field-specific guides, research-heavy content
9. Wei Luo - Certificate programs, straightforward degree guides

**Auto-Assignment Logic:**
- Match article topic/keywords to contributor expertise_areas
- Score based on keyword matches, category, content type
- Highest scoring contributor is assigned
- Each contributor has detailed writing_style_profile

**Integration:**
- Maps to WordPress Author ID
- Contributes to E-E-A-T compliance

**User Stories:**
- As an SEO Specialist, I want articles authored by credible experts so they meet E-E-A-T standards
- As a Content Manager, I want contributors auto-assigned so I don't have to manually choose
- As an Editor, I want consistent author voices so content maintains brand standards

### 5. Article Editor

**Description:** Comprehensive editing interface with quality tools and real-time preview.

**Main Features:**
- Rich text editor for HTML content
- Production preview with simulated site styling
- Title, excerpt, content editing
- Content type selector
- Topic cluster assignment
- Contributor assignment with auto-suggest
- Status management
- FAQ schema generator

**Sidebar Tools:**
1. **Quality Checklist** - Evaluates:
   - Word count (min 1200)
   - Image alt tags
   - H1/H2 presence
   - Internal/external links
   - Keyword density
   - Flesch-Kincaid readability
   - Shortcode compliance

2. **Auto-Fix All Issues** - AI-powered improvements
3. **Schema Generator** - FAQ JSON-LD markup
4. **Link Compliance Checker** - Verify link requirements
5. **Article Navigation Generator** - Table of contents
6. **BLS Citation Helper** - Format citations

**Actions:**
- Save Draft
- Submit for Review
- Publish Now
- Post to WordPress

**User Stories:**
- As an Editor, I want to see article quality metrics so I know what needs improvement
- As an Editor, I want to auto-fix issues so I don't have to manually edit everything
- As an Editor, I want to preview how the article will look on the site

### 6. Content Library

**Description:** Centralized repository for all articles with search and filtering.

**Features:**
- Search by title/keyword
- Filter by status and content type
- Article cards showing: title, excerpt, status, type, word count, date
- Bulk selection and deletion
- Link to ArticleEditor
- "New Article" button

**User Stories:**
- As a Content Manager, I want to search for articles by keyword so I can find specific content
- As a Content Manager, I want to filter by status so I can see what needs attention
- As an Editor, I want to bulk delete drafts so I can clean up the library

### 7. WordPress Publishing

**Description:** Direct integration to publish articles to WordPress sites.

**Features:**
- Multiple WordPress site configurations
- Authentication: Application Password, Basic Auth, OAuth
- Connection testing
- Default post status/type/categories/tags
- Dry run mode for testing
- Auto-publication scheduling

**Publishing Function:**
- Fetches Article and WordPressConnection data
- Builds REST API payload with:
  - Title, content (HTML), status
  - Yoast SEO meta (title, description)
  - Author ID from contributor.wordpress_user_id
  - Categories, tags, featured image
- Creates new post or updates existing
- Handles errors and sets publish_status

**User Stories:**
- As a Content Manager, I want to publish articles to WordPress with one click
- As a Content Manager, I want to test publishing without actually posting (dry run)
- As an SEO Specialist, I want Yoast SEO fields populated automatically

### 8. Site Catalog (Internal Linking)

**Description:** Repository of existing site articles for intelligent internal linking.

**Features:**
- Database of 1000+ existing articles
- Fields: URL, title, category, topics, excerpt, author
- Import function from URLs
- Active/inactive status
- Mapping to internal Article entities

**Usage:**
- Provides context for internal linking during generation
- AI selects top 15-50 most relevant articles
- AutoLinker component places 3-5 internal links per article
- Semantic relevance scoring

**User Stories:**
- As an SEO Specialist, I want internal links added automatically so I maintain link structure
- As a Content Manager, I want to import existing articles so the AI knows what content exists
- As an SEO Specialist, I want links to be semantically relevant so they add value

### 9. AI Training & Feedback Loop

**Description:** System for collecting editorial feedback and improving AI generation.

**Review System:**
- Editors select text and add contextual comments
- Comments captured with: text, position, severity, category
- Status tracking (pending/addressed/ignored)

**AI-Driven Revision:**
- "Revise with AI" button on review page
- Constructs prompt with all feedback
- AI rewrites content addressing comments
- Updates revision status

**Training Data Generation:**
- "Submit for AI Training" creates training record
- Captures: original content, revised content, feedback items
- Pattern classification
- Impact scoring (1-10)
- Applied to system flag

**Continuous Improvement:**
- Approved training data refines prompts
- Updates generation instructions
- Tracks improvements over time

**User Stories:**
- As an Editor, I want to provide feedback on AI-generated content so it improves
- As an Editor, I want AI to revise content based on my comments
- As a Content Manager, I want the system to learn from feedback so quality improves over time

### 10. Analytics & Performance Tracking

**Description:** Dashboard for tracking content production and performance metrics.

**Key Metrics:**
- Total Articles
- Weekly Growth
- Average Quality Score
- Published Rate
- Articles in Review

**Charts:**
1. Article Production - Line chart over time
2. Status Distribution - Pie chart of stages
3. Content Types - Bar chart distribution
4. Quality Score Trend - Line chart
5. Cluster Performance - Top topic clusters

**Time Filtering:** 7/30/90 days

**Additional Tracking:**
- AI detection test results
- Per-article: impressions, clicks, CTR, word count
- Revision history

**User Stories:**
- As a Content Manager, I want to see production trends so I can plan capacity
- As an SEO Specialist, I want to see which content types perform best
- As a Content Manager, I want to track quality scores over time to measure improvement

### 11. Keywords & Topic Clusters

**Description:** Strategic content planning through keyword and cluster management.

**Keyword Entity:**
- Keyword text
- Intent (informational, commercial, transactional, navigational)
- Cluster assignment
- Difficulty score
- Search volume
- Target flag

**Cluster Entity:**
- Name, description
- Parent cluster (hierarchical)
- Target audience
- Content brief
- Internal link targets
- External sources
- Priority, status

**Usage:**
- Guides content ideation
- Informs AI generation prompts
- Structures content strategy

**User Stories:**
- As an SEO Specialist, I want to organize keywords into clusters so I can plan content
- As an SEO Specialist, I want to assign articles to clusters so I build topical authority
- As a Content Manager, I want to see which clusters need more content

### 12. Shortcode Management

**Description:** Define and validate custom WordPress shortcodes in content.

**Features:**
- Shortcode database with syntax, parameters, examples
- Category classification
- Validation rules (regex)
- Usage examples
- Backend injection function

**User Stories:**
- As a Developer, I want to define shortcodes so editors can use them correctly
- As an Editor, I want shortcode validation so I know they're correct before publishing

---

## Success Metrics

### Product Metrics

**Efficiency:**
- Time to generate article: < 5 minutes (vs 4-8 hours manual)
- Articles per month: 100+ (vs 20-30 manual)
- Cost per article: < $5 AI costs (vs $100-500 writer)

**Quality:**
- AI detection score: < 30% AI-probability (GPTZero, Originality.ai)
- Average quality score: > 85/100
- Articles passing first review: > 70%
- Articles requiring major revision: < 10%

**SEO Performance:**
- Average word count: 1500-2500 words
- Internal links per article: 3-5
- External citations per article: 2-4
- Flesch-Kincaid reading level: 8-10th grade

**Workflow:**
- Ideas to published: < 24 hours (automated path)
- Ideas to published: < 1 week (manual review path)
- Articles in queue: < 20
- Publishing success rate: > 95%

### User Engagement

- Daily active users: 3-5
- Articles generated per user per week: 20-40
- Feature adoption: Automation mode > 60%
- User satisfaction (NPS): > 50

### Technical Performance

- Page load time: < 2 seconds
- Generation success rate: > 90%
- WordPress publish success rate: > 95%
- System uptime: > 99.5%

---

## Technical Requirements

### Frontend

**Framework:**
- React 18.2+
- Vite 6.0+ (build tool)
- React Router 7.0+

**Styling:**
- Tailwind CSS 3.4+
- Shadcn UI components
- Dark mode support
- Responsive design (mobile, tablet, desktop)

**State Management:**
- TanStack React Query (data fetching/caching)
- React Context (global state)
- Local state (useState, useReducer)

**Key Libraries:**
- Recharts (analytics charts)
- Framer Motion (animations)
- React Hook Form + Zod (forms/validation)
- Date-fns (date utilities)
- Lucide React (icons)
- React Quill or Tiptap (rich text editor)

### Backend

**Platform:**
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- PostgreSQL 15+
- Row Level Security (RLS) policies

**Authentication:**
- Supabase Auth
- Email/password
- Role-based access (admin, editor, user)

**Functions:**
- Supabase Edge Functions (Deno)
- WordPress publishing endpoint
- AI generation orchestration
- Webhook handlers

**Storage:**
- Supabase Storage for file uploads
- Image optimization

### AI Integration

**Models:**
- xAI Grok (grok-beta or grok-2) - Drafting
- Anthropic Claude (claude-3-5-sonnet-20250122) - Humanization
- Optional: OpenAI GPT-4o-mini for structured tasks

**Requirements:**
- Streaming support for real-time updates
- Retry logic with exponential backoff
- Rate limiting
- Token usage tracking
- Error handling and fallbacks

**Integration Pattern:**
- Direct API calls (no wrapper)
- Separate service layer
- Environment variable configuration

### Database

**Entities (14 total):**
1. User (Supabase Auth)
2. Article
3. ContentIdea
4. ArticleContributor
5. Cluster
6. Keyword
7. SiteArticle
8. WordPressConnection
9. SystemSetting
10. ArticleRevision
11. TrainingData
12. DetectionResearchLog
13. ArticleWorkflowConfig
14. Shortcode

**Requirements:**
- Foreign key relationships
- Indexes on frequently queried fields
- JSON columns for arrays/objects
- Timestamps (created_at, updated_at)
- Soft deletes where applicable

### Deployment

**Frontend:**
- Netlify
- Continuous deployment from Git
- Environment variables
- Custom domain support

**Backend:**
- Supabase Cloud
- Edge Functions deployed via Supabase CLI
- Environment secrets management

**CI/CD:**
- GitHub Actions or Netlify CI
- Automated testing
- Preview deployments for PRs

### Security

**Authentication:**
- Secure password hashing (Supabase default)
- Session management
- CSRF protection

**Authorization:**
- Row Level Security (RLS) policies
- Role-based access control
- API key rotation

**Data:**
- Encrypted at rest (Supabase default)
- HTTPS only
- Input validation and sanitization
- SQL injection prevention

**API Keys:**
- Environment variables only
- Never exposed to frontend
- Rotation policy

---

## User Stories

### Epic 1: Article Generation

**US-001:** As a Content Manager, I want to generate an article from an idea so I can produce content quickly.
**Acceptance Criteria:**
- Can drag idea to "Drafting" column to start generation
- Generation progress is visible with step-by-step updates
- Article appears in "Drafting" column when complete
- Generation completes in < 5 minutes

**US-002:** As a Content Manager, I want to generate multiple articles in sequence so I can batch produce content.
**Acceptance Criteria:**
- Can queue multiple ideas for generation
- Visual indicator shows queue count
- Articles generate sequentially
- Can continue working while generation happens in background

**US-003:** As an Editor, I want AI-generated content to read like human writing so it passes detection tools.
**Acceptance Criteria:**
- Articles score < 30% AI-probability on GPTZero
- Content uses varied sentence lengths
- Content avoids AI-signature phrases
- Content has natural, conversational tone

### Epic 2: Workflow Management

**US-004:** As a Content Manager, I want to see all articles in the pipeline so I can track progress.
**Acceptance Criteria:**
- Dashboard shows 5 workflow stages
- Articles displayed as cards in columns
- Card shows title, status, contributor, date
- Can filter and search articles

**US-005:** As a Content Manager, I want to move articles between stages so I can manage the workflow.
**Acceptance Criteria:**
- Can drag-and-drop articles between columns
- Status updates automatically
- Change is saved to database
- Real-time updates for other users

**US-006:** As a Content Manager, I want to enable automation mode so articles move through stages automatically.
**Acceptance Criteria:**
- Toggle switch for automation mode
- In auto mode, articles progress automatically after each stage
- Can override and manually move articles
- Visual indicator shows automation is enabled

### Epic 3: Quality Control

**US-007:** As an Editor, I want to see article quality metrics so I know what needs improvement.
**Acceptance Criteria:**
- Quality checklist shows pass/fail for each criterion
- Overall quality score displayed (0-100)
- Risk flags visible on article cards
- Can click checklist item to see details

**US-008:** As an Editor, I want to auto-fix quality issues so I don't have to manually edit everything.
**Acceptance Criteria:**
- "Auto-Fix All Issues" button available
- Shows progress during fixing
- Updates content with improvements
- Re-runs quality check after fix

**US-009:** As an Editor, I want to provide feedback on articles so future content improves.
**Acceptance Criteria:**
- Can select text and add comment
- Can categorize feedback (tone, accuracy, structure, etc.)
- Can set severity level
- Feedback saved and linked to article

### Epic 4: Publishing

**US-010:** As a Content Manager, I want to publish articles to WordPress with one click.
**Acceptance Criteria:**
- "Post to WordPress" button available
- Selects default WordPress connection
- Publishes with correct author, categories, SEO meta
- Shows success/failure message
- Updates article with WordPress post ID and URL

**US-011:** As a Content Manager, I want to test publishing without actually posting so I can verify configuration.
**Acceptance Criteria:**
- Can enable "Dry Run" mode
- Simulates publish without creating post
- Shows what would be sent to WordPress
- Validates connection and credentials

### Epic 5: Analytics

**US-012:** As a Content Manager, I want to see production trends so I can plan capacity.
**Acceptance Criteria:**
- Chart shows articles created over time
- Can filter by time range (7/30/90 days)
- Shows weekly growth percentage
- Can drill down by content type or author

**US-013:** As an SEO Specialist, I want to see which content types perform best.
**Acceptance Criteria:**
- Bar chart shows distribution by content type
- Shows quality scores by type
- Shows publish rate by type
- Can click to see articles of that type

---

## Feature Priorities

### Phase 1: MVP (Weeks 1-4)

**Must Have:**
1. User authentication (Supabase Auth)
2. Database schema and migrations
3. AI integration (Grok + Claude)
4. Basic article generation pipeline
5. Kanban dashboard (5 stages)
6. Article editor with rich text
7. Content Library (list/search)
8. WordPress publishing (basic)

**Success Criteria:**
- Can generate an article from idea to draft
- Can edit article in editor
- Can publish to WordPress
- Can view articles in library

### Phase 2: Quality & Automation (Weeks 5-8)

**Must Have:**
1. Quality checklist and scoring
2. Auto-fix functionality
3. Contributor system (9 authors)
4. Auto-assignment logic
5. Sequential generation queue
6. Automation mode toggle
7. Site Catalog (basic)
8. Internal linking (basic)

**Success Criteria:**
- Articles auto-assigned to appropriate contributor
- Quality issues auto-fixed
- Can queue multiple articles
- Automation mode moves articles through stages

### Phase 3: Intelligence & Learning (Weeks 9-12)

**Must Have:**
1. Advanced internal linking (AutoLinker)
2. Content idea generation (from sources)
3. Semantic similarity detection
4. Review system with comments
5. AI-powered revision
6. Training data collection
7. Analytics dashboard (basic)
8. Keywords & Clusters (basic)

**Success Criteria:**
- Can generate ideas from trending topics
- AI adds relevant internal links
- Editors can review and provide feedback
- AI learns from feedback

### Phase 4: Polish & Scale (Weeks 13-16)

**Should Have:**
1. Advanced analytics (charts, trends)
2. Detection test tracking
3. Shortcode management
4. Multiple WordPress connections
5. Bulk operations
6. Performance optimization
7. Mobile responsive design
8. Dark mode

**Success Criteria:**
- Full analytics with all charts
- Can manage multiple WordPress sites
- Mobile-friendly interface
- Performance optimized (< 2s load time)

### Future Enhancements

**Nice to Have:**
- A/B testing for prompts
- Direct model fine-tuning
- Competitive content analysis
- Content calendar and scheduling
- Team collaboration features
- Advanced permissions system
- Multi-language support
- API for external integrations

---

## Non-Functional Requirements

### Performance

**Response Time:**
- Page load: < 2 seconds
- Search results: < 500ms
- Article save: < 1 second
- Generation start: < 2 seconds

**Throughput:**
- Support 5 concurrent users
- Generate 100 articles per day
- Handle 1000+ articles in library
- Process 10 simultaneous API calls

**Scalability:**
- Database: Support 10,000+ articles
- Storage: Support 10GB+ content
- Users: Support 20+ team members

### Reliability

**Availability:**
- Uptime: 99.5% (excluding maintenance)
- Planned maintenance: < 4 hours/month
- Unplanned downtime: < 2 hours/month

**Error Handling:**
- Graceful degradation when AI APIs unavailable
- Automatic retry with exponential backoff
- Clear error messages to users
- Fallback mechanisms for critical features

**Data Integrity:**
- No data loss during failures
- Automatic backups (Supabase daily)
- Point-in-time recovery
- Transaction consistency

### Usability

**Learnability:**
- New user can generate first article in < 15 minutes
- No training required for basic features
- Contextual help and tooltips
- Onboarding wizard

**Efficiency:**
- < 3 clicks to perform common actions
- Keyboard shortcuts for frequent tasks
- Bulk operations for repetitive tasks
- Smart defaults reduce configuration

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode

### Security

**Data Protection:**
- Encryption at rest and in transit
- Regular security audits
- Compliance with data privacy regulations
- Secure credential storage

**Access Control:**
- Role-based permissions
- Session timeout after 24 hours
- Strong password requirements
- Audit logging for sensitive actions

### Maintainability

**Code Quality:**
- TypeScript for type safety (optional but recommended)
- ESLint and Prettier for consistency
- Comprehensive comments
- Modular, reusable components

**Testing:**
- Unit test coverage > 70%
- Integration tests for critical paths
- E2E tests for main workflows
- Regular regression testing

**Documentation:**
- Architecture documentation
- API documentation
- Component documentation
- Deployment guides

### Compatibility

**Browser Support:**
- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

**Device Support:**
- Desktop (primary)
- Tablet (secondary)
- Mobile (basic view)

**API Compatibility:**
- WordPress REST API v2
- Supabase Client v2+
- AI provider APIs (current versions)

---

## Constraints & Assumptions

### Technical Constraints

1. **AI API Limitations:**
   - Rate limits vary by provider
   - Token limits per request
   - Cost per token
   - Occasional downtime

2. **Supabase Limits:**
   - Free tier: 500MB database, 1GB bandwidth
   - Row Level Security overhead
   - Realtime connections limit

3. **WordPress API:**
   - Requires WordPress 5.6+ for Application Passwords
   - REST API must be enabled
   - May require plugins for full functionality

4. **Browser Limitations:**
   - LocalStorage size limits
   - JavaScript memory limits
   - Concurrent request limits

### Business Constraints

1. **Budget:**
   - AI API costs must stay < $500/month
   - Infrastructure costs < $100/month
   - Total operational cost < $1000/month

2. **Timeline:**
   - MVP in 4 weeks
   - Full v1.0 in 16 weeks
   - Regular bi-weekly releases

3. **Team:**
   - 1-2 developers
   - 1 content manager for testing
   - Part-time designer

### Assumptions

1. **Users:**
   - Have basic technical literacy
   - Understand content marketing and SEO
   - Have access to WordPress admin
   - Have API keys for AI providers

2. **Content:**
   - Primary language: English
   - Target: Educational content
   - Volume: 50-200 articles/month
   - Length: 1200-3000 words per article

3. **Infrastructure:**
   - Reliable internet connection
   - Modern browsers
   - Supabase remains available and affordable
   - AI APIs remain accessible

4. **Quality:**
   - AI-generated content requires some human review
   - Not all generated articles will be perfect
   - Some manual editing expected
   - Quality improves over time with training data

### Risks & Mitigation

**Risk 1: AI Detection Improves**
- **Impact:** High - Core value proposition
- **Mitigation:** Continuous research, prompt updates, multi-model approach

**Risk 2: AI API Costs Spike**
- **Impact:** High - Operational viability
- **Mitigation:** Token usage tracking, caching, model selection optimization

**Risk 3: Supabase Limitations**
- **Impact:** Medium - Scalability concerns
- **Mitigation:** Optimize queries, implement caching, plan migration path

**Risk 4: WordPress API Changes**
- **Impact:** Medium - Publishing disruption
- **Mitigation:** Version detection, fallback methods, regular testing

**Risk 5: Quality Inconsistency**
- **Impact:** Medium - User satisfaction
- **Mitigation:** Robust QA checks, auto-fix, human review, training loop

---

## Appendix

### Glossary

- **E-E-A-T:** Experience, Expertise, Authoritativeness, Trustworthiness (Google's content quality framework)
- **Perplexity:** Measure of unpredictability in text (higher = more human-like)
- **Burstiness:** Variation in sentence lengths (human writing has high burstiness)
- **RLS:** Row Level Security (Supabase database security feature)
- **Edge Function:** Serverless function running close to users (Deno Deploy)
- **Semantic Similarity:** Measure of meaning similarity between texts
- **Topic Cluster:** Group of related content pieces for SEO

### References

- Original Perdia repo: `C:\Users\Disruptors\Desktop\Perdia content engine\repo`
- Original PRDs and documentation in parent folder
- Supabase documentation: https://supabase.com/docs
- xAI Grok API: https://docs.x.ai/
- Anthropic Claude API: https://docs.anthropic.com/

### Version History

- **v2.0 (Jan 2025):** Complete rebuild with Supabase, Grok + Claude
- **v1.0 (2024):** Original Base44 implementation

---

**Document Status:** Complete
**Next Steps:** Review and approve → Proceed to Technical Architecture Document
