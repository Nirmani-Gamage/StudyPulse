require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.models) {
    const modelNames = data.models.map(m => m.name);
    console.log("Available models:", modelNames);
  } else {
    console.log("Error:", data);
  }
}

listModels();
