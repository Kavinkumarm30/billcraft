import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const candidateModels = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.6-flash",
  "gemini-3.7-flash"
];

async function testModels() {
  for (const modelName of candidateModels) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [{ text: "Hello, reply with JSON: {\"status\": \"ok\"}" }]
          }
        ],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      console.log(`✅ SUCCESS with ${modelName}:`, response.text);
    } catch (err: any) {
      console.log(`❌ FAILED with ${modelName}:`, err.message || err.status || err);
    }
  }
}

testModels();
