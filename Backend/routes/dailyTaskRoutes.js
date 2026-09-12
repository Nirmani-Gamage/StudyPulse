const express = require("express");
const router = express.Router();
const protect = require("../middleware/authmiddleware");
const {
  getDailyTasks,
  getTodayTasks,
  createDailyTask,
  updateDailyTask,
  toggleDailyTask,
  updateTaskOutcome,
  deleteDailyTask,
} = require("../controllers/dailyTaskController");

// All daily task routes require authentication
router.use(protect);

router.get("/today", getTodayTasks);
router.get("/", getDailyTasks);
router.post("/", createDailyTask);
router.put("/:id", updateDailyTask);
router.patch("/:id/toggle", toggleDailyTask);
router.patch("/:id/outcome", updateTaskOutcome);
router.delete("/:id", deleteDailyTask);

module.exports = router;
