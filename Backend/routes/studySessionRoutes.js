const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createStudySession,
  getStudySessions,
  getStudySessionById,
  updateStudySession,
  deleteStudySession,
} = require("../controllers/studySessionController");

// Apply protection middleware to all routes
router.use(protect);

router.post("/", createStudySession);
router.get("/", getStudySessions);
router.get("/:id", getStudySessionById);
router.put("/:id", updateStudySession);
router.delete("/:id", deleteStudySession);

module.exports = router;
