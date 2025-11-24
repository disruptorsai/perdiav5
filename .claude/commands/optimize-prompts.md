---
description: Optimize AI prompts for better output quality
---

# Optimize AI Prompts

Help improve the quality of AI-generated content by optimizing prompts in Grok and Claude clients.

## Tasks

1. **Audit Current Prompts**
   - Review `grokClient.js` prompts (generateDraft, generateIdeas, generateMetadata)
   - Review `claudeClient.js` prompts (humanize, autoFixQualityIssues, reviseWithFeedback)
   - Identify weaknesses or areas for improvement
   - Check prompt length against context windows

2. **Analyze Output Quality**
   - Review sample outputs from current prompts
   - Identify common issues or patterns
   - Check against quality metrics
   - Get user feedback on specific problems

3. **Optimization Strategies**
   - **For Grok Drafts**: Improve structure, reduce generic phrases, better examples
   - **For Claude Humanization**: Enhance perplexity/burstiness, better voice matching
   - **For Quality Fixes**: More specific instructions, better context
   - Add few-shot examples if beneficial
   - Adjust temperature and max_tokens settings

4. **Test Improvements**
   - Create test content ideas
   - Run generation with new prompts
   - Compare old vs new outputs
   - Measure quality score improvements
   - Check for regressions

5. **Implement Changes**
   - Update prompt builder methods
   - Adjust temperature/max_tokens if needed
   - Add new banned phrases to Claude's list
   - Update content type structures in Grok
   - Document prompt engineering decisions

6. **Monitor Results**
   - Track quality scores before/after
   - Collect user feedback
   - Measure AI detection scores if available
   - Iterate based on results

## Expected Outcome

User should have measurably improved AI output quality with optimized prompts.
