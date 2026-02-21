import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function extractAndParseJSON(raw: string) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Model returned empty response.");
  }

  let cleaned = raw.trim();

  // Remove ```json fences
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

  // Extract first valid JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in model response.");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("FAILED TO PARSE:", cleaned);
    throw new Error("Invalid JSON returned from model.");
  }
}

export async function GET() {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const res = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Respond ONLY with raw JSON." },
        { role: "user", content: "Say hello in JSON format: {\"hello\": true}" },
      ],
      max_completion_tokens: 500,
    });

    const raw = res.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Model returned empty content.");
    }

    const parsed = extractAndParseJSON(raw);

    return NextResponse.json({
      parsed,
      usage: res.usage,
      model: res.model,
      finish_reason: res.choices?.[0]?.finish_reason,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? String(e) },
      { status: 500 }
    );
  }
}