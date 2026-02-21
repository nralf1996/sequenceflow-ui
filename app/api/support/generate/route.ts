import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";

import { loadAgentConfig } from "@/lib/support/configLoader";
import {
  buildSupportSystemPrompt,
  buildSupportUserPrompt,
} from "@/lib/support/promptBuilder";
import { validateSupportResponse } from "@/lib/support/validateSupportResponse";
import type {
  SupportGenerateRequest,
  SupportGenerateResponse,
} from "@/types/support";
import { maskEmail } from "@/types/support";

export const runtime = "nodejs";

const LOG_PATH = path.join(process.cwd(), "data", "support-logs.jsonl");

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

async function appendLog(line: object) {
  await fs.appendFile(LOG_PATH, JSON.stringify(line) + "\n", "utf-8");
}

function extractAndParseJSON(raw: string) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON found in model response.");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const body = (await req.json()) as SupportGenerateRequest;

    if (!body?.subject || !body?.body) {
      return NextResponse.json(
        { error: "Missing subject/body" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const config = await loadAgentConfig();

    const system = buildSupportSystemPrompt(config);
    const user = buildSupportUserPrompt(body, config);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_completion_tokens: 500,
    });

    const raw = completion.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Model returned empty content.");
    }

    const parsed = extractAndParseJSON(raw);

    let validated: SupportGenerateResponse =
      validateSupportResponse(parsed);

    validated.confidence = clamp01(validated.confidence);

    validated.meta = {
      model: completion.model,
      requestId,
    };

    if (!config.allowDiscount) {
      validated.actions = validated.actions.filter(
        (a) => a.type !== "OFFER_DISCOUNT"
      );
    }

    if (
      validated.draft.body &&
      config.signature &&
      !validated.draft.body.includes(config.signature)
    ) {
      validated.draft.body =
        validated.draft.body + "\n\n" + config.signature;
    }

    await appendLog({
      ts: new Date().toISOString(),
      requestId,
      latencyMs: Date.now() - startedAt,
      status: validated.status,
      confidence: validated.confidence,
      model: completion.model,
      subject: body.subject.slice(0, 120),
      customerEmail: maskEmail(body.customer?.email),
    });

    return NextResponse.json(validated);
  } catch (err: any) {
    const errorMessage = String(err?.message ?? err);

    await appendLog({
      ts: new Date().toISOString(),
      requestId,
      latencyMs: Date.now() - startedAt,
      status: "ERROR",
      error: errorMessage,
    });

    return NextResponse.json(
      { error: errorMessage, requestId },
      { status: 500 }
    );
  }
}