import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 */
export function formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) {
        return 'Today'
    }
    if (d.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow'
    }

    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
}

/**
 * Get priority label and color
 */
export function getPriorityInfo(priority) {
    const priorities = {
        1: { label: 'Urgent', color: 'text-priority-1', bg: 'priority-bg-1' },
        2: { label: 'High', color: 'text-priority-2', bg: 'priority-bg-2' },
        3: { label: 'Medium', color: 'text-priority-3', bg: 'priority-bg-3' },
        4: { label: 'Low', color: 'text-priority-4', bg: 'priority-bg-4' },
    }
    return priorities[priority] || priorities[4]
}

/**
 * Parse quick-add syntax
 * Example: "Buy groceries #shopping @personal !1 ^tomorrow"
 */
export function parseQuickAdd(input) {
    const result = {
        title: input,
        labels: [],
        project: null,
        priority: 4,
        dueDate: null,
    }

    // Extract labels (#label)
    const labelMatches = input.match(/#(\w+)/g)
    if (labelMatches) {
        result.labels = labelMatches.map(l => l.slice(1))
        result.title = result.title.replace(/#\w+/g, '')
    }

    // Extract project (@project)
    const projectMatch = input.match(/@(\w+)/)
    if (projectMatch) {
        result.project = projectMatch[1]
        result.title = result.title.replace(/@\w+/, '')
    }

    // Extract priority (!1-4)
    const priorityMatch = input.match(/!([1-4])/)
    if (priorityMatch) {
        result.priority = parseInt(priorityMatch[1], 10)
        result.title = result.title.replace(/![1-4]/, '')
    }

    // Extract due date (^today, ^tomorrow, ^YYYY-MM-DD)
    const dueDateMatch = input.match(/\^(\w+|\d{4}-\d{2}-\d{2})/)
    if (dueDateMatch) {
        const dateStr = dueDateMatch[1].toLowerCase()
        const today = new Date()

        if (dateStr === 'today') {
            result.dueDate = today.toISOString().split('T')[0]
        } else if (dateStr === 'tomorrow') {
            today.setDate(today.getDate() + 1)
            result.dueDate = today.toISOString().split('T')[0]
        } else if (/\d{4}-\d{2}-\d{2}/.test(dueDateMatch[1])) {
            result.dueDate = dueDateMatch[1]
        }
        result.title = result.title.replace(/\^(\w+|\d{4}-\d{2}-\d{2})/, '')
    }

    result.title = result.title.trim()
    return result
}
