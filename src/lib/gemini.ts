import { GoogleGenAI } from '@google/genai';
import type { BusinessConfig } from './types';
import { buildSystemPrompt, type BookingContext, type ChatTurn } from './prompt';

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key from https://aistudio.google.com/apikey');
  }
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export async function askAssistant(
  business: BusinessConfig,
  history: ChatTurn[],
  booking?: BookingContext
): Promise<string> {
  const ai = getClient();

  const contents = history.map((t) => ({
    role: t.role === 'assistant' ? ('model' as const) : ('user' as const),
    text: t.content,
  }));

  if (booking) {
    contents.push({
      role: 'user',
      text: `[form-update] The user has filled the booking enquiry form with: ${JSON.stringify(booking)}. Acknowledge briefly and tell them to tap the WhatsApp button to send it to the team for confirmation.`,
    });
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(business),
      temperature: 0.4,
      maxOutputTokens: 600,
    },
  });

  return response.text?.trim() || "Sorry, I couldn't get an answer just now. Please try again or reach the team on WhatsApp.";
}
