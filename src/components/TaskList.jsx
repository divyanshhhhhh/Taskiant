import { forwardRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TaskItem } from './TaskItem'

const TaskList = forwardRef(function TaskList({
    tasks,
    allTasks,
    onToggle,
    onUpdate,
    onDelete,
    onAddSubtask,
    onRefresh
}, ref) {
    // Build tree structure from flat list
    const getSubtasks = (parentId) => {
        return allTasks?.filter(t => t.parent_id === parentId) || []
    }

    // Staggered container variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    return (
        <motion.div
            ref={ref}
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence mode="popLayout">
                {tasks.map((task, index) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        subtasks={getSubtasks(task.id)}
                        allTasks={allTasks}
                        index={index}
                        onToggle={onToggle}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onCreateSubtask={onAddSubtask}
                        onRefresh={onRefresh}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    )
})

export { TaskList }
export default memo(TaskList)
