import { safeStorage, app } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export function getEncryptionKey() {
    const userDataPath = app.getPath('userData')
    const keyPath = path.join(userDataPath, 'db-key.enc')

    // Check if key already exists
    if (fs.existsSync(keyPath)) {
        try {
            const encryptedKey = fs.readFileSync(keyPath)
            if (safeStorage.isEncryptionAvailable()) {
                return safeStorage.decryptString(encryptedKey)
            }
        } catch (error) {
            console.error('Failed to decrypt database key:', error)
            // Fallback checking for dev key if migration is needed, or throw error
            // For now, we propagate error to prevent DB corruption
            throw new Error('Could not decrypt database key. SafeStorage may be unavailable.')
        }
    }

    // Generate new key if not found
    const newKey = crypto.randomBytes(32).toString('hex')

    if (safeStorage.isEncryptionAvailable()) {
        const encryptedKey = safeStorage.encryptString(newKey)
        fs.writeFileSync(keyPath, encryptedKey)
        return newKey
    } else {
        console.warn('SafeStorage not available - using fallback key for development/testing')
        // In production this should probably throw, but for dev we can return the dev key
        // or a generated key that won't persist securely. 
        // Returning a fixed fallback for dev environments where safeStorage fails
        return 'taskiant-fallback-key-2024'
    }
}
