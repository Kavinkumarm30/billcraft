import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const list = await ai.models.list();
    console.log("Available models:");
    for await (const m of list) {
      console.log(m.name);
    }
  } catch (error) {
    console.error("List models error:", error);
  }
}

listModels();
