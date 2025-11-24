---
description: Test Grok and Claude API connections
---

# Test AI Client Connections

Help the user verify that their AI API keys are working correctly.

## Tasks

1. **Check Environment Variables**
   - Verify `VITE_GROK_API_KEY` is set in `.env.local`
   - Verify `VITE_CLAUDE_API_KEY` is set in `.env.local`
   - Warn about the security risk of client-side API keys (development only)

2. **Create Test Script**
   - Create a simple test file that imports both AI clients
   - Test Grok client with a simple generation request
   - Test Claude client with a simple humanization request
   - Handle errors gracefully and show meaningful messages

3. **Run Tests**
   - Execute the test script
   - Display results for each client
   - Show token usage if available
   - Report any errors with suggestions for fixes

4. **Common Issues**
   - Invalid API keys → Check keys in console dashboards
   - Rate limits → Suggest waiting or checking quota
   - Network errors → Check internet connection and firewall
   - CORS errors → Remind about `dangerouslyAllowBrowser: true` setting

## Expected Outcome

User should have confirmation that both AI clients are working correctly.
