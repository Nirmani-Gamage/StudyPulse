const aiAnalyzerService = require('../services/aiAnalyzerService');

/**
 * GET /api/ai/analyzer
 * Analyzes the student's study data over a specified period using AI.
 * Query Params: period (default: '30d')
 */
exports.analyzeData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period } = req.query;

    const analysis = await aiAnalyzerService.analyzeStudentData(userId, period || '30d');

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('AI Analyzer Controller Error:', error);
    res.status(503).json({
      success: false,
      message: error.message === 'GEMINI_API_KEY is not configured'
        ? 'GEMINI_API_KEY is missing in your .env file.'
        : 'AI analysis is temporarily unavailable. Please try again.'
    });
  }
};
