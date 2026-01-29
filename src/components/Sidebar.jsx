import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home, Plus, ChevronLeft, ChevronRight,
    MoreHorizontal, Pencil, Trash2
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger
} from './ui/context-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipPortal,
} from './ui/tooltip'
import { SessionPlanner, StickyTimer } from './SessionPlanner'
import { cn } from '@/lib/utils'

const EMOJI_OPTIONS = ['📁', '📚', '💼', '🎯', '💡', '🚀', '⭐', '🔥', '📝', '🎨', '🔧', '📊', '🏠', '💻', '🎮', '🎵']

export function Sidebar({
    projects,
    tasks,
    selectedView,
    onSelectView,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    onUpdateTask,
    collapsed,
    onToggleCollapse
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [formData, setFormData] = useState({ name: '', icon: '📁' })

    // Pomodoro timer state
    const [sessions, setSessions] = useState([])
    const [currentSessionIndex, setCurrentSessionIndex] = useState(-1)
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)
    const timerRef = useRef(null)

    const currentSession = currentSessionIndex >= 0 ? sessions[currentSessionIndex] : null

    // Timer logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Session complete
                        clearInterval(timerRef.current)
                        handleSessionComplete()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(timerRef.current)
    }, [isRunning])

    const handleSessionComplete = () => {
        setIsRunning(false)

        // Send notification
        if (window.electronAPI) {
            const session = sessions[currentSessionIndex]
            window.electronAPI.sendNotification(
                'Session Complete!',
                `${session?.customLabel || session?.label || 'Session'} finished`
            )

            // Update task completion count if linked
            if (session?.linkedTask && onUpdateTask) {
                onUpdateTask(session.linkedTask.id, {
                    pomo_completed: (session.linkedTask.pomo_completed || 0) + 1
                })
            }
        }

        // Auto-advance to next session
        if (currentSessionIndex < sessions.length - 1) {
            const nextIndex = currentSessionIndex + 1
            setCurrentSessionIndex(nextIndex)
            setTimeLeft(sessions[nextIndex].minutes * 60)
        }
    }

    const handleStartTimer = () => {
        if (currentSessionIndex < 0 && sessions.length > 0) {
            setCurrentSessionIndex(0)
            setTimeLeft(sessions[0].minutes * 60)
        }
        setIsRunning(true)
    }

    const handlePauseTimer = () => {
        setIsRunning(false)
    }

    const handleSkipSession = () => {
        setIsRunning(false)
        if (currentSessionIndex < sessions.length - 1) {
            const nextIndex = currentSessionIndex + 1
            setCurrentSessionIndex(nextIndex)
            setTimeLeft(sessions[nextIndex].minutes * 60)
        }
    }

    const handleResetTimer = () => {
        setIsRunning(false)
        if (currentSession) {
            setTimeLeft(currentSession.minutes * 60)
        }
    }

    const handleStartSequence = useCallback((newSessions) => {
        setSessions(newSessions)
        if (newSessions.length > 0) {
            setCurrentSessionIndex(0)
            setTimeLeft(newSessions[0].minutes * 60)
            setIsRunning(true)
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        if (editingProject) {
            await onUpdateProject(editingProject.id, formData)
        } else {
            await onCreateProject(formData)
        }

        setIsDialogOpen(false)
        setEditingProject(null)
        setFormData({ name: '', icon: '📁' })
    }

    const handleEdit = (project) => {
        setEditingProject(project)
        setFormData({ name: project.name, icon: project.icon })
        setIsDialogOpen(true)
    }

    const handleDelete = async (project) => {
        if (confirm(`Delete "${project.name}" and all its tasks?`)) {
            await onDeleteProject(project.id)
            if (selectedView?.type === 'project' && selectedView?.id === project.id) {
                onSelectView({ type: 'today' })
            }
        }
    }

    const openNewDialog = () => {
        setEditingProject(null)
        setFormData({ name: '', icon: '📁' })
        setIsDialogOpen(true)
    }

    return (
        <>
            <motion.aside
                animate={{ width: collapsed ? 60 : 260 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="h-full bg-background-secondary border-r border-border flex flex-col"
            >
                {/* Collapse toggle */}
                <div className="p-2 flex justify-end">
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={onToggleCollapse}
                            >
                                {collapsed ? (
                                    <ChevronRight className="h-4 w-4 text-text-secondary" />
                                ) : (
                                    <ChevronLeft className="h-4 w-4 text-text-secondary" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipPortal>
                            <TooltipContent side="right" className="z-[100]">
                                {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            </TooltipContent>
                        </TooltipPortal>
                    </Tooltip>
                </div>

                {/* Sticky Timer - Always visible */}
                <StickyTimer
                    currentSession={currentSession}
                    timeLeft={timeLeft}
                    isRunning={isRunning}
                    onStart={handleStartTimer}
                    onPause={handlePauseTimer}
                    onSkip={handleSkipSession}
                    onReset={handleResetTimer}
                    collapsed={collapsed}
                />

                {/* Navigation */}
                <ScrollArea className="flex-1 px-2">
                    <nav className="space-y-1">
                        {/* Daily Focus */}
                        <motion.button
                            onClick={() => onSelectView({ type: 'today' })}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                "hover:bg-background-tertiary",
                                selectedView?.type === 'today' && "bg-accent/10 text-accent"
                            )}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Home className="h-5 w-5 shrink-0" />
                            <AnimatePresence mode="wait">
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-sm font-medium overflow-hidden whitespace-nowrap"
                                    >
                                        Daily Focus
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {/* Separator */}
                        <div className="h-px bg-border my-3" />

                        {/* Projects section header */}
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-between px-3 py-1"
                                >
                                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                                        Projects
                                    </span>
                                    <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={openNewDialog}
                                            >
                                                <Plus className="h-4 w-4 text-text-muted" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipPortal>
                                            <TooltipContent className="z-[100]">Add new project</TooltipContent>
                                        </TooltipPortal>
                                    </Tooltip>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Project list */}
                        <div className="space-y-0.5">
                            {projects.map((project, index) => (
                                <ContextMenu key={project.id}>
                                    <ContextMenuTrigger>
                                        <motion.button
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => onSelectView({ type: 'project', id: project.id, name: project.name })}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                                "hover:bg-background-tertiary",
                                                selectedView?.type === 'project' && selectedView?.id === project.id &&
                                                "bg-accent/10 text-accent"
                                            )}
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="text-lg shrink-0">{project.icon}</span>
                                            <AnimatePresence mode="wait">
                                                {!collapsed && (
                                                    <motion.span
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        className="text-sm font-medium overflow-hidden whitespace-nowrap text-left flex-1"
                                                    >
                                                        {project.name}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => handleEdit(project)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem
                                            onClick={() => handleDelete(project)}
                                            className="text-priority-1 focus:text-priority-1"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>

                        {/* Add project button when collapsed */}
                        {collapsed && (
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-full h-10"
                                        onClick={openNewDialog}
                                    >
                                        <Plus className="h-5 w-5 text-text-muted" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipPortal>
                                    <TooltipContent side="right" className="z-[100]">
                                        Add new project
                                    </TooltipContent>
                                </TooltipPortal>
                            </Tooltip>
                        )}
                    </nav>
                </ScrollArea>

                {/* Sessions Planner Section - Only when expanded */}
                <AnimatePresence mode="wait">
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-3 border-t border-border"
                        >
                            <SessionPlanner
                                tasks={tasks}
                                onSessionsChange={setSessions}
                                onStartSequence={handleStartSequence}
                                onUpdateTask={onUpdateTask}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.aside>

            {/* Add/Edit Project Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingProject ? 'Edit Project' : 'New Project'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                Project Name
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Study, Work, Personal"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                Icon
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {EMOJI_OPTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                                        className={cn(
                                            "w-9 h-9 flex items-center justify-center rounded-lg text-xl transition-all",
                                            "hover:bg-background-tertiary",
                                            formData.icon === emoji && "bg-accent/20 ring-2 ring-accent"
                                        )}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingProject ? 'Save' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
