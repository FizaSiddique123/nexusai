import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Calendar,
  HelpCircle,
  Clock,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Mic,
  Paperclip,
  LayoutGrid,
  Code2,
  Utensils,
  Heart,
  Briefcase,
  Wrench,
  User,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api.js';
import { ChatMessage } from '../../../shared/src/types.js';
import { NavTab } from '../components/Sidebar.js';
import { FormattedMessage } from '../components/FormattedMessage.js';

interface AssistantProps {
  setActiveTab: (tab: NavTab) => void;
  initialPrompt?: string;
  showHero: boolean;
  setShowHero: (val: boolean) => void;
  onHasMessagesChange?: (hasMessages: boolean) => void;
}

export const Assistant: React.FC<AssistantProps> = ({
  setActiveTab,
  initialPrompt,
  showHero,
  setShowHero,
  onHasMessagesChange
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts matching Image 2 categories + Nexus AI capabilities
  const categoryPills = [
    { label: 'Coding', icon: <Code2 size={13} />, prompt: 'Analyse my notes for programming and networking algorithms.' },
    { label: 'Cooking', icon: <Utensils size={13} />, prompt: 'Plan my study schedule with healthy meal and rest intervals.' },
    { label: 'Health', icon: <Heart size={13} />, prompt: 'Check my revision sessions to ensure proper mental wellness breaks.' },
    { label: 'Trips', icon: <Briefcase size={13} />, prompt: 'Organise my upcoming tasks and deadlines in a structured timeline.' },
    { label: 'Troubleshoot', icon: <Wrench size={13} />, prompt: 'Troubleshoot and explain TCP 3-way handshake vs UDP flow control.' }
  ];

  const quickStudyPrompts = [
    'I have an exam on Friday. Analyze my uploaded notes, identify the important topics, create a revision plan, schedule my study sessions, and generate a practice quiz.',
    'Plan my study sessions for tomorrow with 45-minute blocks.',
    'Generate a 10-question practice quiz from my notes.'
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    onHasMessagesChange?.(messages.length > 0);
  }, [messages, onHasMessagesChange]);

  useEffect(() => {
    if (initialPrompt) {
      setShowHero(false);
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length > 0 && !showHero) {
      scrollToBottom();
    }
  }, [messages, activeStep, showHero]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      setMessages(history);
      onHasMessagesChange?.(history.length > 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isProcessing) return;

    setInput('');
    setShowHero(false);
    setIsProcessing(true);
    setActiveStep('Analyzing your request...');

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      if (text.toLowerCase().includes('analyse') || text.toLowerCase().includes('notes')) {
        setActiveStep('Searching indexed notes via SQLite FTS5...');
      }

      const result = await api.sendChatMessage(text);
      setMessages(prev => [...prev, result.message]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error executing request: ${err.message || 'Please check your connection and retry.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setActiveStep(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory();
      setMessages([]);
      setShowHero(true);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleApproveSchedule = async (scheduleId: string) => {
    try {
      await api.updateSchedule(scheduleId, { status: 'approved' });
      setMessages(prev => prev.map(m => {
        if (m.proposed_schedule && m.proposed_schedule.id === scheduleId) {
          return {
            ...m,
            proposed_schedule: { ...m.proposed_schedule, status: 'approved' }
          };
        }
        return m;
      }));
    } catch (err) {
      console.error('Failed to approve schedule:', err);
    }
  };

  const handleVoiceTrigger = () => {
    const voicePrompt = "Analyse my notes, identify the important topics, create a revision plan, and generate a quiz.";
    handleSend(voicePrompt);
  };

  const toggleActions = (msgId: string) => {
    setExpandedActions(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const formatActionName = (toolName: string) => {
    const map: Record<string, string> = {
      search_knowledge: 'Notes Search',
      extract_important_topics: 'Topic Extraction',
      create_revision_plan: 'Revision Planning',
      schedule_study_sessions: 'Session Scheduling',
      generate_quiz: 'Quiz Generated',
      get_workflow_status: 'Workflow Verification',
      list_documents: 'Document Scan',
      create_task: 'Task Created',
      generate_schedule: 'Schedule Synthesized',
      check_schedule_conflicts: 'Conflict Verification',
      create_quiz: 'Quiz Generated',
      retrieve_preferences: 'Preferences Loaded',
      get_tasks: 'Task Audit'
    };
    return map[toolName] || toolName.replace(/_/g, ' ');
  };

  const isHeroActive = showHero || messages.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Session Navigation Bar (Only in active chat mode) */}
      {!isHeroActive && (
        <div
          className="glass-box-subtle"
          style={{
            padding: '10px 36px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 10px #38bdf8'
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
              Active Assistant Session
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowHero(true)}
              className="btn btn-secondary liquid-btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.785rem'
              }}
            >
              <Sparkles size={13} color="#38bdf8" />
              <span>Hero View</span>
            </button>

            <button
              onClick={handleVoiceTrigger}
              className="btn btn-secondary liquid-btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.785rem'
              }}
            >
              <Mic size={13} color="#38bdf8" />
              <span>Simulate Alexa+ Voice</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="btn btn-subtle liquid-btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.785rem'
              }}
              title="Clear conversation"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isHeroActive ? '6px 20px 16px' : '24px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isHeroActive ? 'center' : 'flex-start'
        }}
      >
        {/* HERO VIEW MATCHING IMAGE 2 EXACTLY */}
        {isHeroActive && (
          <div className="hero-container">
            {/* Luminous 3D Cosmic Energy Orb */}
            <div className="hero-orb-wrapper" onClick={handleVoiceTrigger} title="Click to ask Nexus AI">
              <div className="hero-orb-aura" />
              <img
                src="/energy-orb.jpg"
                alt="Nexus Energy Orb"
                className="hero-orb-img"
              />
            </div>

            {/* Bold Greeting */}
            <h1 className="hero-title">
              <span className="hero-welcome-gradient">Welcome</span>{' '}
              <span className="hero-title-white">Back Rolex!</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              What design would you like feedback on?
            </p>

            {/* Large Rounded Glass Input Box (Image 2) */}
            <div className="glass-input-card">
              <textarea
                className="glass-input-textarea"
                placeholder="Learn more about our features."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isProcessing}
              />

              <div className="glass-input-actions">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="glass-action-btn"
                    onClick={() => setActiveTab('knowledge')}
                    title="Upload & attach notes"
                  >
                    <Paperclip size={16} />
                  </button>
                  <button
                    type="button"
                    className="glass-action-btn"
                    onClick={() => setActiveTab('home')}
                    title="Explore modules & tools"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="glass-action-btn"
                    onClick={handleVoiceTrigger}
                    title="Simulate Alexa+ Voice command"
                  >
                    <Mic size={16} />
                  </button>

                  <button
                    type="button"
                    className="glass-send-btn"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isProcessing}
                    title="Send to Nexus AI"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Suggestion Pills (Image 2) */}
            <div className="suggestion-pills-row">
              {categoryPills.map((pill, idx) => (
                <button
                  key={idx}
                  className="suggestion-pill"
                  onClick={() => handleSend(pill.prompt)}
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Demo Workflow Trigger */}
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => handleSend(quickStudyPrompts[0])}
                className="btn btn-secondary liquid-btn"
                style={{
                  padding: '9px 22px',
                  fontSize: '0.825rem',
                  color: '#93c5fd'
                }}
              >
                <Sparkles size={14} color="#38bdf8" />
                <span>Run Hackathon Primary Scenario: Note Analysis, Revision Plan & Quiz</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE CONVERSATION STREAM */}
        {!isHeroActive && (
          <div
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.role === 'user' ? '82%' : '100%',
                  width: msg.role === 'user' ? 'auto' : '100%'
                }}
              >
                {/* Assistant Mini Avatar */}
                {msg.role !== 'user' && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '1.5px solid rgba(56, 189, 248, 0.5)',
                      boxShadow: '0 0 14px rgba(56, 189, 248, 0.45)',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <img
                      src="/robot-avatar.jpg"
                      alt="AI"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Message Bubble with Glassmorphism */}
                  <div
                    className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                    style={{
                      padding: '18px 22px',
                      borderRadius: '22px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      lineHeight: '1.65'
                    }}
                  >
                    <FormattedMessage
                      content={msg.content}
                      role={msg.role}
                      onActionClick={(actionText) => handleSend(actionText)}
                    />
                  </div>

                  {/* Actions Taken Accordion */}
                  {msg.tool_invocations && msg.tool_invocations.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => toggleActions(msg.id)}
                        className="btn-subtle liquid-btn"
                        style={{
                          fontSize: '0.785rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px'
                        }}
                      >
                        {expandedActions[msg.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{expandedActions[msg.id] ? 'Hide' : 'View'} {msg.tool_invocations.length} actions taken</span>
                      </button>

                      {expandedActions[msg.id] && (
                        <div
                          className="glass-box-subtle"
                          style={{
                            marginTop: '8px',
                            padding: '14px 18px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {msg.tool_invocations.map((t, idx) => (
                            <div key={idx} style={{ fontSize: '0.785rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Check size={13} color="#38bdf8" />
                              <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                                {formatActionName(t.tool)}:
                              </span>
                              <span style={{ color: '#94a3b8' }}>
                                {t.summary}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proposed Schedule Card with Glassmorphism */}
                  {msg.proposed_schedule && (
                    <div
                      className="nexus-card"
                      style={{
                        marginTop: '16px',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        borderTop: '1.5px solid rgba(255, 255, 255, 0.35)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={18} color="#38bdf8" />
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                            {msg.proposed_schedule.title}
                          </span>
                        </div>
                        <span className="badge badge-medium">
                          {msg.proposed_schedule.status === 'approved' ? 'Approved' : 'Proposed schedule'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {msg.proposed_schedule.sessions?.map(s => (
                          <div
                            key={s.id}
                            className="glass-item-row"
                            style={{
                              padding: '10px 16px',
                              fontSize: '0.825rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Clock size={14} color="#94a3b8" />
                              <span style={{ fontWeight: 500, color: '#93c5fd' }}>{s.start_time} – {s.end_time}</span>
                              <span style={{ color: s.is_break ? '#fbbf24' : '#f8fafc', fontWeight: s.is_break ? 400 : 500 }}>
                                {s.title}
                              </span>
                            </div>
                            <span style={{ color: '#64748b' }}>{s.duration_minutes}m</span>
                          </div>
                        ))}
                      </div>

                      {msg.proposed_schedule.status === 'proposed' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleApproveSchedule(msg.proposed_schedule!.id)}
                            className="btn btn-primary liquid-btn"
                            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                          >
                            <Check size={14} />
                            <span>Approve Schedule</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('planner')}
                            className="btn btn-secondary liquid-btn"
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          >
                            <span>Modify in Planner</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Practice Quiz Card with Glassmorphism */}
                  {msg.generated_quiz_id && (
                    <div
                      className="nexus-card"
                      style={{
                        marginTop: '16px',
                        border: '1px solid rgba(168, 85, 247, 0.45)',
                        borderTop: '1.5px solid rgba(255, 255, 255, 0.35)',
                        background: 'linear-gradient(135deg, rgba(30, 24, 75, 0.48) 0%, rgba(12, 18, 55, 0.68) 100%)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HelpCircle size={18} color="#c084fc" />
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                            Practice Mastery Quiz Generated
                          </span>
                        </div>
                        <span className="badge badge-low">
                          Interactive Quiz
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '14px', lineHeight: '1.6' }}>
                        A practice quiz grounded in your notes is ready to assess your knowledge.
                      </p>
                      <button
                        onClick={() => setActiveTab('quizzes')}
                        className="btn btn-primary liquid-btn"
                        style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                      >
                        <Sparkles size={14} />
                        <span>Launch Interactive Quiz Studio</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      border: '1.5px solid rgba(147, 197, 253, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#ffffff',
                      boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* In-Flight Processing Spinner */}
            {isProcessing && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1.5px solid rgba(56, 189, 248, 0.5)',
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
                  }}
                >
                  <img src="/robot-avatar.jpg" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(8, 26, 72, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    color: '#38bdf8',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <Sparkles size={15} />
                  <span>{activeStep || 'Coordinating tools...'}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Persistent Glass Input Bar when in active chat view */}
      {!isHeroActive && (
        <div
          style={{
            padding: '14px 36px 18px 36px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(4, 13, 38, 0.75)',
            backdropFilter: 'blur(16px)',
            maxWidth: '860px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <button
              type="button"
              className="glass-action-btn"
              onClick={() => setActiveTab('knowledge')}
              title="Attach notes"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nexus AI to organise tasks, understand notes, or plan sessions..."
              disabled={isProcessing}
              style={{
                padding: '12px 18px',
                fontSize: '0.9rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(8, 24, 66, 0.8)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            />

            <button
              type="button"
              className="glass-action-btn"
              onClick={handleVoiceTrigger}
              title="Simulate Voice"
            >
              <Mic size={16} />
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="glass-send-btn"
              title="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
