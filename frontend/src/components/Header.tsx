import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { NavTab } from './Sidebar.js';

interface HeaderProps {
  activeTab: NavTab;
  onOpenSettings: () => void;
  onSimulateVoice?: () => void;
  showHero?: boolean;
  onToggleHero?: () => void;
  hasChatMessages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSettings,
  showHero = true,
  onToggleHero,
  hasChatMessages = false
}) => {
  return (
    <header
      style={{
        padding: '16px 36px 8px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'transparent',
        zIndex: 40,
        minHeight: '52px',
        flexShrink: 0
      }}
    >
      {/* Left Pill Badge from Image 2 */}
      <div
        className="glass-box-subtle"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.25)'
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/robot-avatar.jpg"
            alt="AI"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#f1f5f9',
            letterSpacing: '0.01em'
          }}
        >
          Nexus AI
        </span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeTab === 'assistant' && hasChatMessages && onToggleHero && (
          <button
            onClick={onToggleHero}
            className="btn btn-secondary liquid-btn"
            style={{
              padding: '6px 16px',
              fontSize: '0.785rem'
            }}
            title={showHero ? 'Open active conversation' : 'Switch to Hero View'}
          >
            {showHero ? <MessageSquare size={13} color="#c084fc" /> : <Sparkles size={13} color="#c084fc" />}
            <span>{showHero ? 'Chat Session' : 'Hero View'}</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="btn-pill-glossy liquid-btn"
          title="Upgrade plan & settings"
        >
          <span>Upgrade</span>
        </button>
      </div>
    </header>
  );
};
