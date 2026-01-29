import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, Notification } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getDb, checkDbExists } from './database/init.js'
import { createBackup } from './database/backup.js'
import * as queries from './database/queries.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let quickAddWindow = null
let tray = null

const isDev = !app.isPackaged

// Resolve preload path reliably across all environments
const getPreloadPath = () => {
    if (isDev) {
        return path.join(__dirname, 'preload.cjs')
    }
    return path.resolve(app.getAppPath(), 'electron', 'preload.cjs')
}

function createMainWindow() {
    const preloadPath = getPreloadPath()

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#0B0E14',
        frame: false,
        titleBarStyle: 'hidden',
        show: false,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    // Hide to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault()
            mainWindow.hide()
        }
    })
}

function createQuickAddWindow() {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
        quickAddWindow.show()
        quickAddWindow.focus()
        return
    }

    quickAddWindow = new BrowserWindow({
        width: 600,
        height: 120,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        center: true,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    })

    if (isDev) {
        quickAddWindow.loadURL('http://localhost:5173/#/quick-add')
    } else {
        quickAddWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
            hash: '/quick-add'
        })
    }

    quickAddWindow.on('blur', () => {
        if (quickAddWindow && !quickAddWindow.isDestroyed()) {
            quickAddWindow.hide()
        }
    })

    quickAddWindow.on('closed', () => {
        quickAddWindow = null
    })
}

function createTray() {
    // Create a simple tray icon (16x16 blue square for now)
    // Use icon.ico which serves as both window and tray icon
    const iconPath = isDev
        ? path.join(__dirname, '../public/icon.ico')
        : path.join(__dirname, '../dist/icon.ico')

    // Create a fallback icon if file doesn't exist
    let trayIcon
    try {
        trayIcon = nativeImage.createFromPath(iconPath)
    } catch {
        // Create a simple colored icon as fallback
        trayIcon = nativeImage.createEmpty()
    }

    tray = new Tray(trayIcon.isEmpty() ? nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABsSURBVDiNY2AYacBIrgYGBgYG/8dvGf6//4/AIwwMDP//IwtyMDAwMPxnYGBgYGJQZ2BgYMCqAZcBjNgMIEYzIw4DGBkZGRjIMYARXQMxmrEagKyZGM0YLmBkZGTAqpmBgYGBEd0FpGomCgAAMSMPhqNTGNAAAAAASUVORK5CYII='
    ) : trayIcon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Taskiant',
            click: () => {
                if (mainWindow) {
                    mainWindow.show()
                    mainWindow.focus()
                }
            }
        },
        {
            label: 'Quick Add (Ctrl+Alt+A)',
            click: () => createQuickAddWindow()
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('Taskiant')
    tray.setContextMenu(contextMenu)

    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide()
            } else {
                mainWindow.show()
                mainWindow.focus()
            }
        }
    })
}

function registerGlobalShortcuts() {
    // Register Ctrl+Alt+A for Quick Add
    globalShortcut.register('CommandOrControl+Alt+A', () => {
        createQuickAddWindow()
    })
}

