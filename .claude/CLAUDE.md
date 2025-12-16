# perdiav5 - Claude Code Context

> **Initialized:** 2025-12-15
> **Path:** /c/Users/Disruptors/Documents/Disruptors Projects/perdiav5

## Project Description

Perdia v5 is an AI-powered content production system built with React 19, Vite, and Supabase. The application orchestrates a two-pass AI generation pipeline (Grok for drafting → StealthGPT for humanization) to produce SEO-optimized articles with automated quality assurance, contributor assignment, and WordPress publishing capabilities.

**Primary Client:** GetEducated.com

## Global Tools Available

This project is connected to the Disruptors global development environment.

### Automatic Time Tracking
All work is automatically logged to `~/.claude/timesheet/logs/`
- Sessions, prompts, and tool usage captured
- Time calculated in 15-minute blocks (0.25 hrs each)

### Commands
| Command | Description |
|---------|-------------|
| `/hours` | Quick timesheet summary |
| `/hours week` | Last 7 days summary |
| `/timesheet` | Detailed breakdown |
| `/notion-sync` | Push to Notion |
| `/init` | Re-run this setup |

### MCP Servers
- **Notion** - Page/database management
- **GoHighLevel** - CRM integration

### Subagents
- `timesheet-reporter` - "Generate my timesheet"
- `notion-timesheet` - "Sync to Notion"
- `project-init` - "Initialize this project"

## Project Notes

- See root `CLAUDE.md` for detailed project architecture and conventions
- AI generation pipeline: Grok → StealthGPT → Claude (fallback)
- 4 approved authors: Tony Huffman, Kayleigh Gilbert, Sara, Charity
- See `docs/v5-updates/` for GetEducated-specific requirements

## Key Files

- `src/services/generationService.js` - Main AI generation pipeline
- `src/services/ai/grokClient.js` - Grok API client (drafting)
- `src/services/ai/stealthGptClient.js` - StealthGPT client (humanization)
- `src/services/ai/claudeClient.js` - Claude API client (fallback/revision)
- `src/contexts/AuthContext.jsx` - Authentication layer
- `src/App.jsx` - Main routing
- `supabase/migrations/` - Database migrations

---
*Global system docs: ~/Documents/personal/claude-timesheet-system/*
