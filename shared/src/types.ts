export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  created_at: string;
  chunk_count?: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  page_number: number;
  content: string;
  token_count: number;
}

export interface DocumentSearchResult {
  chunk_id: string;
  document_id: string;
  filename: string;
  page_number: number;
  content: string;
  score?: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: TaskPriority;
  estimated_duration: number; // in minutes
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSession {
  id: string;
  schedule_id: string;
  task_id?: string | null;
  title: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  duration_minutes: number;
  is_break: boolean;
  order_index: number;
}

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  total_study_minutes: number;
  status: 'proposed' | 'approved' | 'active';
  created_at: string;
  updated_at: string;
  sessions?: ScheduleSession[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  source_reference?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partially_completed' | 'cancelled';

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  tool_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_params?: any;
  output_result?: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface WorkflowItem {
  id: string;
  goal: string;
  status: WorkflowStatus;
  exam_date?: string;
  artifacts: {
    document_ids?: string[];
    task_ids?: string[];
    schedule_id?: string;
    quiz_id?: string;
  };
  steps?: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export interface ImportantTopic {
  topic: string;
  explanation: string;
  supporting_evidence: string;
  source_reference: {
    document_id?: string;
    filename: string;
    page_number: number;
    chunk_id?: string;
  };
  confidence: number;
  estimated_difficulty: 'easy' | 'medium' | 'hard';
}

export interface RevisionPlan {
  id: string;
  exam_date: string;
  available_time_minutes: number;
  ordered_topics: {
    topic: string;
    allocated_minutes: number;
    priority: 'low' | 'medium' | 'high';
    notes_reference?: string;
  }[];
  break_intervals: {
    after_minutes: number;
    duration_minutes: number;
  }[];
  assumptions: string[];
  created_at: string;
}

export interface QuizItem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_count: number;
  document_id?: string | null;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: Record<string, number>; // questionId -> chosenIndex
  completed_at: string;
}

export interface UserPreference {
  key: string;
  value: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  event_type: 'tool_execution' | 'agent_query' | 'task_created' | 'task_updated' | 'schedule_generated' | 'quiz_taken' | 'document_uploaded' | 'workflow_created' | 'workflow_completed';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ToolInvocation {
  tool: string;
  status: 'running' | 'completed' | 'failed';
  summary: string;
  input?: any;
  output?: any;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tool_invocations?: ToolInvocation[];
  proposed_schedule?: ScheduleItem;
  generated_quiz_id?: string;
  workflow_id?: string;
}

