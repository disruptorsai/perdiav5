---
description: Guide for migrating AI API calls to Supabase Edge Functions
---

# Migrate to Edge Functions

Help migrate AI API calls from client-side to secure Supabase Edge Functions.

## Context

Currently, both Grok and Claude API clients use `dangerouslyAllowBrowser: true`, exposing API keys in the browser. This is a critical security risk that must be fixed before production.

## Tasks

1. **Explain the Security Issue**
   - Why client-side API keys are dangerous
   - How Edge Functions solve this problem
   - Benefits: security, rate limiting, monitoring

2. **Create Edge Function Structure**
   - Create `supabase/functions/generate-draft/` for Grok
   - Create `supabase/functions/humanize-content/` for Claude
   - Create `supabase/functions/auto-fix-quality/` for quality fixes
   - Set up proper TypeScript types and imports

3. **Implement Edge Functions**
   - Move Grok client logic to generate-draft function
   - Move Claude client logic to humanize-content function
   - Add proper error handling and logging
   - Implement request validation
   - Add rate limiting if needed

4. **Update Client Code**
   - Modify `generationService.js` to call Edge Functions
   - Remove `dangerouslyAllowBrowser` from claudeClient.js
   - Update API calls to use `supabase.functions.invoke()`
   - Handle Edge Function responses
   - Update error handling

5. **Configure Secrets**
   - Set up Supabase secrets for API keys
   - Update environment variables for Edge Functions
   - Document the new setup process
   - Update `.env.example` and README.md

6. **Testing & Deployment**
   - Test Edge Functions locally with Supabase CLI
   - Deploy functions to Supabase
   - Test production deployment
   - Monitor for errors
   - Update documentation

## Expected Outcome

User should have secure, server-side AI API calls with no exposed credentials in the browser.
