import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import FloatingHelpButton from '../help/FloatingHelpButton'
import HelpModal from '../help/HelpModal'
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Library,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ClipboardCheck,
  Globe,
  Hash,
  Zap,
  Plug,
  Users,
  Brain,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'

// System status banner component
function SystemStatusBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [buildInfo, setBuildInfo] = useState(null)

  useEffect(() => {
    // Check if user has dismissed this version's banner
    const dismissedVersion = localStorage.getItem('dismissedStatusVersion')
    const currentVersion = '2026.01.08.2'
    if (dismissedVersion === currentVersion) {
      setIsVisible(false)
    }
    setBuildInfo({
      version: currentVersion,
      lastUpdate: 'Jan 8, 2026 11:30 AM PT',
      status: 'operational',
      recentFixes: [
        'NEW: Full Article Preview - click "Preview Full Article" to view complete content without leaving the page',
        'NEW: Enhanced Error Display - errors now show copyable error codes for easy reporting',
        'View Article button added to completed ideas',
        'Articles now appear in Review Queue after generation',
      ]
    })
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('dismissedStatusVersion', buildInfo?.version || '')
    setIsVisible(false)
  }

  if (!isVisible || !buildInfo) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b-2 border-green-300"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">System Updated & Ready</span>
              </div>
              <span className="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded">
                v{buildInfo.version}
              </span>
              <span className="text-sm text-green-600">
                {buildInfo.lastUpdate}
              </span>
            </div>
            {/* Show recent fixes */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {buildInfo.recentFixes.slice(0, 2).map((fix, index) => (
                <div key={index} className="flex items-center gap-1.5 text-sm text-green-700">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fix}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
            title="Dismiss (won't show again for this version)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function MainLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Content Ideas', href: '/ideas', icon: Lightbulb },
    { name: 'Library', href: '/library', icon: Library },
    { name: 'Review Queue', href: '/review', icon: ClipboardCheck },
    { name: 'Automation', href: '/automation', icon: Zap },
    { name: 'Site Catalog', href: '/catalog', icon: Globe },
    // { name: 'Keywords', href: '/keywords', icon: Hash }, // Hidden - not currently in use
    { name: 'Integrations', href: '/integrations', icon: Plug },
    { name: 'Contributors', href: '/contributors', icon: Users },
    { name: 'AI Training', href: '/ai-training', icon: Brain },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center h-16 px-6 border-b border-gray-200"
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <FileText className="w-8 h-8 text-blue-600" />
            </motion.div>
            <span className="ml-2 text-xl font-bold text-gray-900">Perdia</span>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                >
                  <Link
                    to={item.href}
                    className={`
                      relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? 'text-blue-700'
                          : 'text-gray-700 hover:text-gray-900'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-blue-50 rounded-lg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* User Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <div className="flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                  >
                    {user?.email?.[0].toUpperCase()}
                  </motion.div>
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="pl-64">
        <SystemStatusBanner />
        <main className="min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* How-To Guide Components */}
      <FloatingHelpButton />
      <HelpModal />
    </div>
  )
}

export default MainLayout
