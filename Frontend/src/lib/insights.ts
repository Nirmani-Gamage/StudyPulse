import type { StudySession, Subject, Goal, CalendarEvent } from '../types';

export interface InsightResult {
  title: string;
  value: string;
  description: string;
  status: 'success' | 'warning' | 'neutral' | 'info';
}

export function getBestStudyTime(sessions: StudySession[]): InsightResult {
  if (sessions.length === 0) {
    return {
      title: 'Best Study Time',
      value: 'Not enough data yet',
      description: 'Complete a few study sessions to discover your study pattern.',
      status: 'neutral'
    };
  }

  let morning = 0; // 5-11
  let afternoon = 0; // 12-16
  let evening = 0; // 17-20
  let night = 0; // 21-4

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    if (hour >= 5 && hour < 12) morning += session.durationMinutes;
    else if (hour >= 12 && hour < 17) afternoon += session.durationMinutes;
    else if (hour >= 17 && hour < 21) evening += session.durationMinutes;
    else night += session.durationMinutes;
  });

  const max = Math.max(morning, afternoon, evening, night);
  
  if (max === 0) {
    return {
      title: 'Best Study Time',
      value: 'Not enough data yet',
      description: 'Complete a few study sessions to discover your study pattern.',
      status: 'neutral'
    };
  }

  let period = '';
  let timeRange = '';
  let emoji = '';
  
  if (max === evening) { period = 'evening'; timeRange = '5 PM and 9 PM'; emoji = '🌙'; }
  else if (max === morning) { period = 'morning'; timeRange = '5 AM and 12 PM'; emoji = '🌅'; }
  else if (max === afternoon) { period = 'afternoon'; timeRange = '12 PM and 5 PM'; emoji = '☀️'; }
  else { period = 'night'; timeRange = '9 PM and 5 AM'; emoji = '🦉'; }

  return {
    title: `Best Study Time ${emoji}`,
    value: `Most of your study time is in the ${period}.`,
    description: `A majority of your recorded study time happens between ${timeRange}.`,
    status: 'info'
  };
}

export function getMostStudiedSubject(sessions: StudySession[], subjects: Subject[]): InsightResult {
  if (sessions.length === 0 || subjects.length === 0) {
    return {
      title: 'Most Studied Subject',
      value: 'No study data yet',
      description: 'Start a session to see your top subject.',
      status: 'neutral'
    };
  }

  const subjectTotals: Record<string, number> = {};
  sessions.forEach(s => {
    subjectTotals[s.subjectId] = (subjectTotals[s.subjectId] || 0) + s.durationMinutes;
  });

  let topSubjectId = '';
  let maxMinutes = -1;
  Object.entries(subjectTotals).forEach(([id, mins]) => {
    if (mins > maxMinutes) {
      maxMinutes = mins;
      topSubjectId = id;
    }
  });

  if (maxMinutes <= 0) {
    return {
      title: 'Most Studied Subject',
      value: 'No study data yet',
      description: 'Start a session to see your top subject.',
      status: 'neutral'
    };
  }

  const topSubject = subjects.find(s => s.id === topSubjectId);

  return {
    title: 'Most Studied Subject',
    value: topSubject?.name || 'Unknown',
    description: 'Your most studied subject recently.',
    status: 'info'
  };
}

export function getStudyConsistency(sessions: StudySession[]): InsightResult {
  const now = new Date();
  const activeDays = new Set<string>();
  
  // Look at last 7 calendar days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    
    if (sessions.some(s => s.startTime.startsWith(dStr))) {
      activeDays.add(dStr);
    }
  }

  const count = activeDays.size;

  if (sessions.length === 0) {
    return {
      title: 'Study Consistency',
      value: 'No Data',
      description: 'Not enough sessions yet.',
      status: 'neutral'
    };
  } else if (count >= 5) {
    return {
      title: 'Study Consistency',
      value: 'Excellent',
      description: `You're active on ${count} of the last 7 days.`,
      status: 'success'
    };
  } else if (count >= 3) {
    return {
      title: 'Study Consistency',
      value: 'Good',
      description: `You're active on ${count} of the last 7 days.`,
      status: 'info'
    };
  } else {
    return {
      title: 'Study Consistency',
      value: 'Needs Improvement',
      description: `You're active on ${count} of the last 7 days.`,
      status: 'warning'
    };
  }
}

