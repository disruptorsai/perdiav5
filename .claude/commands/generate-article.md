---
description: Generate a complete article using the two-pass AI pipeline
---

# Generate Article from Idea

Guide the user through generating a complete article using the Grok → Claude pipeline.

## Tasks

1. **Get Content Idea**
   - Ask user for article topic or idea
   - Or help them select an existing idea from the `content_ideas` table
   - Confirm the content type (guide, listicle, ranking, review, explainer)

2. **Run Generation Pipeline**
   - Use the `GenerationService` class to orchestrate generation
   - Show progress through all 5 stages:
     - Stage 1: Grok draft generation
     - Stage 2: Contributor assignment
     - Stage 3: Claude humanization
     - Stage 4: Internal linking (if enabled)
     - Stage 5: Quality scoring
   - Display real-time progress updates

3. **Review Results**
   - Show the generated article metadata (title, excerpt, SEO fields)
   - Display quality score and any issues found
   - Show assigned contributor
   - List internal links added

4. **Save to Database**
   - Save the generated article to the `articles` table
   - Update the content idea status to 'completed'
   - Return the article ID and URL path for editing

5. **Next Steps**
   - Suggest opening the article in the editor
   - If quality score < 85, suggest running auto-fix
   - Provide tips for improving the article

## Expected Outcome

User should have a complete, humanized article saved in their database with quality metrics.
