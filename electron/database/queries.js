import { getDb } from './init.js'

// ============================================
// PROJECTS
// ============================================

export function getProjects() {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC
  `).all()
}

export function createProject({ name, icon = '📁' }) {
  const db = getDb()
  const maxOrder = db.prepare(`SELECT MAX(sort_order) as max FROM projects`).get()
  const sortOrder = (maxOrder?.max ?? -1) + 1

  const result = db.prepare(`
    INSERT INTO projects (name, icon, sort_order) VALUES (?, ?, ?)
  `).run(name, icon, sortOrder)

  return { id: result.lastInsertRowid, name, icon, sort_order: sortOrder }
}

export function updateProject(id, { name, icon, sort_order }) {
  const db = getDb()
  const updates = []
  const values = []

  if (name !== undefined) { updates.push('name = ?'); values.push(name) }
  if (icon !== undefined) { updates.push('icon = ?'); values.push(icon) }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order) }

  if (updates.length === 0) return null

  values.push(id)
  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  return db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id)
}

export function deleteProject(id) {
  const db = getDb()
  return db.prepare(`DELETE FROM projects WHERE id = ?`).run(id)
}

// ============================================
// TASKS (with Recursive CTEs)
// ============================================

export function getTasks(projectId) {
  const db = getDb()

  // Recursive CTE to get full task hierarchy
  const tasks = db.prepare(`
    WITH RECURSIVE task_tree AS (
      -- Base case: root tasks (no parent)
      SELECT 
        id, project_id, parent_id, title, priority, 
        due_date, is_completed, pomo_target, created_at, completed_at,
        0 AS depth,
        CAST(printf('%010d', id) AS TEXT) AS path
      FROM tasks 
      WHERE parent_id IS NULL AND project_id = ?
      
      UNION ALL
      
      -- Recursive case: child tasks
      SELECT 
        t.id, t.project_id, t.parent_id, t.title, t.priority,
        t.due_date, t.is_completed, t.pomo_target, t.created_at, t.completed_at,
        tt.depth + 1,
        tt.path || '/' || printf('%010d', t.id)
      FROM tasks t
      INNER JOIN task_tree tt ON t.parent_id = tt.id
    )
    SELECT * FROM task_tree
    ORDER BY path
  `).all(projectId)

  return tasks
}

export function getTasksToday() {
  const db = getDb()

  // Get today's tasks with full hierarchy
  const tasks = db.prepare(`
    WITH RECURSIVE task_tree AS (
      -- Base case: root tasks due today
      SELECT 
        id, project_id, parent_id, title, priority, 
        due_date, is_completed, pomo_target, created_at, completed_at,
        0 AS depth,
        CAST(printf('%010d', id) AS TEXT) AS path
      FROM tasks 
      WHERE due_date = date('now') AND parent_id IS NULL
      
      UNION ALL
      
      -- Include all subtasks of today's tasks
      SELECT 
        t.id, t.project_id, t.parent_id, t.title, t.priority,
        t.due_date, t.is_completed, t.pomo_target, t.created_at, t.completed_at,
        tt.depth + 1,
        tt.path || '/' || printf('%010d', t.id)
      FROM tasks t
      INNER JOIN task_tree tt ON t.parent_id = tt.id
    )
    SELECT task_tree.*, projects.name as project_name, projects.icon as project_icon
    FROM task_tree
    LEFT JOIN projects ON task_tree.project_id = projects.id
    ORDER BY priority ASC, path
  `).all()

  return tasks
}

// Get tasks for a specific date (for calendar navigation)
export function getTasksByDate(dateStr) {
  const db = getDb()

  const tasks = db.prepare(`
    WITH RECURSIVE task_tree AS (
      SELECT 
        id, project_id, parent_id, title, priority, 
        due_date, is_completed, pomo_target, created_at, completed_at,
        0 AS depth,
        CAST(printf('%010d', id) AS TEXT) AS path
      FROM tasks 
      WHERE due_date = ? AND parent_id IS NULL
      
      UNION ALL
      
      SELECT 
        t.id, t.project_id, t.parent_id, t.title, t.priority,
        t.due_date, t.is_completed, t.pomo_target, t.created_at, t.completed_at,
        tt.depth + 1,
        tt.path || '/' || printf('%010d', t.id)
      FROM tasks t
      INNER JOIN task_tree tt ON t.parent_id = tt.id
    )
    SELECT task_tree.*, projects.name as project_name, projects.icon as project_icon
    FROM task_tree
    LEFT JOIN projects ON task_tree.project_id = projects.id
    ORDER BY priority ASC, path
  `).all(dateStr)

  return tasks
}

export function createTask({ project_id, parent_id = null, title, notes = null, priority = 4, due_date = null, pomo_target = 1 }) {
  const db = getDb()

  const result = db.prepare(`
    INSERT INTO tasks (project_id, parent_id, title, notes, priority, due_date, pomo_target)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, parent_id, title, notes, priority, due_date, pomo_target)

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(result.lastInsertRowid)
}

