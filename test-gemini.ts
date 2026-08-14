import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Extract the details from this handwritten or printed bill/invoice into structured JSON format.
              Follow this exact JSON structure:
              { "customerName": "string" }
              Respond ONLY with valid JSON. No markdown tags.`
            }
          ]
        }
      ],
      config: {
          temperature: 0.1,
          responseMimeType: "application/json",
      }
    });
    console.log("Success with gemini-flash-latest:", response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
