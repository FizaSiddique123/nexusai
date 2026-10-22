import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Play,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { QuizItem, QuizAttempt } from '../../../shared/src/types.js';

export const Quizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Quiz Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState('Computer Networks');
  const [newCount, setNewCount] = useState(10);
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, aList] = await Promise.all([
        api.getQuizzes(),
        api.getQuizAttempts()
      ]);
      setQuizzes(qList);
      setAttempts(aList);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      const fullQuiz = await api.getQuizById(quizId);
      setActiveQuiz(fullQuiz);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setQuizResult(null);
    } catch (err) {
      console.error('Failed to load quiz questions:', err);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const res = await api.submitQuiz(activeQuiz.id, selectedAnswers);
      setQuizResult(res);
      await loadData();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const created = await api.createQuiz({
        topic_or_doc_id: newTopic,
        count: newCount,
        difficulty: newDifficulty
      });
      setShowCreateModal(false);
      await loadData();
      handleStartQuiz(created.id);
    } catch (err: any) {
      alert(`Error generating quiz: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // 1. Result View
  if (activeQuiz && quizResult) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '760px' }}>
        <div className="nexus-card" style={{ textAlign: 'center', padding: '32px 24px', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: quizResult.attempt.percentage >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: quizResult.attempt.percentage >= 70 ? 'var(--accent-emerald)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}
          >
            <Award size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Quiz result: {quizResult.attempt.score} / {quizResult.attempt.total_questions} ({quizResult.attempt.percentage}%)
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.85rem' }}>
            {activeQuiz.title}
          </p>

          <button
            onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
            className="btn btn-secondary"
            style={{ marginTop: '20px' }}
          >
            <RotateCcw size={15} />
            <span>Return to quizzes</span>
          </button>
        </div>

        {/* Detailed Question Rationales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Question breakdown & explanations
          </h3>

          {quizResult.details?.map((d: any, idx: number) => (
            <div
              key={idx}
              className="nexus-card"
              style={{
                borderLeft: `3px solid ${d.is_correct ? 'var(--accent-emerald)' : 'var(--danger)'}`,
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontWeight: 500, fontSize: '0.885rem', color: 'var(--text-primary)' }}>
                  {idx + 1}. {d.question}
                </div>
                <span className={d.is_correct ? 'badge badge-success' : 'badge badge-high'}>
                  {d.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Rationale: </span>
                {d.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Active Taking Quiz View
  if (activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0) {
    const currentQ = activeQuiz.questions[currentQuestionIdx];
    const totalQ = activeQuiz.questions.length;

    return (
      <div className="page-wrapper" style={{ maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <button onClick={() => setActiveQuiz(null)} className="btn-subtle" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
            <X size={15} />
            <span>Exit quiz</span>
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Question {currentQuestionIdx + 1} of {totalQ}
          </div>
        </div>

        {/* Question Card */}
        <div className="nexus-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: '20px' }}>
            {currentQ.question}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--accent-surface)' : 'var(--bg-input)',
                    border: `1px solid ${isSelected ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isSelected ? 'var(--accent-emerald)' : 'var(--text-muted)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-muted)'
                    }}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span style={{ flex: 1 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
              disabled={currentQuestionIdx === 0}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              Previous
            </button>

            {currentQuestionIdx < totalQ - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                <span>Next question</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || Object.keys(selectedAnswers).length === 0}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                <span>{submitting ? 'Submitting...' : 'Submit & see results'}</span>
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Quiz Overview List
  return (
    <div className="page-wrapper" style={{ maxWidth: '1080px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Quizzes
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Practice assessments generated directly from your uploaded notes and study materials.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>New quiz</span>
        </button>
      </div>

      {/* Available Quizzes */}
      <div className="nexus-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Available quizzes ({quizzes.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading quizzes...
          </div>
        ) : quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No quizzes generated yet. Click "New quiz" or ask the AI Assistant!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {quizzes.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.885rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {q.title}
                    </h4>
                    <span className="badge badge-status" style={{ fontSize: '0.625rem' }}>
                      {q.difficulty}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {q.question_count} questions • {q.topic}
                  </div>
                </div>

                <button
                  onClick={() => handleStartQuiz(q.id)}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '7px 12px', fontSize: '0.785rem' }}
                >
                  <Play size={13} />
                  <span>Start quiz</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Attempt History */}
      {attempts.length > 0 && (
        <div className="nexus-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
            Previous attempts ({attempts.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {attempts.map(att => (
              <div
                key={att.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {att.quiz_title || 'Networking Assessment'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {new Date(att.completed_at).toLocaleDateString()} at {new Date(att.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: att.percentage >= 70 ? 'var(--accent-emerald)' : 'var(--warning)' }}>
                    {att.score} / {att.total_questions}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    ({att.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Create new quiz</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Topic or notes focus
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="e.g. Computer Networks, OSI Model, TCP UDP"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Questions
                  </label>
                  <select
                    className="input-field"
                    value={newCount}
                    onChange={e => setNewCount(Number(e.target.value))}
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Difficulty
                  </label>
                  <select
                    className="input-field"
                    value={newDifficulty}
                    onChange={e => setNewDifficulty(e.target.value as any)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={generating} className="btn btn-primary">
                  {generating ? 'Generating...' : 'Generate quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
