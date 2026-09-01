const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../controllers/calendarEventController");

// Apply protection middleware to all routes
router.use(protect);

router.post("/", createCalendarEvent);
router.get("/", getCalendarEvents);
router.get("/:id", getCalendarEventById);
router.put("/:id", updateCalendarEvent);
router.delete("/:id", deleteCalendarEvent);

module.exports = router;
