/**
 * Converts raw learning metrics into deterministic Learning Effectiveness component scores.
 * 
 * Weights:
 * Goal Progress: 25%
 * Productivity: 25%
 * Consistency: 20%
 * Study Distribution: 15%
 * Revision Activity: 15%
 */

exports.calculateEffectiveness = (metrics) => {
  // 1. Goal Progress (25%)
  const goalProgress = calculateGoalProgress(metrics.goals);

  // 2. Productivity (25%)
  const productivity = calculateProductivity(metrics.journal);

  // 3. Consistency (20%)
  const consistency = calculateConsistency(metrics.study, metrics.period);

  // 4. Study Distribution (15%)
  const studyDistribution = calculateStudyDistribution(metrics.subjects);

  // 5. Revision Activity (15%)
  const revision = calculateRevision(metrics.revision);

  const components = {
    goalProgress,
    productivity,
    consistency,
    studyDistribution,
    revision
  };

  const weights = {
    goalProgress: 25,
    productivity: 25,
    consistency: 20,
    studyDistribution: 15,
    revision: 15
  };

  // Calculate overall score
  let totalScore = 0;
  let totalAvailableWeight = 0;
  let sufficientData = false;

  Object.entries(components).forEach(([key, component]) => {
    if (component.available && component.score !== null) {
      totalScore += component.score * (weights[key] / 100);
      totalAvailableWeight += weights[key];
    }
  });

  let overall = null;

  // Only produce a score if we have at least 40% of the weight available (meaning at least some core metrics are present)
  if (totalAvailableWeight >= 40) {
    sufficientData = true;
    // Normalize to out of 100 based on available weights
    overall = Math.round((totalScore / (totalAvailableWeight / 100)));
  }

  return {
    overall,
    sufficientData,
    components,
    weights
  };
};

function calculateGoalProgress(goals) {
  if (!goals || goals.active === 0) {
    return {
      score: null,
      available: false,
      goalCount: 0,
      averageProgress: null
    };
  }

  // Calculate score directly from average progress. 0 to 100.
  const score = Math.round(goals.averageProgress);

  return {
    score,
    available: true,
    goalCount: goals.active,
    averageProgress: Math.round(goals.averageProgress)
  };
}

function calculateProductivity(journal) {
  if (!journal || journal.entries === 0 || journal.averageProductivity === null) {
    return {
      score: null,
      available: false,
      journalEntries: journal ? journal.entries : 0,
      averageProductivity: null
    };
  }

  // Convert 1-5 scale to 0-100 scale.
  // 5 -> 100, 4 -> 80, 3 -> 60, 2 -> 40, 1 -> 20.
  // Formula: (value / 5) * 100
  const score = Math.round((journal.averageProductivity / 5) * 100);

  return {
    score,
    available: true,
    journalEntries: journal.entries,
    averageProductivity: Number(journal.averageProductivity.toFixed(1))
  };
}

function calculateConsistency(study, period) {
  if (!study || period.daysInPeriod === 0) {
    return {
      score: null,
      available: false,
      studyDays: 0,
      daysInPeriod: period ? period.daysInPeriod : 0,
      consistencyRate: 0
    };
  }

  const rawRate = (study.studyDays / period.daysInPeriod) * 100;

  // Gentle curve:
  // If they study > 75% of days, give them 100 (allows for rest days).
  // Otherwise, scale it up slightly.
  let score = 0;
  if (rawRate >= 75) {
    score = 100;
  } else {
    // e.g. 50% study days -> (50 / 75) * 100 = 66 score
    score = Math.round((rawRate / 75) * 100);
  }

  return {
    score,
    available: true,
    studyDays: study.studyDays,
    daysInPeriod: period.daysInPeriod,
    consistencyRate: Number(rawRate.toFixed(1))
  };
}

function calculateStudyDistribution(subjects) {
  if (!subjects || subjects.distribution.length === 0) {
    return {
      score: null,
      available: false,
      subjectCount: subjects ? subjects.total : 0,
      dominantSubject: null,
      dominantSubjectPercentage: null
    };
  }

  const dist = subjects.distribution;
  const topSubject = dist[0];

  if (subjects.total === 1) {
    // If they only have 1 subject in the system, 100% concentration is perfectly normal.
    return {
      score: 100,
      available: true,
      subjectCount: 1,
      dominantSubject: topSubject.subjectId,
      dominantSubjectPercentage: 100
    };
  }

  // If they have multiple subjects, penalize excessive concentration.
  // For example, if they spend > 85% time on one subject.
  let score = 100;
  const pct = topSubject.percentage;

  if (pct > 85) {
    score = 50; // Very highly concentrated
  } else if (pct > 65) {
    score = 75; // Moderately concentrated
  }

  return {
    score,
    available: true,
    subjectCount: subjects.total,
    dominantSubject: topSubject.subjectId,
    dominantSubjectPercentage: Math.round(pct)
  };
}

function calculateRevision(revision) {
  if (!revision || revision.completedTasks === 0) {
    return {
      score: null,
      available: false,
      completedTasks: 0,
      revisionTasks: 0,
      revisionRate: 0
    };
  }

  const rate = revision.revisionRate;
  let score = 0;

  // Target 20-30% for a perfect 100.
  if (rate >= 20 && rate <= 35) {
    score = 100;
  } else if (rate > 35) {
    // Too much revision (e.g. 80%) -> score goes down slightly but not completely punished.
    score = 80;
  } else if (rate >= 10) {
    score = 70;
  } else if (rate > 0) {
    score = 40;
  } else {
    score = 20; // 0% revision but they did complete tasks.
  }

  return {
    score,
    available: true,
    completedTasks: revision.completedTasks,
    revisionTasks: revision.revisionTasks,
    revisionRate: Number(rate.toFixed(1))
  };
}