export function updateTask(id, { title, notes, priority, due_date, start_time, is_completed, pomo_target, project_id, parent_id }) {
  const db = getDb()
  const updates = []
  const values = []

  if (title !== undefined) { updates.push('title = ?'); values.push(title) }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }
  if (priority !== undefined) { updates.push('priority = ?'); values.push(priority) }
  if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date) }
  if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time) }
  if (is_completed !== undefined) {
    updates.push('is_completed = ?'); values.push(is_completed)
    updates.push('completed_at = ?'); values.push(is_completed ? new Date().toISOString() : null)
  }
  if (pomo_target !== undefined) { updates.push('pomo_target = ?'); values.push(pomo_target) }
  if (project_id !== undefined) { updates.push('project_id = ?'); values.push(project_id) }
  if (parent_id !== undefined) { updates.push('parent_id = ?'); values.push(parent_id) }

  if (updates.length === 0) return null

  values.push(id)
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)
}

export function deleteTask(id) {
  const db = getDb()
  return db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
}

// Daily Focus Migration - Move task to today
export function moveToToday(id) {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  db.prepare(`UPDATE tasks SET due_date = ? WHERE id = ?`).run(today, id)
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)
}

// Daily Focus Migration - Copy task to today
export function copyToToday(id) {
  const db = getDb()
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)
  if (!task) return null

  const today = new Date().toISOString().split('T')[0]
  const result = db.prepare(`
    INSERT INTO tasks (project_id, parent_id, title, notes, priority, due_date, pomo_target)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(task.project_id, null, task.title, task.notes, task.priority, today, task.pomo_target)

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(result.lastInsertRowid)
}

// Get all uncompleted tasks for Pomodoro linking
export function getAllActiveTasks() {
  const db = getDb()
  return db.prepare(`
    SELECT t.*, p.name as project_name, p.icon as project_icon
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.is_completed = 0
    ORDER BY t.priority ASC, t.due_date ASC NULLS LAST
  `).all()
}

export function toggleTask(id) {
  const db = getDb()
  const task = db.prepare(`SELECT is_completed FROM tasks WHERE id = ?`).get(id)
  if (!task) return null

  const newStatus = task.is_completed ? 0 : 1
  db.prepare(`
    UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?
  `).run(newStatus, newStatus ? new Date().toISOString() : null, id)

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)
}

// ============================================
// LABELS
// ============================================

export function getLabels() {
  const db = getDb()
  return db.prepare(`SELECT * FROM labels ORDER BY name ASC`).all()
}

export function createLabel({ name, color = '#3B82F6' }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO labels (name, color) VALUES (?, ?)
  `).run(name, color)

  return { id: result.lastInsertRowid, name, color }
}

export function deleteLabel(id) {
  const db = getDb()
  return db.prepare(`DELETE FROM labels WHERE id = ?`).run(id)
}

export function addLabelToTask(taskId, labelId) {
  const db = getDb()
  try {
    db.prepare(`INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)`).run(taskId, labelId)
    return true
  } catch {
    return false
  }
}

export function removeLabelFromTask(taskId, labelId) {
  const db = getDb()
  return db.prepare(`DELETE FROM task_labels WHERE task_id = ? AND label_id = ?`).run(taskId, labelId)
}

export function getTaskLabels(taskId) {
  const db = getDb()
  return db.prepare(`
    SELECT l.* FROM labels l
    INNER JOIN task_labels tl ON l.id = tl.label_id
    WHERE tl.task_id = ?
  `).all(taskId)
}

// ============================================
// SETTINGS
// ============================================

export function getSettings() {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM settings`).all()
  const settings = {}
  rows.forEach(row => { settings[row.key] = row.value })
  return settings
}

export function getSetting(key) {
  const db = getDb()
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key)
  return row?.value ?? null
}

export function setSetting(key, value) {
  const db = getDb()
  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(key, value)
  return { key, value }
}

// ============================================
// STATS
// ============================================

export function getStats() {
  const db = getDb()

  const today = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
    FROM tasks 
    WHERE due_date = date('now')
  `).get()

  const allTasks = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
    FROM tasks
  `).get()

  const completedToday = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE completed_at IS NOT NULL 
    AND date(completed_at) = date('now')
  `).get()

  const pomosToday = db.prepare(`
    SELECT COUNT(*) as count FROM pomodoro_sessions 
    WHERE date(start_time) = date('now') AND was_completed = 1
  `).get()

  return {
    todayTotal: today?.total ?? 0,
    todayCompleted: today?.completed ?? 0,
    allTotal: allTasks?.total ?? 0,
    allCompleted: allTasks?.completed ?? 0,
    completedToday: completedToday?.count ?? 0,
    pomosToday: pomosToday?.count ?? 0,
  }
}

