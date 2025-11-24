---
description: Analyze article quality metrics and suggest improvements
---

# Check Article Quality

Analyze an article's quality metrics and provide actionable improvement suggestions.

## Tasks

1. **Select Article**
   - Ask user for article ID or title
   - Or show recent articles for them to choose from
   - Fetch the article from database

2. **Calculate Quality Metrics**
   - Use `GenerationService.calculateQualityMetrics()` method
   - Display comprehensive breakdown:
     - Overall quality score (0-100)
     - Word count and target range
     - Internal link count
     - External link count
     - FAQ count and quality
     - Heading structure analysis
     - Readability score

3. **Identify Issues**
   - List all quality issues with severity levels (major/minor)
   - Explain what each issue means
   - Show point deductions for each issue

4. **Suggest Fixes**
   - For each issue, provide specific recommendations
   - Offer to run Claude's `autoFixQualityIssues()` if available
   - Suggest manual improvements for complex issues

5. **Auto-Fix Option**
   - If quality score < 85, offer automated fixing
   - Explain what the auto-fix will do
   - Run Claude's auto-fix if user approves
   - Re-calculate metrics and show improvements

## Expected Outcome

User should understand exactly what quality issues exist and have clear paths to fix them.
