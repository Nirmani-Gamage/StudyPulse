const mongoose = require('mongoose');
const StudySession = require('../models/StudySession');
const DailyTask = require('../models/DailyTask');
const Goal = require('../models/Goal');
const CalendarEvent = require('../models/CalendarEvent');
const Subject = require('../models/Subject');
const analyticsService = require('./analyticsService');
const effectivenessService = require('./effectivenessService');

// Priority mapping based on score
const getPriority = (score) => {
  if (score >= 80) return 'HIGH';
  if (score >= 60) return 'MEDIUM';
  return 'LOW';
};

/**
 * Retrieves all context needed for recommendations using parallel queries
 */
const getRecommendationContext = async (userId, options) => {
  const now = new Date();
  
  // 14 days ago for recent study history
  const historyStart = new Date(now);
  historyStart.setDate(now.getDate() - 14);

  // Future for upcoming exams
  const futureEnd = new Date(now);
  futureEnd.setDate(now.getDate() + 30); // look up to 30 days ahead

  const [
    subjects,
    activeGoals,
    upcomingExams,
    recentSessions,
    incompleteTasks,
    learningMetrics
  ] = await Promise.all([
    Subject.find({ userId }),
    Goal.find({ userId, isCompleted: false }),
    CalendarEvent.find({ userId, type: 'exam', date: { $gte: now, $lte: futureEnd } }),
    StudySession.find({ userId, startTime: { $gte: historyStart } }),
    DailyTask.find({ userId, completed: false, priority: 'high' }),
    analyticsService.getLearningMetrics(userId, { range: '14d' }) // Re-use phase 4 metrics
  ]);

  const effectiveness = effectivenessService.calculateEffectiveness(learningMetrics);

  // Group study sessions by subject for quick lookup
  const subjectStudyMap = {};
  subjects.forEach(s => subjectStudyMap[s._id.toString()] = { 
    totalMinutes: 0, 
    lastStudied: null,
    subject: s 
  });
  
  recentSessions.forEach(s => {
    if (!s.subjectId) return;
    const sid = s.subjectId.toString();
    if (!subjectStudyMap[sid]) return;
    
    subjectStudyMap[sid].totalMinutes += s.durationMinutes;
    if (!subjectStudyMap[sid].lastStudied || s.startTime > subjectStudyMap[sid].lastStudied) {
      subjectStudyMap[sid].lastStudied = s.startTime;
    }
  });

  return {
    now,
    subjects,
    activeGoals,
    upcomingExams,
    subjectStudyMap,
    incompleteTasks,
    effectiveness
  };
};

/**
 * Evaluates rules and generates raw recommendation candidates
 */
