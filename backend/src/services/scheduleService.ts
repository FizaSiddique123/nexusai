import { db } from '../database/db.js';
import { ScheduleItem, ScheduleSession, TaskItem } from '../../../shared/src/types.js';
import { TaskService } from './taskService.js';
import { PreferenceService } from './preferenceService.js';
import { ActivityService } from './activityService.js';
import crypto from 'node:crypto';

export class ScheduleService {
  /**
   * Helper to convert "HH:mm" to minutes from midnight
   */
  static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Helper to convert minutes from midnight to "HH:mm"
   */
  static minutesToTime(totalMinutes: number): string {
    const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Detect overlapping sessions
   */
  static checkScheduleConflicts(sessions: { start_time: string; end_time: string; title?: string }[]): {
    has_conflicts: boolean;
    conflicts: string[];
  } {
    const conflicts: string[] = [];

    for (let i = 0; i < sessions.length; i++) {
      const aStart = this.timeToMinutes(sessions[i].start_time);
      const aEnd = this.timeToMinutes(sessions[i].end_time);
      const aTitle = sessions[i].title || `Session ${i + 1}`;

      if (aEnd <= aStart) {
        conflicts.push(`"${aTitle}" has invalid time range: ${sessions[i].start_time} - ${sessions[i].end_time}`);
      }

      for (let j = i + 1; j < sessions.length; j++) {
        const bStart = this.timeToMinutes(sessions[j].start_time);
        const bEnd = this.timeToMinutes(sessions[j].end_time);
        const bTitle = sessions[j].title || `Session ${j + 1}`;

        if (aStart < bEnd && bStart < aEnd) {
          conflicts.push(`Overlap detected between "${aTitle}" (${sessions[i].start_time}-${sessions[i].end_time}) and "${bTitle}" (${sessions[j].start_time}-${sessions[j].end_time})`);
        }
      }
    }

    return {
      has_conflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Generate an intelligent revision schedule
   */
  static generateSchedule(params: {
    date?: string;
    available_time?: number; // in minutes
    task_ids?: string[];
    preferences?: Record<string, any>;
    status?: 'proposed' | 'approved';
  }): ScheduleItem {
    const scheduleDate = params.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const prefs = PreferenceService.getAllPreferences();

    const startTimeStr = params.preferences?.start_time || prefs.study_start_time || '09:00';
    const sessionDuration = parseInt(params.preferences?.session_duration || prefs.session_duration_minutes || '45', 10);
    const breakDuration = parseInt(params.preferences?.break_duration || prefs.break_duration_minutes || '15', 10);
    const maxStudyMinutes = params.available_time || parseInt(prefs.daily_max_study_hours || '6', 10) * 60;

    // Retrieve candidate tasks
    let candidateTasks: TaskItem[] = [];
    if (params.task_ids && params.task_ids.length > 0) {
      candidateTasks = params.task_ids
        .map(id => TaskService.getTaskById(id))
        .filter((t): t is TaskItem => t !== null && t.status !== 'completed');
    } else {
      candidateTasks = TaskService.getTasks({ status: 'pending' });
    }

    // If no existing tasks, create contextual study blocks
    if (candidateTasks.length === 0) {
      candidateTasks = [
        TaskService.createTask({
          title: 'Review OSI 7-Layer Model & Protocols',
          description: 'Detailed study of physical through application layers and encapsulation',
          priority: 'high',
          estimated_duration: 45
        }),
        TaskService.createTask({
          title: 'Master TCP vs UDP Handshake & Flow Control',
          description: 'Three-way handshake, sliding window mechanism, and congestion avoidance',
          priority: 'high',
          estimated_duration: 45
        }),
        TaskService.createTask({
          title: 'IPv4 Subnetting & Routing (OSPF & BGP)',
          description: 'CIDR calculations, ARP resolution, and link-state vs distance-vector routing',
          priority: 'medium',
          estimated_duration: 45
        }),
        TaskService.createTask({
          title: 'Application Security (DNS, TLS 1.3, Firewalls)',
          description: 'Hierarchical DNS resolution, symmetric vs asymmetric encryption, and packet inspection',
          priority: 'medium',
          estimated_duration: 45
        })
      ];
    }

    const scheduleId = crypto.randomUUID();
    const now = new Date().toISOString();
    let currentMinute = this.timeToMinutes(startTimeStr);
    let totalStudyMinutes = 0;
    const generatedSessions: Omit<ScheduleSession, 'id' | 'schedule_id'>[] = [];
    let orderIndex = 0;

    for (const task of candidateTasks) {
      if (totalStudyMinutes + sessionDuration > maxStudyMinutes) {
        break;
      }

      // Add Study Session
      const sessionStart = this.minutesToTime(currentMinute);
      currentMinute += sessionDuration;
      const sessionEnd = this.minutesToTime(currentMinute);
      totalStudyMinutes += sessionDuration;

      generatedSessions.push({
        task_id: task.id,
        title: task.title,
        start_time: sessionStart,
        end_time: sessionEnd,
        duration_minutes: sessionDuration,
        is_break: false,
        order_index: orderIndex++
      });

      // Add Break if remaining study time allows
      if (totalStudyMinutes + breakDuration < maxStudyMinutes) {
        const breakStart = this.minutesToTime(currentMinute);
        currentMinute += breakDuration;
        const breakEnd = this.minutesToTime(currentMinute);

        generatedSessions.push({
          task_id: null,
          title: 'Rest & Mental Refreshment Break',
          start_time: breakStart,
          end_time: breakEnd,
          duration_minutes: breakDuration,
          is_break: true,
          order_index: orderIndex++
        });
      }
    }

    const scheduleTitle = `Revision Plan - ${scheduleDate}`;
    const initialStatus = params.status || 'proposed';

    // Insert schedule
    const insertSchedule = db.prepare(`
      INSERT INTO schedules (id, date, title, total_study_minutes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertSchedule.run(scheduleId, scheduleDate, scheduleTitle, totalStudyMinutes, initialStatus, now, now);

    // Insert sessions
    const insertSession = db.prepare(`
      INSERT INTO schedule_sessions (id, schedule_id, task_id, title, start_time, end_time, duration_minutes, is_break, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fullSessions: ScheduleSession[] = [];
    for (const s of generatedSessions) {
      const sessionId = crypto.randomUUID();
      insertSession.run(
        sessionId,
        scheduleId,
        s.task_id || null,
        s.title,
        s.start_time,
        s.end_time,
        s.duration_minutes,
        s.is_break ? 1 : 0,
        s.order_index
      );
      fullSessions.push({
        id: sessionId,
        schedule_id: scheduleId,
        ...s
      });
    }

    ActivityService.logEvent(
      'schedule_generated',
      `Schedule created for ${scheduleDate}`,
      `Generated ${fullSessions.filter(s => !s.is_break).length} study sessions totalling ${totalStudyMinutes} minutes. Status: ${initialStatus}.`,
      { scheduleId, date: scheduleDate, sessionCount: fullSessions.length }
    );

    return {
      id: scheduleId,
      date: scheduleDate,
      title: scheduleTitle,
      total_study_minutes: totalStudyMinutes,
      status: initialStatus,
      created_at: now,
      updated_at: now,
      sessions: fullSessions
    };
  }

  static getSchedule(idOrDate?: string): ScheduleItem | null {
    let sched: any = null;
    if (idOrDate) {
      sched = db.prepare('SELECT * FROM schedules WHERE id = ? OR date = ? ORDER BY created_at DESC LIMIT 1').get(idOrDate, idOrDate);
    } else {
      sched = db.prepare('SELECT * FROM schedules ORDER BY created_at DESC LIMIT 1').get();
    }

    if (!sched) return null;

    const sessionStmt = db.prepare(`
      SELECT * FROM schedule_sessions
      WHERE schedule_id = ?
      ORDER BY order_index ASC
    `);
    const sessions = sessionStmt.all(sched.id) as any[];

    return {
      id: sched.id,
      date: sched.date,
      title: sched.title,
      total_study_minutes: sched.total_study_minutes,
      status: sched.status,
      created_at: sched.created_at,
      updated_at: sched.updated_at,
      sessions: sessions.map(s => ({
        id: s.id,
        schedule_id: s.schedule_id,
        task_id: s.task_id,
        title: s.title,
        start_time: s.start_time,
        end_time: s.end_time,
        duration_minutes: s.duration_minutes,
        is_break: Boolean(s.is_break),
        order_index: s.order_index
      }))
    };
  }

  static getAllSchedules(): ScheduleItem[] {
    const rows = db.prepare('SELECT * FROM schedules ORDER BY date DESC, created_at DESC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      title: r.title,
      total_study_minutes: r.total_study_minutes,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  }

  static approveSchedule(id: string): ScheduleItem {
    const existing = this.getSchedule(id);
    if (!existing) {
      throw new Error(`Schedule with id ${id} not found.`);
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE schedules SET status = 'approved', updated_at = ? WHERE id = ?").run(now, id);

    ActivityService.logEvent(
      'tool_execution',
      `Schedule approved: ${existing.title}`,
      `User confirmed and approved schedule ${existing.id}`,
      { scheduleId: id }
    );

    return this.getSchedule(id)!;
  }

  static updateSchedule(
    id: string,
    updates: {
      title?: string;
      status?: 'proposed' | 'approved' | 'active';
      sessions?: Array<{
        title: string;
        start_time: string;
        end_time: string;
        duration_minutes: number;
        is_break?: boolean;
        task_id?: string;
      }>;
    }
  ): ScheduleItem {
    const existing = this.getSchedule(id);
    if (!existing) {
      throw new Error(`Schedule with id ${id} not found.`);
    }

    const title = updates.title || existing.title;
    const status = updates.status || existing.status;
    const now = new Date().toISOString();

    if (updates.sessions) {
      // Validate conflicts
      const conflictCheck = this.checkScheduleConflicts(updates.sessions);
      if (conflictCheck.has_conflicts) {
        throw new Error(`Schedule update has conflicts: ${conflictCheck.conflicts.join('; ')}`);
      }

      // Replace sessions
      db.prepare('DELETE FROM schedule_sessions WHERE schedule_id = ?').run(id);
      const insert = db.prepare(`
        INSERT INTO schedule_sessions (id, schedule_id, task_id, title, start_time, end_time, duration_minutes, is_break, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let totalMinutes = 0;
      updates.sessions.forEach((s, idx) => {
        const sid = crypto.randomUUID();
        if (!s.is_break) totalMinutes += s.duration_minutes;
        insert.run(
          sid,
          id,
          s.task_id || null,
          s.title,
          s.start_time,
          s.end_time,
          s.duration_minutes,
          s.is_break ? 1 : 0,
          idx
        );
      });

      db.prepare('UPDATE schedules SET title = ?, status = ?, total_study_minutes = ?, updated_at = ? WHERE id = ?')
        .run(title, status, totalMinutes, now, id);
    } else {
      db.prepare('UPDATE schedules SET title = ?, status = ?, updated_at = ? WHERE id = ?')
        .run(title, status, now, id);
    }

    ActivityService.logEvent('tool_execution', `Schedule updated: ${title}`, `Updated schedule ${id}`, { scheduleId: id });
    return this.getSchedule(id)!;
  }

  static deleteSchedule(id: string): { success: boolean; id: string } {
    db.prepare('DELETE FROM schedule_sessions WHERE schedule_id = ?').run(id);
    db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
    return { success: true, id };
  }
}
