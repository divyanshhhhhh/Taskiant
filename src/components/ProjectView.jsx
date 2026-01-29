import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, FolderOpen } from 'lucide-react'
import { TaskList } from './TaskList'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function ProjectView({
    project,
    tasks,
    onToggleTask,
    onCreateTask,
    onUpdateTask,
    onDeleteTask,
    onRefresh
}) {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState(4)
    const [isAddingTask, setIsAddingTask] = useState(false)

    const handleAddTask = async (e) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        await onCreateTask({
            project_id: project.id,
            title: newTaskTitle,
            priority: newTaskPriority,
        })

        setNewTaskTitle('')
        setNewTaskPriority(4)
        setIsAddingTask(false)
        onRefresh()
    }

    // Filter root tasks (no parent)
    const rootTasks = tasks.filter(t => t.parent_id === null)
    const completedCount = tasks.filter(t => t.is_completed).length
    const totalCount = tasks.length

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-8 py-6 border-b border-border"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{project.icon}</span>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">
                                {project.name}
                            </h1>
                            <p className="text-text-secondary text-sm mt-0.5">
                                {completedCount} of {totalCount} tasks completed
                            </p>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    {totalCount > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-background-tertiary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="text-sm text-text-muted">
                                {Math.round((completedCount / totalCount) * 100)}%
                            </span>
                        </div>
                    )}
                </div>
            </motion.header>

            {/* Main content */}
            <div className="flex-1 overflow-auto px-8 py-6">
                {/* Quick add */}
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
                                placeholder="Task title..."
                                autoFocus
                                className="flex-1"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="sm">
                                        P{newTaskPriority}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {[1, 2, 3, 4].map((p) => (
                                        <DropdownMenuItem
                                            key={p}
                                            onClick={() => setNewTaskPriority(p)}
                                        >
                                            Priority {p}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 h-12 text-text-muted hover:text-text-primary"
                            onClick={() => setIsAddingTask(true)}
                        >
                            <Plus className="h-5 w-5" />
                            Add a task
                        </Button>
                    )}
                </motion.div>

                {/* Task list */}
                {tasks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-16"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-tertiary flex items-center justify-center">
                            <FolderOpen className="h-8 w-8 text-text-muted" />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                            No tasks yet
                        </h3>
                        <p className="text-text-secondary max-w-md mx-auto">
                            Add your first task to get started with this project.
                        </p>
                    </motion.div>
                ) : (
                    <TaskList
                        tasks={rootTasks}
                        allTasks={tasks}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                        onAddSubtask={onCreateTask}
                        onRefresh={onRefresh}
                    />
                )}
            </div>
        </div>
    )
}
