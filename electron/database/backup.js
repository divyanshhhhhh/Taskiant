import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const MAX_BACKUPS = 7

export function createBackup(dbPath) {
    try {
        const userDataPath = app.getPath('userData')
        const backupDir = path.join(userDataPath, 'backups')

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true })
        }

        // Check if source database exists
        if (!fs.existsSync(dbPath)) {
            console.log('No database file to backup yet')
            return false
        }

        // Create timestamp for backup filename
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, 19)

        const backupPath = path.join(backupDir, `storage-${timestamp}.db`)

        // Rotate old backups (keep only MAX_BACKUPS)
        const existingBackups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('storage-') && f.endsWith('.db'))
            .sort()
            .reverse()

        if (existingBackups.length >= MAX_BACKUPS) {
            existingBackups.slice(MAX_BACKUPS - 1).forEach(oldBackup => {
                const oldPath = path.join(backupDir, oldBackup)
                try {
                    fs.unlinkSync(oldPath)
                    console.log(`Deleted old backup: ${oldBackup}`)
                } catch (err) {
                    console.error(`Failed to delete old backup: ${oldBackup}`, err)
                }
            })
        }

        // Copy current database to backup
        fs.copyFileSync(dbPath, backupPath)
        console.log(`Backup created: ${backupPath}`)

        return true
    } catch (error) {
        console.error('Backup failed:', error)
        return false
    }
}

export function listBackups() {
    try {
        const userDataPath = app.getPath('userData')
        const backupDir = path.join(userDataPath, 'backups')

        if (!fs.existsSync(backupDir)) {
            return []
        }

        return fs.readdirSync(backupDir)
            .filter(f => f.startsWith('storage-') && f.endsWith('.db'))
            .map(filename => {
                const filepath = path.join(backupDir, filename)
                const stats = fs.statSync(filepath)
                return {
                    filename,
                    path: filepath,
                    size: stats.size,
                    created: stats.birthtime,
                }
            })
            .sort((a, b) => b.created - a.created)
    } catch (error) {
        console.error('Failed to list backups:', error)
        return []
    }
}

export function restoreBackup(backupPath, targetPath) {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not found')
        }

        fs.copyFileSync(backupPath, targetPath)
        console.log(`Restored backup from: ${backupPath}`)
        return true
    } catch (error) {
        console.error('Restore failed:', error)
        return false
    }
}
