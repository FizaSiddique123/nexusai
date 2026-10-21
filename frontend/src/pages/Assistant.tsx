import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Calendar,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Mic,
  Volume2
} from 'lucide-react';
import { api } from '../services/api.js';
import { ChatMessage, ToolInvocation, ScheduleItem } from '../../../shared/src/types.js';
import { NavTab } from '../components/Sidebar.js';

interface AssistantProps {
  setActiveTab: (tab: NavTab) => void;
  initialPrompt?: string;
}

export const Assistant: React.FC<AssistantProps> = ({ setActiveTab, initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Analyse my notes, identify important topics, create a revision plan, and generate a quiz.',
    'Analyse my uploaded notes for TCP and UDP differences.',
    'Plan my study sessions for tomorrow with 45-minute blocks.',
    'Show my pending tasks and priorities.',
    'Generate a 10-question practice quiz from my notes.'
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeStep]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      setMessages(history);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isProcessing) return;

    setInput('');
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
      // Simulate real activity progression
      if (text.toLowerCase().includes('analyse') || text.toLowerCase().includes('notes')) {
        setActiveStep('Searching your notes...');
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

  const handleApproveSchedule = async (scheduleId: string) => {
    try {
      setIsProcessing(true);
      setActiveStep('Saving approved changes...');
      await api.approveSchedule(scheduleId);
      await handleSend('Approve the revision plan and schedule my study sessions');
    } catch (err: any) {
      console.error('Failed to approve schedule:', err);
    } finally {
      setIsProcessing(false);
      setActiveStep(null);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear conversation history?')) {
      await api.clearChatHistory();
      setMessages([]);
    }
  };

  const toggleActions = (msgId: string) => {
    setExpandedActions(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Convert technical tool name into plain English action label
  const formatActionName = (tool: string) => {
    switch (tool) {
      case 'search_knowledge': return 'Searched notes';
      case 'list_documents': return 'Checked documents';
      case 'create_task': return 'Created study task';
      case 'get_tasks': return 'Retrieved tasks';
      case 'generate_schedule': return 'Prepared revision schedule';
      case 'check_schedule_conflicts': return 'Validated schedule timeline';
      case 'create_quiz': return 'Generated assessment quiz';
      case 'update_schedule': return 'Updated schedule';
      default: return tool.replace(/_/g, ' ');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 68px)',
        position: 'relative',
        backgroundColor: 'var(--bg-main)'
      }}
    >
      {/* Quiet Top Action Bar */}
      <div
        style={{
          padding: '12px 32px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-header)',
          fontSize: '0.8rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <Bot size={15} color="var(--accent-emerald)" />
          <span>Assistant Session</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Subtle Alexa+ Voice Simulation Button */}
          <button
            onClick={() => handleSend('Analyse my notes, identify the important topics, create a revision plan for my upcoming exam, schedule my study sessions, and generate a quiz.')}
            disabled={isProcessing}
            className="btn btn-secondary"
            style={{
              padding: '5px 12px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Trigger simulated Alexa+ voice instruction"
          >
            <Mic size={13} color="var(--accent-teal)" />
            <span>Simulate Alexa+ Voice</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn-subtle"
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Clear conversation"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '880px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '580px', padding: '40px 0' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-surface)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: 'var(--accent-emerald)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              How can I help you today?
            </h2>
            <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ask a question, upload study notes, or pick a suggestion below.
            </p>

            {/* Suggestions */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-card)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <span>{p}</span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          </div>
        )}

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
            {/* Avatar */}
            {msg.role !== 'user' && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-surface)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--accent-emerald)',
                  marginTop: '2px'
                }}
              >
                <Bot size={16} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Message Content Bubble */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: msg.role === 'user' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                  border: msg.role === 'user' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.885rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>

              {/* Compact "View actions" disclosure */}
              {msg.tool_invocations && msg.tool_invocations.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => toggleActions(msg.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '2px 4px'
                    }}
                  >
                    {expandedActions[msg.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    <span>{expandedActions[msg.id] ? 'Hide' : 'View'} {msg.tool_invocations.length} actions taken</span>
                  </button>

                  {expandedActions[msg.id] && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {msg.tool_invocations.map((t, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check size={12} color="var(--accent-emerald)" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatActionName(t.tool)}:
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {t.summary}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Proposed Schedule Card */}
              {msg.proposed_schedule && (
                <div
                  className="nexus-card"
                  style={{
                    marginTop: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    backgroundColor: 'var(--bg-card-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="var(--accent-emerald)" />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{msg.proposed_schedule.title}</span>
                    </div>
                    <span className="badge badge-medium">Proposed schedule</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    {msg.proposed_schedule.sessions?.map(s => (
                      <div
                        key={s.id}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-input)',
                          fontSize: '0.785rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span style={{ fontWeight: 500 }}>{s.start_time} - {s.end_time}</span>
                          <span style={{ color: s.is_break ? 'var(--warning)' : 'var(--text-primary)' }}>{s.title}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>{s.duration_minutes}m</span>
                      </div>
                    ))}
                  </div>

                  {msg.proposed_schedule.status === 'proposed' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApproveSchedule(msg.proposed_schedule!.id)}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        <Check size={14} />
                        <span>Approve Schedule</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('planner')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <span>Modify in Planner</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Generated Quiz Card */}
              {msg.generated_quiz_id && (
                <div
                  className="nexus-card"
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(20, 184, 166, 0.25)',
                    backgroundColor: 'var(--bg-card-subtle)',
                    padding: '14px 18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-teal)'
                      }}
                    >
                      <HelpCircle size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        Practice Quiz Generated
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        10 questions grounded in your notes with instant score and rationales
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    <span>Start Quiz</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--text-secondary)',
                  marginTop: '2px'
                }}
              >
                <User size={15} />
              </div>
            )}
          </div>
        ))}

        {/* Concise real-time activity status */}
        {isProcessing && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)'
              }}
            >
              <Bot size={16} />
            </div>
            <div
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.825rem',
                color: 'var(--accent-emerald)'
              }}
            >
              <Sparkles className="spin" size={14} />
              <span>{activeStep || 'Coordinating tools...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          padding: '16px 32px 20px 32px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-header)',
          backdropFilter: 'blur(8px)',
          maxWidth: '880px',
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
            gap: '8px',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <input
            type="text"
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Nexus AI to organise tasks, understand notes, or plan sessions..."
            disabled={isProcessing}
            style={{
              padding: '12px 16px',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-input)'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="btn btn-primary"
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              opacity: !input.trim() || isProcessing ? 0.5 : 1
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
