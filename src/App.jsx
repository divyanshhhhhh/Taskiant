import { useState, useEffect, useCallback } from 'react'
import { TooltipProvider } from './components/ui/tooltip'
import { Titlebar } from './components/Titlebar'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { ProjectView } from './components/ProjectView'
import { QuickAdd } from './components/QuickAdd'

import { Login } from './components/Login'

function App() {
    // Check if this is the quick-add window
    const isQuickAdd = window.location.hash === '#/quick-add'

    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [projects, setProjects] = useState([])
    const [tasks, setTasks] = useState([])
    const [stats, setStats] = useState({
        todayTotal: 0,
        todayCompleted: 0,
        allTotal: 0,
        allCompleted: 0,
        completedToday: 0,
    })
    const [selectedView, setSelectedView] = useState({ type: 'today' })
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [loading, setLoading] = useState(true)

    // Load data from database
    const loadProjects = useCallback(async () => {
        if (window.electronAPI) {
            const p = await window.electronAPI.getProjects()
            setProjects(p)
        }
    }, [])

    // Load tasks based on selected date
    const loadTasks = useCallback(async () => {
        if (!window.electronAPI) return

        if (selectedView.type === 'today') {
            // Load tasks for the selected date
            const today = new Date().toISOString().split('T')[0]
            if (selectedDate === today) {
                const t = await window.electronAPI.getTasksToday()
                setTasks(t)
            } else {
                // Load tasks for specific date
                const t = await window.electronAPI.getTasksByDate(selectedDate)
                setTasks(t)
            }
        } else if (selectedView.type === 'project') {
            const t = await window.electronAPI.getTasks(selectedView.id)
            setTasks(t)
        }
    }, [selectedView, selectedDate])

    const loadStats = useCallback(async () => {
        if (window.electronAPI) {
            const s = await window.electronAPI.getStats()
            setStats(s)
        }
    }, [])

    const loadAll = useCallback(async () => {
        setLoading(true)
        await Promise.all([loadProjects(), loadTasks(), loadStats()])
        setLoading(false)
    }, [loadProjects, loadTasks, loadStats])

    useEffect(() => {
        if (isAuthenticated) {
            loadAll()
        }
    }, [isAuthenticated, loadAll])

    useEffect(() => {
        loadTasks()
    }, [selectedView, selectedDate, loadTasks])

    // Handle date selection from calendar
    const handleDateSelect = (date) => {
        setSelectedDate(date)
        // Auto-switch to "today" view when selecting a date from calendar
        if (selectedView.type !== 'today') {
            setSelectedView({ type: 'today' })
        }
    }

    // Project handlers
    const handleCreateProject = async (data) => {
        if (window.electronAPI) {
            await window.electronAPI.createProject(data)
            await loadProjects()
        }
    }

    const handleUpdateProject = async (id, data) => {
        if (window.electronAPI) {
            await window.electronAPI.updateProject(id, data)
            await loadProjects()
        }
    }

    const handleDeleteProject = async (id) => {
        if (window.electronAPI) {
            await window.electronAPI.deleteProject(id)
            await loadProjects()
        }
    }

    // Task handlers
    const handleCreateTask = async (data) => {
        if (window.electronAPI) {
            await window.electronAPI.createTask(data)
            await loadTasks()
            await loadStats()
        }
    }

    const handleUpdateTask = async (id, data) => {
        if (window.electronAPI) {
            await window.electronAPI.updateTask(id, data)
            await loadTasks()
            await loadStats()
        }
    }

    const handleDeleteTask = async (id) => {
        if (window.electronAPI) {
            await window.electronAPI.deleteTask(id)
            await loadTasks()
            await loadStats()
        }
    }

    const handleToggleTask = async (id) => {
        if (window.electronAPI) {
            await window.electronAPI.toggleTask(id)
            await loadTasks()
            await loadStats()
        }
    }

    // Render Quick Add window
    if (isQuickAdd) {
        return <QuickAdd />
    }

    // Login Screen
    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />
    }

    // Main app
    return (
        <TooltipProvider>
            <div className="h-screen flex flex-col bg-background-primary">
                {/* Custom titlebar */}
                <Titlebar />

                {/* Main layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <Sidebar
                        projects={projects}
                        tasks={tasks}
                        selectedView={selectedView}
                        onSelectView={setSelectedView}
                        onCreateProject={handleCreateProject}
                        onUpdateProject={handleUpdateProject}
                        onDeleteProject={handleDeleteProject}
                        onUpdateTask={handleUpdateTask}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />

                    {/* Main content area */}
                    {selectedView.type === 'today' ? (
                        <Dashboard
                            tasks={tasks}
                            stats={stats}
                            selectedDate={selectedDate}
                            onSelectDate={handleDateSelect}
                            onToggleTask={handleToggleTask}
                            onCreateTask={handleCreateTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onRefresh={loadTasks}
                        />
                    ) : selectedView.type === 'project' ? (
                        <ProjectView
                            project={{
                                id: selectedView.id,
                                name: selectedView.name,
                                icon: projects.find(p => p.id === selectedView.id)?.icon || '📁'
                            }}
                            tasks={tasks}
                            onToggleTask={handleToggleTask}
                            onCreateTask={handleCreateTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onRefresh={loadTasks}
                        />
                    ) : null}
                </div>
            </div>
        </TooltipProvider>
    )
}

export default App
