const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());



// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const studySessionRoutes = require("./routes/studySessionRoutes");
const goalRoutes = require("./routes/goalRoutes");
const calendarEventRoutes = require("./routes/calendarEventRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/sessions", studySessionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/events", calendarEventRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "StudyPulse Backend is running!",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StudyPulse backend running on port ${PORT}`);
});