import React from 'react';
import {
  Search,
  Clock,
  LayoutGrid,
  Sparkles,
  Settings as SettingsIcon
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
  collapsed?: boolean;
  setCollapsed?: (c: boolean) => void;
  metrics?: {
    tasks?: number;
    documents?: number;
    quizzes?: number;
  };
  onResetHero?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  onResetHero
}) => {
  // Exact 4 primary orb navigation buttons from Image 2
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'assistant', label: 'AI Assistant', icon: <Search size={21} /> },
    { id: 'planner', label: 'Planner & Schedule', icon: <Clock size={21} /> },
    { id: 'home', label: 'Modules & Dashboard', icon: <LayoutGrid size={21} />, badge: metrics?.tasks },
    { id: 'quizzes', label: 'Quiz Studio & Knowledge', icon: <Sparkles size={21} />, badge: metrics?.quizzes },
  ];

  return (
    <aside
      style={{
        width: '84px',
        background: 'linear-gradient(180deg, rgba(5, 16, 44, 0.95) 0%, rgba(2, 8, 24, 0.98) 100%)',
        borderRight: '1px solid rgba(59, 130, 246, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0 24px 0',
        zIndex: 50,
        userSelect: 'none',
        flexShrink: 0,
        position: 'relative'
      }}
    >
      {/* Top 3D Mascot Avatar from Image 2 */}
      <div
        onClick={() => {
          setActiveTab('assistant');
          onResetHero?.();
        }}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.6), rgba(37, 99, 235, 0.3))',
          boxShadow: '0 0 18px rgba(56, 189, 248, 0.35)',
          cursor: 'pointer',
          marginBottom: '38px',
          transition: 'all 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 18px rgba(56, 189, 248, 0.35)';
        }}
        title="Nexus AI - Home"
      >
        <img
          src="/robot-avatar.jpg"
          alt="Nexus AI Avatar"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Vertical Orb Navigation Buttons */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          width: '100%'
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id ||
            (item.id === 'quizzes' && activeTab === 'knowledge') ||
            (item.id === 'home' && (activeTab === 'tasks' || activeTab === 'history'));
            
          return (
            <div key={item.id} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'assistant') {
                    onResetHero?.();
                  }
                }}
                className={`orb-btn ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                {item.icon}
              </button>

              {/* Badge count if present */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#38bdf8',
                    color: '#03102d',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    pointerEvents: 'none'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Settings Orb Button (Image 2) */}
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <button
          onClick={() => setActiveTab('settings')}
          className={`orb-btn ${activeTab === 'settings' ? 'active' : ''}`}
          title="Settings & Preferences"
        >
          <SettingsIcon size={21} />
        </button>
      </div>
    </aside>
  );
};
