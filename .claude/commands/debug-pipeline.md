---
description: Debug issues with the AI generation pipeline
---

# Debug Generation Pipeline

Help troubleshoot issues with the Grok → Claude generation pipeline.

## Tasks

1. **Identify the Issue**
   - Ask user to describe the problem
   - Determine which stage is failing:
     - Stage 1: Grok draft generation
     - Stage 2: Contributor assignment
     - Stage 3: Claude humanization
     - Stage 4: Internal linking
     - Stage 5: Quality scoring

2. **Check Prerequisites**
   - Verify API keys are valid
   - Check network connectivity
   - Verify database connection
   - Ensure content idea data is valid

3. **Test Individual Stages**
   - Create isolated tests for each stage
   - Run Grok client test independently
   - Run Claude client test independently
   - Test database queries for contributors and site_articles

4. **Common Issues & Solutions**
   - **JSON parsing errors from Grok**: Check prompt format, validate response structure
   - **Claude timeout**: Reduce content size, check max_tokens setting
   - **Contributor assignment fails**: Verify contributors table has data
   - **Internal linking fails**: Check site_articles table has entries
   - **Quality score calculation errors**: Validate HTML content format

5. **Provide Detailed Diagnostics**
   - Show error stack traces
   - Log API request/response details (sanitize keys)
   - Display intermediate results from each stage
   - Suggest specific code fixes

## Expected Outcome

User should identify the root cause and have clear steps to fix the pipeline issue.
