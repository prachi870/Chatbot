const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables.');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION =
  'You are a helpful, friendly AI assistant. Format responses using Markdown ' +
  'where appropriate (headings, lists, code blocks with language tags) so they ' +
  'render cleanly in a chat UI. Keep answers clear and concise unless the user ' +
  'asks for depth. When given a file or image, analyse it thoroughly and answer ' +
  'any questions about its content.';

/**
 * Converts stored Message documents into the { role, parts } shape
 * the Gemini SDK expects. Gemini uses "model" instead of "assistant".
 */
function toGeminiHistory(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/**
 * Builds the parts array for the current user turn.
 * Supports an optional file attachment (image, PDF, video, audio).
 *
 * @param {string} text       - The user's text message (may be empty if file-only)
 * @param {object} [fileData] - Optional: { mimeType, data } where data is a Buffer
 * @returns {Array}           - Gemini parts array
 */
function buildUserParts(text, fileData) {
  const parts = [];

  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data.toString('base64'),
      },
    });
  }

  // Always include a text part (even a placeholder so the turn is never empty)
  parts.push({ text: text || 'Please analyse this file.' });

  return parts;
}

class GeminiError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Non-streaming: sends history + new message (+ optional file) to Gemini.
 *
 * @param {Array}  history   - Prior messages [{role, content}]
 * @param {string} newMessage
 * @param {object} [fileData] - { mimeType, data: Buffer }
 * @returns {Promise<string>}
 */
async function generateResponse(history, newMessage, fileData) {
  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      history: toGeminiHistory(history),
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const parts  = buildUserParts(newMessage, fileData);
    const result = await chat.sendMessage({ message: parts });
    const text   = result?.text;

    if (!text) {
      throw new GeminiError('Received an empty response from the AI. Please try again.', 502);
    }
    return text;
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    console.error('Gemini API error:', error);
    throw new GeminiError(
      'The AI service is currently unavailable. Please try again in a moment.',
      502
    );
  }
}

/**
 * Streaming: yields text chunks from Gemini.
 *
 * @param {Array}  history
 * @param {string} newMessage
 * @param {object} [fileData] - { mimeType, data: Buffer }
 * @yields {string}
 */
async function* streamResponse(history, newMessage, fileData) {
  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      history: toGeminiHistory(history),
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const parts  = buildUserParts(newMessage, fileData);
    const stream = await chat.sendMessageStream({ message: parts });

    let receivedAny = false;
    for await (const chunk of stream) {
      const chunkText = chunk?.text;
      if (chunkText) {
        receivedAny = true;
        yield chunkText;
      }
    }

    if (!receivedAny) {
      throw new GeminiError('Received an empty response from the AI. Please try again.', 502);
    }
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    console.error('Gemini streaming error:', error);
    throw new GeminiError(
      'The AI service is currently unavailable. Please try again in a moment.',
      502
    );
  }
}

module.exports = { generateResponse, streamResponse, GeminiError };
