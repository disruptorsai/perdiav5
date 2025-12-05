# Remaining Implementation - Gap Analysis

**Last Updated:** December 5, 2025
**Status:** Comprehensive analysis of what's implemented vs what's still needed

This document provides a detailed comparison between the specifications in `perdia_geteducated_content_monetization_spec.md` and the existing documentation against what has actually been implemented in the codebase.

---

## Executive Summary

| Category | Implemented | Partially Done | Not Started | Total Items |
|----------|-------------|----------------|-------------|-------------|
| Database Schema | 8 | 2 | 3 | 13 |
| Validation & Compliance | 4 | 1 | 2 | 7 |
| Monetization System | 2 | 1 | 4 | 7 |
| Data Integration | 1 | 0 | 4 | 5 |
| AI Generation | 2 | 2 | 3 | 7 |
| Workflow & Publishing | 2 | 2 | 3 | 7 |
| UI Components | 3 | 3 | 2 | 8 |
| **TOTAL** | **22** | **11** | **21** | **54** |

**Overall Progress: ~41% Complete**

---

## 1. DATABASE SCHEMA

### 1.1 Implemented Tables

| Table | Status | Notes |
|-------|--------|-------|
| `articles` | IMPLEMENTED | Has all required fields including `risk_level`, `autopublish_deadline`, `reviewed_at` |
| `article_contributors` | IMPLEMENTED | Has `is_active`, `display_name`, `author_page_url` columns |
| `content_ideas` | IMPLEMENTED | Full workflow support |
| `monetization_categories` | IMPLEMENTED | 155 category/concentration pairs seeded |
| `monetization_levels` | IMPLEMENTED | 13 degree levels seeded |
| `article_monetization` | IMPLEMENTED | Tracks shortcode placements |
| `site_articles` | IMPLEMENTED | For internal linking catalog |
| `system_settings` | IMPLEMENTED | Settings storage (column names differ from spec) |

### 1.2 Partially Implemented

| Table | Status | What's Missing |
|-------|--------|----------------|
| `subjects` | NOT CREATED | Spec requires a `subjects` table mapping topics to Category ID + Concentration ID + CIP codes. Current `monetization_categories` table is similar but lacks CIP code fields |
| `degree_levels` | RENAMED | Exists as `monetization_levels` but missing some spec requirements |

### 1.3 Not Implemented

| Table | Priority | Description |
|-------|----------|-------------|
| `subjects` (full spec) | **P0** | Full subject-CIP-BLS mapping per spec section 3.1.1. Needs: `field_of_study_label`, `cip_main_code`, `cip_main_title`, `cip_secondary_code`, `cip_secondary_title`, `cip_third_code`, `cip_third_title`, `degree_description` |
| `ranking_reports` | **P0** | Store cost data from GetEducated ranking reports |
| `schools` | **P1** | School database with GetEducated URLs, paid client status, logo |
| `degrees` | **P1** | Degree database with sponsored status, program details |

---

## 2. VALIDATION & COMPLIANCE

### 2.1 Implemented

| Feature | File | Status |
|---------|------|--------|
| Link Validator | `src/services/validation/linkValidator.js` | COMPLETE - Blocks .edu, competitors, validates external whitelist |
| Risk Assessment | `src/services/validation/riskAssessment.js` | COMPLETE - Risk levels (LOW/MEDIUM/HIGH/CRITICAL) |
| Pre-Publish Validation | `src/services/validation/prePublishValidation.js` | COMPLETE - Author, links, risk, quality checks |
| Approved Authors List | `src/hooks/useContributors.js` | COMPLETE - Only Tony, Kayleigh, Sarah, Charity |

### 2.2 Partially Implemented

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Shortcode Validation | PARTIAL | Can detect missing shortcodes but cannot validate shortcode FORMAT or PARAMETERS |

### 2.3 Not Implemented

| Feature | Priority | Description |
|---------|----------|-------------|
| Shortcode Parameter Validation | **P0** | Validate `category_id`, `concentration_id`, `level` values exist in database |
| Cost Data Source Validation | **P0** | Verify cost numbers come from ranking reports, not external sources |

---

