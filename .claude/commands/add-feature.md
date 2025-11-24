---
description: Guide for adding a new feature following project conventions
---

# Add New Feature

Guide the user through adding a new feature while following project architecture and conventions.

## Tasks

1. **Understand the Feature Request**
   - Clarify feature requirements with the user
   - Identify affected areas (UI, API, database, AI)
   - Determine if it fits the current architecture
   - Check README.md roadmap for related features

2. **Plan the Implementation**
   - Break down into discrete tasks
   - Identify required database changes (if any)
   - Plan API/service layer changes
   - Design UI components needed
   - Consider state management approach

3. **Database Changes (if needed)**
   - Create new migration file with timestamp prefix
   - Write SQL for tables, indexes, RLS policies
   - Add to `supabase/migrations/` folder
   - Document the schema changes

4. **Service Layer Implementation**
   - Create or update services in `src/services/`
   - Follow existing patterns (try/catch, error handling)
   - Add to `generationService.js` if related to AI pipeline
   - Write clear JSDoc comments

5. **Data Access Layer**
   - Create custom hooks in `src/hooks/`
   - Use React Query for server state
   - Follow the established pattern (useQuery/useMutation)
   - Include proper cache invalidation

6. **UI Implementation**
   - Create components in appropriate folders
   - Follow Tailwind CSS + CVA patterns
   - Use Lucide React for icons
   - Implement proper loading/error states

7. **Integration & Testing**
   - Integrate feature into relevant pages
   - Test all user flows
   - Check error handling
   - Verify mobile responsiveness (if applicable)
   - Test with real data

8. **Documentation**
   - Update CLAUDE.md if architecture changes
   - Update README.md if user-facing
   - Add code comments for complex logic
   - Document any new patterns introduced

## Expected Outcome

User should have a fully implemented feature that follows project conventions and integrates seamlessly.
