# Perdia Content Engine - Implementation Roadmap

**Version:** 2.0
**Timeline:** 16 weeks (4 phases)
**Team Size:** 1-2 developers
**Date:** January 2025

---

## Executive Summary

This roadmap breaks down the Perdia rebuild into 4 distinct phases over 16 weeks, with clear deliverables and milestones for each phase.

**Phase 1 (Weeks 1-4):** MVP - Core generation and basic features
**Phase 2 (Weeks 5-8):** Quality & Automation
**Phase 3 (Weeks 9-12):** Intelligence & Learning
**Phase 4 (Weeks 13-16):** Polish & Scale

---

## Phase 1: MVP Foundation (Weeks 1-4)

### Goal
Build a working end-to-end system that can generate, edit, and publish one article.

### Week 1: Infrastructure Setup

**Days 1-2: Project Initialization**
- [ ] Create new Git repository
- [ ] Initialize React + Vite project
- [ ] Install and configure Tailwind CSS
- [ ] Set up Shadcn UI components
- [ ] Configure ESLint and Prettier
- [ ] Set up basic folder structure

**Days 3-4: Supabase Setup**
- [ ] Create Supabase project
- [ ] Run initial database migrations (14 tables)
- [ ] Configure Row Level Security policies
- [ ] Set up authentication
- [ ] Test database connection from frontend

**Day 5: AI Integration Setup**
- [ ] Create Grok client (basic)
- [ ] Create Claude client (basic)
- [ ] Test API connections
- [ ] Set up environment variables

**Deliverable:** Running development environment with database and AI clients connected.

---

### Week 2: Core Data Layer & Authentication

**Days 1-2: Supabase Client & React Query**
- [ ] Create Supabase client wrapper
- [ ] Set up React Query provider
- [ ] Create custom hooks for each entity:
  - `useArticles()`
  - `useContentIdeas()`
  - `useContributors()`
- [ ] Create mutation hooks (create, update, delete)

**Days 3-4: Authentication**
- [ ] Build Login page
- [ ] Build Signup page
- [ ] Create AuthContext
- [ ] Implement protected routes
- [ ] Add session persistence
- [ ] Create user profile page

**Day 5: Seed Data**
- [ ] Seed 9 article contributors
- [ ] Seed system settings
- [ ] Create test articles and ideas
- [ ] Verify RLS policies work correctly

**Deliverable:** Authentication working, data layer functional with custom hooks.

---

### Week 3: Article Generation Pipeline

**Days 1-2: Prompt Engineering**
- [ ] Build `PromptBuilder` service
- [ ] Implement `buildDraftPrompt()`
- [ ] Implement `buildHumanizationPrompt()`
- [ ] Test prompts manually with AI APIs
- [ ] Refine based on output quality

**Days 3-5: Generation Service**
- [ ] Create `generationService.js`
- [ ] Implement draft generation (Grok)
- [ ] Implement humanization (Claude)
- [ ] Implement SEO metadata generation
- [ ] Add validation and error handling
- [ ] Add retry logic with exponential backoff
- [ ] Test full pipeline end-to-end

**Deliverable:** Working article generation from idea → draft → humanized content.

---

### Week 4: Basic UI - Dashboard & Editor

**Days 1-2: Dashboard (Basic)**
- [ ] Create Dashboard page layout
- [ ] Build KanbanBoard component (5 columns)
- [ ] Build ArticleCard component
- [ ] Fetch and display articles by status
- [ ] Implement basic drag-and-drop (react-beautiful-dnd or dnd-kit)
- [ ] Update article status on drop

**Days 3-4: Article Editor (Basic)**
- [ ] Create ArticleEditor page
- [ ] Integrate rich text editor (React Quill or Tiptap)
- [ ] Add title and excerpt fields
- [ ] Add save functionality
- [ ] Add preview pane
- [ ] Route from dashboard to editor

**Day 5: Content Library (Basic)**
- [ ] Create ContentLibrary page
- [ ] Display articles in grid/list
- [ ] Add search functionality
- [ ] Add filter by status
- [ ] Link to editor

**Deliverable:** Basic UI allowing manual article creation and editing.

---

### Phase 1 Milestone: MVP DEMO

**Capabilities:**
- User can log in
- User can create a content idea manually
- System can generate article from idea (Grok + Claude)
- User can edit article in editor
- User can view articles in library
- User can move articles through workflow stages

**Not Yet Included:**
- WordPress publishing
- Auto-assignment
- Quality checks
- Automated workflow
- Analytics