## 3. MONETIZATION SYSTEM

### 3.1 Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Monetization Categories Table | COMPLETE | 155 category/concentration pairs |
| Monetization Levels Table | COMPLETE | 13 degree levels with codes |

### 3.2 Partially Implemented

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Article-to-Monetization Mapping | PARTIAL | `article_monetization` table exists but no logic to auto-populate |

### 3.3 Not Implemented

| Feature | Priority | Description |
|---------|----------|-------------|
| Topic-to-Category Matcher | **P0** | AI/algorithm to map article topic to appropriate Category ID + Concentration ID |
| Shortcode Generator | **P0** | Generate `[ge_monetization category="X" concentration="Y" level="Z"]` from article context |
| Shortcode Auto-Placement | **P1** | Insert shortcodes at appropriate positions (after intro, mid-content, pre-conclusion) |
| Monetization Preview UI | **P2** | Show what monetization block will look like in editor |

**Spec Reference:** Section 4 of `perdia_geteducated_content_monetization_spec.md`

---

## 4. DATA INTEGRATION

### 4.1 Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Internal Linking Catalog | PARTIAL | `site_articles` table exists but not populated with GetEducated data |

### 4.2 Not Implemented

| Feature | Priority | Description |
|---------|----------|-------------|
| Ranking Report Crawler | **P0** | Scrape https://www.geteducated.com/online-college-ratings-and-rankings/ for cost data |
| Ranking Report Data Model | **P0** | Store: program_name, school_name, degree_level, total_cost, in_state_cost, out_state_cost, accreditation |
| Degree Database Crawler | **P1** | Crawl https://www.geteducated.com/online-degrees/ for program data |
| School Database Crawler | **P1** | Crawl https://www.geteducated.com/online-schools/ for school data |

**Spec Reference:** Section 3 of `perdia_geteducated_content_monetization_spec.md`

---

## 5. AI GENERATION

### 5.1 Implemented

| Feature | File | Status |
|---------|------|--------|
| Grok Draft Generation | `src/services/ai/grokClient.js` | COMPLETE |
| Claude Humanization | `src/services/ai/claudeClient.js` | COMPLETE |
| StealthGPT Integration | `src/services/ai/stealthGptClient.js` | COMPLETE |
| Quality Scoring | `src/services/generationService.js` | COMPLETE |

### 5.2 Partially Implemented

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Internal Link Insertion | PARTIAL | Logic exists but needs GetEducated URL database |
| Author Style Matching | PARTIAL | `writing_style_profile` exists but prompts don't fully utilize it |

### 5.3 Not Implemented

| Feature | Priority | Description |
|---------|----------|-------------|
| Cost Data RAG | **P0** | Provide ranking report data to AI for accurate cost information |
| Monetization Shortcode Generation | **P0** | AI must output proper shortcodes, not raw links |
| Topic-to-Subject Mapping | **P1** | Map article topic to `subjects` table for Category/Concentration selection |

**Spec Reference:** Section 6 of `perdia_geteducated_content_monetization_spec.md`

---

## 6. WORKFLOW & PUBLISHING

### 6.1 Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Article Status Pipeline | COMPLETE | idea → drafting → refinement → qa_review → ready_to_publish → published |
| Risk Level Fields | COMPLETE | `risk_level`, `autopublish_deadline`, `reviewed_at` columns exist |

### 6.2 Partially Implemented

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Auto-Publish Hook | PARTIAL | `useAutoPublish.js` exists but no scheduler/cron |
| Human Review Tracking | PARTIAL | Fields exist but UI doesn't track review history |

### 6.3 Not Implemented

| Feature | Priority | Description |
|---------|----------|-------------|
| Auto-Publish Scheduler | **P0** | Edge Function to auto-publish after N days if not reviewed |
| Webhook Publishing (Temp) | **P0** | POST to n8n webhook: `https://willdisrupt.app.n8n.cloud/webhook-test/144c3e6f-63e7-4bca-b029-0a470f2e3f79` |
| WordPress API (Future) | **P1** | Direct WordPress REST API integration via Edge Functions |
| Status History/Audit Log | **P1** | Track who changed status and when |

