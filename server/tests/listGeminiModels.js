import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('./server/.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Fetching available Gemini models for key:", apiKey ? apiKey.substring(0, 8) + '...' : 'NONE');

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log("Available Gemini Models:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
