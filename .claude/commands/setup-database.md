---
description: Guide for setting up Supabase database with migrations
---

# Setup Supabase Database

Help the user set up their Supabase database for the Perdia Content Engine.

## Tasks

1. **Verify Environment Variables**
   - Check if `.env.local` exists
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - If missing, guide user to create from `.env.example`

2. **Run Migrations in Order**
   - Explain that migrations must be run in the Supabase SQL Editor
   - Provide the order:
     1. `supabase/migrations/20250101000000_initial_schema.sql`
     2. `supabase/migrations/20250101000001_seed_contributors.sql`
     3. `supabase/migrations/20250101000002_seed_settings.sql`

3. **Verify Database Setup**
   - Check that all 14 tables were created
   - Verify 9 contributors were seeded
   - Verify system settings were created

4. **Troubleshoot Issues**
   - If there are errors, help debug based on error messages
   - Check RLS policies are enabled
   - Verify user authentication is working

## Expected Outcome

User should have a fully functional Supabase database ready for development.
