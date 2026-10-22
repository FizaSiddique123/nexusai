import { db } from '../database/db.js';
import { TaskService } from './taskService.js';

export interface PerformanceAnalysis {
  totalQuizzesTaken: number;
  averageScorePercentage: number;
  overallMasteryLevel: 'Foundational' | 'Intermediate' | 'Proficient' | 'Advanced';
  topicStrengths: Array<{ topic: string; attempts: number; averagePercentage: number; status: 'Strong' | 'Needs Practice' | 'Weak' }>;
  weakTopics: string[];
  recommendedActions: Array<{ action: string; priority: 'high' | 'medium'; durationMins: number }>;
  taskCompletionRate: number;
}

export class PerformanceService {
  /**
   * Calculate comprehensive real-time performance analytics from SQLite quiz attempts
   */
  static analyzePerformance(): PerformanceAnalysis {
    const attemptsStmt = db.prepare(`
      SELECT qa.id, qa.score, qa.total_questions, qa.percentage, qa.completed_at, q.topic, q.title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      ORDER BY qa.completed_at DESC
    `);
    const attempts = attemptsStmt.all() as Array<{
      id: string;
      score: number;
      total_questions: number;
      percentage: number;
      completed_at: string;
      topic: string;
      title: string;
    }>;

    const taskStats = TaskService.getTaskStats();

    if (attempts.length === 0) {
      return {
        totalQuizzesTaken: 0,
        averageScorePercentage: 0,
        overallMasteryLevel: 'Foundational',
        topicStrengths: [
          { topic: 'Computer Networks (OSI & TCP/IP)', attempts: 0, averagePercentage: 0, status: 'Needs Practice' }
        ],
        weakTopics: ['Take your first diagnostic quiz to identify weak areas.'],
        recommendedActions: [
          { action: 'Take the Computer Networks diagnostic quiz to baseline your score', priority: 'high', durationMins: 20 },
          { action: 'Review high-yield exam topics in your indexed notes', priority: 'medium', durationMins: 30 }
        ],
        taskCompletionRate: taskStats.completion_rate
      };
    }

    const totalQuizzes = attempts.length;
    const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzes);

    // Group by topic
    const topicMap: Record<string, { totalScore: number; count: number }> = {};
    for (const a of attempts) {
      const top = a.topic || 'General';
      if (!topicMap[top]) topicMap[top] = { totalScore: 0, count: 0 };
      topicMap[top].totalScore += a.percentage;
      topicMap[top].count += 1;
    }

    const topicStrengths: PerformanceAnalysis['topicStrengths'] = [];
    const weakTopics: string[] = [];

    for (const [topic, data] of Object.entries(topicMap)) {
      const pct = Math.round(data.totalScore / data.count);
      let status: 'Strong' | 'Needs Practice' | 'Weak' = 'Needs Practice';
      if (pct >= 80) {
        status = 'Strong';
      } else if (pct < 65) {
        status = 'Weak';
        weakTopics.push(topic);
      }
      topicStrengths.push({
        topic,
        attempts: data.count,
        averagePercentage: pct,
        status
      });
    }

    let mastery: PerformanceAnalysis['overallMasteryLevel'] = 'Intermediate';
    if (avgScore >= 85) mastery = 'Advanced';
    else if (avgScore >= 70) mastery = 'Proficient';
    else if (avgScore < 50) mastery = 'Foundational';

    const recommendedActions: PerformanceAnalysis['recommendedActions'] = [];
    if (weakTopics.length > 0) {
      for (const wt of weakTopics) {
        recommendedActions.push({
          action: `Targeted revision and practice quiz for weak topic: "${wt}"`,
          priority: 'high',
          durationMins: 45
        });
      }
    } else {
      recommendedActions.push({
        action: 'Maintain mastery with mixed-difficulty revision questions',
        priority: 'medium',
        durationMins: 30
      });
    }

    if (taskStats.pending > 0) {
      recommendedActions.push({
        action: `Clear ${taskStats.high_priority} high-priority study tasks scheduled in your queue`,
        priority: 'high',
        durationMins: 45
      });
    }

    return {
      totalQuizzesTaken: totalQuizzes,
      averageScorePercentage: avgScore,
      overallMasteryLevel: mastery,
      topicStrengths,
      weakTopics: weakTopics.length > 0 ? weakTopics : ['No critical weak areas identified yet! Keep up the momentum.'],
      recommendedActions,
      taskCompletionRate: taskStats.completion_rate
    };
  }

  /**
   * Format a rich performance overview message
   */
  static formatPerformanceReport(): string {
    const p = this.analyzePerformance();

    return `### 📈 Personalized Learning & Performance Analytics

- **Quizzes Completed**: ${p.totalQuizzesTaken}
- **Average Accuracy**: **${p.averageScorePercentage}%**
- **Overall Mastery Tier**: **${p.overallMasteryLevel}**
- **Study Task Completion Rate**: ${p.taskCompletionRate}%

---

#### 🎯 Topic Mastery Breakdown
${p.topicStrengths.map(ts => {
  const badge = ts.status === 'Strong' ? '🟢 Strong' : ts.status === 'Weak' ? '🔴 Weak' : '🟡 Needs Practice';
  return `- **${ts.topic}**: ${ts.averagePercentage}% (${ts.attempts} attempt${ts.attempts === 1 ? '' : 's'}) — ${badge}`;
}).join('\n')}

---

#### ⚠️ Priority Weak Areas Identified
${p.weakTopics.map(w => `- ${w}`).join('\n')}

---

#### 💡 Recommended Next Actions
${p.recommendedActions.map(a => `- [${a.priority.toUpperCase()}] **${a.action}** (~${a.durationMins} mins)`).join('\n')}

*Would you like me to schedule a 45-minute focused revision block or generate a practice quiz targeting your weak areas?*`;
  }
}
