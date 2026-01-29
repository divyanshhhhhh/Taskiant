import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core'
import { Clock, GripVertical } from 'lucide-react'
import { cn, getPriorityColor } from '@/lib/utils'

// Generate time slots from 6am to 11pm
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6
    return {
        hour,
        label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        value: `${String(hour).padStart(2, '0')}:00`,
    }
})

// Draggable task component
function DraggableTask({ task, isDragging }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
        data: { task },
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
            className={cn(
                'flex items-center gap-2 p-2 rounded-lg bg-background-tertiary',
                'cursor-grab active:cursor-grabbing hover:bg-background-secondary transition-colors',
                isDragging && 'opacity-50'
            )}
            {...listeners}
            {...attributes}
        >
            <GripVertical className="h-4 w-4 text-text-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-sm truncate',
                    task.is_completed ? 'text-text-muted line-through' : 'text-text-primary'
                )}>
                    {task.title}
                </p>
                {task.project_name && (
                    <p className="text-xs text-text-muted truncate">{task.project_icon} {task.project_name}</p>
                )}
            </div>
            <span className={cn('text-xs px-1.5 py-0.5 rounded', getPriorityColor(task.priority))}>
                P{task.priority}
            </span>
        </motion.div>
    )
}

// Droppable time slot
function TimeSlot({ slot, tasks, isOver }) {
    const { setNodeRef } = useDroppable({
        id: slot.value,
        data: { slot },
    })

    const slotTasks = tasks.filter(t => t.start_time === slot.value)

    return (
        <motion.div
            ref={setNodeRef}
            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
            className={cn(
                'flex gap-3 py-2 px-3 border-b border-border/20 min-h-[60px] transition-colors',
                isOver && 'bg-accent/10 border-accent/30'
            )}
        >
            <span className="text-xs text-text-muted w-16 flex-shrink-0 pt-1">
                {slot.label}
            </span>
            <div className="flex-1 space-y-1">
                <AnimatePresence mode="popLayout">
                    {slotTasks.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className={cn(
                                'flex items-center gap-2 p-2 rounded-lg text-sm',
                                task.is_completed
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-accent/10 text-accent'
                            )}
                        >
                            <Clock className="h-3 w-3" />
                            <span className={cn(task.is_completed && 'line-through opacity-60')}>
                                {task.title}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isOver && slotTasks.length === 0 && (
                    <div className="h-8 rounded-lg border-2 border-dashed border-accent/40 flex items-center justify-center">
                        <span className="text-xs text-accent/60">Drop here</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export function TimeGrid({ date, unscheduledTasks = [], onTaskSchedule, className }) {
    const [scheduledTasks, setScheduledTasks] = useState([])
    const [activeId, setActiveId] = useState(null)
    const [overId, setOverId] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    // Load scheduled tasks for the date
    useEffect(() => {
        const loadScheduledTasks = async () => {
            if (!window.electronAPI || !date) return
            const tasks = await window.electronAPI.getTimeBlockedTasks(date)
            setScheduledTasks(tasks)
        }
        loadScheduledTasks()
    }, [date])

    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    const handleDragOver = (event) => {
        setOverId(event.over?.id || null)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveId(null)
        setOverId(null)

        if (!over) return

        const taskId = active.id
        const newStartTime = over.id

        // Update task in database
        if (window.electronAPI) {
            await window.electronAPI.updateTaskTimeBlock(taskId, {
                due_date: date,
                start_time: newStartTime,
            })

            // Reload scheduled tasks
            const tasks = await window.electronAPI.getTimeBlockedTasks(date)
            setScheduledTasks(tasks)

            onTaskSchedule?.()
        }
    }

    const handleDragCancel = () => {
        setActiveId(null)
        setOverId(null)
    }

    const activeTask = useMemo(() => {
        if (!activeId) return null
        return [...unscheduledTasks, ...scheduledTasks].find(t => t.id === activeId)
    }, [activeId, unscheduledTasks, scheduledTasks])

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className={cn('flex gap-4', className)}>
                {/* Unscheduled tasks sidebar */}
                <div className="w-64 flex-shrink-0">
                    <div className="glass rounded-xl p-3">
                        <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                            <GripVertical className="h-4 w-4" />
                            Unscheduled
                        </h4>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {unscheduledTasks.filter(t => !t.start_time).map((task) => (
                                <DraggableTask
                                    key={task.id}
                                    task={task}
                                    isDragging={activeId === task.id}
                                />
                            ))}
                            {unscheduledTasks.filter(t => !t.start_time).length === 0 && (
                                <p className="text-sm text-text-muted text-center py-4">
                                    No unscheduled tasks
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Time grid */}
                <div className="flex-1 glass rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-border/30 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <h4 className="text-sm font-medium text-text-primary">
                            Time Blocks for {date}
                        </h4>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        {TIME_SLOTS.map((slot) => (
                            <TimeSlot
                                key={slot.value}
                                slot={slot}
                                tasks={scheduledTasks}
                                isOver={overId === slot.value}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activeTask && (
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.05, rotate: 2 }}
                        className="p-3 rounded-lg bg-accent/90 text-white shadow-lg"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{activeTask.title}</span>
                        </div>
                    </motion.div>
                )}
            </DragOverlay>
        </DndContext>
    )
}
