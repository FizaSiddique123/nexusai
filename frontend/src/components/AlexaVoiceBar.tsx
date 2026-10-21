import React, { useState } from 'react';
import { Mic, Sparkles, ArrowRight, Play, Volume2 } from 'lucide-react';

interface AlexaVoiceBarProps {
  onExecutePrompt: (prompt: string) => void;
}

export const AlexaVoiceBar: React.FC<AlexaVoiceBarProps> = ({ onExecutePrompt }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const primaryPrompt = 'Analyse my notes, identify the important topics, create a revision plan for my upcoming exam, schedule my study sessions, and generate a quiz.';

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      onExecutePrompt(primaryPrompt);
      setIsSimulating(false);
    }, 800);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
            flexShrink: 0
          }}
        >
          <Volume2 size={20} color="#051512" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Alexa+ Voice Agent Simulation
            </span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-teal)', padding: '1px 6px', borderRadius: '4px' }}>
              Amazon Hackathon 2026
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500, marginTop: '2px' }}>
            <span style={{ color: 'var(--text-muted)' }}>"Alexa, ask Nexus AI to </span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>analyse notes, schedule study sessions & generate quiz...</span>
            <span style={{ color: 'var(--text-muted)' }}>"</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="btn btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '0.85rem',
            opacity: isSimulating ? 0.7 : 1
          }}
        >
          {isSimulating ? (
            <>
              <Sparkles className="spin" size={16} />
              <span>Simulating Alexa Request...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="#041014" />
              <span>Run Primary Hackathon Demo</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
