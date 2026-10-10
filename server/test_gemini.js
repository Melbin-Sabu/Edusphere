require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const prompt = `Generate exactly 2 multiple-choice questions based on the following text. 
    Respond ONLY with a JSON array where each object has:
    - "questionText" (string)
    - "options" (array of exactly 4 strings)
    - "correctAnswer" (string, must exactly match one of the options)
    
    Text:
    The sky is blue. Grass is green.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    console.log("Response text:", response.text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
