import { db } from '../database/db.js';
import { WorkflowItem, WorkflowStep, WorkflowStatus } from '../../../shared/src/types.js';
import { ActivityService } from './activityService.js';
import crypto from 'node:crypto';

export class WorkflowService {
  /**
   * Create a new execution workflow
   */
  static createWorkflow(goal: string, examDate?: string): WorkflowItem {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const emptyArtifacts = JSON.stringify({
      document_ids: [],
      task_ids: [],
      schedule_id: null,
      quiz_id: null
    });

    const stmt = db.prepare(`
      INSERT INTO workflows (id, goal, status, exam_date, artifacts, created_at, updated_at)
      VALUES (?, ?, 'running', ?, ?, ?, ?)
    `);
    stmt.run(id, goal, examDate || null, emptyArtifacts, now, now);

    ActivityService.logEvent(
      'workflow_created',
      'Workflow Started',
      `Workflow [${id.substring(0, 8)}] started for goal: "${goal}"`,
      { workflowId: id, goal, examDate }
    );

    return {
      id,
      goal,
      status: 'running',
      exam_date: examDate,
      artifacts: {
        document_ids: [],
        task_ids: [],
        schedule_id: undefined,
        quiz_id: undefined
      },
      steps: [],
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Start a workflow step
   */
  static startStep(
    workflowId: string,
    stepOrder: number,
    stepName: string,
    toolName: string,
    inputParams?: any
  ): WorkflowStep {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO workflow_steps (id, workflow_id, step_order, step_name, tool_name, status, input_params, started_at)
      VALUES (?, ?, ?, ?, ?, 'running', ?, ?)
    `);
    stmt.run(
      id,
      workflowId,
      stepOrder,
      stepName,
      toolName,
      inputParams ? JSON.stringify(inputParams) : null,
      now
    );

    return {
      id,
      workflow_id: workflowId,
      step_order: stepOrder,
      step_name: stepName,
      tool_name: toolName,
      status: 'running',
      input_params: inputParams,
      started_at: now
    };
  }

  /**
   * Complete a workflow step with verified outputs
   */
  static completeStep(stepId: string, outputResult?: any): WorkflowStep {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE workflow_steps
      SET status = 'completed', output_result = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(outputResult ? JSON.stringify(outputResult) : null, now, stepId);

    const getStmt = db.prepare('SELECT * FROM workflow_steps WHERE id = ?');
    const row = getStmt.get(stepId) as any;
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      step_order: row.step_order,
      step_name: row.step_name,
      tool_name: row.tool_name,
      status: row.status,
      input_params: row.input_params ? JSON.parse(row.input_params) : undefined,
      output_result: row.output_result ? JSON.parse(row.output_result) : undefined,
      started_at: row.started_at,
      completed_at: row.completed_at
    };
  }

  /**
   * Mark a workflow step as failed
   */
  static failStep(stepId: string, errorMessage: string): WorkflowStep {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE workflow_steps
      SET status = 'failed', error_message = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(errorMessage, now, stepId);

    const getStmt = db.prepare('SELECT * FROM workflow_steps WHERE id = ?');
    const row = getStmt.get(stepId) as any;
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      step_order: row.step_order,
      step_name: row.step_name,
      tool_name: row.tool_name,
      status: 'failed',
      input_params: row.input_params ? JSON.parse(row.input_params) : undefined,
      error_message: errorMessage,
      started_at: row.started_at,
      completed_at: row.completed_at
    };
  }

  /**
   * Complete a workflow with persistent artifact links and verified status
   */
  static completeWorkflow(
    workflowId: string,
    artifacts: {
      document_ids?: string[];
      task_ids?: string[];
      schedule_id?: string;
      quiz_id?: string;
    },
    status: WorkflowStatus = 'completed'
  ): WorkflowItem {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE workflows
      SET status = ?, artifacts = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(status, JSON.stringify(artifacts), now, workflowId);

    ActivityService.logEvent(
      'workflow_completed',
      `Workflow ${status.toUpperCase()}`,
      `Workflow [${workflowId.substring(0, 8)}] finished with status "${status}". Artifacts verified.`,
      { workflowId, status, artifacts }
    );

    return this.getWorkflow(workflowId)!;
  }

  /**
   * Retrieve a workflow and all its steps
   */
  static getWorkflow(workflowId: string): WorkflowItem | null {
    const stmt = db.prepare('SELECT * FROM workflows WHERE id = ?');
    const row = stmt.get(workflowId) as any;
    if (!row) return null;

    const stepsStmt = db.prepare('SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order ASC');
    const stepRows = stepsStmt.all(workflowId) as any[];

    return {
      id: row.id,
      goal: row.goal,
      status: row.status,
      exam_date: row.exam_date || undefined,
      artifacts: row.artifacts ? JSON.parse(row.artifacts) : {},
      steps: stepRows.map(s => ({
        id: s.id,
        workflow_id: s.workflow_id,
        step_order: s.step_order,
        step_name: s.step_name,
        tool_name: s.tool_name,
        status: s.status,
        input_params: s.input_params ? JSON.parse(s.input_params) : undefined,
        output_result: s.output_result ? JSON.parse(s.output_result) : undefined,
        error_message: s.error_message || undefined,
        started_at: s.started_at,
        completed_at: s.completed_at || undefined
      })),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * List recent workflows
   */
  static listWorkflows(limit = 20): WorkflowItem[] {
    const stmt = db.prepare('SELECT * FROM workflows ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      goal: r.goal,
      status: r.status,
      exam_date: r.exam_date || undefined,
      artifacts: r.artifacts ? JSON.parse(r.artifacts) : {},
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  }

  /**
   * Verify whether the artifacts claimed by a workflow actually exist in persistent storage
   */
  static verifyWorkflowArtifacts(workflowId: string): {
    verified: boolean;
    taskCount: number;
    hasSchedule: boolean;
    hasQuiz: boolean;
    details: string;
    artifacts: any;
  } {
    const wf = this.getWorkflow(workflowId);
    if (!wf) {
      return {
        verified: false,
        taskCount: 0,
        hasSchedule: false,
        hasQuiz: false,
        details: 'Workflow record does not exist.',
        artifacts: {}
      };
    }

    const taskIds = wf.artifacts.task_ids || [];
    let validTasks = 0;
    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      const taskStmt = db.prepare(`SELECT count(*) as count FROM tasks WHERE id IN (${placeholders})`);
      const row = taskStmt.get(...taskIds) as any;
      validTasks = row?.count || 0;
    }

    let hasSchedule = false;
    if (wf.artifacts.schedule_id) {
      const schedStmt = db.prepare('SELECT id FROM schedules WHERE id = ?');
      hasSchedule = Boolean(schedStmt.get(wf.artifacts.schedule_id));
    }

    let hasQuiz = false;
    if (wf.artifacts.quiz_id) {
      const quizStmt = db.prepare('SELECT id FROM quizzes WHERE id = ?');
      hasQuiz = Boolean(quizStmt.get(wf.artifacts.quiz_id));
    }

    const verified = validTasks > 0 && hasSchedule && hasQuiz;
    const details = verified
      ? `All ${validTasks} tasks, study schedule (${wf.artifacts.schedule_id?.substring(0, 8)}), and quiz (${wf.artifacts.quiz_id?.substring(0, 8)}) verified in database.`
      : `Partial verification: tasks=${validTasks}/${taskIds.length}, schedule=${hasSchedule}, quiz=${hasQuiz}.`;

    return {
      verified,
      taskCount: validTasks,
      hasSchedule,
      hasQuiz,
      details,
      artifacts: wf.artifacts
    };
  }
}
