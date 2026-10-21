import React from 'react';
import {
  Home,
  Bot,
  BookOpen,
  CheckSquare,
  Calendar,
  HelpCircle,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'assistant'
  | 'knowledge'
  | 'tasks'
  | 'planner'
  | 'quizzes'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  metrics?: {
    tasks?: number;
    documents?: number;
    quizzes?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  metrics
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot size={18} /> },
    { id: 'knowledge', label: 'Knowledge', icon: <BookOpen size={18} />, badge: metrics?.documents },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} />, badge: metrics?.tasks },
    { id: 'planner', label: 'Planner', icon: <Calendar size={18} /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={18} />, badge: metrics?.quizzes },
    { id: 'history', label: 'History', icon: <HistoryIcon size={18} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        userSelect: 'none',
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          minHeight: '68px'
        }}
      >
        <div
          onClick={() => setActiveTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-surface)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)',
              flexShrink: 0
            }}
          >
            <Sparkles size={16} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.975rem', color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                NEXUS AI
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Personal AI Workspace
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto'
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? 'var(--accent-surface)' : 'transparent',
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontSize: '0.675rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Unobtrusive Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          fontSize: '0.725rem',
          color: 'var(--text-muted)'
        }}
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-emerald)'
                }}
              />
              <span>System active</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.725rem'
              }}
            >
              v1.0
            </button>
          </>
        )}
      </div>
    </aside>
  );
};
