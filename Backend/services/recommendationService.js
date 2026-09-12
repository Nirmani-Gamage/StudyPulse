/**
 * Generates deterministic rule-based recommendations based on the effectiveness component scores.
 * Maximum of 3 recommendations returned, prioritized by the lowest scores.
 */

exports.generateRecommendations = (effectiveness) => {
  if (!effectiveness || !effectiveness.sufficientData || !effectiveness.components) {
    return [];
  }

  const { goalProgress, productivity, consistency, studyDistribution, revision } = effectiveness.components;
  
  const possibleRecommendations = [];

  // Check Consistency
  if (consistency.available && consistency.score !== null) {
    if (consistency.score < 60) {
      possibleRecommendations.push({
        type: 'consistency',
        score: consistency.score,
        priority: consistency.score < 40 ? 'high' : 'medium',
        title: 'Build a more consistent routine',
        message: 'Try scheduling shorter study sessions across more days instead of cramming.'
      });
    } else if (consistency.score === 100) {
      // Positive reinforcement (low priority)
      possibleRecommendations.push({
        type: 'consistency',
        score: 999, // Push to back
        priority: 'low',
        title: 'Excellent Consistency',
        message: 'You are maintaining a great study rhythm. Keep it up!'
      });
    }
  }

  // Check Productivity
  if (productivity.available && productivity.score !== null) {
    if (productivity.score < 60) {
      possibleRecommendations.push({
        type: 'productivity',
        score: productivity.score,
        priority: productivity.score < 40 ? 'high' : 'medium',
        title: 'Boost your focus quality',
        message: 'Your perceived productivity is low. Try shorter Pomodoro blocks to maintain high energy.'
      });
    }
  }

  // Check Goal Progress
  if (goalProgress.available && goalProgress.score !== null) {
    if (goalProgress.score < 50) {
      possibleRecommendations.push({
        type: 'goalProgress',
        score: goalProgress.score,
        priority: 'high',
        title: 'Review your active goals',
        message: 'You are falling behind on your goals. Consider breaking them into smaller, manageable tasks.'
      });
    }
  }

  // Check Study Distribution
  if (studyDistribution.available && studyDistribution.score !== null) {
    if (studyDistribution.score < 60) {
      possibleRecommendations.push({
        type: 'studyDistribution',
        score: studyDistribution.score,
        priority: 'medium',
        title: 'Rebalance your study subjects',
        message: 'You are heavily concentrating on one subject. Ensure you are not neglecting other priorities.'
      });
    }
  }

  // Check Revision Activity
  if (revision.available && revision.score !== null) {
    if (revision.score < 50) {
      possibleRecommendations.push({
        type: 'revision',
        score: revision.score,
        priority: 'medium',
        title: 'Increase revision activity',
        message: 'You are mostly learning new things. Add a few short review sessions each week to retain knowledge.'
      });
    } else if (revision.score === 80 && revision.revisionRate > 50) {
      possibleRecommendations.push({
        type: 'revision',
        score: revision.score,
        priority: 'low',
        title: 'Balance revision with new learning',
        message: 'You are spending a large majority of your time reviewing. Make sure you are also progressing on new topics.'
      });
    }
  }

  // Sort recommendations: lowest score first (to prioritize weakest areas)
  possibleRecommendations.sort((a, b) => a.score - b.score);

  // Return max 3 recommendations, omitting the 'score' field from final output
  return possibleRecommendations.slice(0, 3).map(r => ({
    type: r.type,
    priority: r.priority,
    title: r.title,
    message: r.message
  }));
};
