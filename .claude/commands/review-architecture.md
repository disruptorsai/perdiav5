---
description: Review codebase architecture and suggest improvements
---

# Review Architecture

Conduct an architecture review of the Perdia Content Engine codebase.

## Tasks

1. **Analyze Current Architecture**
   - Review the two-pass AI generation pipeline
   - Examine state management patterns (React Query + Context)
   - Analyze component organization and structure
   - Review database schema and relationships
   - Check API client implementations

2. **Security Assessment**
   - Identify security vulnerabilities
   - Focus on the `dangerouslyAllowBrowser: true` issue
   - Check for exposed credentials or secrets
   - Review RLS policies in Supabase
   - Assess input validation and sanitization

3. **Performance Analysis**
   - Identify potential bottlenecks
   - Review query optimization opportunities
   - Check React Query cache configuration
   - Analyze bundle size and code splitting
   - Look for unnecessary re-renders

4. **Code Quality Review**
   - Check for code duplication
   - Review error handling patterns
   - Assess TypeScript usage opportunities
   - Look for missing abstractions or over-engineering
   - Review consistency across the codebase

5. **Suggest Improvements**
   - Prioritize suggestions by impact and effort
   - Provide specific code examples for recommendations
   - Focus on high-value, low-effort wins first
   - Address technical debt items
   - Suggest next steps from README.md roadmap

## Expected Outcome

User should have a clear understanding of architectural strengths/weaknesses and a prioritized improvement plan.
