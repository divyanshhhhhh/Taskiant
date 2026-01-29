import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock, Flame, Plus, Timer } from 'lucide-react'
import { TaskList } from './TaskList'
import { Calendar } from './Calendar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

// Format date for display
const formatDisplayDate = (dateStr) => {
    const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })
}

// Get greeting based on time of day
const getGreetingForDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0]

    if (dateStr && dateStr !== today) {
        // If viewing a different date, show the date context
        const date = new Date(dateStr + 'T00:00:00')
        const now = new Date()
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return 'Tomorrow\'s focus'
        if (diffDays === -1) return 'Yesterday\'s tasks'
        if (diffDays > 1) return `Upcoming: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        if (diffDays < -1) return `Past: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }

    // Today - show time-based greeting
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

export function Dashboard({
    tasks,
    stats,
    selectedDate,
    onSelectDate,
    onToggleTask,
    onCreateTask,
    onUpdateTask,
    onDeleteTask,
    onRefresh
}) {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [filter, setFilter] = useState('all') // 'all', 'completed', 'remaining'

    const today = new Date().toISOString().split('T')[0]
    const displayDate = selectedDate || today
    const dateString = formatDisplayDate(displayDate)
    const greeting = getGreetingForDate(displayDate)
    const isToday = displayDate === today
    const isPastDate = displayDate < today

    const handleAddTask = async (e) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        await onCreateTask({
            title: newTaskTitle,
            due_date: displayDate, // Use selected date for new tasks
            priority: 4,
        })

        setNewTaskTitle('')
        setIsAddingTask(false)
        onRefresh()
    }

    // Handle calendar date selection
    const handleDateSelect = (date) => {
        onSelectDate?.(date)
    }

    // Go back to today
    const goToToday = () => {
        onSelectDate?.(today)
    }

    const completionRate = stats.todayTotal > 0
        ? Math.round((stats.todayCompleted / stats.todayTotal) * 100)
        : 0

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-8 py-6 border-b border-border relative z-10"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-text-primary">
                                {greeting} {isToday ? '👋' : '📅'}
                            </h1>
                            {!isToday && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={goToToday}
                                    className="px-3 py-1 text-xs rounded-lg bg-accent text-white font-medium"
                                >
                                    Back to Today
                                </motion.button>
                            )}
                        </div>
                        <p className="text-text-secondary mt-1 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {dateString}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex gap-4"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="text-center px-4 py-2 rounded-xl bg-background-tertiary cursor-pointer"
                                onClick={() => setShowCalendar(!showCalendar)}
                            >
                                <div className="flex items-center gap-1 text-accent">
                                    <CalendarDays className="h-4 w-4" />
                                    <span className="text-lg font-bold">📅</span>
                                </div>
                                <span className="text-xs text-text-muted">Calendar</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`text-center px-4 py-2 rounded-xl cursor-pointer transition-colors ${filter === 'completed' ? 'bg-accent/20 ring-1 ring-accent' : 'bg-background-tertiary'}`}
                                onClick={() => setFilter('completed')}
                            >
                                <div className="flex items-center gap-1 text-accent">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-lg font-bold">{stats.todayCompleted}</span>
                                </div>
                                <span className="text-xs text-text-muted">Completed</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`text-center px-4 py-2 rounded-xl cursor-pointer transition-colors ${filter === 'remaining' ? 'bg-priority-2/20 ring-1 ring-priority-2' : 'bg-background-tertiary'}`}
                                onClick={() => setFilter('remaining')}
                            >
                                <div className="flex items-center gap-1 text-priority-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-lg font-bold">{stats.todayTotal - stats.todayCompleted}</span>
                                </div>
                                <span className="text-xs text-text-muted">Remaining</span>
                            </motion.div>

                            {stats.pomosToday > 0 && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="text-center px-4 py-2 rounded-xl bg-red-500/10"
                                >
                                    <div className="flex items-center gap-1 text-red-400">
                                        <Timer className="h-4 w-4" />
                                        <span className="text-lg font-bold">{stats.pomosToday}</span>
                                    </div>
                                    <span className="text-xs text-text-muted">Pomodoros</span>
                                </motion.div>
                            )}

                            {completionRate >= 50 && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="text-center px-4 py-2 rounded-xl bg-success/10"
                                >
                                    <div className="flex items-center gap-1 text-success">
                                        <Flame className="h-4 w-4" />
                                        <span className="text-lg font-bold">{completionRate}%</span>
                                    </div>
                                    <span className="text-xs text-text-muted">Progress</span>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Show All Reset Button */}
                        <AnimatePresence>
                            {filter !== 'all' && (
                                <motion.button
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onClick={() => setFilter('all')}
                                    className="text-xs text-text-muted hover:text-text-primary underline flex items-center gap-1 bg-background-tertiary px-3 py-1 rounded-full"
                                >
                                    Show All Tasks ✕
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.header>

            {/* Main content */}
            <div className="flex-1 overflow-auto px-8 py-6 relative z-10">
                <div className="flex gap-6">
                    {/* Tasks column */}
                    <div className="flex-1">
                        {/* Quick add - hide when filtering completed */}
                        {filter !== 'completed' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mb-6"
                            >
                                {isAddingTask ? (
                                    <form onSubmit={handleAddTask} className="flex gap-2">
                                        <Input
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder={isToday ? "What do you want to accomplish today?" : `Add task for ${formatDisplayDate(displayDate)}`}
                                            autoFocus
                                            className="flex-1"
                                        />
                                        <Button type="submit">Add</Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsAddingTask(false)
                                                setNewTaskTitle('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </form>
                                ) : isPastDate ? (
                                    <div className="flex items-center gap-2 h-12 px-4 rounded-lg bg-background-tertiary/30 border border-border/50 text-text-muted cursor-not-allowed">
                                        <CalendarDays className="h-5 w-5" />
                                        <span className="text-sm">Past dates are view-only</span>
                                    </div>
                                ) : (
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 h-12 text-text-muted hover:text-text-primary"
                                            onClick={() => setIsAddingTask(true)}
                                        >
                                            <Plus className="h-5 w-5" />
                                            {isToday ? 'Add a task for today' : `Add a task for ${formatDisplayDate(displayDate)}`}
                                        </Button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* Task sections */}
                        {tasks.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-center py-16"
                            >
                                <div className="text-6xl mb-4">{isToday ? '🎯' : '📭'}</div>
                                <h3 className="text-xl font-semibold text-text-primary mb-2">
                                    No tasks for {isToday ? 'today' : 'this day'}
                                </h3>
                                <p className="text-text-secondary max-w-md mx-auto">
                                    {isToday
                                        ? "Your daily focus is clear! Add a new task or enjoy your free time."
                                        : isPastDate
                                            ? "No tasks were scheduled for this date."
                                            : "No tasks scheduled for this date. Add a task or select another day."
                                    }
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                {/* Priority sections */}
                                {[1, 2, 3, 4].map((priority) => {
                                    const priorityTasks = tasks.filter(t => {
                                        // Base filter: match priority and be a root task
                                        const matchesBase = t.priority === priority && t.depth === 0
                                        if (!matchesBase) return false

                                        // Apply completed/remaining filter
                                        if (filter === 'completed') return t.is_completed === 1
                                        if (filter === 'remaining') return t.is_completed === 0
                                        return true
                                    })

                                    if (priorityTasks.length === 0) return null

                                    const labels = ['Urgent', 'High', 'Medium', 'Low']
                                    const variants = ['priority1', 'priority2', 'priority3', 'priority4']

                                    return (
                                        <motion.div
                                            key={priority}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: priority * 0.1 }}
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant={variants[priority - 1]}>
                                                    {labels[priority - 1]}
                                                </Badge>
                                                <span className="text-xs text-text-muted">
                                                    {priorityTasks.filter(t => t.is_completed).length}/{priorityTasks.length} completed
                                                </span>
                                            </div>

                                            <TaskList
                                                tasks={priorityTasks}
                                                allTasks={tasks}
                                                onToggle={onToggleTask}
                                                onUpdate={onUpdateTask}
                                                onDelete={onDeleteTask}
                                                onAddSubtask={onCreateTask}
                                                onRefresh={onRefresh}
                                            />
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Calendar */}
                    <AnimatePresence mode="wait">
                        {showCalendar && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="w-80 flex-shrink-0"
                            >
                                <Calendar
                                    selectedDate={displayDate}
                                    onSelectDate={handleDateSelect}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
