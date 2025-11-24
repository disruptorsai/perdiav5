# Perdia Content Engine v2.0 - Complete Documentation

**AI-Powered Content Workflow System**
**Built with:** React + Vite + Supabase + Grok + Claude

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Documentation Index](#documentation-index)
3. [Quick Links](#quick-links)
4. [Getting Started](#getting-started)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Key Features](#key-features)
8. [Development Workflow](#development-workflow)

---

## Overview

Perdia Content Engine is a sophisticated AI-powered content production system that generates, manages, and publishes high-quality, SEO-optimized articles at scale.

### What Makes Perdia Unique

- **Two-Model AI Strategy:** Grok for drafting + Claude for humanization
- **Anti-AI-Detection:** Advanced techniques to create undetectable content
- **Complete Workflow:** From idea generation to WordPress publishing
- **Continuous Learning:** AI improves from editorial feedback
- **Intelligent Linking:** Automatic internal links from 1000+ article catalog

### Use Case

Perfect for educational content publishers, digital marketing agencies, and content teams producing 50-200 articles per month with minimal manual intervention.

---

## Documentation Index

### 📘 Core Documents

#### **01. Product Requirements Document (PRD)**
**Location:** `docs/01-PRODUCT-REQUIREMENTS-DOCUMENT.md`

**What's Inside:**
- Complete feature specifications
- User personas and stories
- Success metrics
- Non-functional requirements
- Feature priorities by phase

**Read this to:** Understand what Perdia does and why each feature exists.

---

#### **02. Technical Architecture**
**Location:** `architecture/02-TECHNICAL-ARCHITECTURE.md`

**What's Inside:**
- System architecture overview
- Frontend architecture (React + Vite)
- Backend architecture (Supabase)
- AI integration architecture
- Security architecture
- Deployment architecture
- Technology stack details

**Read this to:** Understand how Perdia is built and how components interact.

---

#### **03. Database Schema**
**Location:** `architecture/03-DATABASE-SCHEMA.md`

**What's Inside:**
- All 14 entity definitions
- Complete SQL migrations
- Relationship diagrams
- Index strategies
- Row Level Security policies
- Database functions and triggers
- Example queries

**Read this to:** Understand the data model and set up the database.

---

#### **04. AI Integration Strategy**
**Location:** `specifications/04-AI-INTEGRATION-STRATEGY.md`

**What's Inside:**
- Multi-model strategy (Grok + Claude)
- Two-pass generation workflow
- Complete API client implementations
- Prompt engineering templates
- Anti-AI-detection techniques
- Error handling and retry logic
- Cost optimization strategies

**Read this to:** Understand how AI generation works and implement AI features.

---

#### **05. Implementation Roadmap**
**Location:** `docs/05-IMPLEMENTATION-ROADMAP.md`

**What's Inside:**
- 16-week phased implementation plan
- Week-by-week task breakdown
- Deliverables and milestones
- Risk management
- Success criteria
- Post-launch roadmap

**Read this to:** Plan your development timeline and track progress.

---

### 📙 Feature Specifications

#### **08. DataForSEO Integration Guide**
**Location:** `specifications/08-DATAFORSEO-INTEGRATION.md`

**What's Inside:**
- DataForSEO API setup and configuration
- Complete client implementation with all methods
- Keyword research workflow
- Integration with idea generator
- Cost optimization strategies
- Rate limiting and caching
- Testing and validation

**Read this to:** Implement keyword research using DataForSEO for data-driven content ideas.

---

#### **09. Automatic Mode Specification**
**Location:** `specifications/09-AUTOMATIC-MODE-SPECIFICATION.md`

**What's Inside:**
- Complete automatic mode architecture
- End-to-end autonomous workflow (idea → published article)
- Closed-loop self-correction system
- Quality gates and decision trees
- Error handling and recovery
- Monitoring and notifications
- Full implementation code examples

**Read this to:** Implement fully autonomous content production with zero human intervention.

---

### 📗 Setup Guides

#### **06. Supabase Setup & Configuration**
**Location:** `guides/06-SUPABASE-SETUP-GUIDE.md`

**What's Inside:**
- Step-by-step Supabase project setup
- Database migration instructions
- Authentication configuration
- Edge Functions deployment
- Environment variables
- Security best practices
- Troubleshooting guide

**Read this to:** Set up your Supabase backend from scratch.

---

#### **07. Quick Start Guide**
**Location:** `guides/07-QUICK-START-GUIDE.md`

**What's Inside:**
- 30-minute setup walkthrough
- Project initialization
- Basic file structure
- First feature implementation
- Development tips
- Common issues and fixes

**Read this to:** Get up and running quickly with a working development environment.

---

## Quick Links

### 🚀 For First-Time Setup
1. Read: [Quick Start Guide](guides/07-QUICK-START-GUIDE.md)
2. Follow: [Supabase Setup Guide](guides/06-SUPABASE-SETUP-GUIDE.md)
3. Reference: [Database Schema](architecture/03-DATABASE-SCHEMA.md) for migrations

### 👨‍💻 For Developers
1. Study: [Technical Architecture](architecture/02-TECHNICAL-ARCHITECTURE.md)
2. Reference: [AI Integration Strategy](specifications/04-AI-INTEGRATION-STRATEGY.md)
3. Follow: [Implementation Roadmap](docs/05-IMPLEMENTATION-ROADMAP.md)

### 📊 For Project Managers
1. Read: [Product Requirements Document](docs/01-PRODUCT-REQUIREMENTS-DOCUMENT.md)
2. Track: [Implementation Roadmap](docs/05-IMPLEMENTATION-ROADMAP.md)
3. Review: Success metrics in PRD

### 🎨 For Designers
1. Reference: [PRD User Stories](docs/01-PRODUCT-REQUIREMENTS-DOCUMENT.md#user-stories)
2. Study: UI specifications in PRD
3. Review: Component structure in Technical Architecture

---

## Getting Started

### Prerequisites

- **Node.js:** 18 or higher
- **Git:** Latest version
- **Supabase Account:** Free tier works for development
- **API Keys:**
  - xAI Grok API key ([https://x.ai/api](https://x.ai/api))
  - Anthropic Claude API key ([https://console.anthropic.com](https://console.anthropic.com))

### Quick Setup (30 minutes)

```bash
# 1. Create React + Vite project
npm create vite@latest perdia-content-engine -- --template react
cd perdia-content-engine

# 2. Install dependencies
npm install
npm install @supabase/supabase-js @tanstack/react-query
npm install @anthropic-ai/sdk
npm install react-router-dom tailwindcss

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Set up Supabase (follow guide)
# - Create project at supabase.com
# - Run database migrations
# - Configure .env.local

# 5. Run dev server
npm run dev
```

**For detailed instructions, see:** [Quick Start Guide](guides/07-QUICK-START-GUIDE.md)

---

## Technology Stack

### Frontend
- **Framework:** React 18.2+
- **Build Tool:** Vite 6.0+
- **Styling:** Tailwind CSS 3.4+
- **UI Components:** Shadcn UI (Radix primitives)
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router 7.0+
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Editor:** React Quill / Tiptap

### Backend
- **Platform:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Database:** PostgreSQL 15+
- **Runtime:** Deno (Edge Functions)
- **Real-time:** Supabase Realtime (WebSockets)

### AI Providers
- **xAI Grok:** Article drafting, idea generation
- **Anthropic Claude:** Content humanization, revision

### DevOps
- **Hosting:** Netlify (frontend)
- **Backend:** Supabase Cloud
- **Version Control:** Git + GitHub
- **CI/CD:** Netlify CI

---

## Project Structure

```
perdia-content-engine/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn UI primitives
│   │   ├── layout/          # Layout components
│   │   ├── dashboard/       # Dashboard-specific
│   │   ├── editor/          # Editor components
│   │   └── workflow/        # Workflow components
│   │
│   ├── pages/               # Page components (routes)
│   │   ├── Dashboard.jsx
│   │   ├── ContentLibrary.jsx
│   │   ├── ArticleEditor.jsx
│   │   └── ...
│   │
│   ├── services/            # Business logic
│   │   ├── supabaseClient.js
│   │   ├── ai/
│   │   │   ├── grokClient.js
│   │   │   ├── claudeClient.js
│   │   │   └── promptBuilder.js
│   │   └── wordpressService.js
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useArticles.js
│   │   ├── useGeneration.js
│   │   └── useWordPress.js
│   │
│   ├── lib/                 # Utilities
│   ├── contexts/            # React contexts
│   ├── App.jsx
│   └── main.jsx
│
├── supabase/
│   ├── migrations/          # SQL migrations
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250101000001_seed_contributors.sql
│   │   └── 20250101000002_seed_settings.sql
│   │
│   └── functions/           # Edge Functions
│       ├── generate-article/
│       ├── publish-to-wordpress/
│       └── generate-ideas/
│
├── docs/                    # This documentation
├── .env.local               # Environment variables (not committed)
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Key Features

### 🤖 AI-Powered Generation
- Two-pass generation (Grok drafting + Claude humanization)
- Anti-AI-detection techniques (perplexity, burstiness)
- Multiple content types (listicles, guides, rankings, FAQs)
- Auto-assignment to 9 specialized contributors
- Quality checks and auto-fix

### 📋 Kanban Workflow
- Visual pipeline (Idea → Drafting → Refinement → QA → Publishing)
- Drag-and-drop interface
- Sequential generation queue
- Automation modes (manual, semi-auto, full-auto)
- Real-time progress tracking

### ✍️ Article Editor
- Rich text editing (HTML)
- Production preview
- Quality checklist sidebar
- Auto-fix all issues button
- FAQ schema generator
- Internal link compliance checker
- Publish to WordPress

### 🔗 Intelligent Linking
- 1000+ article catalog for internal linking
- Semantic relevance scoring
- Automatic link injection (3-5 per article)
- External citation addition

### 🧠 Continuous Learning
- Editorial review system
- Contextual feedback comments
- AI-powered revision from feedback
- Training data generation
- Prompt refinement over time

### 📊 Analytics
- Production metrics and trends
- Quality score tracking
- Content type distribution
- Cluster performance
- Time-range filtering

### 🚀 WordPress Publishing
- One-click publishing
- Multiple site support
- Yoast SEO integration
- Dry run mode
- Error handling and retry

---

## Development Workflow

### Daily Development

```bash
# Start local Supabase (optional)
supabase start

# Start dev server
npm run dev

# Access at http://localhost:5173
```

### Database Changes

```bash
# Create new migration
supabase migration new migration_name

# Edit migration file in supabase/migrations/

# Apply migrations
supabase db push
```

### Deploy Edge Functions

```bash
# Deploy function
supabase functions deploy generate-article

# View logs
supabase functions logs generate-article --follow
```

### Deploy Frontend

```bash
# Build for production
npm run build

# Netlify auto-deploys on git push to main
git push origin main
```

---

## Phase-by-Phase Implementation

### Phase 1: MVP (Weeks 1-4)
✅ Core generation pipeline
✅ Basic dashboard and editor
✅ Database and authentication

### Phase 2: Quality & Automation (Weeks 5-8)
✅ WordPress publishing
✅ Quality checks and auto-fix
✅ Contributor system
✅ Automation engine

### Phase 3: Intelligence (Weeks 9-12)
✅ Intelligent internal linking
✅ Idea generation
✅ Editorial review system
✅ AI training loop

### Phase 4: Polish & Launch (Weeks 13-16)
✅ Analytics dashboard
✅ Performance optimization
✅ Mobile responsive
✅ Production deployment

**See full breakdown:** [Implementation Roadmap](docs/05-IMPLEMENTATION-ROADMAP.md)

---

## Success Metrics

### Quality
- AI detection score: < 30% AI-probability
- Average quality score: > 85/100
- Articles passing first review: > 70%

### Efficiency
- Time to generate article: < 5 minutes
- Articles per month: 100+
- Cost per article: < $5 AI costs

### SEO
- Average word count: 1500-2500 words
- Internal links per article: 3-5
- External citations: 2-4

**Full metrics in:** [Product Requirements Document](docs/01-PRODUCT-REQUIREMENTS-DOCUMENT.md)

---

## API Keys Required

### xAI Grok
- **Signup:** [https://x.ai/api](https://x.ai/api)
- **Use:** Article drafting, idea generation
- **Cost:** ~$5 per 1M tokens (estimate)

### Anthropic Claude
- **Signup:** [https://console.anthropic.com](https://console.anthropic.com)
- **Use:** Content humanization, revision
- **Cost:** $3/1M input tokens, $15/1M output tokens

### Supabase
- **Signup:** [https://supabase.com](https://supabase.com)
- **Tier:** Free (development), Pro $25/mo (production)

---

## Support & Resources

### Documentation
- All docs in `new plan/` folder
- Comprehensive guides for every aspect
- Code examples and SQL migrations included

### External Resources
- **Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
- **React Query:** [https://tanstack.com/query/latest](https://tanstack.com/query/latest)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Shadcn UI:** [https://ui.shadcn.com/](https://ui.shadcn.com/)

### Getting Help
1. Check relevant documentation in `new plan/` folder
2. Review Database Schema for entity structure
3. Study AI Integration Strategy for prompt engineering
4. Follow Implementation Roadmap for feature order

---

## License

This documentation and project plan is provided for the Perdia Content Engine rebuild project.

---

## Document Version History

- **v2.0** (January 2025): Complete rebuild documentation with Supabase + Grok + Claude
- **v1.0** (2024): Original Base44 implementation

---

**Ready to build? Start with the [Quick Start Guide](guides/07-QUICK-START-GUIDE.md)!**
