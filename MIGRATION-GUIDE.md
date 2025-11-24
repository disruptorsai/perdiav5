# Edge Functions Migration Guide

## Overview

This guide walks you through migrating from client-side AI API calls to secure server-side Edge Functions. This migration **eliminates the critical security vulnerability** of exposing API keys in the browser.

## What Changed

### Before (Insecure)
```javascript
// ❌ Old: API keys exposed in browser
import GrokClient from './ai/grokClient'  // Uses dangerouslyAllowBrowser
import ClaudeClient from './ai/claudeClient'  // Uses dangerouslyAllowBrowser

const grok = new GrokClient(import.meta.env.VITE_GROK_API_KEY)  // ⚠️ Exposed!
const claude = new ClaudeClient(import.meta.env.VITE_CLAUDE_API_KEY)  // ⚠️ Exposed!
```

### After (Secure)
```javascript
// ✅ New: API keys stay server-side
import GrokClient from './ai/grokClient.edge'
import ClaudeClient from './ai/claudeClient.edge'

const grok = new GrokClient()  // Calls Supabase Edge Function
const claude = new ClaudeClient()  // Calls Supabase Edge Function
```

## Migration Steps

### 1. Deploy Edge Functions

Run the PowerShell deployment script (easiest method):

```powershell
.\deploy-edge-functions.ps1
```

Or follow the manual steps in [`supabase/functions/DEPLOY.md`](supabase/functions/DEPLOY.md).

### 2. Verify Deployment

Go to [Supabase Dashboard → Edge Functions](https://supabase.com/dashboard/project/nvffvcjtrgxnunncdafz/functions) and verify you see:

- ✅ grok-api
- ✅ claude-api
- ✅ generate-article
- ✅ publish-to-wordpress
- ✅ generate-ideas-from-keywords

### 3. Test Edge Functions

Test the modular functions from the Supabase Dashboard:

**Test grok-api:**
```json
{
  "action": "generateDraft",
  "payload": {
    "idea": {
      "title": "Test Article",
      "description": "A test",
      "seed_topics": ["test"]
    },
    "contentType": "guide",
    "targetWordCount": 1000
  }
}
```

**Test claude-api:**
```json
{
  "action": "humanize",
  "payload": {
    "content": "<p>Test content</p>",
    "contributorProfile": null
  }
}
```

If both return `{"success": true, "data": {...}}`, you're good to go!

### 4. Application Already Updated

The following files have already been updated to use Edge Functions:

- ✅ `src/services/ai/grokClient.edge.js` - New Edge Function wrapper
- ✅ `src/services/ai/claudeClient.edge.js` - New Edge Function wrapper
- ✅ `src/services/generationService.js` - Now imports `.edge` clients

**No additional code changes needed!** The application will automatically use the secure Edge Functions once deployed.

### 5. Remove API Keys from Frontend

After confirming Edge Functions work, remove API keys from `.env.local`:

**Before:**
```env
VITE_SUPABASE_URL=https://nvffvcjtrgxnunncdafz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# ❌ Remove these (now server-side only)
VITE_GROK_API_KEY=xai-qEJO7ehC...
VITE_CLAUDE_API_KEY=sk-ant-api03-gGCBN...
VITE_DATAFORSEO_USERNAME=will@disruptorsmedia.com
VITE_DATAFORSEO_PASSWORD=e1ea5e75ba659fe8
```

**After:**
```env
VITE_SUPABASE_URL=https://nvffvcjtrgxnunncdafz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# AI API keys now stored as Supabase secrets (server-side)
```

### 6. Rotate API Keys (CRITICAL!)

**⚠️ IMPORTANT:** Your API keys were exposed in this conversation with Claude Code. You **MUST** rotate them immediately:

1. **Grok API Key:**
   - Go to https://console.x.ai/api-keys
   - Revoke the old key
   - Generate a new key
   - Update Supabase secret: `supabase secrets set GROK_API_KEY=<new-key>`

2. **Claude API Key:**
   - Go to https://console.anthropic.com/settings/keys
   - Revoke the old key
   - Generate a new key
   - Update Supabase secret: `supabase secrets set CLAUDE_API_KEY=<new-key>`

3. **DataForSEO Password:**
   - Go to https://app.dataforseo.com/api
   - Change your password
   - Update Supabase secret: `supabase secrets set DATAFORSEO_PASSWORD=<new-password>`

### 7. Test End-to-End

Test article generation in your app:

1. Open the application
2. Go to Content Ideas
3. Approve an idea and generate an article
4. Verify the article is generated successfully
5. Check Supabase Dashboard → Edge Functions → Logs to see function calls

## Architecture Changes

### New Edge Functions

**grok-api** - Modular Grok API client
- Actions: `generateDraft`, `generateIdeas`, `generateMetadata`
- Keeps Grok API key server-side
- Returns structured JSON responses

**claude-api** - Modular Claude API client
- Actions: `humanize`, `autoFixQualityIssues`, `reviseWithFeedback`, `extractLearningPatterns`, `addInternalLinks`
- Keeps Claude API key server-side
- Returns processed content

**generate-article** - Full pipeline orchestrator
- Runs complete Grok → Claude pipeline server-side
- Auto-assigns contributors
- Adds internal links
- Calculates quality metrics
- Saves directly to database

### Client-Side Changes

The new `.edge.js` clients are drop-in replacements:

```javascript
// Old client (direct API call)
const result = await grokClient.generateDraft(idea, options)

// New client (Edge Function call)
const result = await grokClient.generateDraft(idea, options)
// ↑ Same interface, secure implementation
```

No changes needed in components that use `GenerationService`!

## Troubleshooting

### "Function not found" error
- Verify deployment: `supabase functions list`
- Re-deploy: `supabase functions deploy <function-name>`

### "Missing API key" error
- Check secrets: `supabase secrets list`
- Re-set secret: `supabase secrets set GROK_API_KEY=<key>`

### "CORS error"
- Edge Functions already include CORS headers
- Make sure you're using the correct Supabase URL

### "Unauthorized" error
- Verify user is authenticated
- Check authentication token is being passed

## Benefits

✅ **Security:** API keys never exposed in browser
✅ **Same API:** Drop-in replacement for existing code
✅ **Better control:** Centralized rate limiting and error handling
✅ **Cost tracking:** Monitor AI usage in one place
✅ **Easier debugging:** Server-side logs in Supabase Dashboard

## Cost Considerations

- **Supabase Edge Functions:** Free tier includes 500K invocations/month
- **Grok API:** Charged by xAI (unchanged)
- **Claude API:** Charged by Anthropic (unchanged)

Edge Functions add minimal overhead (~10-50ms latency) but provide significant security benefits.

## Rollback Plan

If you need to rollback to direct API calls:

1. Update imports in `src/services/generationService.js`:
   ```javascript
   import GrokClient from './ai/grokClient'  // Remove .edge
   import ClaudeClient from './ai/claudeClient'  // Remove .edge
   ```

2. Restore API keys to `.env.local`

3. Restart development server

⚠️ **Not recommended for production!**

## Support

- Edge Functions documentation: https://supabase.com/docs/guides/functions
- Supabase Dashboard: https://supabase.com/dashboard/project/nvffvcjtrgxnunncdafz
- View logs: `supabase functions logs <function-name> --tail`

## Next Steps

After successful migration:

1. ✅ Monitor Edge Function logs for errors
2. ✅ Set up alerts for failed function calls
3. ✅ Consider adding retry logic for failed AI requests
4. ✅ Implement request caching to reduce AI costs
5. ✅ Add rate limiting to prevent abuse