**Spec Reference:** Section 6 of `perdia_geteducated_content_monetization_spec.md`

---

## 7. UI COMPONENTS

### 7.1 Implemented

| Component | File | Status |
|-----------|------|--------|
| Risk Level Display | `src/components/article/RiskLevelDisplay.jsx` | COMPLETE |
| Link Compliance Checker | `src/components/article/LinkComplianceChecker.jsx` | COMPLETE |
| Contributor Assignment | `src/components/article/ContributorAssignment.jsx` | COMPLETE |

### 7.2 Partially Implemented

| Component | Status | What's Missing |
|-----------|--------|----------------|
| Article Editor | PARTIAL | ReactQuill incompatible with React 19 |
| Review Queue | PARTIAL | Missing auto-publish deadline column, risk indicators |
| Dashboard | PARTIAL | Missing GetEducated-specific metrics |

### 7.3 Not Implemented

| Component | Priority | Description |
|-----------|----------|-------------|
| Shortcode Inspector Panel | **P1** | Show shortcodes in article, validate params |
| Monetization Preview | **P2** | Preview rendered monetization block |

---

## 8. INFORMATION STILL NEEDED FROM CLIENT

### 8.1 Blocking (Cannot Complete Without)

| Item | Status | Why It's Needed |
|------|--------|-----------------|
| WordPress Example Article HTML | REQUESTED | Need exact shortcode syntax for monetization, internal links, external links |
| Business Model Explanation | REQUESTED | Understand paid vs free school relationships for link/monetization decisions |

### 8.2 Important

| Item | Status | Why It's Needed |
|------|--------|-----------------|
| Ranking Report Data Export | NOT REQUESTED | Structured cost data would be faster than scraping |
| Degree Database Export | NOT REQUESTED | Structured degree data with sponsored flags |
| School Database Export | NOT REQUESTED | Structured school data with paid client status |

**Reference:** See `05-MISSING-INFORMATION.md` for full list

---

## 9. DETAILED IMPLEMENTATION TASKS

### Phase 1: Critical Foundation (P0 - Must Complete First)

#### 1.1 Subject-CIP Mapping Table
**Estimated Effort:** 4-6 hours
**Files to Create/Modify:**
- `supabase/migrations/20250105000000_create_subjects_table.sql`
- `data/subjects-cip-mapping.json` (from IPEDS spreadsheet)
- `supabase/migrations/20250105000001_seed_subjects_data.sql`

**Schema Required:**
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_of_study_label TEXT NOT NULL,  -- "Arts & Liberal Arts", "Business"
  category_id INTEGER NOT NULL,
  concentration_id INTEGER NOT NULL,
  concentration_label TEXT NOT NULL,   -- "Anthropology", "Accounting"
  degree_types TEXT[],                 -- ["Associate", "Bachelor", "Master"]
  cip_main_code TEXT,                  -- "45.0201"
  cip_main_title TEXT,                 -- "Anthropology"
  cip_secondary_code TEXT,
  cip_secondary_title TEXT,
  cip_third_code TEXT,
  cip_third_title TEXT,
  degree_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, concentration_id)
);
```

#### 1.2 Ranking Report Data Model & Crawler
**Estimated Effort:** 8-12 hours
**Files to Create:**
- `supabase/migrations/20250105000002_create_ranking_reports_table.sql`
- `src/services/rankingReportService.js`
- `scripts/crawl-ranking-reports.js`

**Schema Required:**
```sql
CREATE TABLE ranking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_url TEXT NOT NULL UNIQUE,
  report_title TEXT NOT NULL,
  degree_level TEXT,
  field_of_study TEXT,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ranking_report_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES ranking_reports(id),
  school_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  total_cost DECIMAL(10,2),
  in_state_cost DECIMAL(10,2),
  out_of_state_cost DECIMAL(10,2),
  accreditation TEXT,
  rank_position INTEGER,
  geteducated_school_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 Shortcode Generation Service
**Estimated Effort:** 6-8 hours
**Files to Create:**
- `src/services/shortcodeService.js`
- `src/hooks/useMonetization.js`

