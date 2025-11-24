# Edge Functions Quick Start

## TL;DR - Deploy in 3 Commands

```powershell
# 1. Link to your project
supabase link --project-ref nvffvcjtrgxnunncdafz

# 2. Set API keys as secrets
supabase secrets set GROK_API_KEY=your-grok-api-key-here
supabase secrets set CLAUDE_API_KEY=your-claude-api-key-here
supabase secrets set DATAFORSEO_USERNAME=your-dataforseo-username
supabase secrets set DATAFORSEO_PASSWORD=your-dataforseo-password

# 3. Deploy all functions
supabase functions deploy
```

Or run the automated script:
```powershell
.\deploy-edge-functions.ps1
```

## What Got Created

### 5 New Edge Functions

| Function | Purpose | Key Actions |
|----------|---------|-------------|
| **grok-api** | Modular Grok client | generateDraft, generateIdeas, generateMetadata |
| **claude-api** | Modular Claude client | humanize, autoFixQualityIssues, reviseWithFeedback |
| **generate-article** | Full pipeline | Complete Grok → Claude workflow |
| **publish-to-wordpress** | WordPress publishing | Publish articles via REST API |
| **generate-ideas-from-keywords** | Idea generation | DataForSEO + Grok integration |

### 2 New Client Wrappers

- `src/services/ai/grokClient.edge.js` - Calls grok-api Edge Function
- `src/services/ai/claudeClient.edge.js` - Calls claude-api Edge Function

### Updated Services

- `src/services/generationService.js` - Now uses Edge Function clients

## API Examples

### Call grok-api

```javascript
import GrokClient from './services/ai/grokClient.edge'

const grok = new GrokClient()

// Generate article draft
const draft = await grok.generateDraft({
  title: "How to Build a React App",
  description: "A comprehensive guide",
  seed_topics: ["react", "javascript"]
}, {
  contentType: 'guide',
  targetWordCount: 2000
})

// Generate content ideas
const ideas = await grok.generateIdeas(['react', 'supabase'], 10)

// Generate SEO metadata
const metadata = await grok.generateMetadata(articleContent, 'react hooks')
```

### Call claude-api

```javascript
import ClaudeClient from './services/ai/claudeClient.edge'

const claude = new ClaudeClient()

// Humanize content
const humanized = await claude.humanize(draftContent, {
  contributorProfile: contributor,
  targetPerplexity: 'high',
  targetBurstiness: 'high'
})

// Auto-fix quality issues
const fixed = await claude.autoFixQualityIssues(content, issues, siteArticles)

// Revise with feedback
const revised = await claude.reviseWithFeedback(content, feedbackItems)

// Add internal links
const withLinks = await claude.addInternalLinks(content, siteArticles)
```

## Testing from Dashboard

1. Go to: https://supabase.com/dashboard/project/nvffvcjtrgxnunncdafz/functions
2. Click on a function (e.g., `grok-api`)
3. Click "Invoke Function"
4. Paste test payload:

```json
{
  "action": "generateIdeas",
  "payload": {
    "seedTopics": ["react", "supabase"],
    "count": 5
  }
}
```

5. Click "Send Request"
6. Should see: `{"success": true, "data": [...]}`

## Monitoring

View real-time logs:

```bash
# Monitor all functions
supabase functions logs --tail

# Monitor specific function
supabase functions logs grok-api --tail
supabase functions logs claude-api --tail
```

Or view in Supabase Dashboard → Functions → [function name] → Logs

## Security Checklist

- [ ] Edge Functions deployed
- [ ] API keys set as Supabase secrets
- [ ] API keys removed from `.env.local`
- [ ] Grok API key rotated (https://console.x.ai/api-keys)
- [ ] Claude API key rotated (https://console.anthropic.com/settings/keys)
- [ ] DataForSEO password changed (https://app.dataforseo.com/api)
- [ ] Old API keys revoked
- [ ] Application tested end-to-end

## Cost Monitoring

- **Edge Functions:** https://supabase.com/dashboard/project/nvffvcjtrgxnunncdafz/functions
- **Grok API:** https://console.x.ai/usage
- **Claude API:** https://console.anthropic.com/settings/usage

## Common Issues

**"Function not found"**
```bash
supabase functions deploy <function-name>
```

**"Missing API key"**
```bash
supabase secrets list  # Check what's set
supabase secrets set GROK_API_KEY=<new-key>
```

**"Unauthorized"**
- Make sure user is logged in
- Check authentication token is passed

## Files Created/Modified

### New Files
- `supabase/functions/grok-api/index.ts` - Grok Edge Function
- `supabase/functions/claude-api/index.ts` - Claude Edge Function
- `src/services/ai/grokClient.edge.js` - Grok client wrapper
- `src/services/ai/claudeClient.edge.js` - Claude client wrapper
- `deploy-edge-functions.ps1` - Automated deployment script
- `MIGRATION-GUIDE.md` - Detailed migration guide
- `EDGE-FUNCTIONS-QUICK-START.md` - This file

### Modified Files
- `supabase/functions/DEPLOY.md` - Updated with new functions
- `src/services/generationService.js` - Now uses Edge Function clients

### Unchanged Files
- `src/services/ai/grokClient.js` - Original (still exists for reference)
- `src/services/ai/claudeClient.js` - Original (still exists for reference)

## Next Steps

1. Deploy Edge Functions (run script or manual commands)
2. Test in Supabase Dashboard
3. Test in application (generate an article)
4. Remove API keys from `.env.local`
5. Rotate API keys
6. Monitor logs for errors

## Support

- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **Edge Functions Dashboard:** https://supabase.com/dashboard/project/nvffvcjtrgxnunncdafz/functions
- **Project Dashboard:** https://supabase.com/dashboard/project/nvffvcjtrgxnunncdafz

## Documentation

- Full migration guide: [`MIGRATION-GUIDE.md`](MIGRATION-GUIDE.md)
- Deployment instructions: [`supabase/functions/DEPLOY.md`](supabase/functions/DEPLOY.md)
- Project instructions: [`CLAUDE.md`](CLAUDE.md)
- Main README: [`README.md`](README.md)
