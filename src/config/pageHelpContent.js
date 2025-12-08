/**
 * Page-specific help content for the "How to use this page" feature.
 * Each key corresponds to a route path, and values contain the help information.
 */

export const pageHelpContent = {
  '/': {
    title: 'Dashboard',
    description: 'Your command center for content production.',
    sections: [
      {
        heading: 'Overview',
        content: 'The Dashboard gives you a quick snapshot of your content pipeline status, including articles in progress, pending reviews, and recently published content.'
      },
      {
        heading: 'Key Metrics',
        content: 'View real-time statistics about your content production including articles generated today, quality scores, and publishing throughput.'
      },
      {
        heading: 'Quick Actions',
        content: 'Use the action buttons to quickly generate new content, review pending articles, or jump to the content library.'
      }
    ]
  },

  '/ideas': {
    title: 'Content Ideas',
    description: 'Manage and approve content ideas for generation.',
    sections: [
      {
        heading: 'Overview',
        content: 'This page displays all content ideas in your pipeline. Ideas can be manually created or AI-generated based on keyword research.'
      },
      {
        heading: 'Approving Ideas',
        content: 'Review each idea and click "Approve" to add it to the generation queue, or "Reject" to remove it. Only approved ideas will be used for article generation.'
      },
      {
        heading: 'Creating Ideas',
        content: 'Click "Add Idea" to manually create a new content idea. Provide a title, description, target keywords, and content type.'
      },
      {
        heading: 'Bulk Actions',
        content: 'Select multiple ideas to approve, reject, or delete them in bulk for faster workflow management.'
      }
    ]
  },

  '/library': {
    title: 'Content Library',
    description: 'Browse and manage all generated articles.',
    sections: [
      {
        heading: 'Overview',
        content: 'The Content Library contains all articles in your system, organized by status: drafts, in review, ready to publish, and published.'
      },
      {
        heading: 'Filtering & Search',
        content: 'Use the filters to view articles by status, author, date range, or search by title/keywords.'
      },
      {
        heading: 'Article Actions',
        content: 'Click on any article to open it in the editor. Use the action menu to change status, regenerate, or delete articles.'
      },
      {
        heading: 'Batch Generation',
        content: 'Use the "Generate Batch" button to create multiple articles at once from approved ideas.'
      }
    ]
  },

  '/review': {
    title: 'Review Queue',
    description: 'Review and approve articles before publishing.',
    sections: [
      {
        heading: 'Overview',
        content: 'Articles that pass quality checks appear here for human review before publishing. This is your final quality gate.'
      },
      {
        heading: 'Review Process',
        content: 'Click on an article to review its content, quality score, and any flagged issues. Make edits if needed, then approve or reject.'
      },
      {
        heading: 'Quality Indicators',
        content: 'Each article shows its quality score, word count, internal links, and any compliance warnings. Address red flags before approving.'
      },
      {
        heading: 'Auto-Publish Timer',
        content: 'Articles have an auto-publish deadline. If not reviewed in time, they may be automatically published (if enabled in settings).'
      }
    ]
  },

  '/automation': {
    title: 'Automation',
    description: 'Configure and monitor automated content generation.',
    sections: [
      {
        heading: 'Overview',
        content: 'Control the automated content pipeline. Set up scheduled generation, queue management, and auto-publishing rules.'
      },
      {
        heading: 'Generation Queue',
        content: 'View and manage the queue of articles waiting to be generated. Prioritize, pause, or cancel items as needed.'
      },
      {
        heading: 'Scheduling',
        content: 'Set up automatic content generation schedules. Define how many articles to generate per day and at what times.'
      },
      {
        heading: 'Monitoring',
        content: 'Track the status of ongoing generations, view success/failure rates, and troubleshoot any issues.'
      }
    ]
  },

  '/catalog': {
    title: 'Site Catalog',
    description: 'Manage the GetEducated article catalog for internal linking.',
    sections: [
      {
        heading: 'Overview',
        content: 'The Site Catalog contains all existing GetEducated articles. This database is used for intelligent internal linking during content generation.'
      },
      {
        heading: 'Browsing Articles',
        content: 'Search and filter through the catalog to find specific articles. View metadata like URL, topics, and link usage.'
      },
      {
        heading: 'Syncing',
        content: 'Click "Sync Catalog" to import new articles from the GetEducated sitemap. This keeps your internal linking database up to date.'
      },
      {
        heading: 'Link Analytics',
        content: 'See which articles are most frequently linked to and identify opportunities for better internal linking coverage.'
      }
    ]
  },

  '/keywords': {
    title: 'Keywords',
    description: 'Research and manage target keywords for content.',
    sections: [
      {
        heading: 'Overview',
        content: 'Research keywords using DataForSEO integration. Find high-value keywords for new content ideas.'
      },
      {
        heading: 'Keyword Research',
        content: 'Enter seed keywords to get search volume, competition data, and related keyword suggestions.'
      },
      {
        heading: 'Saving Keywords',
        content: 'Save promising keywords to your list for future content planning. Organize them by topic or priority.'
      },
      {
        heading: 'Creating Ideas from Keywords',
        content: 'Select keywords and click "Create Ideas" to automatically generate content ideas targeting those keywords.'
      }
    ]
  },

  '/integrations': {
    title: 'Integrations',
    description: 'Connect external services and APIs.',
    sections: [
      {
        heading: 'Overview',
        content: 'Manage connections to external services like WordPress, analytics platforms, and third-party APIs.'
      },
      {
        heading: 'WordPress Connection',
        content: 'Configure your WordPress site connection for direct publishing. Set up API credentials and test the connection.'
      },
      {
        heading: 'API Keys',
        content: 'Manage API keys for AI providers (Grok, Claude, StealthGPT) and other services (DataForSEO).'
      },
      {
        heading: 'Webhooks',
        content: 'Set up webhooks to trigger external automations when articles are published or status changes occur.'
      }
    ]
  },

  '/contributors': {
    title: 'Contributors',
    description: 'Manage article contributors and their writing styles.',
    sections: [
      {
        heading: 'Overview',
        content: 'View and manage the approved contributors who can be attributed as article authors. GetEducated uses 4 approved authors.'
      },
      {
        heading: 'Author Profiles',
        content: 'Each contributor has a profile with their expertise areas, writing style characteristics, and content type preferences.'
      },
      {
        heading: 'Style Matching',
        content: 'The AI uses contributor profiles to match writing styles and automatically assign appropriate authors to generated content.'
      },
      {
        heading: 'Content Mapping',
        content: 'See which types of content each author typically writes and their historical article assignments.'
      }
    ]
  },

  '/ai-training': {
    title: 'AI Training',
    description: 'Train and fine-tune AI writing styles.',
    sections: [
      {
        heading: 'Overview',
        content: 'Improve AI output quality by providing feedback and training data. The system learns from approved revisions.'
      },
      {
        heading: 'Style Samples',
        content: 'Upload example articles to help the AI learn specific writing styles for each contributor.'
      },
      {
        heading: 'Feedback Loop',
        content: 'Review AI-generated content and mark corrections. The system uses this feedback to improve future generations.'
      },
      {
        heading: 'Quality Patterns',
        content: 'View patterns in quality scores and identify areas where the AI needs improvement.'
      }
    ]
  },

  '/analytics': {
    title: 'Analytics',
    description: 'Track content performance and production metrics.',
    sections: [
      {
        heading: 'Overview',
        content: 'Monitor your content production pipeline with detailed analytics and performance metrics.'
      },
      {
        heading: 'Production Metrics',
        content: 'Track articles generated, published, and in queue. View daily/weekly/monthly trends.'
      },
      {
        heading: 'Quality Scores',
        content: 'Analyze average quality scores over time and identify patterns in content quality.'
      },
      {
        heading: 'Author Performance',
        content: 'See content distribution across contributors and compare quality metrics by author.'
      }
    ]
  },

  '/settings': {
    title: 'Settings',
    description: 'Configure application behavior and preferences.',
    sections: [
      {
        heading: 'Overview',
        content: 'Configure all aspects of the content engine including GetEducated rules, automation levels, AI settings, and quality standards.'
      },
      {
        heading: 'GetEducated Tab',
        content: 'Set client-specific rules: approved authors, link compliance, auto-publish settings, and risk controls.'
      },
      {
        heading: 'Automation Tab',
        content: 'Choose automation level (Manual, Assisted, Full Auto) and configure auto-post and idea generation settings.'
      },
      {
        heading: 'AI Models Tab',
        content: 'Configure AI model selection, temperature, and humanization settings for StealthGPT.'
      },
      {
        heading: 'Quality Rules Tab',
        content: 'Set minimum requirements for word count, links, readability, and other quality metrics.'
      }
    ]
  },

  // Editor routes (dynamic)
  '/editor': {
    title: 'Article Editor',
    description: 'Edit and refine article content.',
    sections: [
      {
        heading: 'Overview',
        content: 'The full-featured editor for reviewing and modifying article content. Make edits, request AI revisions, and prepare articles for publishing.'
      },
      {
        heading: 'Content Editing',
        content: 'Use the rich text editor to modify content. Format text, add headings, insert links, and structure your article.'
      },
      {
        heading: 'AI Revision',
        content: 'Select text and use "AI Revise" to request specific changes. Add comments explaining what you want changed.'
      },
      {
        heading: 'Metadata Panel',
        content: 'Edit SEO metadata including title, description, focus keyword, and author attribution on the right panel.'
      },
      {
        heading: 'Quality Score',
        content: 'Monitor the real-time quality score as you make changes. Address any flagged issues before publishing.'
      }
    ]
  },

  // Catalog article detail
  '/catalog/:id': {
    title: 'Catalog Article Detail',
    description: 'View details of a catalog article.',
    sections: [
      {
        heading: 'Overview',
        content: 'View detailed information about a specific article in the GetEducated catalog.'
      },
      {
        heading: 'Article Metadata',
        content: 'See the article URL, topics, word count, and how many times it has been used for internal linking.'
      },
      {
        heading: 'Refresh Content',
        content: 'Re-scrape the article to update its content and metadata in the catalog.'
      }
    ]
  }
}