---

## Phase 2: Quality & Automation (Weeks 5-8)

### Goal
Add quality controls, automated workflows, and WordPress publishing.

### Week 5: WordPress Integration

**Days 1-2: WordPress Connection Setup**
- [ ] Create `wordpress_connections` table UI
- [ ] Build connection form (auth types)
- [ ] Implement connection testing
- [ ] Store encrypted credentials

**Days 3-5: Publishing Function**
- [ ] Create Supabase Edge Function `publish-to-wordpress`
- [ ] Implement WordPress REST API client
- [ ] Build post payload (title, content, meta)
- [ ] Handle Yoast SEO fields
- [ ] Test publishing (dry run mode)
- [ ] Add publish button to editor
- [ ] Display publish status and errors

**Deliverable:** One-click WordPress publishing working.

---

### Week 6: Quality System

**Days 1-2: Quality Checklist**
- [ ] Create `QualityChecklist` component
- [ ] Implement quality metrics calculation:
  - Word count
  - Internal/external link counts
  - FAQ count
  - Readability score (Flesch-Kincaid)
  - Heading structure validation
- [ ] Display pass/fail indicators
- [ ] Calculate overall quality score

**Days 3-5: Auto-Fix Functionality**
- [ ] Implement `autoFixQualityIssues()` in Claude client
- [ ] Create targeted fix prompts
- [ ] Add "Auto-Fix All Issues" button
- [ ] Show progress during fixing
- [ ] Re-run quality check after fix
- [ ] Set risk_flags for remaining issues

**Deliverable:** Quality checklist and auto-fix working.

---

### Week 7: Contributor System & Auto-Assignment

**Days 1-2: Contributor UI**
- [ ] Create ContributorSetup page
- [ ] Display all 9 contributors
- [ ] Edit contributor form
- [ ] Update expertise areas and style profiles

**Days 3-5: Auto-Assignment Logic**
- [ ] Create `ContributorAssignment` service
- [ ] Implement scoring algorithm:
  - Keyword matches
  - Category matches
  - Content type matches
- [ ] Auto-assign during generation
- [ ] Allow manual override in editor
- [ ] Cache contributor name on article

**Deliverable:** Contributors auto-assigned to articles based on topic.

---

### Week 8: Automation Engine & Full Automatic Mode

**Days 1-2: Generation Queue & Basic Automation**
- [ ] Implement sequential generation queue
- [ ] Add "Generate" button to idea cards
- [ ] Show "Add to Queue" for subsequent clicks
- [ ] Display sticky progress bar
- [ ] Process queue automatically
- [ ] Add automation_level setting (manual/semi_auto/full_auto)
- [ ] Create automation toggle UI in dashboard

**Days 3-4: Full Automatic Mode Implementation**
- [ ] Create AutomaticModeEngine class
- [ ] Implement continuous cycle loop:
  - Check idea queue, auto-generate if needed (DataForSEO + AI)
  - Pick next approved idea
  - Generate article (Grok + Claude)
  - Quality assurance with closed-loop auto-fix (up to 3 attempts)
  - Save article with quality score
  - Auto-publish if score ≥ 85
- [ ] Add quality gates and decision trees
- [ ] Implement error handling and retry logic
- [ ] Add automatic mode status dashboard

**Day 5: Monitoring & Controls**
- [ ] Build real-time automatic mode dashboard
- [ ] Display current task, queue status, cycle stats
- [ ] Add Start/Stop buttons for automatic mode
- [ ] Implement notification system (errors, completions)
- [ ] Add logging for audit trail

**Deliverable:** Fully autonomous end-to-end article generation and publishing system.

---

### Phase 2 Milestone: PRODUCTION-READY MVP

**Capabilities:**
- Generate articles automatically from ideas
- Quality checks and auto-fix (closed-loop with up to 3 retries)
- Auto-assign contributors
- Sequential generation queue
- Publish to WordPress
- **Full Automatic Mode:** End-to-end autonomous operation
- Quality gates (auto-publish if score ≥ 85, review if 75-84, reject if < 75)
- Error handling and graceful degradation

---

## Phase 3: Intelligence & Learning (Weeks 9-12)

### Goal
Add intelligent internal linking, idea generation, and AI training loop.

### Week 9: Site Catalog & Internal Linking

**Days 1-2: Site Catalog UI**
- [ ] Create SiteCatalog page
- [ ] Display existing site articles
- [ ] Add import form (bulk URL input)
- [ ] Implement `importSiteArticles` Edge Function
- [ ] Test importing articles

