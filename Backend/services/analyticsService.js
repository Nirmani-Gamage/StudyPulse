const mongoose = require('mongoose');
const StudySession = require('../models/StudySession');
const DailyTask = require('../models/DailyTask');
const Goal = require('../models/Goal');
const JournalEntry = require('../models/JournalEntry');
const CalendarEvent = require('../models/CalendarEvent');
const Subject = require('../models/Subject');

/**
 * Parses and returns standard date range objects
 * @param {string} range '7d', '30d', '90d'
 * @param {string} startDateStr Optional YYYY-MM-DD
 * @param {string} endDateStr Optional YYYY-MM-DD
 */
const getDateRange = (range, startDateStr, endDateStr) => {
  const end = endDateStr ? new Date(endDateStr) : new Date();
  
  let start;
  if (startDateStr) {
    start = new Date(startDateStr);
  } else {
    start = new Date(end);
    let days = 30; // default 30d
    if (range === '7d') days = 7;
    if (range === '90d') days = 90;
    start.setDate(start.getDate() - days);
  }
  
  // Normalize to UTC boundaries
  end.setUTCHours(23, 59, 59, 999);
  start.setUTCHours(0, 0, 0, 0);

  const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

  return { start, end, daysInPeriod };
};

/**
 * Retrieves and calculates raw learning metrics for a given user.
 * 
 * @param {string} userId - Authenticated user's ID
 * @param {object} options - Options containing range, startDate, endDate
 */
exports.getLearningMetrics = async (userId, options = {}) => {
  const { range = '30d', startDate: startOpt, endDate: endOpt } = options;
  const { start, end, daysInPeriod } = getDateRange(range, startOpt, endOpt);
  
  const dateFilter = { $gte: start, $lte: end };

  // Fetch data concurrently
  const [
    sessions,
    tasks,
    goals,
    journalEntries,
    events,
    totalSubjects
  ] = await Promise.all([
    StudySession.find({ userId, startTime: dateFilter }),
    DailyTask.find({ userId, date: dateFilter }),
    Goal.find({ userId }), // We typically look at all active goals, not just ones created in period
    JournalEntry.find({ userId, date: dateFilter }),
    CalendarEvent.find({ userId, date: dateFilter }),
    Subject.countDocuments({ userId })
  ]);

  // --- Study Metrics ---
  let totalMinutes = 0;
  const activeStudyDays = new Set();
  let longestSession = 0;
  const subjectDistributionMap = {};

  sessions.forEach(s => {
    totalMinutes += s.durationMinutes;
    activeStudyDays.add(s.startTime.toISOString().split('T')[0]);
    if (s.durationMinutes > longestSession) longestSession = s.durationMinutes;
    
    const sid = s.subjectId ? s.subjectId.toString() : 'unassigned';
    subjectDistributionMap[sid] = (subjectDistributionMap[sid] || 0) + s.durationMinutes;
  });

  const totalSessions = sessions.length;
  const averageSessionMinutes = totalSessions > 0 ? (totalMinutes / totalSessions) : 0;
  
  // Format subject distribution
  const subjectDistribution = Object.entries(subjectDistributionMap).map(([subjectId, minutes]) => ({
    subjectId,
    minutes,
    percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
  })).sort((a, b) => b.minutes - a.minutes);

  // --- Task Metrics ---
  const totalTasks = tasks.length;
  const completedTasksList = tasks.filter(t => t.completed || t.completionStatus === 'completed');
  const completedTasks = completedTasksList.length;
  const partialTasks = tasks.filter(t => !t.completed && t.completionStatus === 'partial').length;
  const notCompletedTasks = tasks.filter(t => !t.completed && t.completionStatus === 'not_completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // --- Goal Metrics ---
  const activeGoalsList = goals.filter(g => !g.isCompleted);
  const totalGoals = goals.length;
  const activeGoals = activeGoalsList.length;
  let totalProgressPct = 0;
  activeGoalsList.forEach(g => {
    if (g.targetHours > 0) {
      let pct = (g.completedHours / g.targetHours) * 100;
      if (pct > 100) pct = 100;
      totalProgressPct += pct;
    }
  });
  const averageProgress = activeGoals > 0 ? (totalProgressPct / activeGoals) : 0;

  // --- Journal Metrics ---
  const journalCount = journalEntries.length;
  let totalProductivity = 0;
  let validProductivityCount = 0;
  journalEntries.forEach(j => {
    if (j.productivity != null) {
      totalProductivity += j.productivity;
      validProductivityCount++;
    }
  });
  const averageProductivity = validProductivityCount > 0 ? (totalProductivity / validProductivityCount) : null;

  // --- Revision Metrics ---
  let revisionTasksCount = 0;
  completedTasksList.forEach(t => {
    if (t.source === 'exam') {
      revisionTasksCount++;
    } else {
      const titleLower = (t.title || '').toLowerCase();
      if (titleLower.includes('review') || titleLower.includes('revise') || titleLower.includes('revision')) {
        revisionTasksCount++;
      }
    }
  });
  const revisionRate = completedTasks > 0 ? (revisionTasksCount / completedTasks) * 100 : 0;

  // --- Exam Metrics ---
  const upcomingExams = events.filter(e => e.type === 'exam' && e.date >= start);
  const now = new Date();
  const nearDeadlineExams = upcomingExams.filter(e => {
    const daysLeft = (e.date.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return daysLeft >= 0 && daysLeft <= 14;
  });

  return {
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      daysInPeriod
    },
    study: {
      totalMinutes,
      totalSessions,
      averageSessionMinutes,
      studyDays: activeStudyDays.size,
      longestSession
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      partial: partialTasks,
      notCompleted: notCompletedTasks,
      completionRate
    },
    goals: {
      total: totalGoals,
      active: activeGoals,
      averageProgress
    },
    subjects: {
      total: totalSubjects,
      distribution: subjectDistribution
    },
    journal: {
      entries: journalCount,
      averageProductivity
    },
    revision: {
      completedTasks,
      revisionTasks: revisionTasksCount,
      revisionRate
    },
    exams: {
      upcoming: upcomingExams.length,
      nearDeadline: nearDeadlineExams.length
    }
  };
};
