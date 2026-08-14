import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Test image: public/payment-qr.png
const imageBuffer = fs.readFileSync('public/payment-qr.png');
const base64Image = imageBuffer.toString('base64');

const modelsToTest = [
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3-flash-preview"
];

async function testImage() {
  for (const m of modelsToTest) {
    try {
      console.log(`Testing image OCR with ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Image
                }
              },
              {
                text: `Extract all visible text from this image into JSON format: { "text": "string" }`
              }
            ]
          }
        ],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      console.log(`✅ SUCCESS with ${m}:`, response.text);
      return m; // Stop on first working model
    } catch (err: any) {
      console.log(`❌ FAILED with ${m}:`, err.message || err);
    }
  }
}

testImage();