**Days 3-5: AutoLinker System**
- [ ] Create `AutoLinker` service
- [ ] Implement relevance scoring:
  - Title matches
  - Topic overlap
  - Category similarity
- [ ] Integrate with generation pipeline
- [ ] Add 3-5 internal links per article
- [ ] Validate link placement

**Deliverable:** Intelligent internal linking from 1000+ article catalog.

---

### Week 10: Content Idea Generation + DataForSEO Integration

**Days 1-2: DataForSEO Integration**
- [ ] Set up DataForSEO account and get API credentials
- [ ] Create DataForSEOClient service
- [ ] Implement keyword research methods:
  - `getKeywordSuggestions()`
  - `getSearchVolume()`
  - `getSerpAnalysis()` (optional)
- [ ] Test API connection and keyword data
- [ ] Add keyword_research_data field to content_ideas table

**Days 3-4: Enhanced Idea Generation**
- [ ] Create keyword research workflow
- [ ] Integrate DataForSEO with idea generation
- [ ] Filter keywords by search volume, difficulty, opportunity score
- [ ] Generate AI content ideas from keywords
- [ ] Display keyword metrics in UI (volume, difficulty, etc.)

**Day 5: Semantic Similarity Check**
- [ ] Implement similarity detection algorithm
- [ ] Compare new ideas to existing articles
- [ ] Filter out duplicates
- [ ] Show similarity warnings
- [ ] Allow user to select ideas to add

**Deliverable:** DataForSEO-powered keyword research and AI idea generation with metrics.

---

### Week 11: Review & Training System

**Days 1-2: Article Review UI**
- [ ] Create ArticleReview page
- [ ] Implement text selection for comments
- [ ] Build comment form (category, severity, comment)
- [ ] Save ArticleRevision entities
- [ ] Display comments in sidebar

**Days 3-4: AI-Powered Revision**
- [ ] Implement `reviseWithFeedback()` in Claude client
- [ ] Add "Revise with AI" button
- [ ] Show progress during revision
- [ ] Update article content
- [ ] Mark revisions as 'addressed'

**Day 5: Training Data Submission**
- [ ] Add "Submit for AI Training" button
- [ ] Create TrainingData entity
- [ ] Extract patterns and lessons learned
- [ ] Calculate impact score

**Deliverable:** Editorial review and AI training feedback loop.

---

### Week 12: AI Training Dashboard

**Days 1-3: AITraining Page**
- [ ] Create AITraining page
- [ ] Display pending training data
- [ ] Show original vs revised content
- [ ] Display feedback items
- [ ] Add approve/reject actions
- [ ] Mark as applied to system

**Days 4-5: Prompt Refinement System**
- [ ] Analyze approved training data
- [ ] Identify common patterns
- [ ] Update `PromptBuilder` templates
- [ ] Update system settings
- [ ] Track improvements over time

**Deliverable:** AI continuously improving from editorial feedback.

---

### Phase 3 Milestone: INTELLIGENT SYSTEM

**Capabilities:**
- Intelligent internal linking
- **DataForSEO-powered keyword research** for content ideas
- AI-generated content ideas with search volume and competition metrics
- Editorial review system
- AI learns from feedback
- Continuous quality improvement
- Semantic similarity detection to avoid duplicates

---

## Phase 4: Polish & Scale (Weeks 13-16)

### Goal
Analytics, performance optimization, mobile support, deployment.

### Week 13: Analytics Dashboard

**Days 1-3: Analytics Page**
- [ ] Create Analytics page layout
- [ ] Implement key metrics cards:
  - Total articles
  - Weekly growth
  - Average quality score
  - Published rate
- [ ] Add time range filter (7/30/90 days)

**Days 4-5: Charts**
- [ ] Article production line chart (Recharts)
- [ ] Status distribution pie chart
- [ ] Content types bar chart
- [ ] Quality score trend line chart
- [ ] Cluster performance chart

**Deliverable:** Comprehensive analytics dashboard.

---

### Week 14: Keywords, Clusters, Settings

**Days 1-2: Keywords & Clusters**
- [ ] Create KeywordsAndClusters page
- [ ] Display clusters in hierarchy
- [ ] Add keyword management
- [ ] Link clusters to articles

**Days 3-4: Settings & Integrations**
- [ ] Create Settings page
- [ ] Display system settings
- [ ] Add edit functionality
- [ ] Create Integrations page
- [ ] Manage WordPress connections
- [ ] Manage shortcodes

