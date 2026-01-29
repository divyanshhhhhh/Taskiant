import { useState, useRef, useCallback, forwardRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight, Calendar, Trash2, Pencil, StickyNote,
    MoreHorizontal, Flag, Clock, Sun, Copy, ChevronDown, Plus
} from 'lucide-react'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from './ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from './ui/tooltip'
import { cn, formatDate, getPriorityInfo } from '@/lib/utils'

// Use forwardRef to fix Framer Motion ref warning
const TaskItem = forwardRef(function TaskItem({
    task,
    subtasks = [],
    allTasks = [],
    index,
    onToggle,
    onUpdate,
    onDelete,
    onCreateSubtask,
    onRefresh,
    depth = 0
}, ref) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [isHovered, setIsHovered] = useState(false)
    const [justCompleted, setJustCompleted] = useState(false)
    const [showFullNotes, setShowFullNotes] = useState(false)
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notes, setNotes] = useState(task.notes || '')
    const notesTimeoutRef = useRef(null)

    const priorityInfo = getPriorityInfo(task.priority)
    const hasSubtasks = subtasks.length > 0
    const hasNotes = Boolean(notes?.trim())

    const handleToggle = async () => {
        const wasCompleted = task.is_completed

        if (!wasCompleted) {
            setJustCompleted(true)
            setTimeout(() => setJustCompleted(false), 600)
        }

        await onToggle(task.id)
    }

    const handleSaveEdit = async () => {
        if (editTitle.trim() && editTitle !== task.title) {
            await onUpdate(task.id, { title: editTitle })
        }
        setIsEditing(false)
    }

    const handlePriorityChange = async (priority) => {
        await onUpdate(task.id, { priority })
    }

    const handleDelete = async () => {
        await onDelete(task.id)
    }

    // Auto-save notes with debounce
    const handleNotesChange = useCallback((value) => {
        setNotes(value)

        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current)
        }

        notesTimeoutRef.current = setTimeout(async () => {
            if (window.electronAPI) {
                await window.electronAPI.updateTask(task.id, { notes: value })
            }
        }, 500)
    }, [task.id])

    const saveAndCloseNotes = () => {
        setIsEditingNotes(false)
        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current)
        }
        if (window.electronAPI) {
            window.electronAPI.updateTask(task.id, { notes })
        }
    }

    // Daily Focus Migration
    const handleMoveToToday = async () => {
        if (window.electronAPI) {
            await window.electronAPI.moveToToday(task.id)
            onRefresh?.()
        }
    }

    const handleCopyToToday = async () => {
        if (window.electronAPI) {
            await window.electronAPI.copyToToday(task.id)
            onRefresh?.()
        }
    }

    const handleAddSubtask = async () => {
        if (onCreateSubtask) {
            await onCreateSubtask({
                title: 'New subtask',
                parent_id: task.id,
                project_id: task.project_id,
                due_date: task.due_date,
                priority: 4,
            })
            setIsExpanded(true)
        }
    }

    // Get nested subtasks
    const getNestedSubtasks = (parentId) => {
        return allTasks?.filter(t => t.parent_id === parentId) || []
    }

    // Check if notes need truncation (more than 3 lines or > 150 chars)
    const notesTruncated = task.notes && task.notes.length > 150

    // Staggered entrance variants
    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.3,
                ease: 'easeOut'
            }
        }),
        exit: {
            opacity: 0,
            x: 20,
            height: 0,
            transition: { duration: 0.2 }
        }
    }

    return (
        <motion.div
            ref={ref}
            layout
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ marginLeft: depth * 24 }}
        >
            <motion.div
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className={cn(
                    "group flex items-start gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-background-tertiary",
                    task.is_completed && "opacity-60"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Expand/collapse for subtasks */}
                <div className="w-5 flex items-center justify-center mt-0.5">
                    {hasSubtasks ? (
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <motion.button
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-0.5 hover:bg-background-secondary rounded transition-transform"
                                >
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                                    >
                                        <ChevronRight className="h-4 w-4 text-text-muted" />
                                    </motion.div>
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent>{isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="w-4" />
                    )}
                </div>

                {/* Checkbox */}
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Checkbox
                                checked={task.is_completed === 1}
                                onCheckedChange={handleToggle}
                                className="mt-0.5"
                            />
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>{task.is_completed ? 'Mark incomplete' : 'Mark complete'}</TooltipContent>
                </Tooltip>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit()
                                if (e.key === 'Escape') {
                                    setEditTitle(task.title)
                                    setIsEditing(false)
                                }
                            }}
                            autoFocus
                            className="h-7 text-sm"
                        />
                    ) : (
                        <>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className="relative text-sm cursor-text"
                                    onDoubleClick={() => setIsEditing(true)}
                                >
                                    <span className={cn(
                                        "transition-colors duration-300",
                                        task.is_completed ? "text-text-muted" : "text-text-primary"
                                    )}>
                                        {task.title}
                                    </span>

                                    {/* Animated strike-through line */}
                                    <motion.span
                                        className="absolute left-0 top-1/2 h-[1.5px] bg-text-muted origin-left"
                                        initial={{ width: task.is_completed ? '100%' : '0%' }}
                                        animate={{ width: task.is_completed ? '100%' : '0%' }}
                                        transition={{ duration: justCompleted ? 0.4 : 0, ease: 'easeOut' }}
                                    />
                                </span>

                                {task.project_name && (
                                    <span className="text-xs text-text-muted">
                                        {task.project_icon} {task.project_name}
                                    </span>
                                )}
                            </div>

                            {/* Notes display - formatted text, not textarea */}
                            {hasNotes && !isEditingNotes && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-1.5 pl-0.5"
                                >
                                    <p
                                        onClick={() => setShowFullNotes(!showFullNotes)}
                                        className={cn(
                                            "text-xs text-text-muted leading-relaxed cursor-pointer font-medium",
                                            "hover:text-text-secondary transition-colors",
                                            !showFullNotes && "line-clamp-3"
                                        )}
                                    >
                                        {notes}
                                    </p>

                                    {notes.length > 200 && !showFullNotes && (
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setShowFullNotes(true)
                                                    }}
                                                    className="h-5 px-1.5 text-text-muted hover:text-accent mt-0.5 rounded-sm"
                                                >
                                                    <span className="text-sm font-bold leading-none tracking-widest">...</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Show more</TooltipContent>
                                        </Tooltip>
                                    )}

                                    {showFullNotes && notes.length > 200 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowFullNotes(false)
                                            }}
                                            className="h-5 px-1.5 text-xs text-text-muted hover:text-accent mt-0.5"
                                        >
                                            Show less
                                        </Button>
                                    )}
                                </motion.div>
                            )}

                            {/* Notes editing mode */}
                            <AnimatePresence>
                                {isEditingNotes && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2"
                                    >
                                        <div className="relative">
                                            <textarea
                                                value={notes}
                                                onChange={(e) => {
                                                    if (e.target.value.length <= 1500) {
                                                        handleNotesChange(e.target.value)
                                                    }
                                                }}
                                                onBlur={saveAndCloseNotes}
                                                placeholder="Add notes (max ~250 words)..."
                                                autoFocus
                                                maxLength={1500}
                                                className={cn(
                                                    "w-full min-h-[80px] p-3 rounded-lg pr-2",
                                                    "bg-background-tertiary/50 border border-border/30",
                                                    "text-sm text-text-secondary placeholder:text-text-muted/50",
                                                    "focus:outline-none focus:ring-1 focus:ring-accent/50",
                                                    "resize-none custom-scrollbar leading-relaxed"
                                                )}
                                            />
                                            <div className="absolute bottom-2 right-2 text-[10px] text-text-muted/50 pointer-events-none">
                                                {notes.length}/1500
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}

                    {/* Meta info row */}
                    <div className="flex items-center gap-2 mt-1">
                        {task.due_date && (
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-xs text-text-muted">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(task.due_date)}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Due date</TooltipContent>
                            </Tooltip>
                        )}

                        {task.start_time && (
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-xs text-accent">
                                        <Clock className="h-3 w-3" />
                                        {task.start_time}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Scheduled time</TooltipContent>
                            </Tooltip>
                        )}

                        {task.priority !== 4 && (
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Badge variant={`priority${task.priority}`} className="text-[10px] px-1.5 py-0">
                                            P{task.priority}
                                        </Badge>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {task.priority === 1 ? 'Urgent' : task.priority === 2 ? 'High' : 'Medium'} Priority
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {task.pomo_target > 0 && (
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-xs text-text-muted">
                                        🍅 {task.pomo_completed || 0}/{task.pomo_target}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Pomodoro sessions: {task.pomo_completed || 0} of {task.pomo_target} completed</TooltipContent>
                            </Tooltip>
                        )}


                    </div>
                </div>

                {/* Actions - use modal={false} to fix dropdown disappearing */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                        >
                            <DropdownMenu modal={false}>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <MoreHorizontal className="h-4 w-4 text-text-muted" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Task actions</TooltipContent>
                                </Tooltip>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent align="end" sideOffset={5}>
                                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit title
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => setIsEditingNotes(true)}>
                                            <StickyNote className="h-4 w-4 mr-2" />
                                            {hasNotes ? 'Edit notes' : 'Add notes'}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={handleAddSubtask}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add subtask
                                        </DropdownMenuItem>

                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Flag className="h-4 w-4 mr-2" />
                                                Priority
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {[1, 2, 3, 4].map((p) => (
                                                        <DropdownMenuItem
                                                            key={p}
                                                            onClick={() => handlePriorityChange(p)}
                                                            className={task.priority === p ? 'bg-background-tertiary' : ''}
                                                        >
                                                            <span className={`priority-${p} mr-2`}>●</span>
                                                            Priority {p} ({p === 1 ? 'Urgent' : p === 2 ? 'High' : p === 3 ? 'Medium' : 'Low'})
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>

                                        <DropdownMenuSeparator />

                                        {/* Daily Focus Migration Options - Only show if not already today */}
                                        {task.due_date !== new Date().toISOString().split('T')[0] && (
                                            <>
                                                <DropdownMenuItem onClick={handleMoveToToday}>
                                                    <Sun className="h-4 w-4 mr-2" />
                                                    Move to Daily Focus
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={handleCopyToToday}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Copy to Daily Focus
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="text-priority-1 focus:text-priority-1"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenu>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Subtasks */}
            <AnimatePresence>
                {isExpanded && hasSubtasks && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {subtasks.map((subtask, subIndex) => (
                            <TaskItem
                                key={subtask.id}
                                task={subtask}
                                subtasks={getNestedSubtasks(subtask.id)}
                                allTasks={allTasks}
                                index={subIndex}
                                onToggle={onToggle}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onCreateSubtask={onCreateSubtask}
                                onRefresh={onRefresh}
                                depth={depth + 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
})

// Memoize for performance
export { TaskItem }
export default memo(TaskItem)