/**
 * Get help content for a given route path.
 * Handles dynamic routes by matching patterns.
 */
export function getHelpContentForPath(pathname) {
  // Direct match
  if (pageHelpContent[pathname]) {
    return pageHelpContent[pathname]
  }

  // Handle dynamic routes
  if (pathname.startsWith('/editor/')) {
    return pageHelpContent['/editor']
  }

  if (pathname.startsWith('/catalog/') && pathname !== '/catalog') {
    return pageHelpContent['/catalog/:id']
  }

  if (pathname.startsWith('/contributors/')) {
    return {
      title: 'Contributor Detail',
      description: 'View and edit contributor profile.',
      sections: [
        {
          heading: 'Overview',
          content: 'View detailed information about this contributor including their writing style, expertise areas, and assigned articles.'
        },
        {
          heading: 'Writing Style',
          content: 'See the style characteristics and voice profile used by AI when generating content for this author.'
        },
        {
          heading: 'Article History',
          content: 'View all articles assigned to this contributor and their performance metrics.'
        }
      ]
    }
  }

  // Fallback for unknown routes
  return {
    title: 'Page Help',
    description: 'Help information for this page.',
    sections: [
      {
        heading: 'Getting Started',
        content: 'This page is part of the Perdia content production system. Navigate using the sidebar menu to access different features.'
      }
    ]
  }
}
