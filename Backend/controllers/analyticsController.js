const analyticsService = require('../services/analyticsService');
const effectivenessService = require('../services/effectivenessService');
const recommendationService = require('../services/recommendationService');

/**
 * GET /api/analytics/learning-effectiveness
 * Retrieves the overall learning data engine analytics for the user.
 */
exports.getLearningEffectiveness = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { range, startDate, endDate } = req.query;

    // 1. Calculate raw metrics
    const rawMetrics = await analyticsService.getLearningMetrics(userId, {
      range,
      startDate,
      endDate
    });

    // 2. Convert to effectiveness scores
    const effectiveness = effectivenessService.calculateEffectiveness(rawMetrics);

    // 3. Generate recommendations based on the scores
    const recommendations = recommendationService.generateRecommendations(effectiveness);

    // 4. Return unified JSON
    res.status(200).json({
      period: rawMetrics.period,
      overall: effectiveness.overall,
      sufficientData: effectiveness.sufficientData,
      components: effectiveness.components,
      weights: effectiveness.weights,
      recommendations,
      rawMetrics // Providing rawMetrics can be useful for frontend charts if needed
    });
  } catch (error) {
    console.error('Error generating learning effectiveness:', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
};
