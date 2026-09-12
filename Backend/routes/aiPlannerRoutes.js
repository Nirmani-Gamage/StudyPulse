const express = require('express');
const router = express.Router();
const aiPlannerController = require('../controllers/aiPlannerController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', aiPlannerController.generatePlan);
router.post('/add-to-tasks', aiPlannerController.addToTasks);

module.exports = router;
