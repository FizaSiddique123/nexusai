import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Play,
  Award,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Code2,
  UserCheck,
  ChevronRight,
  Clock,
  Send,
  Plus
} from 'lucide-react';
import { api } from '../services/api.js';
import {
  InterviewSession,
  InterviewQuestion,
  InterviewReport,
  InterviewCategory,
  ResumeAnalysisResult
} from '../../../shared/src/types.js';

export const InterviewPrep: React.FC = () => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeTab, setActiveTab] = useState<'practice' | 'history' | 'resume'>('practice');
  const [loading, setLoading] = useState(false);

  // Active Session State
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<any | null>(null);
  const [activeReport, setActiveReport] = useState<InterviewReport | null>(null);

  // Setup Form State
  const [category, setCategory] = useState<InterviewCategory>('technical');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [targetCompany, setTargetCompany] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [mode, setMode] = useState<'practice' | 'mock'>('practice');
  const [programmingLanguage, setProgrammingLanguage] = useState('Python');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Resume Matcher State
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeResult, setResumeResult] = useState<ResumeAnalysisResult | null>(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const list = await api.getInterviews();
      setSessions(list);
    } catch (err) {
      console.error('Failed to load interview sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (customParams?: any) => {
    try {
      setLoading(true);
      const params = customParams || {
        category,
        target_role: targetRole,
        target_company: targetCompany || undefined,
        difficulty,
        mode,
        programming_language: programmingLanguage,
        total_questions: totalQuestions
      };

      const session = await api.createInterview(params);
      setCurrentSession(session);
      const firstQ = session.questions?.[0] || null;
      setCurrentQuestion(firstQ);
      setAnswerText('');
      setSubmittedCode(firstQ?.starter_code || '');
      setShowHint(false);
      setLatestEvaluation(null);
      setActiveReport(null);
      setShowSetupModal(false);
      setActiveTab('practice');
      loadSessions();
    } catch (err: any) {
      alert(`Failed to start interview: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentSession || !currentQuestion || !answerText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const res = await api.submitInterviewAnswer(currentSession.id, {
        question_id: currentQuestion.id,
        answer_text: answerText,
        submitted_code: submittedCode || undefined,
        duration_seconds: 60
      });

      setLatestEvaluation(res.evaluation);

      if (res.report) {
        setActiveReport(res.report);
      }
    } catch (err: any) {
      alert(`Failed to submit answer: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!currentSession) return;
    try {
      setLoading(true);
      const res = await api.nextInterviewQuestion(currentSession.id);
      if (res.completed || !res.question) {
        const report = await api.completeInterview(currentSession.id);
        setActiveReport(report);
      } else {
        setCurrentQuestion(res.question);
        setAnswerText('');
        setSubmittedCode(res.question.starter_code || '');
        setShowHint(false);
        setLatestEvaluation(null);
      }
      loadSessions();
    } catch (err: any) {
      alert(`Failed to advance question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim() || analyzingResume) return;
    try {
      setAnalyzingResume(true);
      const result = await api.analyzeResume(resumeText, jobDescription);
      setResumeResult(result);
    } catch (err: any) {
      alert(`Resume analysis failed: ${err.message}`);
    } finally {
      setAnalyzingResume(false);
    }
  };

  const quickPresets = [
    {
      title: 'SWE Placement Mock (DSA)',
      category: 'technical' as InterviewCategory,
      role: 'Software Engineer',
      desc: 'Coding problems, algorithmic constraints & Big-O complexity.',
      icon: <Code2 size={16} />
    },
    {
      title: 'HR & Behavioral Round',
      category: 'behavioral' as InterviewCategory,
      role: 'Campus Placement Candidate',
      desc: 'Master the STAR framework for conflict, leadership & failure.',
      icon: <UserCheck size={16} />
    },
    {
      title: 'System Design & Core CS',
      category: 'technical' as InterviewCategory,
      role: 'Backend Systems Engineer',
      desc: 'Scalability, DBMS transactions, caching & network protocols.',
      icon: <Briefcase size={16} />
    }
  ];

  return (
    <div className="page-wrapper" style={{ maxWidth: '1060px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            AI Interview Coach & Placement Studio
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Interactive mock interviews with transparent rubrics, STAR method evaluation, and resume project defense.
          </p>
        </div>

        <button
          onClick={() => setShowSetupModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>New Mock Interview</span>
        </button>
      </div>

      {/* Navigation Subtabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('practice')}
          className={`btn-sm ${activeTab === 'practice' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Play size={14} />
          <span>Interview Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Clock size={14} />
          <span>Past Sessions & Reports ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resume')}
          className={`btn-sm ${activeTab === 'resume' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={14} />
          <span>Resume & JD Matcher</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERVIEW PRACTICE STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'practice' && (
        <div>
          {!currentSession ? (
            /* Setup & Preset Launchers */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="nexus-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Quick Launch Placement Mock Rounds
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  Select a standardized placement interview module or customize your role and company.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {quickPresets.map((p, i) => (
                    <div
                      key={i}
                      className="nexus-card nexus-card-interactive"
                      onClick={() => handleStartSession({
                        category: p.category,
                        target_role: p.role,
                        difficulty: 'medium',
                        mode: 'practice',
                        total_questions: 5
                      })}
                      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.9rem' }}>
                          {p.icon}
                          <span>{p.title}</span>
                        </div>
                        <span className="badge badge-success">5 Questions</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {p.desc}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 500, marginTop: 'auto' }}>
                        <span>Start Practice</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & STAR Overview */}
              <div className="nexus-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={16} color="var(--accent-teal)" />
                  <span>The STAR Method for Behavioral Interviews</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.825rem' }}>
                  <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <strong>S - Situation:</strong> Set the context with specific project constraints or timeline.
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <strong>T - Task:</strong> Define what responsibility you owned and the challenge to overcome.
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <strong>A - Action:</strong> Describe the engineering steps and trade-offs YOU executed.
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <strong>R - Result:</strong> Share measurable impact (e.g. latency cut by 40%, zero downtime).
                  </div>
                </div>
              </div>
            </div>
          ) : activeReport ? (
            /* Final Report View */
            <div className="nexus-card" style={{ padding: '28px', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span className="badge badge-success" style={{ marginBottom: '6px' }}>Session Completed</span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentSession.title}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {activeReport.overall_score}%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Readiness Score</span>
                </div>
              </div>

              <div style={{ padding: '14px 18px', background: 'var(--accent-surface)', border: '1px solid rgba(8, 127, 91, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.875rem' }}>Assessment Tier: </strong>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{activeReport.readiness_assessment}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {/* Strengths */}
                <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} />
                    <span>Key Demonstrated Strengths</span>
                  </h4>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {activeReport.top_strengths.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Critical Improvements */}
                <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={15} />
                    <span>Priority Areas for Improvement</span>
                  </h4>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {activeReport.critical_weaknesses.map((w, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Plan */}
              <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Recommended Action Plan
                </h4>
                <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {activeReport.recommended_preparation.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{r}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    setCurrentSession(null);
                    setCurrentQuestion(null);
                    setActiveReport(null);
                  }}
                  className="btn btn-secondary"
                >
                  Return to Studio
                </button>
                <button
                  onClick={() => handleStartSession()}
                  className="btn btn-primary"
                >
                  <RotateCcw size={15} />
                  <span>Practice Another Round</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Question Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Question Navigation Header */}
              <div className="nexus-card" style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-success">
                      Question {(currentQuestion?.question_index ?? 0) + 1} of {currentSession.total_questions}
                    </span>
                    <span className="badge badge-status">
                      {currentSession.category.toUpperCase()}
                    </span>
                    <span className="badge badge-medium">
                      {currentSession.difficulty.toUpperCase()}
                    </span>
                    <span className="badge badge-low">
                      {currentSession.mode === 'practice' ? 'PRACTICE MODE' : 'MOCK MODE'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('Leave this interview session? Your progress is saved.')) {
                        setCurrentSession(null);
                        setCurrentQuestion(null);
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Pause & Exit
                  </button>
                </div>

                {/* Question Text */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '14px' }}>
                  {currentQuestion?.question_text}
                </h3>

                {/* Hint Button */}
                {currentQuestion?.hints && currentQuestion.hints.length > 0 && currentSession.mode === 'practice' && (
                  <div>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Lightbulb size={13} color="var(--accent-teal)" />
                      <span>{showHint ? 'Hide Interviewer Hint' : '💡 View Interviewer Hint'}</span>
                    </button>

                    {showHint && (
                      <div style={{ marginTop: '8px', padding: '10px 14px', background: 'var(--bg-input)', borderLeft: '3px solid var(--accent-teal)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Hint:</strong> {currentQuestion.hints[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Answer Input Section */}
              {!latestEvaluation ? (
                <div className="nexus-card" style={{ padding: '22px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    Your Response & Explanation
                  </label>
                  <textarea
                    rows={6}
                    className="textarea-field"
                    placeholder="Structure your answer clearly. For behavioral questions, use the STAR format (Situation, Task, Action, Result). For technical questions, explain your approach and Big-O complexity..."
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    style={{ marginBottom: '14px' }}
                  />

                  {/* Optional Code Input for Technical DSA */}
                  {currentSession.category === 'technical' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                        Code Implementation ({currentSession.programming_language || 'Python'}) - Optional
                      </label>
                      <textarea
                        rows={6}
                        className="textarea-field"
                        placeholder="# Write clean code with edge-case handling..."
                        value={submittedCode}
                        onChange={e => setSubmittedCode(e.target.value)}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!answerText.trim() || submitting}
                      className="btn btn-primary"
                      style={{ gap: '6px' }}
                    >
                      <Send size={15} />
                      <span>{submitting ? 'Evaluating with Rubric...' : 'Submit Answer for Feedback'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Evaluation & Rubric Feedback Card */
                <div className="nexus-card" style={{ padding: '24px', animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} color="var(--accent-emerald)" />
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        Transparent Rubric Evaluation
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
                        Score: {latestEvaluation.score} / 100
                      </span>
                    </div>
                  </div>

                  {/* Rubric Breakdown Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Technical Correctness</span>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {latestEvaluation.rubric_breakdown?.technical_correctness ?? 80}%
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Problem Solving</span>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {latestEvaluation.rubric_breakdown?.problem_solving ?? 85}%
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Communication</span>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {latestEvaluation.rubric_breakdown?.communication ?? 90}%
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STAR Structure</span>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {latestEvaluation.rubric_breakdown?.structure_star ?? 75}%
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Missing Concepts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--accent-surface)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(8, 127, 91, 0.2)' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', display: 'block', marginBottom: '6px' }}>
                        ✓ Strengths:
                      </strong>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {latestEvaluation.strengths?.map((s: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'block', marginBottom: '6px' }}>
                        ⚠️ Missing Concepts / Gaps:
                      </strong>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {latestEvaluation.missing_concepts?.map((m: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Follow-up Question from Interviewer */}
                  {latestEvaluation.follow_up_question && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-teal)', marginBottom: '18px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-teal)', display: 'block', marginBottom: '3px' }}>
                        Interviewer Follow-up:
                      </span>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', margin: 0 }}>
                        "{latestEvaluation.follow_up_question}"
                      </p>
                    </div>
                  )}

                  {/* Ideal Model Answer */}
                  {latestEvaluation.strong_example_answer && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Exemplary Benchmark Answer:
                      </span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {latestEvaluation.strong_example_answer}
                      </p>
                    </div>
                  )}

                  {/* Next Step Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={handleNextQuestion}
                      disabled={loading}
                      className="btn btn-primary"
                      style={{ gap: '6px' }}
                    >
                      <span>
                        {(currentQuestion?.question_index ?? 0) + 1 >= currentSession.total_questions
                          ? 'Complete Interview & View Report'
                          : 'Next Interview Question'}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAST SESSIONS & REPORTS */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sessions.length === 0 ? (
            <div className="nexus-card" style={{ padding: '36px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
                No past interview sessions yet. Start your first mock interview to track progress!
              </p>
              <button onClick={() => setShowSetupModal(true)} className="btn btn-primary">
                Start First Mock Interview
              </button>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="nexus-card nexus-card-interactive"
                onClick={async () => {
                  const full = await api.getInterview(s.id);
                  setCurrentSession(full);
                  if (full.status === 'completed' && full.report) {
                    setActiveReport(full.report);
                  } else {
                    const nextQ = full.questions?.find(q => !q.answer) || full.questions?.[0] || null;
                    setCurrentQuestion(nextQ);
                    setLatestEvaluation(null);
                    setActiveReport(null);
                  }
                  setActiveTab('practice');
                }}
                style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{s.title}</strong>
                    <span className={`badge ${s.status === 'completed' ? 'badge-success' : 'badge-status'}`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()} • {s.category.toUpperCase()} • {s.total_questions} Questions
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {s.overall_score !== undefined && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {s.overall_score}%
                      </span>
                    </div>
                  )}
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RESUME & JOB DESCRIPTION MATCHING */}
      {/* ========================================================================= */}
      {activeTab === 'resume' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="nexus-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Resume Grounding & Job Description Fit Analyzer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Paste your resume text and target job description to extract real projects, benchmark skill gaps, and generate customized interview questions.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Resume Text (or paste bio/projects)
                </label>
                <textarea
                  rows={8}
                  className="textarea-field"
                  placeholder="Paste your resume content (Education, Technical Skills, Projects, Experience)..."
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Target Job Description (Optional)
                </label>
                <textarea
                  rows={8}
                  className="textarea-field"
                  placeholder="Paste target job requirements from company career portal (e.g. Google SWE, Amazon SDE)..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleAnalyzeResume}
                disabled={!resumeText.trim() || analyzingResume}
                className="btn btn-primary"
                style={{ gap: '6px' }}
              >
                <Sparkles size={15} />
                <span>{analyzingResume ? 'Analyzing...' : 'Analyze Resume Fit & Generate Questions'}</span>
              </button>
            </div>
          </div>

          {/* Analysis Results View */}
          {resumeResult && (
            <div className="nexus-card" style={{ padding: '24px', animation: 'fadeIn 0.2s ease-out' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Extracted Profile & Job Match Insights
              </h4>

              {resumeResult.job_description_match && (
                <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Role Fit Score</span>
                    <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>
                      {resumeResult.job_description_match.match_score}% Match
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.8rem' }}>
                    <div>
                      <strong style={{ color: 'var(--accent-emerald)' }}>Matching Skills: </strong>
                      <span>{resumeResult.job_description_match.matching_skills.join(', ') || 'General fundamentals'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--warning)' }}>Missing Skills to Study: </strong>
                      <span>{resumeResult.job_description_match.missing_skills.join(', ') || 'None identified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Project Questions */}
              {resumeResult.job_description_match?.generated_project_questions && (
                <div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Custom Interview Questions on Your Actual Projects:
                  </h5>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {resumeResult.job_description_match.generated_project_questions.map((q, i) => (
                      <li key={i} style={{ marginBottom: '8px' }}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM INTERVIEW SETUP MODAL */}
      {/* ========================================================================= */}
      {showSetupModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Configure Custom Mock Interview
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Interview Category
                </label>
                <select
                  className="input-field"
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                >
                  <option value="technical">Technical (DSA, Core CS, System Design)</option>
                  <option value="hr">HR & Introduction</option>
                  <option value="behavioral">Behavioral (STAR Method)</option>
                  <option value="managerial">Managerial & Team Leadership</option>
                  <option value="role_specific">Role-Specific & Company Targeted</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Target Role
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Target Company (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={targetCompany}
                    onChange={e => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Amazon, TCS"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Difficulty
                  </label>
                  <select
                    className="input-field"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                  >
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium">Medium (Standard Placement)</option>
                    <option value="hard">Hard (Tier-1 Tech Companies)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Interview Mode
                  </label>
                  <select
                    className="input-field"
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                  >
                    <option value="practice">Practice Mode (Hints & Instant Rubric)</option>
                    <option value="mock">Mock Mode (Simulated Interview)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Total Questions: {totalQuestions}
                </label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={totalQuestions}
                  onChange={e => setTotalQuestions(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowSetupModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartSession()}
                className="btn btn-primary"
              >
                Start Interview Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