**Day 5: Shortcode System**
- [ ] Create Shortcode management UI
- [ ] Implement validation
- [ ] Add shortcode picker to editor

**Deliverable:** Complete configuration and management UIs.

---

### Week 15: Performance & Polish

**Days 1-2: Performance Optimization**
- [ ] Implement code splitting (lazy loading)
- [ ] Optimize bundle size
- [ ] Add loading skeletons
- [ ] Implement virtualized lists for large datasets
- [ ] Optimize database queries (indexes)
- [ ] Add caching strategies

**Days 3-4: Mobile Responsiveness**
- [ ] Make dashboard mobile-friendly
- [ ] Optimize editor for tablets
- [ ] Test on various devices
- [ ] Fix layout issues

**Day 5: Dark Mode & Accessibility**
- [ ] Implement dark mode toggle
- [ ] Ensure proper color contrast
- [ ] Add keyboard navigation support
- [ ] Test with screen readers

**Deliverable:** Polished, performant, accessible application.

---

### Week 16: Deployment & Documentation

**Days 1-2: Deployment Setup**
- [ ] Set up Netlify project
- [ ] Configure build settings
- [ ] Set up environment variables
- [ ] Deploy Supabase Edge Functions
- [ ] Test production deployment
- [ ] Set up custom domain (optional)

**Days 3-4: Testing & Bug Fixes**
- [ ] End-to-end testing of all features
- [ ] Fix critical bugs
- [ ] Performance testing
- [ ] Security audit
- [ ] Load testing

**Day 5: Documentation & Launch**
- [ ] Write user documentation
- [ ] Create video tutorials (optional)
- [ ] Prepare launch announcement
- [ ] Train initial users
- [ ] GO LIVE!

**Deliverable:** Deployed, tested, production-ready application.

---

### Phase 4 Milestone: LAUNCH

**Full Feature Set:**
- ✅ AI-powered article generation (Grok + Claude)
- ✅ Kanban workflow dashboard
- ✅ Quality checks and auto-fix
- ✅ WordPress publishing
- ✅ Contributor system
- ✅ Automation modes
- ✅ Intelligent internal linking
- ✅ Idea generation from trends
- ✅ Editorial review and AI training
- ✅ Analytics dashboard
- ✅ Keywords and clusters
- ✅ Mobile responsive
- ✅ Dark mode
- ✅ Production deployed

---

## Risk Management

### High-Risk Items

**1. AI API Reliability**
- **Risk:** APIs go down or change pricing
- **Mitigation:** Implement fallbacks, budget alerts, caching

**2. Quality Inconsistency**
- **Risk:** Generated content doesn't meet standards
- **Mitigation:** Robust QA checks, human review, training loop

**3. WordPress Integration Issues**
- **Risk:** Different WP versions/plugins cause compatibility issues
- **Mitigation:** Thorough testing, dry run mode, error handling

**4. Scope Creep**
- **Risk:** Adding features delays launch
- **Mitigation:** Stick to phased roadmap, defer "nice-to-haves"

### Timeline Buffers

- Each phase includes 1-2 days of buffer time
- Week 16 is primarily testing and polish
- Can absorb 1-2 week delay without major impact

---

## Success Criteria by Phase

### Phase 1: MVP
- [ ] Can generate 1 article end-to-end
- [ ] UI is functional (not necessarily beautiful)
- [ ] Database operations work correctly

### Phase 2: Production Ready
- [ ] Can generate 10 articles per day reliably
- [ ] Quality score average > 80/100
- [ ] WordPress publishing works 95%+ of time

### Phase 3: Intelligent
- [ ] Internal links are relevant and helpful
- [ ] AI learns from feedback (measurable improvement)
- [ ] Idea generation produces usable ideas

### Phase 4: Launch
- [ ] Performance: Page load < 2s
- [ ] Uptime: 99%+
- [ ] User satisfaction: Positive feedback from testers

---

## Post-Launch Roadmap (Weeks 17+)

### Month 2-3: Optimization
- A/B test prompt variations
- Optimize AI costs
- Improve detection scores
- Enhance user experience based on feedback

### Month 4-6: Advanced Features
- Multi-language support
- Content calendar and scheduling
- Advanced permissions (team roles)
- API for external integrations
- Direct model fine-tuning with training data

### Month 7-12: Scale
- Handle 1000+ articles
- Support multiple sites/clients
- Advanced analytics (GA integration)
- Competitive analysis features
- SEO performance tracking

---

**Document Status:** Complete
**Next Document:** Frontend Component Architecture
