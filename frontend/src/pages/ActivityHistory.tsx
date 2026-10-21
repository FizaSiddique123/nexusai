import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { ActivityEvent } from '../../../shared/src/types.js';

export const ActivityHistory: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getActivity(50);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (type: ActivityEvent['event_type']) => {
    switch (type) {
      case 'tool_execution':
        return <span className="badge badge-success">Tool</span>;
      case 'agent_query':
        return <span className="badge badge-status">Prompt</span>;
      case 'task_created':
      case 'task_updated':
        return <span className="badge badge-medium">Task</span>;
      case 'schedule_generated':
        return <span className="badge badge-low">Schedule</span>;
      case 'quiz_taken':
        return <span className="badge badge-high">Quiz</span>;
      case 'document_uploaded':
        return <span className="badge badge-success">Document</span>;
      default:
        return <span className="badge badge-status">{type}</span>;
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            History
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Chronological log of AI tool executions, task updates, and document operations.
          </p>
        </div>

        <button onClick={loadEvents} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="nexus-card" style={{ padding: '18px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading history...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No activity recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    {getEventBadge(evt.event_type)}
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {evt.title}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    {evt.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Clock size={12} />
                  <span>{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