const evaluateRules = (context) => {
  const { now, upcomingExams, subjectStudyMap, activeGoals, incompleteTasks, effectiveness } = context;
  const candidates = [];
  
  // Track subjects that have exam prep so we don't duplicate with revision/inactive
  const subjectsWithExamPrep = new Set();

  // RULE 1: Upcoming Exam Preparation
  upcomingExams.forEach(exam => {
    const daysUntil = (exam.date.getTime() - now.getTime()) / (1000 * 3600 * 24);
    if (daysUntil <= 14) {
      const sid = exam.subjectId ? exam.subjectId.toString() : null;
      let recentStudy = 0;
      let subjectName = exam.title || "Exam Subject";
      
      if (sid && subjectStudyMap[sid]) {
        recentStudy = subjectStudyMap[sid].totalMinutes;
        subjectName = subjectStudyMap[sid].subject.name;
        subjectsWithExamPrep.add(sid);
      }

      // Base urgency score
      let score = 0;
      if (daysUntil <= 3) score += 50;
      else if (daysUntil <= 7) score += 35;
      else score += 20;

      // Deficit score
      if (recentStudy === 0) score += 45;
      else if (recentStudy < 60) score += 30;
      else if (recentStudy < 120) score += 15;

      if (score >= 40) {
        candidates.push({
          id: `exam-prep-${exam._id}`,
          type: 'EXAM_PREPARATION',
          subjectId: sid,
          subject: subjectName,
          title: `Prepare for ${subjectName}`,
          duration: score >= 80 ? 60 : 45,
          score: Math.min(100, score),
          reason: [
            `Exam in ${Math.ceil(daysUntil)} days`,
            `Only ${recentStudy} minutes studied recently`
          ],
          action: { type: 'START_STUDY', subjectId: sid, duration: score >= 80 ? 60 : 45 }
        });
      }
    }
  });

  // RULE 3 & 4: Goal Risk
  activeGoals.forEach(goal => {
    if (!goal.deadline) return;
    const daysUntil = (new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 3600 * 24);
    
    if (daysUntil > 0 && daysUntil <= 14) {
      const progress = goal.targetHours > 0 ? (goal.completedHours / goal.targetHours) * 100 : 0;
      let score = 0;
      
      if (daysUntil <= 3 && progress < 50) score = 95;
      else if (daysUntil <= 7 && progress < 50) score = 85;
      else if (daysUntil <= 12 && progress < 60) score = 70;
      else if (daysUntil <= 14 && progress < 70) score = 60;

      if (score >= 60) {
        candidates.push({
          id: `goal-risk-${goal._id}`,
          type: 'GOAL_RISK',
          subjectId: goal.subjectId ? goal.subjectId.toString() : null,
          subject: goal.title,
          title: `Progress Goal: ${goal.title}`,
          duration: score >= 80 ? 45 : 30,
          score,
          reason: [
            `Goal deadline in ${Math.ceil(daysUntil)} days`,
            `Completion is only ${Math.round(progress)}%`
          ],
          action: { type: 'VIEW_GOAL', subjectId: goal.subjectId ? goal.subjectId.toString() : null, duration: 45 }
        });
      }
    }
  });

  // RULE 2: Inactive Subject
  Object.keys(subjectStudyMap).forEach(sid => {
    if (subjectsWithExamPrep.has(sid)) return; // Don't duplicate if already an exam prep
    const data = subjectStudyMap[sid];
    
    if (data.lastStudied) {
      const daysSince = (now.getTime() - data.lastStudied.getTime()) / (1000 * 3600 * 24);
      if (daysSince >= 5) {
        let score = 50;
        if (daysSince >= 10) score = 85;
        else if (daysSince >= 7) score = 70;

        candidates.push({
          id: `inactive-${sid}`,
          type: 'INACTIVE_SUBJECT',
          subjectId: sid,
          subject: data.subject.name,
          title: `Review ${data.subject.name}`,
          duration: score >= 80 ? 45 : 30,
          score,
          reason: [`You haven't studied this subject for ${Math.floor(daysSince)} days`],
          action: { type: 'START_STUDY', subjectId: sid, duration: score >= 80 ? 45 : 30 }
        });
      }
    }
  });

  // Check Effectiveness Components
  if (effectiveness && effectiveness.components) {
    const { consistency, productivity, studyDistribution, revision } = effectiveness.components;

    // RULE 5: Revision
    if (revision && revision.available && revision.score < 50 && upcomingExams.length > 0) {
      candidates.push({
        id: 'sys-revision',
        type: 'REVISION',
        subjectId: null,
        subject: "General Revision",
        title: "Add a Revision Session",
        duration: 30,
        score: 75,
        reason: [
          "Your recent revision activity is low",
          "You have upcoming exams approaching"
        ],
        action: { type: 'START_STUDY', subjectId: null, duration: 30 }
      });
    }

    // RULE 6: Consistency
    if (consistency && consistency.available && consistency.score < 60) {
      candidates.push({
        id: 'sys-consistency',
        type: 'CONSISTENCY',
        subjectId: null,
        subject: "Study Routine",
        title: "Build a more consistent routine",
        duration: 25,
        score: 65,
        reason: ["Your recent study pattern is inconsistent"],
        action: { type: 'START_STUDY', subjectId: null, duration: 25 }
      });
    }

    // RULE 7: Productivity / Focus
    if (productivity && productivity.available && productivity.score < 60) {
      candidates.push({
        id: 'sys-focus',
        type: 'FOCUS',
        subjectId: null,
        subject: "Focus Session",
        title: "Try a focused Pomodoro session",
        duration: 25,
        score: 70,
        reason: ["Your recent productivity score is low"],
        action: { type: 'START_STUDY', subjectId: null, duration: 25 }
      });
    }

    // RULE 8: Study Distribution
    if (studyDistribution && studyDistribution.available && studyDistribution.score < 60) {
      if (activeGoals.length > 1 || upcomingExams.length > 1) {
        candidates.push({
          id: 'sys-distribution',
          type: 'STUDY_BALANCE',
          subjectId: null,
          subject: "Study Balance",
          title: "Rebalance your study subjects",
          duration: 30,
          score: 65,
          reason: [
            "Your study time is heavily concentrated",
            "You have multiple subjects with active priorities"
          ],
          action: { type: 'START_STUDY', subjectId: null, duration: 30 }
        });
      }
    }
  }

  // RULE 9: Task Planning
  if (incompleteTasks && incompleteTasks.length >= 3) {
    let score = 50 + (incompleteTasks.length * 5);
    candidates.push({
      id: 'sys-tasks',
      type: 'TASK_PLANNING',
      subjectId: null,
      subject: "Task Management",
      title: "Focus on existing tasks",
      duration: 30,
      score: Math.min(85, score),
      reason: [`You have ${incompleteTasks.length} high-priority tasks incomplete`],
      action: { type: 'VIEW_TASK', subjectId: null, duration: 30 }
    });
  }

  return candidates;
};

/**
 * Main export: Generates recommendations
 */
exports.generateRecommendations = async (userId, options = {}) => {
  const limit = options.limit ? parseInt(options.limit) : 3;
  const maxLimit = Math.max(1, Math.min(5, limit)); // cap between 1 and 5

  const context = await getRecommendationContext(userId, options);
  const candidates = evaluateRules(context);

  // Assign priority and format
  const formattedCandidates = candidates.map(c => ({
    ...c,
    priority: getPriority(c.score)
  }));

  // Sort by score descending
  formattedCandidates.sort((a, b) => b.score - a.score);

  // Deduplicate and group related signals. 
  // (In our rule engine, we already suppressed Inactive if ExamPrep exists for the same subject).
  // We just take top N.
  return formattedCandidates.slice(0, maxLimit);
};
