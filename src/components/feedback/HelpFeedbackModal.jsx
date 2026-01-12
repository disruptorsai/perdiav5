import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, MessageSquare, ChevronRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useHowToGuide } from '@/contexts/HowToGuideContext'
import { getHelpContentForPath } from '@/config/pageHelpContent'
import FeedbackForm from './FeedbackForm'

function HelpFeedbackModal() {
  const { isHelpModalOpen, closeHelpModal, isEnabled } = useHowToGuide()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('help')

  const helpContent = getHelpContentForPath(location.pathname)

  // Close modal and reset tab
  const handleClose = () => {
    closeHelpModal()
    // Reset to help tab after closing
    setTimeout(() => setActiveTab('help'), 300)
  }

  // Handle successful feedback submission
  const handleFeedbackSuccess = () => {
    // Optionally close modal after submission
    // handleClose()
  }

  return (
    <AnimatePresence>
      {isHelpModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-hidden bg-white rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {activeTab === 'help' ? (
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'help' ? 'Help & Instructions' : 'Send Feedback'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'help'
                      ? helpContent.description
                      : 'Report bugs, ask questions, or suggest improvements'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="help" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    How to Use
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Send Feedback
                  </TabsTrigger>
                </TabsList>

                {/* Help Content Tab */}
                <TabsContent value="help" className="mt-4">
                  <div className="overflow-y-auto max-h-[calc(85vh-220px)] pr-1">
                    <div className="space-y-5">
                      {helpContent.sections.map((section, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                              <ChevronRight className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 mb-1">
                                {section.heading}
                              </h3>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {section.content}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Feedback Form Tab */}
                <TabsContent value="feedback" className="mt-4">
                  <div className="overflow-y-auto max-h-[calc(85vh-220px)] pr-1">
                    <FeedbackForm onSuccess={handleFeedbackSuccess} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 mt-4">
              {activeTab === 'help' ? (
                <p className="text-xs text-gray-500 text-center">
                  Tip: You can disable help guides in Settings. Feedback is always available.
                </p>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  Your feedback helps us improve the app for everyone!
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default HelpFeedbackModal
