# Perdia v2.0 - Quick Reference Cheat Sheet

**One-page reference for developers**

---

## 🔑 Essential Commands

```bash
# Development
npm run dev                  # Start dev server
supabase start              # Start local Supabase
supabase db reset           # Reset database

# Database
supabase db push            # Apply migrations
supabase db dump            # Backup database

# Edge Functions
supabase functions deploy <name>         # Deploy function
supabase functions logs <name> --follow  # View logs
supabase secrets set KEY=value           # Set secret

# Deployment
npm run build               # Build for production
git push origin main        # Auto-deploy to Netlify
```

---

## 🗂️ Project Structure Quick Map

```
src/
├── components/ui/          → Shadcn UI primitives
├── components/dashboard/   → Kanban, ArticleCard
├── components/editor/      → RichTextEditor, QualityChecklist
├── pages/                  → Dashboard.jsx, ArticleEditor.jsx
├── services/               → supabaseClient.js, aiService.js
├── services/ai/            → grokClient.js, claudeClient.js
├── hooks/                  → useArticles.js, useGeneration.js
└── lib/                    → utils.js, validation.js

supabase/
├── migrations/             → SQL files
└── functions/              → Edge Functions (Deno)
```

---

## 📊 Database Tables (14 Total)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `articles` | Main content | title, content, status, contributor_id |
| `content_ideas` | Article ideas | title, status, article_id |
| `article_contributors` | 9 authors | name, expertise_areas, writing_style_profile |
| `clusters` | Topic clusters | name, parent_cluster_id |
| `keywords` | SEO keywords | keyword, intent, cluster_id |
| `site_articles` | Link catalog | url, title, topics |
| `wordpress_connections` | WP sites | site_url, auth_type |
| `article_revisions` | Feedback | article_id, comment, severity |
| `training_data` | AI learning | original_content, revised_content |

---

## 🤖 AI Generation Flow

**Manual Mode:**
```
1. Idea → 2. Grok Draft → 3. Claude Humanize → 4. SEO Meta → 5. QA → 6. Publish
```

**Automatic Mode:**
```
1. DataForSEO Keywords → 2. AI Idea Gen → 3. Grok Draft → 4. Claude Humanize →
5. Closed-Loop QA (up to 3 retries) → 6. Auto-Publish (if score ≥85)
```

**Grok (Drafting):**
- Model: `grok-beta`
- Use: Initial article generation, idea generation
- Output: JSON with title, content, excerpt, FAQs

**Claude (Humanization):**
- Model: `claude-3-5-sonnet-20250122`
- Use: Make content undetectable, auto-fix quality issues
- Output: Rewritten HTML

**DataForSEO (Keyword Research):**
- API: Keywords Data API
- Use: Long-tail keyword discovery, search volume, competition
- Output: Ranked keywords with opportunity scores

---

## 🔐 Environment Variables

```bash
# .env.local (Frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_DATAFORSEO_USERNAME=your_username
VITE_DATAFORSEO_PASSWORD=your_password

# Supabase Secrets (Backend)
GROK_API_KEY=your_grok_key
CLAUDE_API_KEY=your_claude_key
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 📝 Common React Query Patterns

```javascript
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['articles'],
  queryFn: async () => {
    const { data } = await supabase.from('articles').select('*');
    return data;
  },
});

// Mutate data
const mutation = useMutation({
  mutationFn: async (newArticle) => {
    const { data } = await supabase.from('articles').insert(newArticle);
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  },
});
```

---

## 🎨 Common Supabase Patterns

```javascript
// Select
const { data } = await supabase
  .from('articles')
  .select('*, article_contributors(*)')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(10);

// Insert
const { data } = await supabase
  .from('articles')
  .insert({ title: 'Test', content: '...' })
  .select()
  .single();

// Update
const { data } = await supabase
  .from('articles')
  .update({ status: 'published' })
  .eq('id', articleId);

// Delete
const { error } = await supabase
  .from('articles')
  .delete()
  .eq('id', articleId);

// Real-time subscription
supabase
  .channel('articles-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'articles' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```

---

## 🚨 Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| "Module not found" | `npm install <package>` |
| "RLS policy violation" | Check policies in Supabase dashboard |
| "CORS error" from AI | Move AI calls to Edge Functions |
| "JWT expired" | `await supabase.auth.refreshSession()` |
| Slow queries | Add database indexes |
| Edge function timeout | Optimize or split into multiple calls |

---

## 📚 Key Documentation Files

| Topic | File |
|-------|------|
| What to build | `docs/01-PRODUCT-REQUIREMENTS-DOCUMENT.md` |
| How to build it | `architecture/02-TECHNICAL-ARCHITECTURE.md` |
| Database setup | `architecture/03-DATABASE-SCHEMA.md` |
| AI integration | `specifications/04-AI-INTEGRATION-STRATEGY.md` |
| Week-by-week plan | `docs/05-IMPLEMENTATION-ROADMAP.md` |
| Supabase setup | `guides/06-SUPABASE-SETUP-GUIDE.md` |
| Quick start | `guides/07-QUICK-START-GUIDE.md` |
| DataForSEO integration | `specifications/08-DATAFORSEO-INTEGRATION.md` |
| Automatic mode | `specifications/09-AUTOMATIC-MODE-SPECIFICATION.md` |

---

## ⚡ Performance Tips

- Use React Query `staleTime` to reduce API calls
- Lazy load routes with `React.lazy()`
- Implement virtualized lists for 100+ items
- Add database indexes on frequently queried columns
- Use Supabase RLS for security (don't query all data)
- Cache AI prompts and contributor profiles

---

## 🎯 Phase 1 MVP Checklist (Weeks 1-4)

- [ ] Supabase project created and migrated
- [ ] Authentication working
- [ ] AI clients (Grok + Claude) connected
- [ ] Basic dashboard with Kanban board
- [ ] Article generation pipeline (Grok → Claude)
- [ ] Article editor with save
- [ ] Content library with search

**When done:** You can generate, edit, and save one article!

---

## 📞 API Endpoints

**Supabase REST API:**
```
GET  /rest/v1/articles
POST /rest/v1/articles
PATCH /rest/v1/articles?id=eq.123
DELETE /rest/v1/articles?id=eq.123
```

**Edge Functions:**
```
POST /functions/v1/generate-article
POST /functions/v1/publish-to-wordpress
POST /functions/v1/generate-ideas
POST /functions/v1/import-site-articles
POST /functions/v1/automatic-mode-cycle   # Runs one automatic mode cycle
GET  /functions/v1/automatic-mode-status  # Get automation status
```

---

## 💰 Estimated Costs

| Service | Development | Production |
|---------|-------------|------------|
| Supabase | Free | $25/month |
| Netlify | Free | Free |
| Grok API | ~$50/month | ~$200/month |
| Claude API | ~$30/month | ~$150/month |
| DataForSEO | $0.03/request | ~$50/month |
| **Total** | **~$80/month** | **~$450/month** |

*Based on 100 articles/month + keyword research*

---

## 🔗 Important Links

- **Supabase Dashboard:** https://app.supabase.com
- **Netlify Dashboard:** https://app.netlify.com
- **xAI Console:** https://console.x.ai
- **Claude Console:** https://console.anthropic.com
- **DataForSEO Dashboard:** https://app.dataforseo.com
- **Supabase Docs:** https://supabase.com/docs
- **React Query Docs:** https://tanstack.com/query/latest
- **DataForSEO API Docs:** https://docs.dataforseo.com

---

**Keep this file handy while developing!**
