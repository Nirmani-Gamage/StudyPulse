const express = require('express');
const router = express.Router();
const aiAnalyzerController = require('../controllers/aiAnalyzerController');
const authMiddleware = require('../middleware/authMiddleware');

// Base route is /api/ai
router.get('/analyzer', authMiddleware, aiAnalyzerController.analyzeData);

module.exports = router;
