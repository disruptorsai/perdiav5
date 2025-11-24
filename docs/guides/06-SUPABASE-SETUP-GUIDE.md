# Perdia - Supabase Setup & Configuration Guide

**Version:** 2.0
**Platform:** Supabase Cloud
**Date:** January 2025

---

## Prerequisites

- Supabase account (free tier works for development)
- Node.js 18+ installed
- Git installed
- Basic command line knowledge

---

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email
4. Verify your email address

### 1.2 Create New Project

1. Click "New Project"
2. Select your organization (or create new)
3. Fill in project details:
   - **Name:** `perdia-content-engine`
   - **Database Password:** (generate strong password - SAVE THIS!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (for development) or Pro (for production)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### 1.3 Get Project Credentials

Once ready, go to **Settings → API**:

```bash
# Copy these values - you'll need them:
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep secret!)
```

---

## Step 2: Install Supabase CLI

```bash
# macOS/Linux
npm install -g supabase

# Windows
npm install -g supabase

# Verify installation
supabase --version
```

---

## Step 3: Initialize Local Project

```bash
# Navigate to your project
cd perdia-content-engine

# Initialize Supabase
supabase init

# Link to your cloud project
supabase link --project-ref xxxxxxxxxxxxx
# (Enter the database password you saved earlier)
```

---

## Step 4: Database Migrations

### 4.1 Create Migration Files

Migrations are already written in the documentation. Copy them to your project:

```bash
# Create migrations directory
mkdir -p supabase/migrations

# Create migration files (copy SQL from Database Schema doc)
touch supabase/migrations/20250101000000_initial_schema.sql
touch supabase/migrations/20250101000001_seed_contributors.sql
touch supabase/migrations/20250101000002_seed_settings.sql
```

### 4.2 Run Migrations

```bash
# Apply migrations to your cloud database
supabase db push

# Verify tables were created
supabase db remote dump --table articles
```

---

## Step 5: Row Level Security (RLS)

RLS policies are included in the migrations. Verify they're enabled:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select `articles` table
4. Click **RLS** tab
5. Verify policies are listed and enabled

---

## Step 6: Authentication Setup

### 6.1 Configure Auth Providers

1. Go to **Authentication → Providers**
2. Enable **Email** provider:
   - **Enable email confirmations:** ON (for production) or OFF (for development)
   - **Enable email signups:** ON
   - Click **Save**

### 6.2 Configure Email Templates (Optional)

1. Go to **Authentication → Email Templates**
2. Customize confirmation, reset password templates
3. Add your logo and branding

### 6.3 Test Authentication

```javascript
// Test in browser console
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xxxxxxxxxxxxx.supabase.co',
  'your-anon-key'
);

// Sign up test user
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123',
});

console.log(data, error);
```

---

## Step 7: Edge Functions Setup

### 7.1 Create Functions Directory

```bash
mkdir -p supabase/functions
```

### 7.2 Create Generate Article Function

```bash
supabase functions new generate-article
```

This creates `supabase/functions/generate-article/index.ts`

**Edit the file:**

```typescript
import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ideaId } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch idea
    const { data: idea, error } = await supabaseClient
      .from('content_ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (error) throw error;

    // TODO: Implement AI generation logic here
    // (Grok + Claude calls)

    return new Response(
      JSON.stringify({ success: true, idea }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
```

### 7.3 Set Function Secrets

```bash
# Set AI API keys
supabase secrets set GROK_API_KEY=your_grok_key
supabase secrets set CLAUDE_API_KEY=your_claude_key

# List secrets
supabase secrets list
```

### 7.4 Deploy Function

```bash
# Deploy to Supabase
supabase functions deploy generate-article

# Test function
curl -i --location --request POST \
  'https://xxxxxxxxxxxxx.supabase.co/functions/v1/generate-article' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"ideaId":"test-id-here"}'
```

---

## Step 8: Storage Setup (Optional)

For file uploads (images, etc.):

1. Go to **Storage** in dashboard
2. Click **Create new bucket**
3. Name: `article-images`
4. Make public or private
5. Set storage policies

---

## Step 9: Environment Variables

Create `.env.local` in your React project:

```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# DO NOT put these in frontend .env (use Edge Functions instead)
# VITE_GROK_API_KEY=xxx
# VITE_CLAUDE_API_KEY=xxx
```

---

## Step 10: Frontend Integration

### 10.1 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 10.2 Create Supabase Client

```javascript
// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 10.3 Test Connection

```javascript
// Test in your React app
import { supabase } from './services/supabaseClient';

async function testConnection() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .limit(1);

  console.log('Connection test:', data, error);
}
```

---

## Step 11: Database Backups

### 11.1 Enable Automatic Backups

1. Go to **Settings → Database**
2. Scroll to **Backups**
3. **Free tier:** No automatic backups
4. **Pro tier:** Daily backups, 7-day retention

### 11.2 Manual Backup

```bash
# Dump database to SQL file
supabase db dump -f backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset
psql -h db.xxxxxxxxxxxxx.supabase.co -U postgres -d postgres -f backup-20250115.sql
```

---

## Step 12: Monitoring & Logs

### 12.1 Database Logs

1. Go to **Logs → Database**
2. View query logs, errors, slow queries
3. Set up log alerts (Pro plan)

### 12.2 Edge Function Logs

```bash
# Stream logs for a function
supabase functions logs generate-article --follow
```

### 12.3 Usage & Billing

1. Go to **Settings → Usage**
2. Monitor:
   - Database size
   - Bandwidth
   - API requests
   - Edge Function invocations

---

## Step 13: Security Best Practices

### 13.1 API Key Rotation

```bash
# Rotate anon key (if compromised)
# Go to Settings → API → Reset anon key
```

### 13.2 Database Hardening

- ✅ Enable RLS on all tables
- ✅ Use service_role key only in backend
- ✅ Never expose service_role key in frontend
- ✅ Validate all inputs server-side
- ✅ Use prepared statements (default in Supabase)

### 13.3 Monitor for Suspicious Activity

1. Go to **Logs → Auth**
2. Check for:
   - Failed login attempts
   - Unusual signup patterns
   - API abuse

---

## Troubleshooting

### Issue: "relation 'articles' does not exist"

**Solution:** Migrations not applied.
```bash
supabase db push
```

### Issue: "JWT expired" or auth errors

**Solution:** Refresh access token.
```javascript
const { data, error } = await supabase.auth.refreshSession();
```

### Issue: RLS policy blocking queries

**Solution:** Check policies are correct.
```sql
-- View policies
SELECT * FROM pg_policies WHERE tablename = 'articles';
```

### Issue: Edge Function timeout

**Solution:** Functions have 25-second timeout. Optimize or split into multiple calls.

---

## Next Steps

1. ✅ Supabase project created
2. ✅ Database migrated
3. ✅ Authentication configured
4. ✅ Edge Functions deployed
5. → Proceed to Frontend Development (see Quick Start Guide)

---

**Document Status:** Complete