export function getWeeklyEstimate(sessions: StudySession[]): InsightResult {
  const now = new Date();
  let last7DaysMinutes = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    
    const dayMins = sessions.filter(s => s.startTime.startsWith(dStr)).reduce((acc, s) => acc + s.durationMinutes, 0);
    last7DaysMinutes += dayMins;
  }

  if (last7DaysMinutes === 0) {
    return {
      title: 'Estimated Weekly Study Time',
      value: 'Not enough data',
      description: 'Keep studying to build your prediction.',
      status: 'neutral'
    };
  }

  const avgDailyMinutes = last7DaysMinutes / 7;
  const estimatedWeeklyMinutes = avgDailyMinutes * 7;
  const hours = Math.round(estimatedWeeklyMinutes / 60 * 10) / 10;

  return {
    title: 'Estimated Weekly Study Time',
    value: `≈ ${hours}h`,
    description: 'Based on your recent study pattern.',
    status: 'info'
  };
}

export function getGoalRisk(goals: Goal[]): InsightResult {
  const activeGoals = goals.filter(g => !g.isCompleted);
  if (activeGoals.length === 0) {
    return {
      title: 'Goal Risk',
      value: 'No active goals',
      description: 'Create a goal to track your progress.',
      status: 'neutral'
    };
  }

  const now = new Date();
  let mostAtRisk: Goal | null = null;
  let highestRiskScore = -1;
  let riskDetails = { remainingMins: 0, daysLeft: 0, requiredDaily: 0 };

  activeGoals.forEach(g => {
    const deadline = new Date(g.deadline);
    const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24)));
    
    if (daysLeft < 0) return; // passed deadline is handled separately or ignored in risk calc for active approach
    
    const remainingHours = g.targetHours - g.completedHours;
    
    if (remainingHours <= 0) return;

    if (daysLeft === 0) {
      if (remainingHours > 0 && highestRiskScore < 999) {
        mostAtRisk = g;
        highestRiskScore = 999;
        riskDetails = { remainingMins: remainingHours * 60, daysLeft: 0, requiredDaily: remainingHours * 60 };
      }
      return;
    }

    const requiredDailyHours = remainingHours / daysLeft;
    
    // Simple heuristic: if required daily is > 2 hours and days left < 7, high risk
    const riskScore = requiredDailyHours / Math.max(1, daysLeft);
    
    if (riskScore > highestRiskScore) {
      highestRiskScore = riskScore;
      mostAtRisk = g;
      riskDetails = { remainingMins: remainingHours * 60, daysLeft, requiredDaily: requiredDailyHours * 60 };
    }
  });

  if (!mostAtRisk) {
    // Check if any deadline passed
    const passed = activeGoals.find(g => new Date(g.deadline) < now);
    if (passed) {
      return {
        title: 'Deadline Passed',
        value: passed.title,
        description: 'This goal missed its deadline.',
        status: 'warning'
      };
    }
    
    return {
      title: 'Goal On Track 🎯',
      value: 'Looking good!',
      description: "You're making good progress toward your goals.",
      status: 'success'
    };
  }

  const g = mostAtRisk as Goal;
  const remainingHours = Math.round((g.targetHours - g.completedHours) * 10) / 10;
  
  if (riskDetails.requiredDaily > 120 && riskDetails.daysLeft < 5) { // Needs > 2h/day
    return {
      title: 'Goal Needs Attention ⚠️',
      value: g.title,
      description: `${remainingHours} hours remain with ${riskDetails.daysLeft} days left.`,
      status: 'warning'
    };
  }

  return {
    title: 'Goal On Track 🎯',
    value: 'Looking good!',
    description: "You're making good progress toward your goals.",
    status: 'success'
  };
}

