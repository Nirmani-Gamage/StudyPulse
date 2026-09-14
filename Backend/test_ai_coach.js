require('dotenv').config();
const aiCoachService = require('./services/aiCoachService');
const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // We need a dummy user id. Let's just find one.
    const User = require('./models/User');
    const user = await User.findOne();
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }

    console.log("Testing AI Coach with user:", user._id);
    const response = await aiCoachService.chat(user._id, "How can I improve my study?", "GENERAL_QUESTION");
    console.log("AI COACH RESPONSE:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("TEST ERROR:", error);
  } finally {
    mongoose.disconnect();
  }
}

test();
