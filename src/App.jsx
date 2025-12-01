import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/toast'
import { queryClient } from './lib/queryClient'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ArticleEditor from './pages/ArticleEditor'
import ContentIdeas from './pages/ContentIdeas'
import ContentLibrary from './pages/ContentLibrary'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ReviewQueue from './pages/ReviewQueue'
import ArticleReview from './pages/ArticleReview'
import SiteCatalog from './pages/SiteCatalog'
import KeywordsAndClusters from './pages/KeywordsAndClusters'
import Automation from './pages/Automation'
import Integrations from './pages/Integrations'
import Contributors from './pages/Contributors'
import AITraining from './pages/AITraining'

// Layout
import MainLayout from './components/layout/MainLayout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading Perdia...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="ideas" element={<ContentIdeas />} />
              <Route path="editor/:articleId" element={<ArticleEditor />} />
              <Route path="editor" element={<ArticleEditor />} />
              <Route path="library" element={<ContentLibrary />} />
              <Route path="review" element={<ReviewQueue />} />
              <Route path="review/:articleId" element={<ArticleReview />} />
              <Route path="catalog" element={<SiteCatalog />} />
              <Route path="keywords" element={<KeywordsAndClusters />} />
              <Route path="automation" element={<Automation />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="contributors" element={<Contributors />} />
              <Route path="ai-training" element={<AITraining />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