function setupIpcHandlers() {
    // Auth
    ipcMain.handle('auth:checkStatus', () => {
        return {
            needsSetup: !checkDbExists(),
            dbPath: path.join(app.getPath('userData'), 'storage.db')
        }
    })

    ipcMain.handle('auth:login', async (_, password) => {
        try {
            await initDatabase(password)
            // Create backup after successful login
            const db = getDb()
            if (db) {
                createBackup(db.name)
            }
            return { success: true }
        } catch (e) {
            console.error('Login failed:', e)
            return { success: false, error: e.message }
        }
    })

    // Window controls
    ipcMain.handle('window:minimize', () => mainWindow?.minimize())
    ipcMain.handle('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow?.maximize()
        }
    })
    ipcMain.handle('window:close', () => mainWindow?.hide())
    ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
    ipcMain.handle('quickAdd:hide', () => quickAddWindow?.hide())

    // Projects
    ipcMain.handle('db:getProjects', () => queries.getProjects())
    ipcMain.handle('db:createProject', (_, data) => queries.createProject(data))
    ipcMain.handle('db:updateProject', (_, id, data) => queries.updateProject(id, data))
    ipcMain.handle('db:deleteProject', (_, id) => queries.deleteProject(id))

    // Tasks
    ipcMain.handle('db:getTasks', (_, projectId) => queries.getTasks(projectId))
    ipcMain.handle('db:getTasksToday', () => queries.getTasksToday())
    ipcMain.handle('db:createTask', (_, data) => queries.createTask(data))
    ipcMain.handle('db:updateTask', (_, id, data) => queries.updateTask(id, data))
    ipcMain.handle('db:deleteTask', (_, id) => queries.deleteTask(id))
    ipcMain.handle('db:toggleTask', (_, id) => queries.toggleTask(id))

    // Labels
    ipcMain.handle('db:getLabels', () => queries.getLabels())
    ipcMain.handle('db:createLabel', (_, data) => queries.createLabel(data))
    ipcMain.handle('db:deleteLabel', (_, id) => queries.deleteLabel(id))
    ipcMain.handle('db:addLabelToTask', (_, taskId, labelId) => queries.addLabelToTask(taskId, labelId))
    ipcMain.handle('db:removeLabelFromTask', (_, taskId, labelId) => queries.removeLabelFromTask(taskId, labelId))
    ipcMain.handle('db:getTaskLabels', (_, taskId) => queries.getTaskLabels(taskId))

    // Settings
    ipcMain.handle('db:getSettings', () => queries.getSettings())
    ipcMain.handle('db:getSetting', (_, key) => queries.getSetting(key))
    ipcMain.handle('db:setSetting', (_, key, value) => queries.setSetting(key, value))

    // Backup
    ipcMain.handle('db:createBackup', () => {
        const db = getDb()
        if (db) {
            return createBackup(db.name)
        }
        return false
    })

    // Stats
    ipcMain.handle('db:getStats', () => queries.getStats())

    // Pomodoro Sessions
    ipcMain.handle('db:startPomodoro', (_, taskId) => queries.startPomodoroSession(taskId))
    ipcMain.handle('db:completePomodoro', (_, sessionId) => queries.completePomodoroSession(sessionId))
    ipcMain.handle('db:cancelPomodoro', (_, sessionId) => queries.cancelPomodoroSession(sessionId))
    ipcMain.handle('db:getTaskPomodoros', (_, taskId) => queries.getTaskPomodoroSessions(taskId))
    ipcMain.handle('db:getTodayPomodoros', () => queries.getTodayPomodoroSessions())
    ipcMain.handle('db:addManualPomodoro', (_, data) => queries.addManualPomodoroSession(data))

    // Calendar & Time-Blocking
    ipcMain.handle('db:getTasksForMonth', (_, year, month) => queries.getTasksForMonth(year, month))
    ipcMain.handle('db:getTasksForDate', (_, date) => queries.getTasksForDate(date))
    ipcMain.handle('db:getTasksByDate', (_, dateStr) => queries.getTasksByDate(dateStr))
    ipcMain.handle('db:updateTaskTimeBlock', (_, id, data) => queries.updateTaskTimeBlock(id, data))
    ipcMain.handle('db:getTimeBlockedTasks', (_, date) => queries.getTimeBlockedTasks(date))

    // Notifications
    ipcMain.handle('notify:pomodoro', (_, { taskTitle, sessionNumber, type }) => {
        if (!Notification.isSupported()) return false

        const titles = {
            work: '🍅 Pomodoro Complete!',
            short: '☕ Break Over!',
            long: '🎉 Long Break Over!'
        }

        const bodies = {
            work: `Great work on "${taskTitle}"! Session #${sessionNumber} complete. Time for a break.`,
            short: 'Ready to focus again? Start your next pomodoro!',
            long: 'Feeling refreshed? Let\'s get back to work!'
        }

        const notification = new Notification({
            title: titles[type] || titles.work,
            body: bodies[type] || bodies.work,
            silent: false,
        })

        notification.show()

        notification.on('click', () => {
            if (mainWindow) {
                mainWindow.show()
                mainWindow.focus()
            }
        })

        return true
    })

    // Daily Focus Migration
    ipcMain.handle('db:moveToToday', (_, id) => queries.moveToToday(id))
    ipcMain.handle('db:copyToToday', (_, id) => queries.copyToToday(id))

    // Pomodoro Task Linking
    ipcMain.handle('db:getAllActiveTasks', () => queries.getAllActiveTasks())

    // Generic Notifications (for SessionPlanner/StickyTimer)
    ipcMain.handle('notify:send', (_, title, body) => {
        if (!Notification.isSupported()) return false

        const notification = new Notification({
            title,
            body,
            silent: false,
        })

        notification.show()

        notification.on('click', () => {
            if (mainWindow) {
                mainWindow.show()
                mainWindow.focus()
            }
        })

        return true
    })
}

app.whenReady().then(async () => {
    // Database is now initialized after login, not here
    // await initDatabase()

    // Create backup logic moved to post-login
    /*
    const db = getDb()
    if (db) {
        createBackup(db.name)
    }
    */

    createMainWindow()
    createTray()
    registerGlobalShortcuts()
    setupIpcHandlers()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't quit, just hide to tray
    }
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

app.on('before-quit', () => {
    app.isQuitting = true
})
