import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play, Pause, RotateCcw, Coffee, Brain, Plus, Trash2, X,
    ChevronDown, Clock, Settings, SkipForward, AlertCircle, Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipPortal,
} from './ui/tooltip'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover'
import { Input } from './ui/input'
import { Button } from './ui/button'
import * as ReactDOM from 'react-dom'

const SESSION_TYPES = {
    WORK: { type: 'work', label: 'Work', color: '#3B82F6', defaultMinutes: 25, icon: Brain },
    SHORT_BREAK: { type: 'short', label: 'Short Break', color: '#10B981', defaultMinutes: 5, icon: Coffee },
    LONG_BREAK: { type: 'long', label: 'Long Break', color: '#8B5CF6', defaultMinutes: 15, icon: Coffee },
}

// Error Toast Portal
function ErrorToast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return ReactDOM.createPortal(
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white shadow-xl"
            style={{ boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' }}
        >
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{message}</span>
        </motion.div>,
        document.body
    )
}

// Sticky Timer Component
export function StickyTimer({
    currentSession,
    timeLeft,
    isRunning,
    onStart,
    onPause,
    onSkip,
    onReset,
    collapsed = false
}) {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

    const totalTime = currentSession ? currentSession.minutes * 60 : 25 * 60
    const progress = currentSession ? 1 - (timeLeft / totalTime) : 0
    const circumference = 2 * Math.PI * (collapsed ? 18 : 32)
    const strokeDashoffset = circumference * (1 - progress)

    const sessionColor = currentSession?.color || '#3B82F6'
    const Icon = currentSession?.type === 'work' ? Brain : Coffee
    const displayName = currentSession?.linkedTask?.title || currentSession?.customLabel || currentSession?.label || 'No session'

    // Collapsed view
    if (collapsed) {
        return (
            <div className="flex flex-col items-center py-3 w-full">
                <div className="relative">
                    <svg width="44" height="44" className="transform -rotate-90">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-background-tertiary" />
                        <motion.circle
                            cx="22" cy="22" r="18" fill="none" stroke={sessionColor} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={circumference} style={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-4 w-4" style={{ color: sessionColor }} />
                    </div>
                </div>
                <span className="text-[10px] font-mono text-text-muted mt-1">{timeString}</span>
            </div>
        )
    }

    // Expanded view
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 pb-5 border-b border-border mb-2"
        >
            {/* Session name - BIGGER and BOLDER */}
            <p className="text-base font-semibold text-text-primary text-center mb-3 truncate px-2">
                {displayName}
            </p>

            <div className="flex flex-col items-center">
                {/* Timer ring */}
                <div className="relative">
                    <svg width="80" height="80" className="transform -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="4" className="text-background-tertiary" />
                        <motion.circle
                            cx="40" cy="40" r="32" fill="none" stroke={sessionColor} strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={circumference}
                            style={{ strokeDashoffset: circumference, filter: `drop-shadow(0 0 6px ${sessionColor}40)` }}
                            animate={{ strokeDashoffset }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Icon className="h-4 w-4 mb-0.5" style={{ color: sessionColor }} />
                        <span className="text-sm font-bold tabular-nums text-text-primary">{timeString}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 mt-3">
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={isRunning ? onPause : onStart}
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${sessionColor}20`, color: sessionColor }}
                            >
                                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </motion.button>
                        </TooltipTrigger>
                        <TooltipPortal><TooltipContent className="z-[100]">{isRunning ? 'Pause' : 'Start'}</TooltipContent></TooltipPortal>
                    </Tooltip>

                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={onSkip}
                                className="p-2 rounded-lg bg-background-tertiary text-text-muted hover:text-text-primary"
                            >
                                <SkipForward className="h-4 w-4" />
                            </motion.button>
                        </TooltipTrigger>
                        <TooltipPortal><TooltipContent className="z-[100]">Skip to next</TooltipContent></TooltipPortal>
                    </Tooltip>

                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={onReset}
                                className="p-2 rounded-lg bg-background-tertiary text-text-muted hover:text-text-primary"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </motion.button>
                        </TooltipTrigger>
                        <TooltipPortal><TooltipContent className="z-[100]">Reset timer</TooltipContent></TooltipPortal>
                    </Tooltip>
                </div>
            </div>
        </motion.div>
    )
}

// Session Planner - Cleaner design with task linking
export function SessionPlanner({ className, onSessionsChange, onStartSequence, tasks = [], onUpdateTask }) {
    const [sessions, setSessions] = useState([])
    const [isExpanded, setIsExpanded] = useState(true)
    const [customDurations, setCustomDurations] = useState({ work: 25, short: 5, long: 15 })
    const [errorMessage, setErrorMessage] = useState('')

    const showError = (msg) => setErrorMessage(msg)
    const clearError = () => setErrorMessage('')

    const handleDurationChange = (type, value) => {
        if (value <= 0) { showError("Can't be zero"); return false }
        if (value > 90) { showError("Max 90 min"); return false }
        setCustomDurations(prev => ({ ...prev, [type]: value }))
        return true
    }

    const addSession = (typeKey) => {
        const config = SESSION_TYPES[typeKey]
        const duration = customDurations[config.type] || config.defaultMinutes
        const workCount = sessions.filter(s => s.type === 'work').length + 1

        setSessions(prev => [...prev, {
            id: Date.now(),
            type: config.type,
            label: config.type === 'work' ? `Work #${workCount}` : config.label,
            minutes: duration,
            color: config.color,
            linkedTask: null,
        }])
    }

    const removeSession = (id) => {
        const sessionToRemove = sessions.find(s => s.id === id)
        const nextSessions = sessions.filter(s => s.id !== id)
        setSessions(nextSessions)

        // Sync task target if session was linked
        if (sessionToRemove?.linkedTask && onUpdateTask) {
            const taskId = sessionToRemove.linkedTask.id
            const count = nextSessions.filter(s => s.linkedTask?.id === taskId).length
            onUpdateTask(taskId, { pomo_target: count })
        }
    }

    const updateSession = (id, updates) => {
        const prevSession = sessions.find(s => s.id === id)
        const nextSessions = sessions.map(s => s.id === id ? { ...s, ...updates } : s)
        setSessions(nextSessions)

        // If linked task changed, sync targets
        if (updates.linkedTask !== undefined && onUpdateTask) {
            // 1. If it was previously linked to a task, update that task
            if (prevSession?.linkedTask && prevSession.linkedTask.id !== updates.linkedTask?.id) {
                const prevTaskId = prevSession.linkedTask.id
                const prevCount = nextSessions.filter(s => s.linkedTask?.id === prevTaskId).length
                onUpdateTask(prevTaskId, { pomo_target: prevCount })
            }

            // 2. If it is now linked to a task, update that task
            if (updates.linkedTask) {
                const newTaskId = updates.linkedTask.id
                const newCount = nextSessions.filter(s => s.linkedTask?.id === newTaskId).length
                onUpdateTask(newTaskId, { pomo_target: newCount })
            }
        }
    }

    useEffect(() => { onSessionsChange?.(sessions) }, [sessions, onSessionsChange])

    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60

    return (
        <>
            <AnimatePresence>{errorMessage && <ErrorToast message={errorMessage} onClose={clearError} />}</AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={cn('glass rounded-xl overflow-hidden', className)}
            >
                {/* Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-3 hover:bg-background-tertiary/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-text-primary">Sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {sessions.length > 0 && (
                            <span className="text-xs text-text-muted">
                                {sessions.length} • {hours > 0 ? `${hours}h ` : ''}{mins}m
                            </span>
                        )}
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="h-4 w-4 text-text-muted" />
                        </motion.div>
                    </div>
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {/* Quick add buttons - Simplified */}
                            <div className="flex justify-center gap-2 px-3 pb-3">
                                <QuickAddButton type="WORK" duration={customDurations.work} onAdd={() => addSession('WORK')} />
                                <QuickAddButton type="SHORT_BREAK" duration={customDurations.short} onAdd={() => addSession('SHORT_BREAK')} />
                                <QuickAddButton type="LONG_BREAK" duration={customDurations.long} onAdd={() => addSession('LONG_BREAK')} />
                            </div>

                            {/* Sessions list - Cleaner vertical layout */}
                            <div className="px-3 pb-3 space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {sessions.length === 0 ? (
                                        <motion.p
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="text-xs text-text-muted text-center py-4"
                                        >
                                            Click a button to add sessions
                                        </motion.p>
                                    ) : (
                                        sessions.map((session) => (
                                            <SessionCard
                                                key={session.id}
                                                session={session}
                                                tasks={tasks}
                                                onRemove={() => removeSession(session.id)}
                                                onUpdate={(updates) => updateSession(session.id, updates)}
                                                onError={showError}
                                            />
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Start button */}
                            {sessions.length > 0 && (
                                <div className="px-3 pb-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => onStartSequence?.(sessions)}
                                        className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium flex items-center justify-center gap-2"
                                        style={{ boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)' }}
                                    >
                                        <Play className="h-4 w-4" />
                                        Start Sequence
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    )
}

// Quick add button - Simple and clean
function QuickAddButton({ type, duration, onAdd }) {
    const config = SESSION_TYPES[type]
    const Icon = config.icon

    const colorClasses = {
        WORK: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
        SHORT_BREAK: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
        LONG_BREAK: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
    }

    return (
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onAdd}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", colorClasses[type])}
                >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{duration}m</span>
                </motion.button>
            </TooltipTrigger>
            <TooltipPortal>
                <TooltipContent className="z-[100]">Add {config.label.toLowerCase()}</TooltipContent>
            </TooltipPortal>
        </Tooltip>
    )
}

// Session Card - Cleaner card-based design with task linking
function SessionCard({ session, tasks, onRemove, onUpdate, onError }) {
    const [editingDuration, setEditingDuration] = useState(false)
    const [editingLabel, setEditingLabel] = useState(false)
    const [durationValue, setDurationValue] = useState(String(session.minutes))
    const [labelValue, setLabelValue] = useState(session.customLabel || session.label)
    const [showTaskPicker, setShowTaskPicker] = useState(false)

    const Icon = session.type === 'work' ? Brain : Coffee

    const saveDuration = () => {
        const numValue = parseInt(durationValue)
        if (!numValue || numValue <= 0) {
            onError?.("Can't be zero")
            setDurationValue('25')
            onUpdate({ minutes: 25 })
        } else if (numValue > 90) {
            onError?.("Max 90 min")
            setDurationValue('25')
            onUpdate({ minutes: 25 })
        } else {
            onUpdate({ minutes: numValue })
        }
        setEditingDuration(false)
    }

    const saveLabel = () => {
        if (labelValue.trim()) {
            onUpdate({ customLabel: labelValue })
        } else {
            setLabelValue(session.label)
            onUpdate({ customLabel: undefined })
        }
        setEditingLabel(false)
    }

    const linkTask = (task) => {
        onUpdate({ linkedTask: task })
        setShowTaskPicker(false)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative p-3 rounded-lg border border-border/50 bg-background-secondary/50"
        >
            {/* Top row: Type icon, label/task, duration, remove */}
            <div className="flex items-center gap-2">
                {/* Type indicator */}
                <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${session.color}20` }}
                >
                    <Icon className="h-4 w-4" style={{ color: session.color }} />
                </div>

                {/* Label or linked task */}
                <div className="flex-1 min-w-0">
                    {session.linkedTask ? (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-text-primary truncate">{session.linkedTask.title}</span>
                            <button
                                onClick={() => onUpdate({ linkedTask: null })}
                                className="p-0.5 rounded text-text-muted hover:text-red-400"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : editingLabel ? (
                        <input
                            type="text"
                            value={labelValue}
                            onChange={(e) => setLabelValue(e.target.value)}
                            onBlur={saveLabel}
                            onKeyDown={(e) => e.key === 'Enter' && saveLabel()}
                            autoFocus
                            className="w-full text-sm bg-transparent text-text-primary focus:outline-none placeholder:text-text-muted"
                            placeholder="Session name"
                        />
                    ) : (
                        <span
                            onClick={() => setEditingLabel(true)}
                            className="text-sm text-text-muted hover:text-text-primary cursor-text truncate block transition-colors"
                            title="Click to rename"
                        >
                            {session.customLabel || session.label}
                        </span>
                    )}
                </div>

                {/* Duration */}
                {editingDuration ? (
                    <input
                        type="number" min={1} max={90} value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                        onBlur={saveDuration}
                        onKeyDown={(e) => e.key === 'Enter' && saveDuration()}
                        autoFocus
                        className="w-12 h-6 text-xs bg-background-tertiary text-text-primary text-center rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                ) : (
                    <button
                        onClick={() => setEditingDuration(true)}
                        className="text-xs font-medium text-text-muted hover:text-accent px-2 py-1 rounded bg-background-tertiary/50"
                    >
                        {session.minutes}m
                    </button>
                )}

                {/* Remove button */}
                <button
                    onClick={onRemove}
                    className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Task linking - Only for work sessions */}
            {session.type === 'work' && !session.linkedTask && (
                <div className="mt-2 pt-2 border-t border-border/30">
                    <Popover open={showTaskPicker} onOpenChange={setShowTaskPicker}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors">
                                <Link2 className="h-3 w-3" />
                                <span>Link to task</span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 z-[100]" align="start" side="top">
                            <p className="text-xs text-text-muted mb-2 px-1">Select a task:</p>
                            <div className="max-h-[150px] overflow-y-auto space-y-1">
                                {tasks.length === 0 ? (
                                    <p className="text-xs text-text-muted text-center py-2">No tasks available</p>
                                ) : (
                                    tasks.filter(t => !t.is_completed).slice(0, 10).map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => linkTask(task)}
                                            className="w-full text-left px-2 py-1.5 text-xs text-text-primary rounded hover:bg-background-tertiary truncate"
                                        >
                                            {task.title}
                                        </button>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </motion.div>
    )
}

export { SESSION_TYPES }
