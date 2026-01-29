import Database from 'better-sqlite3-multiple-ciphers'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db = null

export function getDb() {
  return db
}

export function checkDbExists() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'storage.db')
  return fs.existsSync(dbPath)
}

export async function initDatabase(password) {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'storage.db')
  const backupDir = path.join(userDataPath, 'backups')

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log('Database path:', dbPath)

  try {
    db = new Database(dbPath)

    // Enable SQLCipher encryption with user password
    db.pragma(`key='${password}'`)
    db.pragma('cipher_compatibility = 4')

    // Enable foreign keys
    db.pragma('foreign_keys = ON')

    // Optimize for performance
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')

    // Verify password by attempting to read from the database
    try {
      db.prepare('SELECT count(*) FROM sqlite_master').get()
    } catch (e) {
      // Close and nullify db if password is wrong
      console.error('Password verification failed:', e)
      db.close()
      db = null
      throw new Error('Invalid password or corrupted database')
    }

    // Create tables
    createSchema()

    console.log('Database initialized successfully')
    return db
  } catch (error) {
    console.error('Database initialization error:', error)
    if (db) {
      try { db.close() } catch (e) { }
      db = null
    }
    throw error
  }
}

function createSchema() {
  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tasks table with hierarchical support
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      parent_id INTEGER DEFAULT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      priority INTEGER DEFAULT 4 CHECK(priority BETWEEN 1 AND 4),
      due_date DATE,
      start_time TEXT,
      is_completed INTEGER DEFAULT 0,
      pomo_target INTEGER DEFAULT 1,
      pomo_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `)

  // Migration: Add start_time column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN start_time TEXT`)
  } catch (e) { /* Column already exists */ }

  // Migration: Add pomo_completed column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN pomo_completed INTEGER DEFAULT 0`)
  } catch (e) { /* Column already exists */ }

  // Migration: Add notes column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN notes TEXT`)
  } catch (e) { /* Column already exists */ }

  // Labels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Task-Label junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `)

  // Pomodoro sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      was_completed INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `)

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // Insert default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `)

  insertSetting.run('theme', 'midnight')
  insertSetting.run('pomo_work', '25')
  insertSetting.run('pomo_break', '5')
  insertSetting.run('backup_enabled', 'true')

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
    CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_labels(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels(label_id);
  `)

  console.log('Schema created successfully')
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
