import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Coffee,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.js';
import { ScheduleItem } from '../../../shared/src/types.js';

export const Planner: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules(selectedDate);
      setSchedule(res.current);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const sched = await api.generateSchedule({
        date: selectedDate,
        available_time: 240,
        status: 'proposed'
      });
      setSchedule(sched);
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!schedule) return;
    try {
      setApproving(true);
      const approved = await api.approveSchedule(schedule.id);
      setSchedule(approved);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1080px' }}>
      {/* Header */}
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
            Planner
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Structured study sessions and scheduled rest intervals based on your notes and tasks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            className="input-field"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
          />

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={14} className={generating ? 'spin' : ''} />
            <span>{generating ? 'Optimizing...' : 'Regenerate'}</span>
          </button>

          {schedule?.status === 'proposed' && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Check size={14} />
              <span>{approving ? 'Saving...' : 'Approve schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Schedule Panel */}
      <div className="nexus-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {schedule ? schedule.title : `Schedule for ${selectedDate}`}
            </h3>
            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
              {schedule ? `Total study time: ${schedule.total_study_minutes} minutes` : 'No study sessions scheduled for this date.'}
            </p>
          </div>

          {schedule && (
            <span className={`badge ${schedule.status === 'approved' ? 'badge-success' : 'badge-medium'}`}>
              {schedule.status === 'approved' ? 'Approved' : 'Pending approval'}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading schedule from database...
          </div>
        ) : !schedule || !schedule.sessions || schedule.sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
            <CalendarIcon size={32} color="var(--border-subtle)" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>No sessions scheduled for this day</div>
            <p style={{ maxWidth: '360px', margin: '4px auto 14px auto', fontSize: '0.8rem' }}>
              Click "Regenerate" or ask the AI Assistant to schedule study blocks from your notes.
            </p>
            <button onClick={handleGenerate} className="btn btn-primary">
              <Sparkles size={15} />
              <span>Generate study plan</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {schedule.sessions.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: s.is_break ? 'rgba(245, 158, 11, 0.04)' : 'var(--bg-input)',
                  border: `1px solid ${s.is_break ? 'rgba(245, 158, 11, 0.15)' : 'var(--border-subtle)'}`
                }}
              >
                {/* Time block */}
                <div
                  style={{
                    width: '110px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    fontSize: '0.8rem'
                  }}
                >
                  <Clock size={14} color={s.is_break ? 'var(--warning)' : 'var(--accent-emerald)'} />
                  <span>{s.start_time} - {s.end_time}</span>
                </div>

                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-card)' }} />

                {/* Session description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500, color: s.is_break ? 'var(--warning)' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {s.title}
                    </span>
                    {s.is_break && (
                      <span className="badge badge-medium" style={{ fontSize: '0.625rem' }}>
                        Break
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {s.duration_minutes} minutes
                  </div>
                </div>

                <div>
                  {s.is_break ? (
                    <Coffee size={16} color="var(--warning)" />
                  ) : (
                    <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