// ============================================
// POMODORO SESSIONS
// ============================================

export function startPomodoroSession(taskId) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO pomodoro_sessions (task_id, start_time) VALUES (?, datetime('now'))
  `).run(taskId)

  return db.prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`).get(result.lastInsertRowid)
}

export function completePomodoroSession(sessionId) {
  const db = getDb()
  db.prepare(`
    UPDATE pomodoro_sessions 
    SET end_time = datetime('now'), was_completed = 1 
    WHERE id = ?
  `).run(sessionId)

  // Also increment pomo_completed on the task
  const session = db.prepare(`SELECT task_id FROM pomodoro_sessions WHERE id = ?`).get(sessionId)
  if (session) {
    db.prepare(`UPDATE tasks SET pomo_completed = pomo_completed + 1 WHERE id = ?`).run(session.task_id)
  }

  return db.prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`).get(sessionId)
}

export function cancelPomodoroSession(sessionId) {
  const db = getDb()
  return db.prepare(`DELETE FROM pomodoro_sessions WHERE id = ? AND was_completed = 0`).run(sessionId)
}

export function getTaskPomodoroSessions(taskId) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM pomodoro_sessions 
    WHERE task_id = ? 
    ORDER BY start_time DESC
  `).all(taskId)
}

export function getTodayPomodoroSessions() {
  const db = getDb()
  return db.prepare(`
    SELECT ps.*, t.title as task_title, t.project_id
    FROM pomodoro_sessions ps
    LEFT JOIN tasks t ON ps.task_id = t.id
    WHERE date(ps.start_time) = date('now')
    ORDER BY ps.start_time DESC
  `).all()
}

export function addManualPomodoroSession({ task_id, start_time, end_time, was_completed = 1 }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO pomodoro_sessions (task_id, start_time, end_time, was_completed) 
    VALUES (?, ?, ?, ?)
  `).run(task_id, start_time, end_time, was_completed)

  // Increment pomo_completed if session was completed
  if (was_completed) {
    db.prepare(`UPDATE tasks SET pomo_completed = pomo_completed + 1 WHERE id = ?`).run(task_id)
  }

  return db.prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`).get(result.lastInsertRowid)
}

// ============================================
// CALENDAR & TIME-BLOCKING
// ============================================

export function getTasksForMonth(year, month) {
  const db = getDb()
  // Month is 1-indexed
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0')}-01`

  return db.prepare(`
    SELECT 
      due_date,
      COUNT(*) as total_tasks,
      SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as incomplete_tasks,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_tasks
    FROM tasks 
    WHERE due_date >= ? AND due_date < ?
    GROUP BY due_date
    ORDER BY due_date
  `).all(startDate, endDate)
}

export function getTasksForDate(date) {
  const db = getDb()

  // Get tasks with full hierarchy for a specific date
  const tasks = db.prepare(`
    WITH RECURSIVE task_tree AS (
      SELECT 
        id, project_id, parent_id, title, priority, 
        due_date, start_time, is_completed, pomo_target, pomo_completed, created_at, completed_at,
        0 AS depth,
        CAST(printf('%010d', id) AS TEXT) AS path
      FROM tasks 
      WHERE due_date = ? AND parent_id IS NULL
      
      UNION ALL
      
      SELECT 
        t.id, t.project_id, t.parent_id, t.title, t.priority,
        t.due_date, t.start_time, t.is_completed, t.pomo_target, t.pomo_completed, t.created_at, t.completed_at,
        tt.depth + 1,
        tt.path || '/' || printf('%010d', t.id)
      FROM tasks t
      INNER JOIN task_tree tt ON t.parent_id = tt.id
    )
    SELECT task_tree.*, projects.name as project_name, projects.icon as project_icon
    FROM task_tree
    LEFT JOIN projects ON task_tree.project_id = projects.id
    ORDER BY start_time NULLS LAST, priority ASC, path
  `).all(date)

  return tasks
}

export function updateTaskTimeBlock(id, { due_date, start_time }) {
  const db = getDb()
  const updates = []
  const values = []

  if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date) }
  if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time) }

  if (updates.length === 0) return null

  values.push(id)
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)
}

export function getTimeBlockedTasks(date) {
  const db = getDb()
  return db.prepare(`
    SELECT t.*, p.name as project_name, p.icon as project_icon
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.due_date = ? AND t.start_time IS NOT NULL
    ORDER BY t.start_time ASC
  `).all(date)
}

