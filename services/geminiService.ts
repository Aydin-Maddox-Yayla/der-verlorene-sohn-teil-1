
import { GoogleGenAI } from "@google/genai";

export async function getEerieReflection(language: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = language === 'DE' 
    ? "Schreibe einen extrem gruseligen, kurzen Satz (max 10 Wörter) aus der Sicht eines Skinwalkers, der einen Vater imitiert. Er will seine Rechte und sein Leben stehlen. Deutsch."
    : "Write an extremely creepy, short sentence (max 10 words) from the perspective of a skinwalker mimicking a father. He wants to steal his rights and life. English.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 1.2,
        maxOutputTokens: 30
      }
    });
    return response.text.trim() || "...";
  } catch (error) {
    return "...";
  }
}
