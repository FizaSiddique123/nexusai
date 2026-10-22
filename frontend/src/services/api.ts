import {
  DocumentItem,
  TaskItem,
  ScheduleItem,
  QuizItem,
  QuizAttempt,
  ChatMessage,
  ActivityEvent,
  DocumentSearchResult,
  WorkflowItem
} from '../../../shared/src/types.js';

const API_BASE = '/api';

export const api = {
  // System status
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  // AI Agent & Chat
  async sendChatMessage(message: string): Promise<{
    message: ChatMessage;
    proposedSchedule?: ScheduleItem;
    generatedQuizId?: string;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Chat request failed' }));
      throw new Error(err.error || 'Chat request failed');
    }
    return res.json();
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/chat/history`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  async clearChatHistory() {
    const res = await fetch(`${API_BASE}/chat/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear chat history');
    return res.json();
  },

  // Tasks
  async getTasks(params?: { status?: string; priority?: string; search?: string }): Promise<{
    stats: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      high_priority: number;
      due_today: number;
      completion_rate: number;
    };
    tasks: TaskItem[];
  }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/tasks${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(task: {
    title: string;
    description?: string;
    deadline?: string;
    priority?: string;
    estimated_duration?: number;
  }): Promise<TaskItem> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async completeTask(id: string): Promise<TaskItem> {
    const res = await fetch(`${API_BASE}/tasks/${id}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  async deleteTask(id: string) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async searchDocuments(query: string, documentId?: string): Promise<DocumentSearchResult[]> {
    const params = new URLSearchParams({ query });
    if (documentId) params.append('document_id', documentId);
    const res = await fetch(`${API_BASE}/documents/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search documents');
    return res.json();
  },

  async deleteDocument(id: string) {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  // Schedules
  async getSchedules(date?: string): Promise<{
    current: ScheduleItem | null;
    history: ScheduleItem[];
  }> {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${API_BASE}/schedules${query}`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
  },

  async generateSchedule(params: {
    date?: string;
    available_time?: number;
    task_ids?: string[];
    status?: 'proposed' | 'approved';
  }): Promise<ScheduleItem> {
    const res = await fetch(`${API_BASE}/schedules/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to generate schedule');
    return res.json();
  },

  async approveSchedule(id: string): Promise<ScheduleItem> {
    const res = await fetch(`${API_BASE}/schedules/${id}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to approve schedule');
    return res.json();
  },

  async updateSchedule(id: string, updates: any): Promise<ScheduleItem> {
    const res = await fetch(`${API_BASE}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update schedule');
    return res.json();
  },

  async checkConflicts(sessions: any[]) {
    const res = await fetch(`${API_BASE}/schedules/conflicts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions })
    });
    if (!res.ok) throw new Error('Failed to check conflicts');
    return res.json();
  },

  // Quizzes
  async getQuizzes(): Promise<QuizItem[]> {
    const res = await fetch(`${API_BASE}/quizzes`);
    if (!res.ok) throw new Error('Failed to fetch quizzes');
    return res.json();
  },

  async getQuizById(id: string): Promise<QuizItem> {
    const res = await fetch(`${API_BASE}/quizzes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch quiz');
    return res.json();
  },

  async createQuiz(params: {
    topic_or_doc_id: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<QuizItem> {
    const res = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to create quiz');
    return res.json();
  },

  async submitQuiz(quizId: string, answers: Record<string, number>): Promise<{
    attempt: QuizAttempt;
    details: Array<{
      question_id: string;
      question: string;
      selected_index: number;
      correct_index: number;
      is_correct: boolean;
      explanation: string;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    if (!res.ok) throw new Error('Failed to submit quiz');
    return res.json();
  },

  async getQuizAttempts(quizId?: string): Promise<QuizAttempt[]> {
    const query = quizId ? `?quiz_id=${quizId}` : '';
    const res = await fetch(`${API_BASE}/quizzes/attempts${query}`);
    if (!res.ok) throw new Error('Failed to fetch quiz attempts');
    return res.json();
  },

  // Preferences & Activity
  async getPreferences(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/preferences`);
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  async savePreference(key: string, value: string) {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) throw new Error('Failed to save preference');
    return res.json();
  },

  async getActivity(limit = 25): Promise<ActivityEvent[]> {
    const res = await fetch(`${API_BASE}/activity?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },

  // Workflows & Agent Execution State
  async getWorkflows(limit = 20): Promise<WorkflowItem[]> {
    const res = await fetch(`${API_BASE}/workflows?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  async getWorkflow(id: string): Promise<WorkflowItem> {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    if (!res.ok) throw new Error('Failed to fetch workflow');
    return res.json();
  },

  async verifyWorkflow(id: string): Promise<{
    verified: boolean;
    taskCount: number;
    hasSchedule: boolean;
    hasQuiz: boolean;
    details: string;
    artifacts: any;
  }> {
    const res = await fetch(`${API_BASE}/workflows/${id}/verify`);
    if (!res.ok) throw new Error('Failed to verify workflow');
    return res.json();
  }
};
