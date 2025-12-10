import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Check,
  X,
  FileText,
  RefreshCw,
  Zap,
  Pencil,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Revision strategy info for display
const STRATEGY_INFO = {
  refresh: {
    name: 'Content Refresh',
    icon: RefreshCw,
    color: 'blue',
    description: 'Updating content while maintaining structure',
  },
  expand: {
    name: 'Content Expansion',
    icon: TrendingUp,
    color: 'green',
    description: 'Adding depth and detail to existing content',
  },
  update_stats: {
    name: 'Statistics Update',
    icon: FileText,
    color: 'purple',
    description: 'Refreshing data and statistics',
  },
  improve_seo: {
    name: 'SEO Optimization',
    icon: Zap,
    color: 'orange',
    description: 'Optimizing for search engines',
  },
  add_faqs: {
    name: 'FAQ Addition',
    icon: BookOpen,
    color: 'cyan',
    description: 'Adding frequently asked questions',
  },
  custom: {
    name: 'Custom Revision',
    icon: Pencil,
    color: 'violet',
    description: 'Applying custom instructions',
  },
}

/**
 * AnalyzingPhase - Shows the revision type being processed
 */
function AnalyzingPhase({ revisionType, articleTitle }) {
  const strategy = STRATEGY_INFO[revisionType] || STRATEGY_INFO.custom
  const Icon = strategy.icon

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {/* Animated Icon */}
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br from-${strategy.color}-400 to-${strategy.color}-600 rounded-full opacity-20`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className={`absolute inset-2 bg-gradient-to-br from-${strategy.color}-500 to-${strategy.color}-600 rounded-full flex items-center justify-center`}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>

        {/* Orbiting dots */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 bg-${strategy.color}-400 rounded-full`}
            style={{ top: '50%', left: '50%' }}
            animate={{
              x: [0, 40, 0, -40, 0],
              y: [-40, 0, 40, 0, -40],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {strategy.name}
      </h3>

      <p className="text-gray-500 mb-4 text-center max-w-md">
        {strategy.description}
      </p>

      <div className="max-w-lg w-full bg-gray-100 rounded-xl p-4">
        <p className="text-sm text-gray-600 text-center line-clamp-2">
          "{articleTitle}"
        </p>
      </div>
    </div>
  )
}

/**
 * ProcessingPhase - Shows detailed progress steps
 */
