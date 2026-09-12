require('dotenv').config();
const aiPlannerService = require('./services/aiPlannerService');
const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studypulse');
    
    // We need a dummy user id. Let's just find one.
    const User = require('./models/User');
    const user = await User.findOne();
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }

    console.log("Testing with user:", user._id);
    const plan = await aiPlannerService.generateDailyPlan(user._id, 180);
    console.log("PLAN:", JSON.stringify(plan, null, 2));
  } catch (error) {
    console.error("TEST ERROR:", error);
  } finally {
    mongoose.disconnect();
  }
}

test();
