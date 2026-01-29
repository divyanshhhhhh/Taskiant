import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Brain, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIMER_MODES = {
    WORK: 'work',
    SHORT_BREAK: 'short',
    LONG_BREAK: 'long',
}

const MODE_CONFIG = {
    [TIMER_MODES.WORK]: { label: 'Focus', color: '#3B82F6', defaultMinutes: 25 },
    [TIMER_MODES.SHORT_BREAK]: { label: 'Short Break', color: '#10B981', defaultMinutes: 5 },
    [TIMER_MODES.LONG_BREAK]: { label: 'Long Break', color: '#8B5CF6', defaultMinutes: 15 },
}

export function PomodoroTimer({ task, onComplete, onCancel, className }) {
    const [mode, setMode] = useState(TIMER_MODES.WORK)
    const [isRunning, setIsRunning] = useState(false)
    const [timeLeft, setTimeLeft] = useState(MODE_CONFIG[TIMER_MODES.WORK].defaultMinutes * 60)
    const [totalTime, setTotalTime] = useState(MODE_CONFIG[TIMER_MODES.WORK].defaultMinutes * 60)
    const [sessionId, setSessionId] = useState(null)
    const [completedPomos, setCompletedPomos] = useState(0)
    const intervalRef = useRef(null)

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            if (window.electronAPI) {
                const settings = await window.electronAPI.getSettings()
                const workMinutes = parseInt(settings.pomo_work) || 25
                const breakMinutes = parseInt(settings.pomo_break) || 5

                MODE_CONFIG[TIMER_MODES.WORK].defaultMinutes = workMinutes
                MODE_CONFIG[TIMER_MODES.SHORT_BREAK].defaultMinutes = breakMinutes

                if (mode === TIMER_MODES.WORK) {
                    setTimeLeft(workMinutes * 60)
                    setTotalTime(workMinutes * 60)
                }
            }
        }
        loadSettings()
    }, [])

    // Timer countdown
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(intervalRef.current)
    }, [isRunning])

    const handleTimerComplete = useCallback(async () => {
        setIsRunning(false)
        clearInterval(intervalRef.current)

        if (mode === TIMER_MODES.WORK && sessionId && window.electronAPI) {
            await window.electronAPI.completePomodoro(sessionId)
            const newCount = completedPomos + 1
            setCompletedPomos(newCount)
            setSessionId(null)

            // Send notification with task name and session number
            await window.electronAPI.notifyPomodoro({
                taskTitle: task?.title || 'Task',
                sessionNumber: newCount,
                type: 'work'
            })

            onComplete?.()

            // Auto-switch to break
            const nextMode = newCount % 4 === 0
                ? TIMER_MODES.LONG_BREAK
                : TIMER_MODES.SHORT_BREAK
            switchMode(nextMode)
        } else {
            // Break completed, notify and back to work
            await window.electronAPI?.notifyPomodoro({
                taskTitle: task?.title || 'Task',
                sessionNumber: completedPomos,
                type: mode === TIMER_MODES.LONG_BREAK ? 'long' : 'short'
            })
            switchMode(TIMER_MODES.WORK)
        }
    }, [mode, sessionId, completedPomos, onComplete, task])

    const switchMode = (newMode) => {
        setMode(newMode)
        const minutes = MODE_CONFIG[newMode].defaultMinutes
        setTimeLeft(minutes * 60)
        setTotalTime(minutes * 60)
        setIsRunning(false)
    }

    const startTimer = async () => {
        setIsRunning(true)

        if (mode === TIMER_MODES.WORK && task && window.electronAPI) {
            const session = await window.electronAPI.startPomodoro(task.id)
            setSessionId(session?.id)
        }
    }

    const pauseTimer = () => {
        setIsRunning(false)
    }

    const resetTimer = async () => {
        setIsRunning(false)
        clearInterval(intervalRef.current)

        if (sessionId && window.electronAPI) {
            await window.electronAPI.cancelPomodoro(sessionId)
            setSessionId(null)
        }

        setTimeLeft(totalTime)
    }

    const cancelSession = async () => {
        await resetTimer()
        onCancel?.()
    }

    // Format time
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

    // Progress for SVG ring
    const progress = 1 - (timeLeft / totalTime)
    const circumference = 2 * Math.PI * 120
    const strokeDashoffset = circumference * (1 - progress)

    const modeConfig = MODE_CONFIG[mode]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn('flex flex-col items-center gap-6', className)}
        >
            {/* Mode tabs */}
            <div className="flex gap-2 p-1 glass rounded-xl">
                {Object.entries(MODE_CONFIG).map(([key, config]) => (
                    <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !isRunning && switchMode(key)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            mode === key
                                ? 'bg-accent text-white'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                        )}
                    >
                        {config.label}
                    </motion.button>
                ))}
            </div>

            {/* Timer ring */}
            <div className="relative">
                <svg width="280" height="280" className="transform -rotate-90">
                    {/* Background ring */}
                    <circle
                        cx="140"
                        cy="140"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-background-tertiary"
                    />
                    {/* Progress ring */}
                    <motion.circle
                        cx="140"
                        cy="140"
                        r="120"
                        fill="none"
                        stroke={modeConfig.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 8px ${modeConfig.color}40)` }}
                    />
                </svg>

                {/* Timer display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        key={timeString}
                        initial={{ opacity: 0.8, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl font-bold text-text-primary tabular-nums"
                    >
                        {timeString}
                    </motion.span>
                    <span className="text-sm text-text-secondary mt-2 flex items-center gap-2">
                        {mode === TIMER_MODES.WORK ? (
                            <Brain className="h-4 w-4" />
                        ) : (
                            <Coffee className="h-4 w-4" />
                        )}
                        {modeConfig.label}
                    </span>
                </div>
            </div>

            {/* Task info */}
            {task && (
                <div className="text-center">
                    <p className="text-sm text-text-muted">Working on</p>
                    <p className="font-medium text-text-primary">{task.title}</p>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-text-secondary">
                        <span className="text-accent">{task.pomo_completed || 0}</span>
                        <span>/</span>
                        <span>{task.pomo_target || 1}</span>
                        <span>pomodoros</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetTimer}
                    className="p-3 rounded-xl bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
                >
                    <RotateCcw className="h-5 w-5" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRunning ? pauseTimer : startTimer}
                    className="p-5 rounded-2xl text-white shadow-lg transition-all"
                    style={{
                        backgroundColor: modeConfig.color,
                        boxShadow: `0 8px 32px ${modeConfig.color}40`
                    }}
                >
                    {isRunning ? (
                        <Pause className="h-8 w-8" />
                    ) : (
                        <Play className="h-8 w-8 ml-1" />
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={cancelSession}
                    className="p-3 rounded-xl bg-background-tertiary text-text-secondary hover:text-red-400 transition-colors"
                >
                    <X className="h-5 w-5" />
                </motion.button>
            </div>

            {/* Session counter */}
            <div className="flex items-center gap-2">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                        className={cn(
                            'w-3 h-3 rounded-full transition-colors',
                            i < (completedPomos % 4) ? 'bg-accent' : 'bg-background-tertiary'
                        )}
                    />
                ))}
                <span className="text-xs text-text-muted ml-2">
                    {completedPomos} completed today
                </span>
            </div>
        </motion.div>
    )
}

// Floating Pomodoro Button - shows on tasks
export function PomodoroButton({ onClick, className }) {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={cn(
                'p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors',
                className
            )}
            title="Start Pomodoro"
        >
            <Play className="h-4 w-4" />
        </motion.button>
    )
}