**Functions Required:**
```javascript
// Match article topic to category/concentration
async function matchTopicToMonetization(articleTopic, degreeLevel)

// Generate shortcode from parameters
function generateShortcode(categoryId, concentrationId, levelCode)

// Insert shortcode at appropriate position in content
function insertShortcodeInContent(content, shortcode, position)

// Validate shortcode parameters exist in database
async function validateShortcode(shortcode)
```

#### 1.4 Article Publishing (Webhook → WordPress)
**Estimated Effort:** 4-6 hours
**Files to Create:**
- `src/services/publishService.js`
- `src/hooks/usePublish.js`

**Current Implementation (Temporary):**
Post articles to n8n webhook for WordPress publishing:
```
POST https://willdisrupt.app.n8n.cloud/webhook-test/144c3e6f-63e7-4bca-b029-0a470f2e3f79
```

**Webhook Payload:**
```json
{
  "title": "Article Title",
  "content": "Full HTML content with shortcodes",
  "excerpt": "Article excerpt",
  "author": "Tony Huffman",
  "author_display_name": "Kif",
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "focus_keyword": "primary keyword",
  "faqs": [{ "question": "...", "answer": "..." }],
  "status": "draft",
  "article_id": "uuid",
  "published_at": "ISO timestamp"
}
```

**Functionality Required:**
- Send article data to webhook
- Update article status to 'published'
- Store webhook response (WordPress post ID if returned)
- Handle errors and retry logic

**Future Implementation (End Goal):**
- Direct WordPress REST API integration via Edge Functions
- `supabase/functions/publish-to-wordpress/index.ts`
- Full control over post creation, categories, featured images

### Phase 2: Workflow Automation (P0/P1)

#### 2.1 Auto-Publish Scheduler
**Estimated Effort:** 4-6 hours
**Files to Create:**
- `supabase/functions/auto-publish-scheduler/index.ts`
- `src/services/autoPublishService.js`

**Logic:**
1. Query articles where `status = 'ready_to_publish'` AND `autopublish_deadline <= NOW()`
2. For each article:
   - Check `risk_level` is 'LOW'
   - Run pre-publish validation
   - If passes, POST to webhook (temporary) or WordPress API (future)
   - Update status to 'published'
   - Log the auto-publish event

**Webhook Endpoint (Current):**
```
POST https://willdisrupt.app.n8n.cloud/webhook-test/144c3e6f-63e7-4bca-b029-0a470f2e3f79
```

#### 2.2 Cost Data RAG for AI Generation
**Estimated Effort:** 6-8 hours
**Files to Modify:**
- `src/services/ai/grokClient.js`
- `src/services/generationService.js`

**Implementation:**
1. Before generating draft, query `ranking_report_entries` for relevant programs
2. Include cost data in prompt context
3. Instruct AI to use ONLY provided cost data, never invent numbers

### Phase 3: Data Population (P1)

#### 3.1 Degree Database Crawler
**Estimated Effort:** 6-8 hours
**Files to Create:**
- `supabase/migrations/20250105000003_create_degrees_table.sql`
- `scripts/crawl-degree-database.js`

**Data to Extract:**
- Degree type (Associate, Bachelor, Master, etc.)
- School name
- GetEducated URL
- Is sponsored (has logo + "Sponsored Listing")
- Category/concentration

#### 3.2 School Database Crawler
**Estimated Effort:** 4-6 hours
**Files to Create:**
- `supabase/migrations/20250105000004_create_schools_table.sql`
- `scripts/crawl-school-database.js`

**Data to Extract:**
- School name
- GetEducated URL (for internal linking)
- Is paid client
- Programs offered
- Logo/sponsored status

### Phase 4: UI Enhancements (P1/P2)

#### 4.1 Shortcode Inspector Panel
**Estimated Effort:** 4-6 hours
**Files to Create:**
- `src/components/article/ShortcodeInspector.jsx`

**Features:**
- Parse shortcodes from article content
- Display each shortcode with its parameters
- Show validation status (valid category/concentration/level)
- Quick edit functionality

#### 4.2 Review Queue Enhancements
**Estimated Effort:** 4-6 hours
**Files to Modify:**
- `src/pages/ReviewQueue.jsx`

