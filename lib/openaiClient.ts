import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient() {
  if (_client) return _client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Check .env.local and server env.");
  }

  _client = new OpenAI({ apiKey });
  return _client;
}