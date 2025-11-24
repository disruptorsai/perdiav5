# PowerShell Deployment Script for Supabase Edge Functions
# This script sets up API keys and deploys all Edge Functions

Write-Host "=== Supabase Edge Functions Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking for Supabase CLI..." -ForegroundColor Yellow
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabasePath) {
    Write-Host "ERROR: Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Read environment variables from .env.local
Write-Host "Reading API keys from .env.local..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.local"
$grokKey = ($envContent | Select-String "VITE_GROK_API_KEY=(.+)").Matches.Groups[1].Value
$claudeKey = ($envContent | Select-String "VITE_CLAUDE_API_KEY=(.+)").Matches.Groups[1].Value
$dataForSeoUser = ($envContent | Select-String "VITE_DATAFORSEO_USERNAME=(.+)").Matches.Groups[1].Value
$dataForSeoPass = ($envContent | Select-String "VITE_DATAFORSEO_PASSWORD=(.+)").Matches.Groups[1].Value

Write-Host "✓ Environment variables loaded" -ForegroundColor Green
Write-Host ""

# Prompt for confirmation
Write-Host "This script will:" -ForegroundColor Cyan
Write-Host "  1. Link to your Supabase project (nvffvcjtrgxnunncdafz)"
Write-Host "  2. Set API keys as Supabase secrets"
Write-Host "  3. Deploy all 5 Edge Functions"
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Step 1: Linking to Supabase Project ===" -ForegroundColor Cyan
supabase link --project-ref nvffvcjtrgxnunncdafz

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to link to Supabase project" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Linked to project" -ForegroundColor Green
Write-Host ""

Write-Host "=== Step 2: Setting API Keys as Secrets ===" -ForegroundColor Cyan

Write-Host "Setting GROK_API_KEY..." -ForegroundColor Yellow
supabase secrets set GROK_API_KEY=$grokKey

Write-Host "Setting CLAUDE_API_KEY..." -ForegroundColor Yellow
supabase secrets set CLAUDE_API_KEY=$claudeKey

Write-Host "Setting DATAFORSEO_USERNAME..." -ForegroundColor Yellow
supabase secrets set DATAFORSEO_USERNAME=$dataForSeoUser

Write-Host "Setting DATAFORSEO_PASSWORD..." -ForegroundColor Yellow
supabase secrets set DATAFORSEO_PASSWORD=$dataForSeoPass

Write-Host "✓ All secrets set" -ForegroundColor Green
Write-Host ""

Write-Host "=== Step 3: Deploying Edge Functions ===" -ForegroundColor Cyan

$functions = @("grok-api", "claude-api", "generate-article", "publish-to-wordpress", "generate-ideas-from-keywords")

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Yellow
    supabase functions deploy $func

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to deploy $func" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ $func deployed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify functions in Supabase Dashboard → Edge Functions"
Write-Host "  2. Test the grok-api and claude-api functions"
Write-Host "  3. Remove API keys from .env.local (keep only VITE_SUPABASE_* keys)"
Write-Host "  4. Rotate your API keys (they were exposed in this session)"
Write-Host ""
Write-Host "To monitor logs, run:" -ForegroundColor Yellow
Write-Host "  supabase functions logs grok-api --tail" -ForegroundColor Gray
Write-Host "  supabase functions logs claude-api --tail" -ForegroundColor Gray
Write-Host ""
