const recommendationService = require('../services/recommendationService');

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = req.query.limit || 3;

    const recommendations = await recommendationService.generateRecommendations(userId, { limit });

    res.status(200).json({
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Server error generating recommendations' });
  }
};
