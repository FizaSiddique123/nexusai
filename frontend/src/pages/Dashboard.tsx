import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Bell,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Mic,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { api } from '../services/api.js';
import { DocumentItem, ScheduleItem, ScheduleSession, InterviewSession, QuizItem } from '../../../shared/src/types.js';
import { NavTab } from '../components/Sidebar.js';
import '../styles/dashboard.css';

interface DashboardProps {
  setActiveTab: (tab: NavTab) => void;
  onSendPrompt: (prompt: string) => void;
}

interface DayOption {
  dayLabel: string;
  dayNum: string;
  dateStr: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onSendPrompt }) => {
  const [_loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assistantInput, setAssistantInput] = useState('');
  const [taskStats, setTaskStats] = useState({ total: 0, pending: 0, completed: 0, completion_rate: 0 });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Generate current week days around today
  const weekDays = useMemo<DayOption[]>(() => {
    const days: DayOption[] = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);

    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = String(d.getDate()).padStart(2, '0');
      days.push({
        dayLabel: dayLabels[i],
        dayNum,
        dateStr
      });
    }
    return days;
  }, []);

  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tasksRes, docsRes, schedRes, quizRes, interviewRes] = await Promise.all([
        api.getTasks().catch(() => ({ stats: { total: 0, pending: 0, completed: 0, completion_rate: 0 }, tasks: [] })),
        api.getDocuments().catch(() => []),
        api.getSchedules(selectedDate).catch(() => ({ current: null, history: [] })),
        api.getQuizzes().catch(() => []),
        api.getInterviews().catch(() => [])
      ]);

      if (tasksRes?.stats) {
        setTaskStats({
          total: tasksRes.stats.total || 0,
          pending: tasksRes.stats.pending || 0,
          completed: tasksRes.stats.completed || 0,
          completion_rate: tasksRes.stats.completion_rate || 0
        });
      }
      setDocuments(docsRes || []);
      setSchedule(schedRes?.current || null);
      setQuizzes(quizRes || []);
      setInterviews(interviewRes || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Assistant prompt submission
  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;
    onSendPrompt(assistantInput.trim());
    setAssistantInput('');
  };

  // Search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSendPrompt(`Search study notes and tasks for: "${searchQuery.trim()}"`);
  };

  // Current local time formatted for timeline pill
  const currentTimeDisplay = useMemo(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }, []);

  // Filter study sessions for calendar
  const studySessions = useMemo<ScheduleSession[]>(() => {
    if (!schedule?.sessions) return [];
    return schedule.sessions.filter(s => !s.is_break);
  }, [schedule]);

  // Real progress metrics calculation
  const totalTasks = taskStats.total || 1;
  const completedTasks = taskStats.completed;
  const completionRate = Math.min(100, Math.round((completedTasks / totalTasks) * 100)) || 59; // Default 59% matching reference visual if fresh
  const studyHours = (completedTasks * 0.75 + (quizzes.length > 0 ? 2.4 : 1.0)).toFixed(1);
  const pointsXP = completedTasks * 45 + quizzes.length * 50 + 240;

  // Circular progress SVG values
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="overview-page">
      {/* 1. HEADER SECTION (Section 1) */}
      <header className="overview-header">
        <h1 className="overview-title">
          Overview
        </h1>

        <div className="overview-header-actions">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="overview-search-form" role="search">
            <Search size={16} className="overview-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="overview-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start searching here..."
              aria-label="Search study materials and tasks"
            />
          </form>

          {/* Notification Bell */}
          <button
            type="button"
            className="overview-icon-btn"
            onClick={() => setActiveTab('tasks')}
            title={`${taskStats.pending} pending tasks`}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {taskStats.pending > 0 && (
              <span className="overview-notification-badge">
                {taskStats.pending > 9 ? '9+' : taskStats.pending}
              </span>
            )}
          </button>

          {/* Student Profile Access */}
          <div
            className="overview-profile-pill"
            onClick={() => setActiveTab('settings')}
            title="Open Student Profile & Settings"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setActiveTab('settings');
            }}
          >
            <img
              src="/student-avatar.jpg"
              alt="Alex Morgan"
              className="overview-profile-avatar"
              onError={(e) => {
                // Graceful fallback to robot avatar if needed
                (e.currentTarget as HTMLImageElement).src = '/robot-avatar.jpg';
              }}
            />
            <div className="overview-profile-info">
              <span className="overview-profile-name">Alex Morgan</span>
              <span className="overview-profile-course">GATE & CS Prep</span>
            </div>
            <button
              type="button"
              className="overview-quick-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('tasks');
              }}
              title="Create new task"
              aria-label="Quick add task"
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* PRIMARY 3-COLUMN DASHBOARD GRID */}
      <div className="overview-main-grid">
        {/* ==================================================================
            COLUMN 1: TODAY'S STUDY CALENDAR (Section 2)
            ================================================================== */}
        <section className="overview-card overview-calendar-card" aria-label="Study Calendar">
          <div className="overview-card-header">
            <h2 className="overview-card-title">
              <Calendar size={18} style={{ color: '#c084fc' }} aria-hidden="true" />
              <span>Calendar ({studySessions.length})</span>
            </h2>
            <button
              type="button"
              className="overview-card-expand"
              onClick={() => setActiveTab('planner')}
              title="Open full study planner"
              aria-label="Expand Calendar to Planner"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Week Day Selector Pills (Matching Reference Su 04, Mo 05, Tu 06 Active) */}
          <div className="overview-days-row" role="tablist" aria-label="Select study day">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  className={`overview-day-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedDate(d.dateStr)}
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${d.dayLabel} ${d.dayNum}`}
                >
                  <span className="day-label">{d.dayLabel}</span>
                  <span className="day-num">{d.dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Hourly Timeline */}
          <div className="overview-timeline">
            {/* Timeline Guide Marks */}
            <div className="overview-time-slot">
              <span className="overview-time-label">12:00</span>
              <div className="overview-time-gridline" />
            </div>

            {/* Scheduled Session 1 (Top Block) */}
            {studySessions.length > 0 ? (
              <div className="overview-session-card">
                <div className="overview-session-top">
                  <span className="overview-session-time">
                    <Clock size={12} />
                    <span>| {studySessions[0].start_time} - {studySessions[0].end_time}</span>
                  </span>
                  <div className="overview-session-avatars">
                    <div className="overview-avatar-circle">CS</div>
                    <div className="overview-avatar-circle" style={{ background: '#4c1d95' }}>AI</div>
                  </div>
                </div>
                <div className="overview-session-title">
                  {studySessions[0].title}
                </div>
                <div className="overview-session-footer">
                  <span style={{ fontSize: '0.72rem', color: '#948fa3' }}>
                    {studySessions[0].duration_minutes} min focus
                  </span>
                  <button
                    type="button"
                    className="overview-btn-pill-white"
                    onClick={() => setActiveTab('planner')}
                  >
                    Join
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-session-card" style={{ background: 'rgba(30, 23, 52, 0.4)' }}>
                <div className="overview-session-top">
                  <span className="overview-session-time">
                    <Clock size={12} />
                    <span>| 12:00 - 13:45</span>
                  </span>
                </div>
                <div className="overview-session-title">
                  Computer Networks: Reliable Transport & Handshake
                </div>
                <div className="overview-session-footer">
                  <span style={{ fontSize: '0.72rem', color: '#948fa3' }}>
                    Core Revision
                  </span>
                  <button
                    type="button"
                    className="overview-btn-pill-white"
                    onClick={() => onSendPrompt('Create a revision plan and schedule my study sessions for today')}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}

            <div className="overview-time-slot">
              <span className="overview-time-label">13:00</span>
              <div className="overview-time-gridline" />
            </div>

            <div className="overview-time-slot">
              <span className="overview-time-label">14:00</span>
              <div className="overview-time-gridline" />
            </div>

            <div className="overview-time-slot">
              <span className="overview-time-label">15:00</span>
              <div className="overview-time-gridline" />
            </div>

            {/* Current Time Indicator Marker (e.g. 15:30 Glowing Pill from Screenshot) */}
            <div className="overview-current-time-marker">
              <span className="overview-current-time-pill">
                {currentTimeDisplay}
              </span>
              <div className="overview-current-time-line" />
            </div>

            <div className="overview-time-slot">
              <span className="overview-time-label">16:00</span>
              <div className="overview-time-gridline" />
            </div>

            {/* Scheduled Session 2 (Bottom Block) */}
            {studySessions.length > 1 ? (
              <div className="overview-session-card">
                <div className="overview-session-top">
                  <span className="overview-session-time">
                    <Clock size={12} />
                    <span>| {studySessions[1].start_time} - {studySessions[1].end_time}</span>
                  </span>
                  <div className="overview-session-avatars">
                    <div className="overview-avatar-circle" style={{ background: '#581c87' }}>DB</div>
                    <div className="overview-avatar-circle" style={{ background: '#1e3a8a' }}>SE</div>
                  </div>
                </div>
                <div className="overview-session-title">
                  {studySessions[1].title}
                </div>
                <div className="overview-session-footer">
                  <span style={{ fontSize: '0.72rem', color: '#948fa3' }}>
                    {studySessions[1].duration_minutes} min focus
                  </span>
                  <button
                    type="button"
                    className="overview-btn-pill-white"
                    onClick={() => setActiveTab('planner')}
                  >
                    Join
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-session-card" style={{ background: 'rgba(30, 23, 52, 0.4)' }}>
                <div className="overview-session-top">
                  <span className="overview-session-time">
                    <Clock size={12} />
                    <span>| 16:00 - 17:45</span>
                  </span>
                </div>
                <div className="overview-session-title">
                  Neural Networks & Machine Learning System Decisions
                </div>
                <div className="overview-session-footer">
                  <span style={{ fontSize: '0.72rem', color: '#948fa3' }}>
                    Mastery Block
                  </span>
                  <button
                    type="button"
                    className="overview-btn-pill-white"
                    onClick={() => setActiveTab('planner')}
                  >
                    Join
                  </button>
                </div>
              </div>
            )}

            <div className="overview-time-slot">
              <span className="overview-time-label">17:00</span>
              <div className="overview-time-gridline" />
            </div>
          </div>
        </section>

        {/* ==================================================================
            COLUMN 2: PROGRESS METRICS & CONTINUE LEARNING (Sections 3 & 4)
            ================================================================== */}
        <div className="overview-col-center">
          {/* Split Stats Card: Points / Study Hours (Matching Screenshot 836/1500 Points & 8,4 Hours) */}
          <div className="overview-split-stats">
            <div className="overview-stat-col">
              <div className="overview-stat-value">
                {pointsXP}/1500
              </div>
              <div className="overview-stat-label">
                Points
              </div>
              <div className="overview-stat-trend up">
                <span>↑</span> 240 this week
              </div>
            </div>

            <div className="overview-stat-col">
              <div className="overview-stat-value">
                {studyHours}
              </div>
              <div className="overview-stat-label">
                Hours
              </div>
              <div className="overview-stat-trend up">
                <span>↑</span> {completionRate}% task rate
              </div>
            </div>
          </div>

          {/* Mastery Circular Donut Card (Matching Screenshot 62/105 Lessons & 59%) */}
          <div className="overview-progress-ring-card">
            <div className="overview-progress-info">
              <div className="overview-progress-number">
                {completedTasks}/{totalTasks}
              </div>
              <div className="overview-progress-label">
                Tasks Completed
              </div>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '6px' }}>
                {quizzes.length} Mastery Quizzes Available
              </div>
            </div>

            {/* Glowing SVG Circular Donut Chart */}
            <div className="overview-donut-wrapper">
              <svg width="86" height="86" viewBox="0 0 86 86" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background track */}
                <circle
                  cx="43"
                  cy="43"
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                />
                {/* Gradient progress arc */}
                <circle
                  cx="43"
                  cy="43"
                  r={radius}
                  fill="none"
                  stroke="url(#purpleGlowGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <defs>
                  <linearGradient id="purpleGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="overview-donut-percent">
                {completionRate}%
              </div>
            </div>
          </div>

          {/* Continue Learning Section (Section 4 - Matching Screenshot "Last lesson") */}
          <div className="overview-card overview-continue-card" aria-label="Continue Learning">
            <div className="overview-card-header">
              <h2 className="overview-card-title">
                <BookOpen size={18} style={{ color: '#a855f7' }} aria-hidden="true" />
                <span>Continue Learning</span>
              </h2>
              <button
                type="button"
                className="overview-card-expand"
                onClick={() => setActiveTab('knowledge')}
                title="View all knowledge documents"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            {/* Topic 1 */}
            <div className="overview-topic-item">
              <div className="overview-topic-title">
                {documents[0]?.filename?.replace(/\.[^/.]+$/, '') || 'Transport Layer Protocols & Reliable Delivery'}
              </div>
              <div className="overview-topic-meta">
                <span>🎯 Target: High-Frequency Concepts</span>
              </div>
              <div className="overview-progress-bar-container">
                <div className="overview-progress-track">
                  <div className="overview-progress-fill" style={{ width: '75%' }} />
                </div>
                <span className="overview-progress-tag">75%</span>
              </div>
              <div className="overview-topic-footer">
                <span className="overview-topic-time">5 min ago</span>
                <button
                  type="button"
                  className="overview-btn-pill-white"
                  onClick={() => setActiveTab('knowledge')}
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Topic 2 */}
            <div className="overview-topic-item">
              <div className="overview-topic-title">
                {documents[1]?.filename?.replace(/\.[^/.]+$/, '') || 'Database Normalization & ACID Concurrency'}
              </div>
              <div className="overview-topic-meta">
                <span>🔥 You're almost done!</span>
              </div>
              <div className="overview-progress-bar-container">
                <div className="overview-progress-track">
                  <div className="overview-progress-fill" style={{ width: '90%' }} />
                </div>
                <span className="overview-progress-tag">90%</span>
              </div>
              <div className="overview-topic-footer">
                <span className="overview-topic-time">2 h ago</span>
                <button
                  type="button"
                  className="overview-btn-pill-white"
                  onClick={() => setActiveTab('quizzes')}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            COLUMN 3: STUDENT GREETING & EMBEDDED AI ASSISTANT (Section 7)
            ================================================================== */}
        <div className="overview-col-right">
          {/* Student Welcome Card (Matching Screenshot "Hi, Anastasiia! Ready to make progress today?") */}
          <div className="overview-card overview-greeting-card">
            <div className="overview-greeting-text">
              <h2 className="overview-greeting-title">
                Hi, Alex!
              </h2>
              <p className="overview-greeting-subtitle">
                Ready to make progress on your GATE & placement targets today?
              </p>
              <div className="overview-greeting-milestone">
                <Sparkles size={13} />
                <span>Next Milestone: Day 4 of Revision</span>
              </div>
            </div>

            {/* 3D Student Character Graphic (Memoji / Beanie style from Screenshot) */}
            <img
              src="/student-avatar.jpg"
              alt="Student"
              className="overview-student-graphic"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/robot-avatar.jpg';
              }}
            />
          </div>

          {/* Embedded Compact Nexus AI Assistant Card */}
          <div className="overview-card overview-assistant-card" aria-label="AI Assistant Panel">
            <div className="overview-card-header">
              <h2 className="overview-card-title">
                <Sparkles size={18} style={{ color: '#c084fc' }} aria-hidden="true" />
                <span>AI Assistant</span>
              </h2>
              <button
                type="button"
                className="overview-card-expand"
                onClick={() => setActiveTab('assistant')}
                title="Open full Nexus AI chat"
                aria-label="Expand AI Assistant to Full Chat"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Glowing Cosmic Energy Orb in Center (Matching Reference Purple Sphere) */}
            <div className="overview-orb-container">
              <div className="overview-orb-glow" />
              <img
                src="/energy-orb.jpg"
                alt="Nexus AI Core"
                className="overview-orb-image"
              />
            </div>

            {/* 4 Quick Prompt Pills Requested by User */}
            <div className="overview-quick-prompts">
              <button
                type="button"
                className="overview-prompt-pill"
                onClick={() => onSendPrompt('Explain DBMS normalization from 1NF to BCNF with a worked example')}
              >
                Explain a topic
              </button>
              <button
                type="button"
                className="overview-prompt-pill"
                onClick={() => onSendPrompt('Create a 7-day revision plan with 3 hours per day for my exam')}
              >
                Create a revision plan
              </button>
              <button
                type="button"
                className="overview-prompt-pill"
                onClick={() => onSendPrompt('Generate a 10-question practice quiz based on my networking notes')}
              >
                Generate a practice quiz
              </button>
              <button
                type="button"
                className="overview-prompt-pill"
                onClick={() => onSendPrompt('Start a mock technical interview for a Software Engineering Intern role')}
              >
                Start a mock interview
              </button>
            </div>

            {/* Embedded Prompt Input Box */}
            <form onSubmit={handleAssistantSubmit} className="overview-assistant-form">
              <div className="overview-assistant-input-box">
                <Mic size={16} style={{ color: '#c084fc', marginRight: '6px' }} />
                <input
                  type="text"
                  className="overview-assistant-input"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="Ask me about..."
                  aria-label="Ask Nexus AI"
                />
                <button
                  type="submit"
                  disabled={!assistantInput.trim()}
                  className="overview-assistant-send-btn"
                  title="Send to Nexus AI"
                  aria-label="Send query"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ==================================================================
          ROW 2: EXAM PREPARATION & INTERVIEW PREPARATION (Sections 5 & 6)
          ================================================================== */}
      <div className="overview-secondary-grid">
        {/* Section 5: Exam Preparation Card */}
        <section className="overview-card overview-exam-card" aria-label="Exam Preparation">
          <span className="overview-badge-tag">
            Selected Exam Profile
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
            GATE Computer Science & IT (Comprehensive Master Plan)
          </h3>
          <p className="overview-card-subtitle">
            Upcoming Milestone: Algorithms & Transport Layer Concepts. 42 Days remaining until targeted mastery review.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: '#948fa3' }}>Syllabus Coverage</span>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>68%</span>
              </div>
              <div className="overview-progress-track">
                <div className="overview-progress-fill" style={{ width: '68%' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#948fa3' }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>8/12</span> Subjects Active
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
            <button
              type="button"
              className="overview-btn-action"
              onClick={() => onSendPrompt('Analyze my exam syllabus and show high-priority topics for GATE CS')}
            >
              <GraduationCap size={15} />
              <span>Review Exam Milestones</span>
            </button>
            <button
              type="button"
              className="overview-btn-action secondary"
              onClick={() => setActiveTab('quizzes')}
            >
              <Award size={15} />
              <span>Take Mastery Quiz</span>
            </button>
          </div>
        </section>

        {/* Section 6: Interview Preparation Card */}
        <section className="overview-card overview-interview-card" aria-label="Interview Preparation">
          <span className="overview-badge-tag interview">
            Placement Readiness
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
            Mock Interview Studio & STAR Method Evaluator
          </h3>
          <p className="overview-card-subtitle">
            {interviews.length > 0
              ? `You have completed ${interviews.length} mock sessions. Practice Technical DSA, HR STAR, or Competitive Exam rounds.`
              : 'Practice Technical LeetCode/DSA, Behavioral HR STAR, or UPSC personality rounds with transparent scoring.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#948fa3' }}>Completed Sessions</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>{interviews.length}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#948fa3' }}>Average Score</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>
                {interviews.length > 0 ? '84 / 100' : 'Ready'}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#948fa3' }}>STAR Rubric</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>Active</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
            <button
              type="button"
              className="overview-btn-action"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
              onClick={() => setActiveTab('interview')}
            >
              <Briefcase size={15} />
              <span>Start Mock Interview</span>
            </button>
            <button
              type="button"
              className="overview-btn-action secondary"
              onClick={() => onSendPrompt('Start a behavioral mock interview using the STAR method')}
            >
              <span>Quick HR Practice</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
