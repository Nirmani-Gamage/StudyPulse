const express = require('express');
const router = express.Router();
const aiCoachController = require('../controllers/aiCoachController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/chat', authMiddleware, aiCoachController.chat);
router.post('/add-plan', authMiddleware, aiCoachController.addPlan);

module.exports = router;
