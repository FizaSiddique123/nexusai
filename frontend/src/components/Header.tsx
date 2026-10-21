import React from 'react';
import { Settings as SettingsIcon, Bell } from 'lucide-react';
import { NavTab } from './Sidebar.js';

interface HeaderProps {
  activeTab: NavTab;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenSettings }) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    home: { title: 'Home', subtitle: 'Personal workspace and daily progress' },
    assistant: { title: 'AI Assistant', subtitle: 'Conversational planning, note analysis, and tool execution' },
    knowledge: { title: 'Knowledge', subtitle: 'Upload and search your study notes and reference documents' },
    tasks: { title: 'Tasks', subtitle: 'Manage your study priorities, deadlines, and durations' },
    planner: { title: 'Planner', subtitle: 'Review and adjust your daily study sessions and rest intervals' },
    quizzes: { title: 'Quizzes', subtitle: 'Assess your knowledge with quizzes generated directly from your notes' },
    history: { title: 'History', subtitle: 'Activity log of your actions and AI tool events' },
    settings: { title: 'Settings', subtitle: 'Preferences, study schedules, and system status' }
  };

  const current = titles[activeTab] || titles.home;

  return (
    <header
      style={{
        padding: '16px 40px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-header)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        minHeight: '68px'
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
          {current.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenSettings}
          className="btn-subtle"
          style={{
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem'
          }}
          title="Open settings"
        >
          <SettingsIcon size={16} />
          <span>Preferences</span>
        </button>
      </div>
    </header>
  );
};
