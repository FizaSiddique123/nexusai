import { db } from '../database/db.js';
import { ActivityEvent } from '../../../shared/src/types.js';
import crypto from 'node:crypto';

export class ActivityService {
  static logEvent(
    eventType: ActivityEvent['event_type'],
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): ActivityEvent {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const metaString = metadata ? JSON.stringify(metadata) : null;

    const stmt = db.prepare(`
      INSERT INTO activity_events (id, event_type, title, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, eventType, title, description, metaString, createdAt);

    return {
      id,
      event_type: eventType,
      title,
      description,
      metadata,
      created_at: createdAt
    };
  }

  static getRecentEvents(limit: number = 20): ActivityEvent[] {
    const stmt = db.prepare(`
      SELECT id, event_type, title, description, metadata, created_at
      FROM activity_events
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      event_type: row.event_type,
      title: row.title,
      description: row.description,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      created_at: row.created_at
    }));
  }
}
