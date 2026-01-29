import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Brain, ChevronDown, Check } from 'lucide-react'
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

export function SidebarPomodoro({ className }) {
    const [mode, setMode] = useState(TIMER_MODES.WORK)
    const [isRunning, setIsRunning] = useState(false)
    const [timeLeft, setTimeLeft] = useState(MODE_CONFIG[TIMER_MODES.WORK].defaultMinutes * 60)
    const [totalTime, setTotalTime] = useState(MODE_CONFIG[TIMER_MODES.WORK].defaultMinutes * 60)
    const [sessionId, setSessionId] = useState(null)
    const [completedPomos, setCompletedPomos] = useState(0)

    // Task Linking
    const [linkedTask, setLinkedTask] = useState(null)
    const [activeTasks, setActiveTasks] = useState([])
    const [showTaskDropdown, setShowTaskDropdown] = useState(false)

    const intervalRef = useRef(null)

    // Load settings and active tasks
    useEffect(() => {
        const loadData = async () => {
            if (window.electronAPI) {
                const settings = await window.electronAPI.getSettings()
                const workMinutes = parseInt(settings.pomo_work) || 25
                const breakMinutes = parseInt(settings.pomo_break) || 5

                MODE_CONFIG[TIMER_MODES.WORK].defaultMinutes = workMinutes
                MODE_CONFIG[TIMER_MODES.SHORT_BREAK].defaultMinutes = breakMinutes

                if (mode === TIMER_MODES.WORK && !isRunning) {
                    setTimeLeft(workMinutes * 60)
                    setTotalTime(workMinutes * 60)
                }

                // Load active tasks for linking
                const tasks = await window.electronAPI.getAllActiveTasks()
                setActiveTasks(tasks)
            }
        }
        loadData()
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

            // Send notification
            await window.electronAPI.notifyPomodoro({
                taskTitle: linkedTask?.title || 'Focus Session',
                sessionNumber: newCount,
                type: 'work'
            })

            // Auto-switch to break
            const nextMode = newCount % 4 === 0
                ? TIMER_MODES.LONG_BREAK
                : TIMER_MODES.SHORT_BREAK
            switchMode(nextMode)
        } else {
            // Break completed
            await window.electronAPI?.notifyPomodoro({
                taskTitle: linkedTask?.title || 'Focus Session',
                sessionNumber: completedPomos,
                type: mode === TIMER_MODES.LONG_BREAK ? 'long' : 'short'
            })
            switchMode(TIMER_MODES.WORK)
        }
    }, [mode, sessionId, completedPomos, linkedTask])

    const switchMode = (newMode) => {
        setMode(newMode)
        const minutes = MODE_CONFIG[newMode].defaultMinutes
        setTimeLeft(minutes * 60)
        setTotalTime(minutes * 60)
        setIsRunning(false)
    }

    const startTimer = async () => {
        setIsRunning(true)

        if (mode === TIMER_MODES.WORK && linkedTask && window.electronAPI) {
            const session = await window.electronAPI.startPomodoro(linkedTask.id)
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

    const selectTask = (task) => {
        setLinkedTask(task)
        setShowTaskDropdown(false)
    }

    // Format time
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

    // Progress for ring
    const progress = 1 - (timeLeft / totalTime)
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference * (1 - progress)

    const modeConfig = MODE_CONFIG[mode]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('p-4 glass rounded-xl', className)}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    {mode === TIMER_MODES.WORK ? <Brain className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                    {modeConfig.label}
                </h3>

                {/* Session dots */}
                <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'w-2 h-2 rounded-full transition-colors',
                                i < (completedPomos % 4) ? 'bg-accent' : 'bg-background-tertiary'
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Mini timer ring */}
            <div className="flex items-center justify-center mb-3">
                <div className="relative">
                    <svg width="100" height="100" className="transform -rotate-90">
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-background-tertiary"
                        />
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={modeConfig.color}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 6px ${modeConfig.color}40)` }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-text-primary tabular-nums">
                            {timeString}
                        </span>
                    </div>
                </div>
            </div>

            {/* Task Link Dropdown */}
            <div className="mb-3 relative">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                        "bg-background-tertiary/50 hover:bg-background-tertiary transition-colors",
                        "border border-border/30"
                    )}
                >
                    <span className={cn(
                        "truncate",
                        linkedTask ? "text-text-primary" : "text-text-muted"
                    )}>
                        {linkedTask ? linkedTask.title : 'Link to task...'}
                    </span>
                    <ChevronDown className={cn(
                        "h-4 w-4 text-text-muted transition-transform",
                        showTaskDropdown && "rotate-180"
                    )} />
                </motion.button>

                <AnimatePresence>
                    {showTaskDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-1 z-20 glass rounded-lg overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
                        >
                            <button
                                onClick={() => selectTask(null)}
                                className="w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-background-tertiary transition-colors flex items-center justify-between"
                            >
                                No task (free focus)
                                {!linkedTask && <Check className="h-3 w-3 text-accent" />}
                            </button>
                            {activeTasks.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => selectTask(task)}
                                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-background-tertiary transition-colors flex items-center justify-between"
                                >
                                    <span className="truncate">{task.title}</span>
                                    {linkedTask?.id === task.id && <Check className="h-3 w-3 text-accent" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetTimer}
                    className="p-2 rounded-lg bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
                >
                    <RotateCcw className="h-4 w-4" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRunning ? pauseTimer : startTimer}
                    className="p-3 rounded-xl text-white shadow-lg transition-all"
                    style={{
                        backgroundColor: modeConfig.color,
                        boxShadow: `0 4px 16px ${modeConfig.color}40`
                    }}
                >
                    {isRunning ? (
                        <Pause className="h-5 w-5" />
                    ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                    )}
                </motion.button>

                {/* Mode toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        const modes = Object.values(TIMER_MODES)
                        const currentIndex = modes.indexOf(mode)
                        const nextMode = modes[(currentIndex + 1) % modes.length]
                        switchMode(nextMode)
                    }}
                    className="p-2 rounded-lg bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
                >
                    {mode === TIMER_MODES.WORK ? <Coffee className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </motion.button>
            </div>

            {/* Completed count */}
            <p className="text-center text-xs text-text-muted mt-3">
                {completedPomos} pomodoros today
            </p>
        </motion.div>
    )
}
