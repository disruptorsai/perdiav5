# Perdia Content Engine v5.0

AI-Powered Content Production System built with React, Supabase, Grok, and Claude.

## Features

- **Two-Pass AI Generation**: Grok for drafting + Claude for humanization
- **Kanban Workflow**: Visual pipeline from idea to publication
- **Auto-Assignment**: AI matches content to specialized contributors
- **Quality Assurance**: Automated checks with AI-powered auto-fix
- **Internal Linking**: Intelligent linking to 1000+ article catalog
- **WordPress Publishing**: One-click publishing with Yoast SEO integration
- **DataForSEO Integration**: Long-tail keyword research
- **Automatic Mode**: Fully autonomous end-to-end content production
- **Analytics Dashboard**: Track production metrics and quality scores

## Tech Stack

- **Frontend**: React 19 + Vite 6
- **Styling**: Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **State Management**: TanStack React Query
- **Routing**: React Router 7
- **AI APIs**: xAI Grok + Anthropic Claude + DataForSEO

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works for development)
- xAI Grok API key
- Anthropic Claude API key
- DataForSEO account (optional, for keyword research)

## 🚀 Getting Started

**→ New to this project? Start here: [NEXT STEPS GUIDE](docs/NEXT-STEPS.md)**

This comprehensive guide includes:
- Complete setup walkthrough (Supabase, API keys, testing)
- What to build next with code examples
- Development roadmap and priorities
- Troubleshooting and best practices

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_GROK_API_KEY`: Your xAI Grok API key
- `VITE_CLAUDE_API_KEY`: Your Anthropic Claude API key
- `VITE_DATAFORSEO_USERNAME`: Your DataForSEO username (optional)
- `VITE_DATAFORSEO_PASSWORD`: Your DataForSEO password (optional)

### 3. Set Up Supabase Database

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Go to the SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/20250101000000_initial_schema.sql`
   - `supabase/migrations/20250101000001_seed_contributors.sql`
   - `supabase/migrations/20250101000002_seed_settings.sql`

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

```
perdiav5/
├── src/
│   ├── components/        # React components
│   │   ├── ui/            # UI primitives
│   │   ├── layout/        # Layout components
│   │   ├── dashboard/     # Dashboard components
│   │   └── editor/        # Editor components
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ArticleEditor.jsx
│   │   ├── ContentLibrary.jsx
│   │   ├── Analytics.jsx
│   │   └── Settings.jsx
│   ├── services/          # Business logic
│   │   ├── ai/
│   │   │   ├── grokClient.js
│   │   │   ├── claudeClient.js
│   │   │   └── dataForSEOClient.js
│   │   ├── supabaseClient.js
│   │   └── generationService.js
│   ├── hooks/             # Custom React hooks
│   │   ├── useArticles.js
│   │   ├── useContentIdeas.js
│   │   └── useGeneration.js
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/               # Utilities
│   │   ├── utils.js
│   │   └── queryClient.js
│   └── App.jsx
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge Functions (to be implemented)
├── .env.example           # Environment variables template
└── README.md
```

## Database Schema

The application uses 14 tables:

1. **articles** - Main content storage
2. **content_ideas** - Article ideas
3. **article_contributors** - 9 specialized AI personas
4. **clusters** - Topic clusters
5. **keywords** - SEO keywords
6. **site_articles** - Internal linking catalog
7. **wordpress_connections** - WordPress site credentials
8. **article_revisions** - Editorial feedback
9. **training_data** - AI learning data
10. **internal_links** - Link tracking
11. **external_links** - Citation tracking
12. **shortcodes** - WordPress shortcodes
13. **generation_queue** - Automation queue
14. **system_settings** - Configuration

See `supabase/migrations/` for complete schema.

## AI Generation Pipeline

### Two-Pass Generation

1. **Draft (Grok)**: Initial article generation
   - Structured content with headings
   - FAQ generation
   - SEO metadata

2. **Humanization (Claude)**: Anti-AI-detection rewrite
   - Perplexity and burstiness optimization
   - Contributor voice injection
   - Banned phrase removal

### Automatic Mode

When enabled, the system:
1. Monitors idea queue
2. Auto-generates ideas from DataForSEO keywords when queue is low
3. Picks next approved idea
4. Generates article (Grok → Claude)
5. Quality assurance with closed-loop auto-fix (up to 3 retries)
6. Auto-publishes if quality score ≥ 85

