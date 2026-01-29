import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

export function Calendar({ selectedDate, onSelectDate, className }) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [monthData, setMonthData] = useState({})
    const [direction, setDirection] = useState(0)

    // Load task counts for the month
    const loadMonthData = useCallback(async () => {
        if (!window.electronAPI) return

        const data = await window.electronAPI.getTasksForMonth(currentYear, currentMonth + 1)
        const dataMap = {}
        data.forEach(d => {
            dataMap[d.due_date] = {
                total: d.total_tasks,
                incomplete: d.incomplete_tasks,
                completed: d.completed_tasks,
            }
        })
        setMonthData(dataMap)
    }, [currentYear, currentMonth])

    useEffect(() => {
        loadMonthData()
    }, [loadMonthData])

    const goToPrevMonth = () => {
        setDirection(-1)
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const goToNextMonth = () => {
        setDirection(1)
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
        onSelectDate?.(today.toISOString().split('T')[0])
    }

    // Generate calendar days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    const today = new Date().toISOString().split('T')[0]

    const calendarDays = []

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i
        const prevMonth = currentMonth === 0 ? 12 : currentMonth
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        calendarDays.push({ day, dateStr, isCurrentMonth: false })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        calendarDays.push({ day, dateStr, isCurrentMonth: true })
    }

    // Next month days
    const remainingDays = 42 - calendarDays.length
    for (let day = 1; day <= remainingDays; day++) {
        const nextMonth = currentMonth === 11 ? 1 : currentMonth + 2
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
        const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        calendarDays.push({ day, dateStr, isCurrentMonth: false })
    }

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('glass rounded-2xl p-4', className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-accent" />
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.h3
                            key={`${currentYear}-${currentMonth}`}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            custom={direction}
                            transition={{ duration: 0.2 }}
                            className="font-semibold text-text-primary"
                        >
                            {MONTHS[currentMonth]} {currentYear}
                        </motion.h3>
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={goToToday}
                        className="px-3 py-1 text-xs rounded-lg bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors mr-2"
                    >
                        Today
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={goToPrevMonth}
                        className="p-1.5 rounded-lg bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={goToNextMonth}
                        className="p-1.5 rounded-lg bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </motion.button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-text-muted py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={`${currentYear}-${currentMonth}`}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    custom={direction}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-7 gap-1"
                >
                    {calendarDays.map(({ day, dateStr, isCurrentMonth }, index) => {
                        const dayData = monthData[dateStr]
                        const isToday = dateStr === today
                        const isSelected = dateStr === selectedDate
                        const hasIncompleteTasks = dayData?.incomplete > 0
                        const allComplete = dayData?.total > 0 && dayData?.incomplete === 0

                        return (
                            <motion.button
                                key={`${dateStr}-${index}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelectDate?.(dateStr)}
                                className={cn(
                                    'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all',
                                    !isCurrentMonth && 'text-text-muted opacity-40',
                                    isCurrentMonth && 'text-text-primary hover:bg-background-tertiary',
                                    isToday && 'bg-accent/20 text-accent font-semibold',
                                    isSelected && 'ring-2 ring-accent bg-accent/10',
                                    allComplete && 'shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                )}
                            >
                                <span>{day}</span>

                                {/* Yellow dot for incomplete tasks */}
                                <AnimatePresence>
                                    {hasIncompleteTasks && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                            className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400"
                                            style={{ boxShadow: '0 0 4px rgba(250, 204, 21, 0.5)' }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Green glow ring for all complete */}
                                {allComplete && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400"
                                        style={{ boxShadow: '0 0 4px rgba(16, 185, 129, 0.6)' }}
                                    />
                                )}
                            </motion.button>
                        )
                    })}
                </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span>Incomplete</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Complete</span>
                </div>
            </div>
        </motion.div>
    )
}
