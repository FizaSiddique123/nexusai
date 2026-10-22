import { db } from '../database/db.js';
import { TaskItem, TaskPriority, TaskStatus } from '../../../shared/src/types.js';
import { ActivityService } from './activityService.js';
import crypto from 'node:crypto';

export class TaskService {
  static createTask(params: {
    title: string;
    description?: string;
    deadline?: string;
    priority?: TaskPriority;
    estimated_duration?: number;
  }): TaskItem {
    if (!params.title || params.title.trim() === '') {
      throw new Error('Task title cannot be empty.');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const deadline = params.deadline || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const priority = params.priority || 'medium';
    const duration = params.estimated_duration && params.estimated_duration > 0 ? params.estimated_duration : 60;
    const description = params.description || '';

    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, deadline, priority, estimated_duration, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    stmt.run(id, params.title.trim(), description, deadline, priority, duration, now, now);

    const task: TaskItem = {
      id,
      title: params.title.trim(),
      description,
      deadline,
      priority,
      estimated_duration: duration,
      status: 'pending',
      created_at: now,
      updated_at: now
    };

    ActivityService.logEvent('task_created', `Task created: ${task.title}`, `Created task "${task.title}" with priority ${task.priority}`, { taskId: id });

    return task;
  }

  static getTasks(filters?: { status?: string; priority?: string; search?: string }): TaskItem[] {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters?.search && filters.search.trim() !== '') {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`);
    }

    query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, deadline ASC";

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      deadline: r.deadline,
      priority: r.priority as TaskPriority,
      estimated_duration: r.estimated_duration,
      status: r.status as TaskStatus,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  }

  static getTaskById(id: string): TaskItem | null {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const r = stmt.get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      deadline: r.deadline,
      priority: r.priority as TaskPriority,
      estimated_duration: r.estimated_duration,
      status: r.status as TaskStatus,
      created_at: r.created_at,
      updated_at: r.updated_at
    };
  }

  static updateTask(id: string, updates: Partial<TaskItem>): TaskItem {
    const existing = this.getTaskById(id);
    if (!existing) {
      throw new Error(`Task with id ${id} not found.`);
    }

    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const deadline = updates.deadline !== undefined ? updates.deadline : existing.deadline;
    const priority = updates.priority !== undefined ? updates.priority : existing.priority;
    const duration = updates.estimated_duration !== undefined ? updates.estimated_duration : existing.estimated_duration;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const updatedAt = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, deadline = ?, priority = ?, estimated_duration = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(title, description, deadline, priority, duration, status, updatedAt, id);

    const updatedTask = this.getTaskById(id)!;
    ActivityService.logEvent('task_updated', `Task updated: ${title}`, `Updated task "${title}"`, { taskId: id, updates });
    return updatedTask;
  }

  static completeTask(id: string): TaskItem {
    return this.updateTask(id, { status: 'completed' });
  }

  static deleteTask(id: string): { success: boolean; id: string } {
    const existing = this.getTaskById(id);
    if (!existing) {
      throw new Error(`Task with id ${id} not found.`);
    }

    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);

    ActivityService.logEvent('task_updated', `Task deleted: ${existing.title}`, `Deleted task "${existing.title}"`, { taskId: id });
    return { success: true, id };
  }

  static getTaskStats() {
    const all = this.getTasks();
    const today = new Date().toISOString().split('T')[0];

    return {
      total: all.length,
      pending: all.filter(t => t.status === 'pending').length,
      in_progress: all.filter(t => t.status === 'in_progress').length,
      completed: all.filter(t => t.status === 'completed').length,
      high_priority: all.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      due_today: all.filter(t => t.deadline === today && t.status !== 'completed').length,
      completion_rate: all.length > 0 ? Math.round((all.filter(t => t.status === 'completed').length / all.length) * 100) : 0
    };
  }
}
