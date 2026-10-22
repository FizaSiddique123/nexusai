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
  interview_session_id?: string;
}

export type InterviewCategory = 'technical' | 'hr' | 'behavioral' | 'managerial' | 'role_specific' | 'competitive_exam';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type InterviewMode = 'practice' | 'mock';
export type InterviewStatus = 'in_progress' | 'completed' | 'paused' | 'abandoned';

export interface InterviewRubricBreakdown {
  technical_correctness?: number; // 0-100
  conceptual_understanding?: number;
  problem_solving?: number;
  communication?: number;
  structure_star?: number;
  evidence_and_examples?: number;
}

export interface InterviewEvaluation {
  id: string;
  answer_id: string;
  question_id: string;
  session_id: string;
  score: number;
  rubric_breakdown: InterviewRubricBreakdown;
  strengths: string[];
  missing_concepts: string[];
  improvement_suggestions: string[];
  follow_up_question?: string;
  strong_example_answer?: string;
  created_at: string;
}

export interface InterviewAnswer {
  id: string;
  question_id: string;
  session_id: string;
  answer_text: string;
  submitted_code?: string;
  duration_seconds: number;
  created_at: string;
  evaluation?: InterviewEvaluation;
}

export interface InterviewQuestion {
  id: string;
  session_id: string;
  question_index: number;
  question_text: string;
  question_type: 'technical_dsa' | 'system_design' | 'dbms_os_networks' | 'hr_behavioral' | 'resume_project' | 'role_scenario';
  expected_concepts: string[];
  starter_code?: string;
  hints?: string[];
  sample_strong_answer?: string;
  created_at: string;
  answer?: InterviewAnswer;
}

export interface InterviewReport {
  id: string;
  session_id: string;
  overall_score: number;
  readiness_assessment: string;
  category_scores: Record<string, number>;
  top_strengths: string[];
  critical_weaknesses: string[];
  recommended_preparation: string[];
  created_at: string;
}

export interface InterviewSession {
  id: string;
  title: string;
  category: InterviewCategory;
  target_company?: string;
  target_role: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  programming_language?: string;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  status: InterviewStatus;
  resume_doc_id?: string;
  job_description?: string;
  current_question_index: number;
  total_questions: number;
  overall_score?: number;
  summary?: string;
  created_at: string;
  updated_at: string;
  questions?: InterviewQuestion[];
  report?: InterviewReport;
}

export interface ResumeAnalysisResult {
  candidate_name?: string;
  education: string[];
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    tech_stack?: string[];
  }>;
  experience: string[];
  certifications: string[];
  job_description_match?: {
    match_score: number; // 0-100
    matching_skills: string[];
    missing_skills: string[];
    recommended_study_topics: string[];
    generated_project_questions: string[];
  };
}


