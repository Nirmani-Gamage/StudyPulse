const express = require("express");
const router = express.Router();
const protect = require("../middleware/authmiddleware");
const {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
} = require("../controllers/journalController");

// All journal routes require authentication
router.use(protect);

router.get("/", getJournalEntries);
router.post("/", createJournalEntry);
router.get("/:id", getJournalEntry);
router.put("/:id", updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

module.exports = router;
