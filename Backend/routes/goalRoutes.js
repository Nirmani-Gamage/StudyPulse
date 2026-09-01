const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

// Apply protection middleware to all routes
router.use(protect);

router.post("/", createGoal);
router.get("/", getGoals);
router.get("/:id", getGoalById);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

module.exports = router;
