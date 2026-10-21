import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  FileText,
  Plus
} from 'lucide-react';
import { api } from '../services/api.js';
import { TaskItem, DocumentItem, ScheduleItem, ScheduleSession } from '../../../shared/src/types.js';
import { NavTab } from '../components/Sidebar.js';

interface DashboardProps {
  setActiveTab: (tab: NavTab) => void;
  onSendPrompt: (prompt: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onSendPrompt }) => {
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [taskStats, setTaskStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [priorityTasks, setPriorityTasks] = useState<TaskItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, docsData, schedData] = await Promise.all([
        api.getTasks({ status: 'pending' }),
        api.getDocuments(),
        api.getSchedules()
      ]);

      setTaskStats({
        total: tasksData.stats.total,
        pending: tasksData.stats.pending,
        completed: tasksData.stats.completed
      });
      // Show up to 3 highest priority tasks
      setPriorityTasks(tasksData.tasks.slice(0, 3));
      setDocuments(docsData);
      setSchedule(schedData.current);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: TaskItem) => {
    try {
      if (task.status === 'completed') {
        await api.updateTask(task.id, { status: 'pending' });
      } else {
        await api.completeTask(task.id);
      }
      loadData();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendPrompt(inputText.trim());
  };

  // Determine greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate next deadline
  const nextDeadline = priorityTasks.length > 0 && priorityTasks[0].deadline
    ? priorityTasks[0].deadline
    : 'None upcoming';

  // Count active study sessions today
  const studySessionsCount = schedule?.sessions
    ? schedule.sessions.filter(s => !s.is_break).length
    : 0;

  // Next upcoming session
  const upcomingSession: ScheduleSession | undefined = schedule?.sessions?.find(s => !s.is_break);

  return (
    <div className="page-wrapper" style={{ maxWidth: '1080px' }}>
      {/* Header Greeting */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {getGreeting()}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          What would you like to get done today?
        </p>
      </div>

      {/* Main AI Assistant Panel */}
      <div
        className="nexus-card"
        style={{
          padding: '28px 32px',
          marginBottom: '32px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            What can I help you accomplish?
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Ask Nexus AI to organise your tasks, understand your notes, or plan your next study session.
          </p>
        </div>

        {/* Conversational Input */}
        <form onSubmit={handleInputSubmit} style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            className="input-field"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Nexus AI anything..."
            style={{
              padding: '14px 48px 14px 18px',
              fontSize: '0.925rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)'
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: inputText.trim() ? 'var(--accent-emerald)' : 'transparent',
              color: inputText.trim() ? 'var(--text-inverse)' : 'var(--text-muted)',
              border: 'none',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Send request"
          >
            <Send size={16} />
          </button>
        </form>

        {/* 3 Compact Suggestion Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onSendPrompt('Analyse my uploaded notes and identify the important exam topics')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <BookOpen size={14} style={{ color: 'var(--accent-emerald)' }} />
            <span>Analyse my notes</span>
          </button>

          <button
            type="button"
            onClick={() => onSendPrompt('Create a balanced revision plan and schedule study sessions for today')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <Calendar size={14} style={{ color: 'var(--accent-teal)' }} />
            <span>Plan my day</span>
          </button>

          <button
            type="button"
            onClick={() => onSendPrompt('Generate a 10-question practice quiz based on my networking notes')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <Sparkles size={14} style={{ color: 'var(--warning)' }} />
            <span>Create a practice quiz</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics (Max 4 small, clean, genuine metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        <div className="nexus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Pending tasks
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {taskStats.pending}
          </div>
        </div>

        <div className="nexus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Documents
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {documents.length}
          </div>
        </div>

        <div className="nexus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Next deadline
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nextDeadline}
          </div>
        </div>

        <div className="nexus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Study sessions today
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {studySessionsCount}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Today's Priorities & Today's Schedule */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Today's Priorities (Max 3 tasks) */}
        <div className="nexus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Today's priorities
            </h4>
            <button
              onClick={() => setActiveTab('tasks')}
              className="btn-subtle"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              View all tasks
            </button>
          </div>

          {priorityTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
              <p style={{ marginBottom: '12px' }}>You have no pending tasks today.</p>
              <button onClick={() => setActiveTab('tasks')} className="btn btn-secondary" style={{ fontSize: '0.775rem', padding: '6px 12px' }}>
                <Plus size={14} />
                <span>Create a task</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {priorityTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <button
                    onClick={() => handleToggleTask(task)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: task.status === 'completed' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Mark task"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--border-card)' }} />
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Due {task.deadline}
                    </div>
                  </div>

                  <span className={`badge badge-${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Schedule (Clean & scan-friendly) */}
        <div className="nexus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Today's schedule
            </h4>
            <button
              onClick={() => setActiveTab('planner')}
              className="btn-subtle"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              View planner
            </button>
          </div>

          {!upcomingSession ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
              <p style={{ marginBottom: '12px' }}>No study sessions scheduled for today.</p>
              <button onClick={() => setActiveTab('planner')} className="btn btn-secondary" style={{ fontSize: '0.775rem', padding: '6px 12px' }}>
                <Calendar size={14} />
                <span>Open planner</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-emerald)',
                    flexShrink: 0
                  }}
                >
                  <Clock size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {upcomingSession.title}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {upcomingSession.start_time} - {upcomingSession.end_time} ({upcomingSession.duration_minutes}m)
                  </div>
                </div>

                <span className="badge badge-success">
                  Upcoming
                </span>
              </div>

              {schedule && schedule.sessions && schedule.sessions.length > 1 && (
                <div style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  + {schedule.sessions.length - 1} more sessions today in Planner
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
