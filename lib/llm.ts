import OpenAI from "openai";
import { wrapOpenAI } from "neatlogs";

// Gemini's OpenAI-compatible endpoint. The OpenAI SDK talks to it unchanged;
// wrapOpenAI patches this specific instance so every call it makes is traced.
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

export const MODEL = "gemini-2.5-flash";

let client: OpenAI | null = null;

/**
 * Lazily build and memoize the traced client. Created on first request —
 * after instrumentation.register() has run neatlogs.init() — so the wrapper
 * attaches to an initialized SDK.
 */
export function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set — add it to .env.");
  }

  client = wrapOpenAI(new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL }));
  return client;
}
