import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  Database,
  Radio,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api.js';

export const Settings: React.FC = () => {
  const [prefs, setPrefs] = useState({
    study_start_time: '09:00',
    study_end_time: '18:00',
    session_duration_minutes: '45',
    break_duration_minutes: '15',
    daily_max_study_hours: '6',
    exam_target_date: '2026-10-28'
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const preferences = await api.getPreferences();
      setPrefs({
        study_start_time: preferences.study_start_time || '09:00',
        study_end_time: preferences.study_end_time || '18:00',
        session_duration_minutes: preferences.session_duration_minutes || '45',
        break_duration_minutes: preferences.break_duration_minutes || '15',
        daily_max_study_hours: preferences.daily_max_study_hours || '6',
        exam_target_date: preferences.exam_target_date || '2026-10-28'
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all(
        Object.entries(prefs).map(([k, v]) => api.savePreference(k, String(v)))
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Settings & Preferences
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Configure your daily study routine, available hours, and review connection status.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Study Routine Form */}
        <div className="nexus-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Study routine preferences
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Daily study start time
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={prefs.study_start_time}
                  onChange={e => setPrefs({ ...prefs, study_start_time: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Daily max hours
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={prefs.daily_max_study_hours}
                  onChange={e => setPrefs({ ...prefs, daily_max_study_hours: e.target.value })}
                  min={1}
                  max={14}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Session duration (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={prefs.session_duration_minutes}
                  onChange={e => setPrefs({ ...prefs, session_duration_minutes: e.target.value })}
                  min={15}
                  step={5}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Break duration (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={prefs.break_duration_minutes}
                  onChange={e => setPrefs({ ...prefs, break_duration_minutes: e.target.value })}
                  min={5}
                  step={5}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                Target exam date
              </label>
              <input
                type="date"
                className="input-field"
                value={prefs.exam_target_date}
                onChange={e => setPrefs({ ...prefs, exam_target_date: e.target.value })}
                style={{ maxWidth: '240px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              {saveSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={15} />
                  <span>Preferences saved</span>
                </div>
              )}
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save preferences'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* System & MCP Diagnostics */}
        <div className="nexus-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
            System & MCP connection
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Radio size={15} color="var(--accent-emerald)" />
                <span style={{ fontWeight: 500 }}>MCP server protocol</span>
              </div>
              <span className="badge badge-success">2025-11-25 (Streamable HTTP)</span>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Database size={15} color="var(--accent-teal)" />
                <span style={{ fontWeight: 500 }}>Database storage</span>
              </div>
              <span className="badge badge-status">SQLite WAL & FTS5</span>
            </div>
          </div>
        </div>

        {/* Data Maintenance */}
        <div className="nexus-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Conversation data
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Clear past chat history while keeping your saved tasks, documents, and schedules intact.
          </p>

          <button
            onClick={async () => {
              if (window.confirm('Clear all conversation messages?')) {
                await api.clearChatHistory();
                alert('Conversation history cleared.');
              }
            }}
            className="btn btn-secondary"
          >
            <RotateCcw size={14} />
            <span>Clear conversation history</span>
          </button>
        </div>
      </div>
    </div>
  );
};
