import { Router } from 'express';
import multer from 'multer';
import { AgentEngine } from '../agent/agentEngine.js';
import { TaskService } from '../services/taskService.js';
import { DocumentService } from '../services/documentService.js';
import { ScheduleService } from '../services/scheduleService.js';
import { QuizService } from '../services/quizService.js';
import { PreferenceService } from '../services/preferenceService.js';
import { ActivityService } from '../services/activityService.js';
import { WorkflowService } from '../services/workflowService.js';
import path from 'node:path';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

export const apiRouter = Router();

// ==========================================
// SYSTEM & HEALTH
// ==========================================
apiRouter.get('/status', (req, res) => {
  const taskStats = TaskService.getTaskStats();
  const docs = DocumentService.listDocuments();
  const quizzes = QuizService.listQuizzes();
  const schedules = ScheduleService.getAllSchedules();

  res.json({
    status: 'ok',
    version: '1.0.0',
    mcp: {
      endpoint: '/mcp',
      protocol_version: '2025-11-25',
      transport: 'Streamable HTTP',
      status: 'active'
    },
    metrics: {
      documents: docs.length,
      tasks: taskStats.total,
      completed_tasks: taskStats.completed,
      quizzes: quizzes.length,
      schedules: schedules.length
    }
  });
});

// ==========================================
// AI AGENT & CHAT
// ==========================================
apiRouter.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const response = await AgentEngine.processUserMessage(message);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Agent processing failed.' });
  }
});

apiRouter.get('/chat/history', (req, res) => {
  try {
    const history = AgentEngine.getChatHistory(50);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/chat/history', (req, res) => {
  try {
    AgentEngine.clearChatHistory();
    res.json({ success: true, message: 'Chat history cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// TASKS
// ==========================================
apiRouter.get('/tasks', (req, res) => {
  try {
    const { status, priority, search } = req.query as any;
    const tasks = TaskService.getTasks({ status, priority, search });
    const stats = TaskService.getTaskStats();
    res.json({ stats, tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/tasks', (req, res) => {
  try {
    const { title, description, deadline, priority, estimated_duration } = req.body;
    const task = TaskService.createTask({
      title,
      description,
      deadline,
      priority,
      estimated_duration: Number(estimated_duration)
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/tasks/:id', (req, res) => {
  try {
    const updated = TaskService.updateTask(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/tasks/:id/complete', (req, res) => {
  try {
    const completed = TaskService.completeTask(req.params.id);
    res.json(completed);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/tasks/:id', (req, res) => {
  try {
    const result = TaskService.deleteTask(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// DOCUMENTS & KNOWLEDGE
// ==========================================
apiRouter.get('/documents', (req, res) => {
  try {
    const docs = DocumentService.listDocuments();
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file was uploaded.' });
      return;
    }

    if (req.file.size === 0) {
      res.status(400).json({ error: 'Uploaded file is empty (0 bytes).' });
      return;
    }

    const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown', '.text'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext) && !req.file.mimetype.includes('text') && !req.file.mimetype.includes('pdf')) {
      res.status(400).json({ error: `Unsupported file type: ${ext || 'unknown'}. Supported types: PDF, TXT, MD.` });
      return;
    }

    const doc = await DocumentService.processDocument(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(201).json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Document processing failed.' });
  }
});

apiRouter.get('/documents/search', (req, res) => {
  try {
    const { query, document_id, limit } = req.query as any;
    if (!query) {
      res.status(400).json({ error: 'Search query parameter is required.' });
      return;
    }
    const results = DocumentService.searchKnowledge(query, document_id, limit ? Number(limit) : 5);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/documents/:id', (req, res) => {
  try {
    const doc = DocumentService.getDocumentById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/documents/:id', (req, res) => {
  try {
    const result = DocumentService.deleteDocument(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// SMART PLANNER & SCHEDULES
// ==========================================
apiRouter.get('/schedules', (req, res) => {
  try {
    const { date, id } = req.query as any;
    const schedule = ScheduleService.getSchedule(id || date);
    const all = ScheduleService.getAllSchedules();
    res.json({ current: schedule, history: all });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/schedules/generate', (req, res) => {
  try {
    const { date, available_time, task_ids, status } = req.body;
    const sched = ScheduleService.generateSchedule({
      date,
      available_time: available_time ? Number(available_time) : undefined,
      task_ids,
      status: status || 'proposed'
    });
    res.status(201).json(sched);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/schedules/:id/approve', (req, res) => {
  try {
    const approved = ScheduleService.approveSchedule(req.params.id);
    res.json(approved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/schedules/:id', (req, res) => {
  try {
    const updated = ScheduleService.updateSchedule(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/schedules/conflicts', (req, res) => {
  try {
    const { sessions } = req.body;
    if (!sessions || !Array.isArray(sessions)) {
      res.status(400).json({ error: 'Sessions array is required.' });
      return;
    }
    const result = ScheduleService.checkScheduleConflicts(sessions);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// QUIZZES
// ==========================================
apiRouter.get('/quizzes', (req, res) => {
  try {
    const quizzes = QuizService.listQuizzes();
    res.json(quizzes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/quizzes', (req, res) => {
  try {
    const { topic_or_doc_id, count, difficulty } = req.body;
    const quiz = QuizService.createQuiz({
      topic_or_doc_id: topic_or_doc_id || 'Computer Networks',
      count: count ? Number(count) : 10,
      difficulty
    });
    res.status(201).json(quiz);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/quizzes/attempts', (req, res) => {
  try {
    const { quiz_id } = req.query as any;
    const attempts = QuizService.getQuizAttempts(quiz_id);
    res.json(attempts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/quizzes/:id', (req, res) => {
  try {
    const quiz = QuizService.getQuizById(req.params.id);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }
    res.json(quiz);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/quizzes/:id/submit', (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ error: 'Answers object is required' });
      return;
    }
    const result = QuizService.submitQuizAnswers(req.params.id, answers);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// PREFERENCES & ACTIVITY
// ==========================================
apiRouter.get('/preferences', (req, res) => {
  try {
    const prefs = PreferenceService.getAllPreferences();
    res.json(prefs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/preferences', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ error: 'Key and value are required.' });
      return;
    }
    const pref = PreferenceService.savePreference(key, String(value));
    res.json(pref);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/activity', (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 25;
    const events = ActivityService.getRecentEvents(limit);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// WORKFLOWS & EXECUTION VERIFICATION
// ==========================================
apiRouter.get('/workflows', (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const workflows = WorkflowService.listWorkflows(limit);
    res.json(workflows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/workflows/:id', (req, res) => {
  try {
    const workflow = WorkflowService.getWorkflow(req.params.id);
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json(workflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/workflows/:id/verify', (req, res) => {
  try {
    const verification = WorkflowService.verifyWorkflowArtifacts(req.params.id);
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/workflows/:id/verify', (req, res) => {
  try {
    const verification = WorkflowService.verifyWorkflowArtifacts(req.params.id);
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/workflows/run', async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== 'string') {
      res.status(400).json({ error: 'Goal description is required.' });
      return;
    }
    const response = await AgentEngine.processUserMessage(goal);
    res.json({
      workflowId: response.workflowId,
      message: response.message,
      proposedSchedule: response.proposedSchedule,
      generatedQuizId: response.generatedQuizId,
      activities: response.activities
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Workflow execution failed.' });
  }
});