## Quality Metrics

Articles are scored (0-100) based on:
- Word count (1500-2500 target)
- Internal links (3-5 target)
- External citations (2-4 target)
- FAQ sections (3+ items)
- Heading structure (proper H2/H3 hierarchy)
- Readability (Flesch-Kincaid approximation)

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Development Workflow

### Creating Content

1. Create content ideas manually or use DataForSEO keyword research
2. Click "Generate Article" on an approved idea
3. System runs two-pass generation (Grok → Claude)
4. Article appears in "Drafting" column
5. Move through workflow stages (Refinement → QA → Ready to Publish)
6. Edit article in the Article Editor
7. Publish to WordPress

### Automatic Mode

1. Enable in Settings
2. Configure automation parameters
3. System runs continuously, handling entire workflow autonomously
4. Monitor progress in the Automatic Mode Dashboard

## API Costs (Estimated)

Based on 100 articles/month:

- **Development**: ~$80/month
  - Supabase: Free
  - Grok API: ~$50/month
  - Claude API: ~$30/month
  - DataForSEO: $0.03/request

- **Production**: ~$450/month
  - Supabase Pro: $25/month
  - Grok API: ~$200/month
  - Claude API: ~$150/month
  - DataForSEO: ~$50/month

## Security Notes

⚠️ **Important**: In production, move AI API calls to Supabase Edge Functions to avoid exposing API keys in the browser.

Current implementation uses `dangerouslyAllowBrowser: true` for Claude client - this is for development only.

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists and contains valid Supabase credentials
- Restart dev server after changing environment variables

### "Module not found" errors
- Run `npm install --legacy-peer-deps`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`

### Database RLS policy violations
- Check that RLS policies are correctly set up in Supabase
- Ensure you're logged in with a valid user

### AI API errors
- Verify API keys are correct in `.env.local`
- Check API rate limits and quotas
- Review error messages in browser console

## Next Steps

### Phase 2 Features (To Be Implemented)

- [ ] Supabase Edge Functions for AI calls
- [ ] WordPress publishing integration
- [ ] Drag-and-drop Kanban board
- [ ] Rich text editor (Tiptap or React Quill)
- [ ] Automatic Mode Engine implementation
- [ ] DataForSEO idea generation workflow
- [ ] Quality auto-fix UI and workflow
- [ ] Site catalog management
- [ ] Editorial review system
- [ ] Training data dashboard

### Phase 3 Features

- [ ] Advanced analytics with charts
- [ ] Cluster management
- [ ] Keyword research UI
- [ ] Multi-site WordPress support
- [ ] Mobile responsiveness
- [ ] Dark mode

## Documentation

Complete documentation is available in the `docs/` folder:

**Quick Start:**
- [START HERE](docs/00-START-HERE.md) - Navigation guide
- [Quick Reference](docs/QUICK-REFERENCE.md) - One-page cheat sheet
- [Documentation Overview](docs/README.md) - Full documentation index

**Core Documentation:**
- [Product Requirements](docs/docs/01-PRODUCT-REQUIREMENTS-DOCUMENT.md) - Feature specifications
- [Technical Architecture](docs/architecture/02-TECHNICAL-ARCHITECTURE.md) - System design
- [Database Schema](docs/architecture/03-DATABASE-SCHEMA.md) - Complete schema
- [AI Integration](docs/specifications/04-AI-INTEGRATION-STRATEGY.md) - AI implementation
- [Implementation Roadmap](docs/docs/05-IMPLEMENTATION-ROADMAP.md) - 16-week plan

**Setup Guides:**
- [Supabase Setup](docs/guides/06-SUPABASE-SETUP-GUIDE.md) - Database setup
- [Quick Start Guide](docs/guides/07-QUICK-START-GUIDE.md) - 30-minute setup

**Feature Documentation:**
- [DataForSEO Integration](docs/specifications/08-DATAFORSEO-INTEGRATION.md) - Keyword research
- [Automatic Mode](docs/specifications/09-AUTOMATIC-MODE-SPECIFICATION.md) - Autonomous operation

## License

Proprietary - Perdia Content Engine v5.0

## Support

For issues or questions, refer to the documentation in the `docs/` folder.

---

**Built with** ❤️ **using Claude Code**
