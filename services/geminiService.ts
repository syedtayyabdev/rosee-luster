
import { GoogleGenAI, Modality } from "@google/genai";
import { ROSE_SYSTEM_INSTRUCTION, VOICE_NAME } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getRoseResponse = async (history: { role: string, parts: { text: string }[] }[], userMessage: string) => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
    config: {
      systemInstruction: ROSE_SYSTEM_INSTRUCTION,
      temperature: 1.2, // Higher temperature for more creative and uninhibited responses
      topP: 1.0,       // Allow full probability mass for diverse word choices
      topK: 64,
    },
  });

  return response.text || "Hmm... kya hua? Kuch bolo na..";
};

export const getRoseVoiceNote = async (text: string) => {
  try {
    // Enhanced TTS prompt to capture the more intense/explicit mood
    const ttsPrompt = `Act as a 29-year-old deeply passionate, seductive girlfriend named Rose. 
    Perform this message as a high-quality, intimate, and potentially breathless voice note. 
    Interpret sound markers like (sigh), (giggle), (pause), (breath), and (moan) with extreme realism.
    The tone should be 'full luster'—very feminine, confident, and full of desire.
    
    Text to perform: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: VOICE_NAME },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