export function getSubjectBalance(sessions: StudySession[], subjects: Subject[]): InsightResult {
  if (sessions.length === 0 || subjects.length === 0) {
    return {
      title: 'Study Balance',
      value: 'Not enough data',
      description: 'Study more subjects to see your study balance.',
      status: 'neutral'
    };
  }

  const subjectTotals: Record<string, number> = {};
  let totalMinutes = 0;
  
  sessions.forEach(s => {
    subjectTotals[s.subjectId] = (subjectTotals[s.subjectId] || 0) + s.durationMinutes;
    totalMinutes += s.durationMinutes;
  });

  if (totalMinutes === 0) {
    return {
      title: 'Study Balance',
      value: 'Not enough data',
      description: 'Study more subjects to see your study balance.',
      status: 'neutral'
    };
  }

  let maxSubjectId = '';
  let maxPercentage = 0;

  Object.entries(subjectTotals).forEach(([id, mins]) => {
    const pct = (mins / totalMinutes) * 100;
    if (pct > maxPercentage) {
      maxPercentage = pct;
      maxSubjectId = id;
    }
  });

  if (maxPercentage > 50 && Object.keys(subjectTotals).length > 1) {
    const sub = subjects.find(s => s.id === maxSubjectId);
    return {
      title: 'Study Balance',
      value: `${Math.round(maxPercentage)}% on ${sub?.name || 'one subject'}`,
      description: `Consider giving some time to your other subjects.`,
      status: 'warning'
    };
  }

  return {
    title: 'Study Balance',
    value: 'Well balanced',
    description: 'Your study time is well distributed across your subjects.',
    status: 'success'
  };
}

export function getWeeklyTrend(sessions: StudySession[]): InsightResult {
  const now = new Date();
  
  let current7DaysMins = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    current7DaysMins += sessions.filter(s => s.startTime.startsWith(dStr)).reduce((a, s) => a + s.durationMinutes, 0);
  }

  let previous7DaysMins = 0;
  for (let i = 7; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    previous7DaysMins += sessions.filter(s => s.startTime.startsWith(dStr)).reduce((a, s) => a + s.durationMinutes, 0);
  }

  if (previous7DaysMins === 0) {
    return {
      title: 'Study Trend',
      value: 'Not enough data',
      description: 'Keep studying to build your weekly trend.',
      status: 'neutral'
    };
  }

  const diff = current7DaysMins - previous7DaysMins;
  const pct = Math.round((diff / previous7DaysMins) * 100);

  if (pct > 0) {
    return {
      title: 'Study Trend 📈',
      value: 'Your study time is improving',
      description: `+${pct}% compared with the previous week.`,
      status: 'success'
    };
  } else if (pct < 0) {
    return {
      title: 'Study Trend',
      value: 'Your study time has decreased',
      description: `${pct}% compared with the previous week.`,
      status: 'warning'
    };
  }

  return {
    title: 'Study Trend',
    value: 'Consistent',
    description: `About the same as the previous week.`,
    status: 'info'
  };
}

export function getSuggestedActions(
  consistency: InsightResult, 
  trend: InsightResult, 
  goalRisk: InsightResult, 
  balance: InsightResult,
  events: CalendarEvent[]
): string[] {
  const suggestions: string[] = [];
  const now = new Date();
  
  // Goal Check
  if (goalRisk.status === 'warning') {
    suggestions.push(`Spend some extra time on your ${goalRisk.value} goal.`);
  }

  // Event Check (upcoming exam within 7 days)
  const upcomingExam = events.find(e => {
    if (e.type !== 'exam') return false;
    const daysLeft = Math.ceil((new Date(e.date).getTime() - now.getTime()) / (1000 * 3600 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  });
  if (upcomingExam) {
    suggestions.push(`Your ${upcomingExam.title} exam is approaching. Consider reviewing it today.`);
  }

  // Consistency Check
  if (consistency.value === 'Needs Improvement') {
    suggestions.push('Try completing a short study session today.');
  } else if (consistency.value === 'Excellent') {
    suggestions.push('Great consistency! Keep your current study routine.');
  }

  // Balance Check
  if (balance.status === 'warning') {
    suggestions.push(balance.description);
  }

  // Trend Check
  if (trend.value === 'Your study time has decreased') {
    suggestions.push('Your study time has decreased recently. Consider scheduling a short session.');
  }

  // Deduplicate and limit to top 3
  return [...new Set(suggestions)].slice(0, 3);
}
