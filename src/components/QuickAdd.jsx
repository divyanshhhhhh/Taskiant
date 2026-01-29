import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Input } from './ui/input'
import { parseQuickAdd } from '@/lib/utils'

export function QuickAdd() {
    const [input, setInput] = useState('')
    const [projects, setProjects] = useState([])
    const inputRef = useRef(null)

    useEffect(() => {
        // Focus input when component mounts
        inputRef.current?.focus()

        // Load projects for @project suggestions
        const loadProjects = async () => {
            if (window.electronAPI) {
                const p = await window.electronAPI.getProjects()
                setProjects(p)
            }
        }
        loadProjects()

        // Handle escape key to close
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                window.electronAPI?.hideQuickAdd()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const parsed = parseQuickAdd(input)

        // Find project by name if specified
        let projectId = null
        if (parsed.project) {
            const matchedProject = projects.find(
                p => p.name.toLowerCase().includes(parsed.project.toLowerCase())
            )
            projectId = matchedProject?.id
        }

        // Create the task
        if (window.electronAPI) {
            await window.electronAPI.createTask({
                title: parsed.title,
                project_id: projectId,
                priority: parsed.priority,
                due_date: parsed.dueDate,
            })
        }

        setInput('')
        window.electronAPI?.hideQuickAdd()
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full h-full flex items-center justify-center p-4"
        >
            <div className="w-full glass rounded-2xl shadow-2xl overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="p-2 rounded-lg bg-accent/20">
                            <Zap className="h-5 w-5 text-accent" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Add task... #label @project !1 ^today"
                            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted text-sm"
                        />
                    </div>

                    {/* Hint bar */}
                    <div className="px-4 py-2 bg-background-primary/50 border-t border-border/30 flex items-center gap-4 text-[10px] text-text-muted">
                        <span><kbd className="px-1 py-0.5 bg-background-tertiary rounded">Enter</kbd> to save</span>
                        <span><kbd className="px-1 py-0.5 bg-background-tertiary rounded">Esc</kbd> to cancel</span>
                        <span className="flex-1" />
                        <span>!1-4 priority • @project • ^today</span>
                    </div>
                </form>
            </div>
        </motion.div>
    )
}
