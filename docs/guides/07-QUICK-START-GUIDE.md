# Perdia Content Engine - Quick Start Guide

**Get up and running in 30 minutes**

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account created
- [ ] API keys obtained:
  - [ ] xAI Grok API key
  - [ ] Anthropic Claude API key

---

## Quick Setup (30 minutes)

### Step 1: Clone/Create Project (5 min)

```bash
# Create new React + Vite project
npm create vite@latest perdia-content-engine -- --template react
cd perdia-content-engine

# Install dependencies
npm install

# Install required packages
npm install @supabase/supabase-js @tanstack/react-query @tanstack/react-router
npm install tailwindcss postcss autoprefixer
npm install @anthropic-ai/sdk
npm install react-hook-form zod @hookform/resolvers
npm install date-fns lucide-react framer-motion recharts
npm install react-quill

# Install Shadcn UI
npx shadcn-ui@latest init
```

### Step 2: Configure Tailwind (2 min)

```bash
npx tailwindcss init -p
```

**Edit `tailwind.config.js`:**
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Edit `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 3: Supabase Setup (10 min)

**Follow the Supabase Setup Guide (`06-SUPABASE-SETUP-GUIDE.md`)**

**Quick version:**
1. Create Supabase project at [https://supabase.com](https://supabase.com)
2. Run migrations (copy SQL from Database Schema doc)
3. Copy API keys

**Create `.env.local`:**
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 4: Create Basic File Structure (5 min)

```bash
mkdir -p src/{components,pages,services,hooks,lib,contexts}
mkdir -p src/components/{ui,layout,dashboard,editor}
```

**Create `src/services/supabaseClient.js`:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Create `src/main.jsx`:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      cacheTime: 300000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Step 5: Test Connection (3 min)

**Create `src/App.jsx`:**
```javascript
import { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('count');

        if (error) throw error;
        setConnectionStatus('✅ Connected to Supabase!');
      } catch (error) {
        setConnectionStatus(`❌ Connection failed: ${error.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Perdia Content Engine</h1>
        <p className="text-gray-600">{connectionStatus}</p>
      </div>
    </div>
  );
}

export default App;
```

**Run dev server:**
```bash
npm run dev
```

Visit `http://localhost:5173` - you should see "✅ Connected to Supabase!"

### Step 6: AI Integration Setup (5 min)

**Create `src/services/ai/grokClient.js`:**
```javascript
export class GrokClient {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_GROK_API_KEY;
    this.baseUrl = 'https://api.x.ai/v1';
  }

  async chat(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'grok-beta',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Grok API error: ${error.error?.message}`);
    }

    return await response.json();
  }
}

export const grokClient = new GrokClient();
```

**Create `src/services/ai/claudeClient.js`:**
```javascript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  constructor(apiKey) {
    this.client = new Anthropic({
      apiKey: apiKey || import.meta.env.VITE_CLAUDE_API_KEY,
      dangerouslyAllowBrowser: true, // Move to backend in production!
    });
    this.model = 'claude-3-5-sonnet-20250122';
  }

  async createMessage(messages, options = {}) {
    const response = await this.client.messages.create({
      model: options.model || this.model,
      max_tokens: options.maxTokens || 8000,
      temperature: options.temperature ?? 1.0,
      messages,
    });

    return response.content[0].text;
  }
}

export const claudeClient = new ClaudeClient();
```

---

## Your First Feature: Article List

### Create useArticles Hook

**`src/hooks/useArticles.js`:**
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData) => {
      const { data, error } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
```

### Create Article List Page

**`src/pages/ContentLibrary.jsx`:**
```javascript
import { useArticles } from '../hooks/useArticles';

export default function ContentLibrary() {
  const { data: articles = [], isLoading, error } = useArticles();

  if (isLoading) {
    return (
      <div className="p-8">
        <p>Loading articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Content Library</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <div key={article.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{article.status}</span>
              <span className="text-xs text-gray-500">
                {article.word_count} words
              </span>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-gray-500 text-center mt-8">
          No articles yet. Create your first one!
        </p>
      )}
    </div>
  );
}
```

### Update App.jsx with Router

```javascript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ContentLibrary from './pages/ContentLibrary';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Simple nav */}
        <nav className="bg-white shadow px-8 py-4">
          <div className="flex gap-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Library
            </Link>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<ContentLibrary />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

**Install React Router:**
```bash
npm install react-router-dom
```

**Test:**
```bash
npm run dev
```

You should now see your article list (empty initially).

---

## Next Steps

### Priority 1: Build Dashboard (Week 1-2)
- [ ] Create Kanban board layout
- [ ] Add drag-and-drop functionality
- [ ] Display articles by status

### Priority 2: Article Generation (Week 2-3)
- [ ] Build PromptBuilder service
- [ ] Implement Grok drafting
- [ ] Implement Claude humanization
- [ ] Test full generation pipeline

### Priority 3: Editor (Week 3-4)
- [ ] Integrate React Quill
- [ ] Build save/update functionality
- [ ] Add preview pane

---

## Development Tips

### Hot Reload
Vite provides instant hot reload - save any file and see changes immediately.

### Database Changes
Whenever you modify the database schema:
```bash
supabase db reset  # Resets and re-runs migrations
```

### Check Logs
```bash
# Supabase Edge Function logs
supabase functions logs generate-article --follow

# Frontend console
# Just open browser DevTools (F12)
```

### Debugging Tips
- Use React Query DevTools for cache inspection
- Use Supabase Dashboard → Table Editor to manually check data
- Check browser Network tab for API errors
- Enable verbose logging in development

---

## Common Issues & Fixes

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "CORS error" when calling AI APIs
Move AI calls to Supabase Edge Functions (backend) instead of frontend.

### "Row Level Security policy violation"
Check RLS policies are correctly configured for your user role.

### Slow queries
Add indexes to frequently queried columns (see Database Schema doc).

---

## Resources

- **Documentation:** `new plan/docs/`
- **Architecture:** `new plan/architecture/`
- **Supabase Docs:** https://supabase.com/docs
- **React Query Docs:** https://tanstack.com/query/latest/docs/react/overview
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Shadcn UI:** https://ui.shadcn.com/

---

## Get Help

1. Check documentation in `new plan/` folder
2. Review Database Schema for entity structure
3. Check Implementation Roadmap for feature order
4. Read AI Integration Strategy for prompt engineering

---

**You're ready to build! Follow the Implementation Roadmap (05-IMPLEMENTATION-ROADMAP.md) for the detailed week-by-week plan.**
