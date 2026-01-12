import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useHowToGuide } from '@/contexts/HowToGuideContext'
import { getHelpContentForPath } from '@/config/pageHelpContent'
import FeedbackForm from './FeedbackForm'

/**
 * Collapsible section component for help content
 */
function CollapsibleSection({ heading, content, defaultOpen = false, index }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white/80">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
            {index + 1}
          </span>
          <span className="font-medium text-gray-900">{heading}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-3 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * FAQ Collapsible component
 */
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-left hover:text-blue-600 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{question}</span>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-gray-600 pb-3 pl-2">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HelpFeedbackModal() {
  const { isHelpModalOpen, closeHelpModal, isEnabled } = useHowToGuide()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('help')

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const modalRef = useRef(null)

  // Resizable state
  const [size, setSize] = useState({ width: 520, height: 600 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartPos = useRef({ x: 0, y: 0 })
  const resizeStartSize = useRef({ width: 520, height: 600 })
  const [isMaximized, setIsMaximized] = useState(false)
  const savedState = useRef({ position: { x: 0, y: 0 }, size: { width: 520, height: 600 } })

  const helpContent = getHelpContentForPath(location.pathname)

  // Reset position when modal opens
  useEffect(() => {
    if (isHelpModalOpen) {
      setPosition({ x: 0, y: 0 })
      setSize({ width: 520, height: 600 })
      setIsMaximized(false)
    }
  }, [isHelpModalOpen])

  // Dragging handlers
  const handleDragStart = useCallback((e) => {
    if (e.target.closest('button') && !e.target.closest('.drag-handle')) return
    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }, [position])

  const handleDrag = useCallback((e) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y,
    })
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeStartPos.current = { x: e.clientX, y: e.clientY }
    resizeStartSize.current = { ...size }
  }, [size])

  const handleResize = useCallback((e) => {
    if (!isResizing) return
    const deltaX = e.clientX - resizeStartPos.current.x
    const deltaY = e.clientY - resizeStartPos.current.y
    setSize({
      width: Math.max(400, Math.min(900, resizeStartSize.current.width + deltaX)),
      height: Math.max(400, Math.min(800, resizeStartSize.current.height + deltaY)),
    })
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDrag, handleDragEnd])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  // Toggle maximize
  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      setPosition(savedState.current.position)
      setSize(savedState.current.size)
    } else {
      savedState.current = { position, size }
      setPosition({ x: 0, y: 0 })
      setSize({ width: window.innerWidth - 80, height: window.innerHeight - 80 })
    }
    setIsMaximized(!isMaximized)
  }, [isMaximized, position, size])

  // Close modal and reset
  const handleClose = () => {
    closeHelpModal()
    setTimeout(() => setActiveTab('help'), 300)
  }

  const handleFeedbackSuccess = () => {
    // Modal stays open after feedback submission
  }

  return (
    <AnimatePresence>
      {isHelpModalOpen && (
        <>
          {/* Backdrop - semi-transparent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
          />

          {/* Modal - draggable, resizable, semi-transparent */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              width: size.width,
              height: size.height,
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            }}
            className={`fixed left-1/2 top-1/2 z-50 flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white/95 backdrop-blur-sm border border-gray-200/50 ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'select-none' : ''}`}
          >
            {/* Drag Handle Header */}
            <div
              onMouseDown={handleDragStart}
              className="drag-handle flex items-center justify-between p-4 border-b border-gray-200/80 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-gray-400">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="p-2 bg-blue-100/80 rounded-lg">
                  {activeTab === 'help' ? (
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'help' ? 'How to Use This Page' : 'Send Feedback About This Page'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'help'
                      ? helpContent.title
                      : 'Report bugs, ask questions, or suggest improvements'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMaximize}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-lg transition-colors"
                  aria-label={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-3 bg-white/50">
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

                {/* Help Content Tab - Collapsible Sections */}
                <TabsContent value="help" className="mt-3 flex-1">
                  <div
                    className="overflow-y-auto pr-1"
                    style={{ maxHeight: size.height - 220 }}
                  >
                    {/* Page Description */}
                    <div className="mb-4 p-3 bg-blue-50/80 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">{helpContent.description}</p>
                    </div>

                    {/* Collapsible Sections */}
                    <div className="space-y-2">
                      {helpContent.sections.map((section, index) => (
                        <CollapsibleSection
                          key={index}
                          index={index}
                          heading={section.heading}
                          content={section.content}
                          defaultOpen={index === 0}
                        />
                      ))}
                    </div>

                    {/* FAQs Section */}
                    {helpContent.faqs && helpContent.faqs.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50/80 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <span className="text-lg">❓</span> Frequently Asked Questions
                        </h4>
                        <div className="space-y-1">
                          {helpContent.faqs.map((faq, index) => (
                            <FAQItem
                              key={index}
                              question={faq.question}
                              answer={faq.answer}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Feedback Form Tab */}
                <TabsContent value="feedback" className="mt-3 flex-1">
                  <div
                    className="overflow-y-auto pr-1"
                    style={{ maxHeight: size.height - 220 }}
                  >
                    <FeedbackForm onSuccess={handleFeedbackSuccess} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="mt-auto p-3 border-t border-gray-200/80 bg-gray-50/80">
              {activeTab === 'help' ? (
                <p className="text-xs text-gray-500 text-center">
                  💡 Tip: Click section headers to expand/collapse. Drag the header to move this window.
                </p>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  Your feedback helps us improve the app for everyone!
                </p>
              )}
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeStart}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
              style={{ touchAction: 'none' }}
            >
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
              </svg>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default HelpFeedbackModal
