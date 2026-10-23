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
        background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.15) 0%, rgba(168, 85, 247, 0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.45)',
            flexShrink: 0
          }}
        >
          <Volume2 size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Alexa+ Voice Agent Simulation
            </span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-electric)', padding: '1px 6px', borderRadius: '4px' }}>
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
              <Play size={16} fill="#ffffff" color="#ffffff" />
              <span>Run Primary Hackathon Demo</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
