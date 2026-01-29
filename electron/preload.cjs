const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Auth
    checkAuthStatus: () => ipcRenderer.invoke('auth:checkStatus'),
    login: (password) => ipcRenderer.invoke('auth:login', password),

    // Window controls
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    hideQuickAdd: () => ipcRenderer.invoke('quickAdd:hide'),

    // Projects
    getProjects: () => ipcRenderer.invoke('db:getProjects'),
    createProject: (data) => ipcRenderer.invoke('db:createProject', data),
    updateProject: (id, data) => ipcRenderer.invoke('db:updateProject', id, data),
    deleteProject: (id) => ipcRenderer.invoke('db:deleteProject', id),

    // Tasks
    getTasks: (projectId) => ipcRenderer.invoke('db:getTasks', projectId),
    getTasksToday: () => ipcRenderer.invoke('db:getTasksToday'),
    createTask: (data) => ipcRenderer.invoke('db:createTask', data),
    updateTask: (id, data) => ipcRenderer.invoke('db:updateTask', id, data),
    deleteTask: (id) => ipcRenderer.invoke('db:deleteTask', id),
    toggleTask: (id) => ipcRenderer.invoke('db:toggleTask', id),

    // Labels
    getLabels: () => ipcRenderer.invoke('db:getLabels'),
    createLabel: (data) => ipcRenderer.invoke('db:createLabel', data),
    deleteLabel: (id) => ipcRenderer.invoke('db:deleteLabel', id),
    addLabelToTask: (taskId, labelId) => ipcRenderer.invoke('db:addLabelToTask', taskId, labelId),
    removeLabelFromTask: (taskId, labelId) => ipcRenderer.invoke('db:removeLabelFromTask', taskId, labelId),
    getTaskLabels: (taskId) => ipcRenderer.invoke('db:getTaskLabels', taskId),

    // Settings
    getSettings: () => ipcRenderer.invoke('db:getSettings'),
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),

    // Backup
    createBackup: () => ipcRenderer.invoke('db:createBackup'),

    // Stats
    getStats: () => ipcRenderer.invoke('db:getStats'),

    // Pomodoro Sessions
    startPomodoro: (taskId) => ipcRenderer.invoke('db:startPomodoro', taskId),
    completePomodoro: (sessionId) => ipcRenderer.invoke('db:completePomodoro', sessionId),
    cancelPomodoro: (sessionId) => ipcRenderer.invoke('db:cancelPomodoro', sessionId),
    getTaskPomodoros: (taskId) => ipcRenderer.invoke('db:getTaskPomodoros', taskId),
    getTodayPomodoros: () => ipcRenderer.invoke('db:getTodayPomodoros'),
    addManualPomodoro: (data) => ipcRenderer.invoke('db:addManualPomodoro', data),

    // Calendar & Time-Blocking
    getTasksForMonth: (year, month) => ipcRenderer.invoke('db:getTasksForMonth', year, month),
    getTasksForDate: (date) => ipcRenderer.invoke('db:getTasksForDate', date),
    getTasksByDate: (dateStr) => ipcRenderer.invoke('db:getTasksByDate', dateStr),
    updateTaskTimeBlock: (id, data) => ipcRenderer.invoke('db:updateTaskTimeBlock', id, data),
    getTimeBlockedTasks: (date) => ipcRenderer.invoke('db:getTimeBlockedTasks', date),

    // Notifications
    notifyPomodoro: (data) => ipcRenderer.invoke('notify:pomodoro', data),

    // Daily Focus Migration
    moveToToday: (id) => ipcRenderer.invoke('db:moveToToday', id),
    copyToToday: (id) => ipcRenderer.invoke('db:copyToToday', id),

    // Pomodoro Task Linking
    getAllActiveTasks: () => ipcRenderer.invoke('db:getAllActiveTasks'),

    // Generic Notifications
    sendNotification: (title, body) => ipcRenderer.invoke('notify:send', title, body),
})
