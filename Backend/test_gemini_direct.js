require('dotenv').config();
const { callGeminiApi } = require('./utils/geminiClient');

async function testDirectGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      parts: [{ text: "Hello, say hi!" }]
    }]
  };

  try {
    const response = await callGeminiApi(url, payload);
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testDirectGemini();
