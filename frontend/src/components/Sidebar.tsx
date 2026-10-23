import React from 'react';
import {
  Home,
  Search,
  Clock,
  LayoutGrid,
  Sparkles,
  Briefcase,
  Settings as SettingsIcon
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'assistant'
  | 'interview'
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
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'home', label: 'Overview', icon: <Home size={21} />, badge: metrics?.tasks },
    { id: 'assistant', label: 'AI Assistant', icon: <Search size={21} /> },
    { id: 'interview', label: 'Interview Prep', icon: <Briefcase size={21} /> },
    { id: 'planner', label: 'Planner & Schedule', icon: <Clock size={21} /> },
    { id: 'quizzes', label: 'Quiz Studio & Knowledge', icon: <Sparkles size={21} />, badge: metrics?.quizzes },
  ];

  return (
    <aside
      style={{
        width: '84px',
        background: 'linear-gradient(180deg, rgba(14, 10, 24, 0.98) 0%, rgba(9, 7, 16, 0.99) 100%)',
        borderRight: '1px solid rgba(139, 92, 246, 0.18)',
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
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.7), rgba(124, 58, 237, 0.45))',
          boxShadow: '0 0 18px rgba(168, 85, 247, 0.4)',
          cursor: 'pointer',
          marginBottom: '38px',
          transition: 'all 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 0 24px rgba(168, 85, 247, 0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 18px rgba(168, 85, 247, 0.4)';
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
                    backgroundColor: '#a855f7',
                    color: '#ffffff',
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
