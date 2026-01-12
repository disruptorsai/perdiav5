import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, MessageSquare } from 'lucide-react'
import { useHowToGuide } from '@/contexts/HowToGuideContext'

/**
 * Floating help & feedback button that appears in the bottom-right corner.
 * Cycles between "How to Use This Page" and "Send Feedback" with smooth animation.
 */
function HelpFeedbackButton() {
  const { isEnabled, openHelpModal } = useHowToGuide()
  const [showHelp, setShowHelp] = useState(true)

  // Cycle between help and feedback text every 3 seconds
  useEffect(() => {
    if (!isEnabled) return // Don't cycle if help is disabled

    const interval = setInterval(() => {
      setShowHelp((prev) => !prev)
    }, 3000)

    return () => clearInterval(interval)
  }, [isEnabled])

  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openHelpModal}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
      aria-label="Help and feedback"
    >
      {isEnabled ? (
        <div className="flex items-center gap-2 h-5">
          <AnimatePresence mode="wait">
            {showHelp ? (
              <motion.div
                key="help"
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">
                  How to Use This Page
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="feedback"
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">
                  Send Feedback
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">Send Feedback</span>
        </div>
      )}
    </motion.button>
  )
}

export default HelpFeedbackButton
