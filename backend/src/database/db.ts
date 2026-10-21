import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.resolve(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'nexusai.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for durability and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      extracted_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
      chunk_id UNINDEXED,
      document_id UNINDEXED,
      filename,
      content
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      deadline TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      estimated_duration INTEGER DEFAULT 60,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      total_study_minutes INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('proposed', 'approved', 'active')) DEFAULT 'proposed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_sessions (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      task_id TEXT,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      is_break INTEGER DEFAULT 0,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
      question_count INTEGER NOT NULL,
      document_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON array
      correct_option_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      answers TEXT NOT NULL, -- JSON object
      completed_at TEXT NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT, -- JSON
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_invocations TEXT, -- JSON
      proposed_schedule TEXT, -- JSON
      generated_quiz_id TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Seed default preferences if not present
  const defaultPrefs = [
    { key: 'study_start_time', value: '09:00' },
    { key: 'study_end_time', value: '18:00' },
    { key: 'session_duration_minutes', value: '45' },
    { key: 'break_duration_minutes', value: '15' },
    { key: 'daily_max_study_hours', value: '6' },
    { key: 'theme', value: 'dark' },
    { key: 'exam_target_date', value: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] }
  ];

  const checkPref = db.prepare('SELECT key FROM user_preferences WHERE key = ?');
  const insertPref = db.prepare('INSERT INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)');
  const now = new Date().toISOString();

  for (const pref of defaultPrefs) {
    const existing = checkPref.get(pref.key);
    if (!existing) {
      insertPref.run(pref.key, pref.value, now);
    }
  }

  console.log(`[Database] Initialized SQLite database with FTS5 at: ${dbPath}`);
}

export { db, uploadsDir, dataDir };
