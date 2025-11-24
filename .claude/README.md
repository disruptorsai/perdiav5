# Claude Code Commands for Perdia v5

This folder contains custom slash commands for the Perdia Content Engine project. These commands help automate common tasks and invoke specialized subagents.

## Available Commands

### Setup & Configuration

- **`/setup-database`** - Set up Supabase database with migrations
  - Verifies environment variables
  - Guides through migration execution
  - Validates database setup

- **`/test-ai-clients`** - Test Grok and Claude API connections
  - Verifies API keys are working
  - Creates and runs test scripts
  - Troubleshoots common connection issues

### Content Generation

- **`/generate-article`** - Generate a complete article using the two-pass pipeline
  - Runs all 5 stages (Grok draft → Contributor → Claude humanization → Links → Quality)
  - Shows real-time progress
  - Saves to database with metrics

- **`/check-quality`** - Analyze article quality metrics
  - Calculates comprehensive quality score
  - Identifies specific issues
  - Offers auto-fix capabilities

### Development & Debugging

- **`/debug-pipeline`** - Debug AI generation pipeline issues
  - Isolates failing stages
  - Tests individual components
  - Provides detailed diagnostics

- **`/review-architecture`** - Conduct architecture review
  - Analyzes code structure
  - Identifies security issues
  - Suggests improvements

- **`/add-feature`** - Guide for adding new features
  - Plans implementation following project patterns
  - Covers database, services, hooks, and UI
  - Ensures consistency with existing code

### Production Readiness

- **`/migrate-to-edge-functions`** - Migrate AI calls to Edge Functions
  - Addresses the `dangerouslyAllowBrowser` security issue
  - Creates secure Edge Functions
  - Updates client code

- **`/optimize-prompts`** - Optimize AI prompts for better quality
  - Audits current prompts
  - Tests improvements
  - Measures quality improvements

## Usage

To use a command, simply type it in Claude Code:

```
/setup-database
```

Claude will then follow the instructions in the corresponding markdown file to help you complete the task.

## Creating New Commands

To add a new command:

1. Create a new `.md` file in `.claude/commands/`
2. Add a description in the frontmatter:
   ```yaml
   ---
   description: Brief description of what this command does
   ---
   ```
3. Write clear instructions for Claude to follow
4. Update this README

## Best Practices

- Commands should be task-focused and actionable
- Include troubleshooting steps for common issues
- Reference specific files and line numbers when helpful
- Follow the project's existing patterns and conventions
- Update commands when the codebase architecture changes
