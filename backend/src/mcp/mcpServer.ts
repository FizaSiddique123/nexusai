import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import crypto from 'node:crypto';

// Import Shared Service Layer
import { DocumentService } from '../services/documentService.js';
import { TaskService } from '../services/taskService.js';
import { ScheduleService } from '../services/scheduleService.js';
import { QuizService } from '../services/quizService.js';
import { PreferenceService } from '../services/preferenceService.js';
import { ActivityService } from '../services/activityService.js';
import { WorkflowService } from '../services/workflowService.js';

export function createNexusMcpServer() {
  const mcp = new McpServer(
    {
      name: 'nexus-ai',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  // -------------------------------------------------------------
  // DOCUMENT INTELLIGENCE TOOLS
  // -------------------------------------------------------------

  // Tool 1: search_knowledge
  mcp.tool(
    'search_knowledge',
    'Search indexed document content and return relevant excerpts with document references and scores.',
    {
      query: z.string().describe('Search query or key concept to look up in the knowledge base'),
      document_id: z.string().optional().describe('Optional document ID to restrict search scope'),
      limit: z.number().optional().describe('Maximum number of passage chunks to retrieve (default: 5)')
    },
    async ({ query, document_id, limit }) => {
      try {
        const results = DocumentService.searchKnowledge(query, document_id, limit || 5);
        ActivityService.logEvent(
          'tool_execution',
          'MCP: search_knowledge',
          `Searched knowledge for "${query}" - found ${results.length} results.`,
          { query, count: results.length }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                count: results.length,
                results: results.map(r => ({
                  chunk_id: r.chunk_id,
                  document_id: r.document_id,
                  filename: r.filename,
                  page_number: r.page_number,
                  content: r.content,
                  score: r.score
                }))
              }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to search knowledge: ${err.message}` }]
        };
      }
    }
  );

  // Tool B: extract_important_topics
  mcp.tool(
    'extract_important_topics',
    'Identify high-priority revision topics from retrieved study material with supporting evidence, citations, and confidence scores.',
    {
      document_id: z.string().optional().describe('Optional document ID to extract topics from'),
      query: z.string().optional().describe('Optional thematic query to focus topic extraction (e.g. "Networking protocols")'),
      limit: z.number().optional().describe('Maximum number of topics to extract (default: 4)')
    },
    async ({ document_id, query, limit }) => {
      try {
        const topics = DocumentService.extractImportantTopics(document_id, query, limit || 4);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: topics.length,
                topics
              }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to extract topics: ${err.message}` }]
        };
      }
    }
  );

  // Tool 2: list_documents
  mcp.tool(
    'list_documents',
    'Return metadata and passage chunk counts for all indexed documents in the knowledge base.',
    {},
    async () => {
      try {
        const docs = DocumentService.listDocuments();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(docs, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to list documents: ${err.message}` }]
        };
      }
    }
  );

  // Tool 3: get_document_content
  mcp.tool(
    'get_document_content',
    'Retrieve extracted text and structured chunks for a specific document by ID.',
    {
      document_id: z.string().describe('The unique ID of the document')
    },
    async ({ document_id }) => {
      try {
        const doc = DocumentService.getDocumentById(document_id);
        if (!doc) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Document with ID ${document_id} was not found.` }]
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(doc, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to get document content: ${err.message}` }]
        };
      }
    }
  );

  // -------------------------------------------------------------
  // TASK MANAGEMENT TOOLS
  // -------------------------------------------------------------

  // Tool 4: create_task
  mcp.tool(
    'create_task',
    'Create a new actionable study task with priority, estimated duration, and due date.',
    {
      title: z.string().describe('Title of the task'),
      description: z.string().optional().describe('Detailed description or objectives'),
      deadline: z.string().optional().describe('Due date formatted as YYYY-MM-DD'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Task urgency level (default: medium)'),
      estimated_duration: z.number().optional().describe('Estimated duration in minutes (default: 60)')
    },
    async ({ title, description, deadline, priority, estimated_duration }) => {
      try {
        const task = TaskService.createTask({
          title,
          description,
          deadline,
          priority: priority as any,
          estimated_duration
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Task created successfully', task }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to create task: ${err.message}` }]
        };
      }
    }
  );

  // Tool 5: get_tasks
  mcp.tool(
    'get_tasks',
    'Retrieve existing tasks with optional status filter (pending, in_progress, completed, all) and keyword search.',
    {
      status: z.enum(['all', 'pending', 'in_progress', 'completed']).optional().describe('Filter by status'),
      priority: z.enum(['all', 'low', 'medium', 'high']).optional().describe('Filter by priority'),
      search: z.string().optional().describe('Filter by keyword search in title or description')
    },
    async ({ status, priority, search }) => {
      try {
        const tasks = TaskService.getTasks({ status, priority, search });
        const stats = TaskService.getTaskStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: tasks.length, stats, tasks }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to get tasks: ${err.message}` }]
        };
      }
    }
  );

  // Tool 6: update_task
  mcp.tool(
    'update_task',
    'Update an existing task (title, description, deadline, priority, duration, or status).',
    {
      task_id: z.string().describe('The ID of the task to update'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      deadline: z.string().optional().describe('New deadline (YYYY-MM-DD)'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('New priority'),
      estimated_duration: z.number().optional().describe('New estimated duration in minutes'),
      status: z.enum(['pending', 'in_progress', 'completed']).optional().describe('New status')
    },
    async ({ task_id, title, description, deadline, priority, estimated_duration, status }) => {
      try {
        const updated = TaskService.updateTask(task_id, {
          title,
          description,
          deadline,
          priority: priority as any,
          estimated_duration,
          status: status as any
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Task updated successfully', task: updated }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to update task: ${err.message}` }]
        };
      }
    }
  );

  // Tool 7: complete_task
  mcp.tool(
    'complete_task',
    'Mark a specific task as completed.',
    {
      task_id: z.string().describe('The ID of the task to mark completed')
    },
    async ({ task_id }) => {
      try {
        const completed = TaskService.completeTask(task_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Task completed', task: completed }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to complete task: ${err.message}` }]
        };
      }
    }
  );

  // Tool 8: delete_task
  mcp.tool(
    'delete_task',
    'Delete a task by ID. Requires explicit user confirmation check.',
    {
      task_id: z.string().describe('The ID of the task to delete')
    },
    async ({ task_id }) => {
      try {
        const res = TaskService.deleteTask(task_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Task deleted successfully', task_id: res.id }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to delete task: ${err.message}` }]
        };
      }
    }
  );

  // -------------------------------------------------------------
  // SCHEDULING TOOLS
  // -------------------------------------------------------------

  // Tool C: create_revision_plan
  mcp.tool(
    'create_revision_plan',
    'Synthesize a realistic, time-aware revision plan for an upcoming exam with ordered topics, study durations, restorative breaks, and clear assumptions.',
    {
      exam_date: z.string().describe('Target exam date (e.g. "Friday" or "YYYY-MM-DD")'),
      available_study_time: z.number().optional().describe('Total available study time in minutes (default: 240)'),
      topics: z.array(z.string()).optional().describe('List of revision topics to include in the plan'),
      preferences: z.record(z.string(), z.any()).optional().describe('Optional user study preferences (start_time, break_duration)')
    },
    async ({ exam_date, available_study_time, topics, preferences }) => {
      try {
        const plan = ScheduleService.createRevisionPlan({
          examDate: exam_date,
          availableStudyTimeMinutes: available_study_time,
          topics,
          preferences
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Revision plan created', plan }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to create revision plan: ${err.message}` }]
        };
      }
    }
  );

  // Tool D: schedule_study_sessions
  mcp.tool(
    'schedule_study_sessions',
    'Persist study sessions into the internal application schedule, run conflict detection, and confirm session timeblocks.',
    {
      date: z.string().describe('Date for the revision sessions (YYYY-MM-DD)'),
      sessions: z.array(z.object({
        title: z.string().describe('Session title'),
        start_time: z.string().describe('Start time in HH:mm format, e.g. 09:00'),
        end_time: z.string().describe('End time in HH:mm format, e.g. 09:45'),
        duration_minutes: z.number().describe('Duration in minutes'),
        is_break: z.boolean().optional().describe('Whether this block is a restorative break'),
        task_id: z.string().optional().describe('Associated task ID')
      })).describe('List of study sessions to lock into the calendar'),
      status: z.enum(['proposed', 'approved']).optional().describe('Schedule status (default: proposed)'),
      revision_plan_id: z.string().optional().describe('Associated revision plan ID')
    },
    async ({ date, sessions, status, revision_plan_id }) => {
      try {
        const result = ScheduleService.scheduleStudySessions({
          date,
          sessions,
          status: status || 'proposed',
          revisionPlanId: revision_plan_id
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to schedule study sessions: ${err.message}` }]
        };
      }
    }
  );

  // Tool 9: generate_schedule
  mcp.tool(
    'generate_schedule',
    'Generate an intelligent study revision schedule for a specific date that allocates task blocks and rest breaks.',
    {
      date: z.string().optional().describe('Date for the schedule (YYYY-MM-DD, defaults to tomorrow)'),
      available_time: z.number().optional().describe('Total available study time in minutes (default: 360 = 6 hours)'),
      task_ids: z.array(z.string()).optional().describe('Specific task IDs to include in the schedule'),
      status: z.enum(['proposed', 'approved']).optional().describe('Initial status of schedule (default: proposed)')
    },
    async ({ date, available_time, task_ids, status }) => {
      try {
        const schedule = ScheduleService.generateSchedule({
          date,
          available_time,
          task_ids,
          status: status || 'proposed'
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'Revision schedule generated',
                schedule
              }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to generate schedule: ${err.message}` }]
        };
      }
    }
  );

  // Tool 10: get_schedule
  mcp.tool(
    'get_schedule',
    'Retrieve the saved study schedule for a specific date or schedule ID, including all study sessions and breaks.',
    {
      date_or_id: z.string().optional().describe('Schedule ID or date (YYYY-MM-DD). If omitted, returns latest schedule.')
    },
    async ({ date_or_id }) => {
      try {
        const schedule = ScheduleService.getSchedule(date_or_id);
        if (!schedule) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ message: 'No schedule found for the given criteria.' })
              }
            ]
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(schedule, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to retrieve schedule: ${err.message}` }]
        };
      }
    }
  );

  // Tool 11: update_schedule
  mcp.tool(
    'update_schedule',
    'Update an existing schedule title, status (e.g. approve proposed schedule), or session timeline.',
    {
      schedule_id: z.string().describe('The ID of the schedule to update'),
      title: z.string().optional().describe('Updated schedule title'),
      status: z.enum(['proposed', 'approved', 'active']).optional().describe('New schedule status'),
      sessions: z.array(z.object({
        title: z.string(),
        start_time: z.string(),
        end_time: z.string(),
        duration_minutes: z.number(),
        is_break: z.boolean().optional(),
        task_id: z.string().optional()
      })).optional().describe('New list of sessions')
    },
    async ({ schedule_id, title, status, sessions }) => {
      try {
        const updated = ScheduleService.updateSchedule(schedule_id, {
          title,
          status,
          sessions
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Schedule updated successfully', schedule: updated }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to update schedule: ${err.message}` }]
        };
      }
    }
  );

  // Tool 12: check_schedule_conflicts
  mcp.tool(
    'check_schedule_conflicts',
    'Analyze a list of proposed study sessions and detect any time overlaps or invalid ranges.',
    {
      sessions: z.array(z.object({
        start_time: z.string().describe('HH:mm format, e.g. 09:00'),
        end_time: z.string().describe('HH:mm format, e.g. 10:00'),
        title: z.string().optional().describe('Session title')
      })).describe('Array of session time blocks to check')
    },
    async ({ sessions }) => {
      try {
        const check = ScheduleService.checkScheduleConflicts(sessions);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(check, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Conflict check error: ${err.message}` }]
        };
      }
    }
  );

  // -------------------------------------------------------------
  // QUIZ TOOLS
  // -------------------------------------------------------------

  // Tool 13: create_quiz
  mcp.tool(
    'create_quiz',
    'Generate an assessment quiz from uploaded documents or specific topics with multiple choice questions.',
    {
      topic_or_doc_id: z.string().describe('Topic name or document ID to generate questions from'),
      question_count: z.number().optional().describe('Number of questions (default: 10)'),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Difficulty level (default: medium)')
    },
    async ({ topic_or_doc_id, question_count, difficulty }) => {
      try {
        const quiz = QuizService.createQuiz({
          topic_or_doc_id,
          count: question_count,
          difficulty
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Quiz created successfully', quiz }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to create quiz: ${err.message}` }]
        };
      }
    }
  );

  // Tool 14: submit_quiz_answers
  mcp.tool(
    'submit_quiz_answers',
    'Submit answers for a quiz, calculate score and percentage, and store the attempt.',
    {
      quiz_id: z.string().describe('ID of the quiz being taken'),
      submitted_answers: z.record(z.string(), z.number()).describe('Map of question_id to chosen option index (0-3)')
    },
    async ({ quiz_id, submitted_answers }) => {
      try {
        const result = QuizService.submitQuizAnswers(quiz_id, submitted_answers);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to submit quiz answers: ${err.message}` }]
        };
      }
    }
  );

  // Tool 15: get_quiz_results
  mcp.tool(
    'get_quiz_results',
    'Retrieve quiz details, past attempt scores, and correct answers with explanations.',
    {
      quiz_id: z.string().describe('ID of the quiz')
    },
    async ({ quiz_id }) => {
      try {
        const quiz = QuizService.getQuizById(quiz_id);
        const attempts = QuizService.getQuizAttempts(quiz_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ quiz, attempts }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to get quiz results: ${err.message}` }]
        };
      }
    }
  );

  // -------------------------------------------------------------
  // PREFERENCE TOOLS
  // -------------------------------------------------------------

  // Tool 16: save_preference
  mcp.tool(
    'save_preference',
    'Save or update a user configuration preference (e.g. study_start_time, daily_max_study_hours).',
    {
      preference_key: z.string().describe('Key name for the preference'),
      preference_value: z.string().describe('Value to store')
    },
    async ({ preference_key, preference_value }) => {
      try {
        const pref = PreferenceService.savePreference(preference_key, preference_value);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Preference saved', preference: pref }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to save preference: ${err.message}` }]
        };
      }
    }
  );

  // Tool 17: retrieve_preferences
  mcp.tool(
    'retrieve_preferences',
    'Retrieve all saved user preferences and study settings.',
    {},
    async () => {
      try {
        const prefs = PreferenceService.getAllPreferences();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(prefs, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to retrieve preferences: ${err.message}` }]
        };
      }
    }
  );

  // Tool E: generate_quiz
  mcp.tool(
    'generate_quiz',
    'Generate practice questions grounded in retrieved notes with options, correct answer, explanation, source references, difficulty, and topic association.',
    {
      topic_or_doc_id: z.string().describe('Topic name or document ID to generate questions from'),
      question_count: z.number().optional().describe('Number of questions (default: 10)'),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('Difficulty level (default: medium)')
    },
    async ({ topic_or_doc_id, question_count, difficulty }) => {
      try {
        const quiz = QuizService.generateQuiz({
          topic_or_doc_id,
          question_count,
          difficulty
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Quiz generated successfully', quiz }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to generate quiz: ${err.message}` }]
        };
      }
    }
  );

  // -------------------------------------------------------------
  // WORKFLOW ORCHESTRATION & VERIFICATION TOOLS
  // -------------------------------------------------------------

  // Tool F: get_workflow_status
  mcp.tool(
    'get_workflow_status',
    'Retrieve the verifiable status of an execution workflow, including completed/running/failed steps, tool-call outcomes, and verified persisted artifacts.',
    {
      workflow_id: z.string().describe('Unique ID of the workflow execution to inspect')
    },
    async ({ workflow_id }) => {
      try {
        const workflow = WorkflowService.getWorkflow(workflow_id);
        if (!workflow) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ exists: false, message: `Workflow with ID ${workflow_id} was not found.` }, null, 2)
              }
            ]
          };
        }

        const verification = WorkflowService.verifyWorkflowArtifacts(workflow_id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                workflow_id: workflow.id,
                goal: workflow.goal,
                status: workflow.status,
                exam_date: workflow.exam_date,
                created_at: workflow.created_at,
                updated_at: workflow.updated_at,
                steps_count: workflow.steps?.length || 0,
                completed_steps: workflow.steps?.filter(s => s.status === 'completed').length || 0,
                running_steps: workflow.steps?.filter(s => s.status === 'running').length || 0,
                failed_steps: workflow.steps?.filter(s => s.status === 'failed').length || 0,
                steps: workflow.steps,
                artifacts: workflow.artifacts,
                verification
              }, null, 2)
            }
          ]
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to retrieve workflow status: ${err.message}` }]
        };
      }
    }
  );

  return mcp;
}

export function createMcpStreamableTransport() {
  return new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID()
  });
}