function ProcessingPhase({ progress, stage }) {
  const stages = [
    { key: 'analyzing', label: 'Analyzing current content', icon: Brain },
    { key: 'generating', label: 'Generating revised content', icon: Sparkles },
    { key: 'humanizing', label: 'Humanizing for AI detection', icon: Pencil },
    { key: 'saving', label: 'Saving new version', icon: CheckCircle2 },
  ]

  // Determine which stages are complete based on progress
  const getStageStatus = (stageKey, index) => {
    const progressThresholds = [0, 25, 60, 90]
    if (progress >= progressThresholds[index + 1] || (index === stages.length - 1 && progress >= 90)) {
      return 'complete'
    }
    if (progress >= progressThresholds[index]) {
      return 'active'
    }
    return 'pending'
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {/* Progress Ring */}
      <div className="relative w-32 h-32 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-blue-500"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.5 }}
            style={{
              strokeDasharray: '352',
              strokeDashoffset: 352 - (352 * progress) / 100,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{Math.round(progress)}%</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Revising Article
      </h3>

      {/* Progress Steps */}
      <div className="space-y-4 w-full max-w-sm">
        {stages.map((s, i) => {
          const status = getStageStatus(s.key, i)
          const Icon = s.icon

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 ${
                status === 'complete' ? 'text-green-600' :
                status === 'active' ? 'text-blue-600' :
                'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status === 'complete' ? 'bg-green-100' :
                status === 'active' ? 'bg-blue-100' :
                'bg-gray-100'
              }`}>
                {status === 'complete' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'active' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={status === 'active' ? 'font-medium' : ''}>
                {s.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * TypingReveal - Progressive reveal of HTML content
 */
function TypingReveal({ htmlContent, onComplete, speed = 'normal' }) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [revealProgress, setRevealProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const duration = useMemo(() => {
    if (!htmlContent) return 5000
    const baseLength = htmlContent.length
    const baseDuration = Math.min(Math.max(baseLength / 100, 5), 15) * 1000
    const speedMultiplier = speed === 'fast' ? 0.5 : speed === 'slow' ? 1.5 : 1
    return baseDuration * speedMultiplier
  }, [htmlContent, speed])

  useEffect(() => {
    if (!htmlContent) return

    const startTime = performance.now()
    let animationFrame

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setRevealProgress(eased * 100)

      if (containerRef.current && contentRef.current) {
        const totalHeight = contentRef.current.scrollHeight
        const revealHeight = (eased * totalHeight)
        const containerHeight = containerRef.current.clientHeight
        const scrollTarget = revealHeight - containerHeight * 0.7
        containerRef.current.scrollTop = Math.max(0, scrollTarget)
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setIsComplete(true)
        onComplete?.()
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [htmlContent, duration, onComplete])

  if (!htmlContent) return null

  return (
    <div ref={containerRef} className="h-full overflow-auto relative">
      <div className="relative">
        <div
          ref={contentRef}
          className="prose prose-sm max-w-none p-6"
          style={{
            clipPath: `inset(0 0 ${100 - revealProgress}% 0)`,
            WebkitClipPath: `inset(0 0 ${100 - revealProgress}% 0)`,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {!isComplete && (
          <motion.div
            className="absolute left-0 right-0 flex items-center gap-2 pointer-events-none px-6"
            style={{ top: `${revealProgress}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent" />
            <motion.div
              className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <Pencil className="w-3 h-3" />
              Writing...
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/**
 * ArticlePreview - Shows article content
 */
function ArticlePreview({ content, title, dimmed = false }) {
  return (
    <div className={`h-full flex flex-col ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-gray-50">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <ScrollArea className="flex-1">
        <div
          className="p-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content || '<p>No content</p>' }}
        />
      </ScrollArea>
    </div>
  )
}

/**
 * CatalogRevisionAnimation - Animation for catalog article revision
 */
export default function CatalogRevisionAnimation({
  originalContent,
  revisedContent,
  articleTitle,
  revisionType,
  progress,
  stage,
  isComplete: externalIsComplete,
  onAccept,
  onCancel,
  error,
}) {
  const [phase, setPhase] = useState('analyzing')
  const [writingComplete, setWritingComplete] = useState(false)

  // Determine phase based on progress
  useEffect(() => {
    if (error) {
      setPhase('error')
    } else if (revisedContent && !externalIsComplete) {
      setPhase('writing')
    } else if (externalIsComplete) {
      setPhase('complete')
    } else if (progress > 5) {
      setPhase('processing')
    } else {
      setPhase('analyzing')
    }
  }, [progress, revisedContent, externalIsComplete, error])

  const handleWritingComplete = useCallback(() => {
    setWritingComplete(true)
    setPhase('complete')
  }, [])

  const strategy = STRATEGY_INFO[revisionType] || STRATEGY_INFO.custom

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              phase === 'complete'
                ? 'bg-green-100'
                : phase === 'error'
                  ? 'bg-red-100'
                  : `bg-gradient-to-br from-${strategy.color}-500 to-${strategy.color}-600`
            }`}>
              {phase === 'complete' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : phase === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <motion.div
                  animate={{ rotate: phase === 'processing' ? 360 : 0 }}
                  transition={{ duration: 2, repeat: phase === 'processing' ? Infinity : 0, ease: 'linear' }}
                >
                  <strategy.icon className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {phase === 'analyzing' && strategy.name}
                {phase === 'processing' && 'Generating Revision'}
                {phase === 'writing' && 'Writing New Version'}
                {phase === 'complete' && 'Revision Complete'}
                {phase === 'error' && 'Revision Failed'}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-1">
                {articleTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Phase dots */}
            <div className="flex items-center gap-1">
              {['analyzing', 'processing', 'writing', 'complete'].map((p, i) => (
                <div
                  key={p}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    p === phase
                      ? 'bg-blue-500 w-4'
                      : ['analyzing', 'processing', 'writing', 'complete'].indexOf(phase) > i
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {phase !== 'complete' && phase !== 'error' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Original */}
          <div className="w-1/2 border-r flex flex-col bg-gray-50/50">
            <ArticlePreview
              content={originalContent}
              title="Original Content"
              dimmed={phase !== 'complete'}
            />
          </div>

          {/* Right - Animation/Revised */}
          <div className="w-1/2 flex flex-col bg-white">
            <div className={`flex items-center gap-2 px-6 py-3 border-b bg-gradient-to-r from-${strategy.color}-50 to-${strategy.color}-100/50`}>
              <Sparkles className={`w-4 h-4 text-${strategy.color}-600`} />
              <span className={`text-sm font-medium text-${strategy.color}-900`}>
                {phase === 'complete' ? 'New Version' : 'AI Revision'}
              </span>
              {phase === 'writing' && (
                <Badge className="ml-auto bg-blue-500 text-white animate-pulse">
                  Live
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {phase === 'analyzing' && (
                <AnalyzingPhase
                  revisionType={revisionType}
                  articleTitle={articleTitle}
                />
              )}

              {phase === 'processing' && (
                <ProcessingPhase progress={progress} stage={stage} />
              )}

              {phase === 'error' && (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Revision Failed</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">{error}</p>
                  <Button variant="outline" onClick={onCancel}>
                    Close
                  </Button>
                </div>
              )}

              {(phase === 'writing' || phase === 'complete') && revisedContent && (
                <div className="h-full">
                  {phase === 'writing' && !writingComplete ? (
                    <TypingReveal
                      htmlContent={revisedContent}
                      onComplete={handleWritingComplete}
                      speed="normal"
                    />
                  ) : (
                    <ScrollArea className="h-full">
                      <div
                        className="p-6 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: revisedContent }}
                      />
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white flex items-center justify-between"
          >
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                New version created
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
              <Button
                onClick={onAccept}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 gap-2"
              >
                <Check className="w-4 h-4" />
                View New Version
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
