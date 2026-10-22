import { db } from '../database/db.js';
import { UserPreference } from '../../../shared/src/types.js';

export class PreferenceService {
  static savePreference(key: string, value: string): UserPreference {
    const updatedAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO user_preferences (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    stmt.run(key, value, updatedAt);
    return { key, value, updated_at: updatedAt };
  }

  static getPreference(key: string): string | null {
    const stmt = db.prepare('SELECT value FROM user_preferences WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  static getAllPreferences(): Record<string, string> {
    const stmt = db.prepare('SELECT key, value FROM user_preferences');
    const rows = stmt.all() as { key: string; value: string }[];
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }
}