**Add:**
- "Age since created" column
- "Auto-publish deadline" column
- Risk level indicators (color-coded badges)
- Bulk actions: Assign, Approve, Schedule

#### 4.3 Replace ReactQuill Editor
**Estimated Effort:** 8-12 hours
**Files to Modify:**
- `src/pages/ArticleEditor.jsx`
- `package.json`

**Options:**
1. TipTap (recommended) - React 19 compatible, extensible
2. Lexical (Facebook's editor) - Modern, performant
3. Milkdown - Markdown-based, simple

---

## 10. IMPLEMENTATION PRIORITY ORDER

### Sprint 1 (Week 1-2): Foundation
1. [ ] Create `subjects` table with CIP mapping
2. [ ] Create `ranking_reports` and `ranking_report_entries` tables
3. [ ] Build ranking report crawler
4. [ ] Create shortcode generation service

### Sprint 2 (Week 3-4): AI Integration
5. [ ] Implement topic-to-monetization matcher
6. [ ] Add cost data RAG to AI prompts
7. [ ] Update AI to output shortcodes instead of raw links
8. [ ] Add shortcode validation to pre-publish checks

### Sprint 3 (Week 5-6): Publishing
9. [ ] Build webhook publishing service (POST to n8n)
10. [ ] Create auto-publish scheduler Edge Function
11. [ ] Add status history/audit logging
12. [ ] Test end-to-end publishing workflow
13. [ ] (Future) Build direct WordPress API integration

### Sprint 4 (Week 7-8): Data & UI
13. [ ] Build degree database crawler
14. [ ] Build school database crawler
15. [ ] Add shortcode inspector to editor
16. [ ] Enhance review queue with deadline/risk columns
17. [ ] Replace ReactQuill with TipTap

---

## 11. VALIDATION CHECKLIST

Before considering the system complete, verify:

### Content Compliance
- [ ] All cost data sourced from `ranking_report_entries` table
- [ ] All school links point to GetEducated URLs (never .edu)
- [ ] All degree links point to GetEducated degree pages
- [ ] No links to competitor sites (onlineu.com, usnews.com, etc.)
- [ ] External links only to BLS/government/nonprofit

### Monetization
- [ ] Articles can auto-match to correct Category ID + Concentration ID
- [ ] Shortcodes generate with valid parameters
- [ ] Shortcodes placed in appropriate positions
- [ ] Shortcode validation blocks invalid parameters

### Workflow
- [ ] Only 4 approved authors can be assigned
- [ ] Articles auto-publish after deadline if not reviewed
- [ ] HIGH/CRITICAL risk blocks auto-publish
- [ ] WordPress receives drafts correctly

### UI
- [ ] Editor works with React 19
- [ ] Shortcode inspector shows all shortcodes
- [ ] Review queue shows deadlines and risk levels
- [ ] Dashboard shows GetEducated-specific metrics

---

## 12. TECHNICAL DEBT

These items should be addressed but are not blocking:

1. **system_settings column names** - Seeds use `key`/`value`/`category` but table has `setting_key`/`setting_value`/`setting_type`
2. **articles_count vs article_count** - Inconsistent column naming in useContributors hook
3. **Client-side API keys** - Move AI calls to Edge Functions for security
4. **Missing .eslintignore** - Exclude docs/ folder from linting
5. **useCreateContributor will fail** - RLS policy blocks INSERT on `article_contributors`

---

## Summary

**Most Critical Missing Pieces:**
1. **Subject-CIP Mapping** - Cannot properly match topics to monetization without this
2. **Ranking Report Data** - Cannot provide accurate cost data to AI
3. **Shortcode Generation** - Cannot auto-create monetization blocks
4. **Article Publishing** - Webhook integration (temporary) → WordPress API (future)

**What's Working Well:**
- Link validation (competitors, .edu blocking)
- Risk assessment and scoring
- Approved authors enforcement
- Pre-publish validation framework
- AI generation pipeline (Grok + Claude/StealthGPT)

**Blocked on Client:**
- Exact shortcode syntax (need WordPress HTML example)
- Business model details (need voice note/explanation)
