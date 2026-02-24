import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";

import { createEmbedding } from "@/lib/embeddings";
import { cosineSimilarity } from "@/lib/similarity";

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

const VECTOR_PATH = path.join(
  process.cwd(),
  "public",
  "uploads",
  "vector-store.json"
);

async function readVectorStore() {
  try {
    const raw = await fs.readFile(VECTOR_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

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
    const body = (await req.json()) as SupportGenerateRequest & {
      config?: import("@/lib/support/configLoader").AgentConfig;
    };

    if (!body?.subject || !body?.body) {
      return NextResponse.json(
        { error: "Missing subject/body" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const config = body.config ?? (await loadAgentConfig());

    const vectorStore = await readVectorStore();

    const queryText = body.subject + "\n\n" + body.body;
    const queryEmbedding = await createEmbedding(queryText);

    const scored = vectorStore.map((item: any) => ({
      chunk: item.chunk,
      score: cosineSimilarity(queryEmbedding, item.embedding),
      documentId: item.documentId as string,
      chunkId: item.chunkId as string,
    }));

    scored.sort((a: any, b: any) => b.score - a.score);

    console.log(
      "Top similarity debug:",
      scored.slice(0, 3).map(s => ({
        score: s.score,
        preview: s.chunk.slice(0, 120)
      }))
    );

    const HIGH_THRESHOLD = 0.60;
    const MEDIUM_THRESHOLD = 0.40;

    const highMatches = scored.filter((s: any) => s.score >= HIGH_THRESHOLD);
    const mediumMatches = scored.filter(
      (s: any) => s.score >= MEDIUM_THRESHOLD && s.score < HIGH_THRESHOLD
    );

    type ScoredItem = { chunk: string; score: number; documentId: string; chunkId: string };
    let topItems: ScoredItem[] = [];
    let retrievalMode: "HIGH" | "MEDIUM" | "LOW" = "LOW";

    if (highMatches.length > 0) {
      topItems = highMatches.slice(0, 5);
      retrievalMode = "HIGH";
    } else if (mediumMatches.length > 0) {
      topItems = mediumMatches.slice(0, 5);
      retrievalMode = "MEDIUM";
    }

    const topChunks = topItems.map((s) => s.chunk);

    console.log("Retrieval mode:", retrievalMode);
    console.log(
      "Top similarity:",
      scored.length ? scored[0].score : "none"
    );

    const highestScore = scored.length ? scored[0].score : 0;

    let confidence = 0.4;

    if (retrievalMode === "HIGH") {
      confidence = Math.min(0.95, 0.75 + (highestScore - 0.6));
    }

    if (retrievalMode === "MEDIUM") {
      confidence = Math.min(0.75, 0.5 + (highestScore - 0.4));
    }

    const knowledgeContext = topChunks.join("\n\n---\n\n");

    if (retrievalMode === "LOW") {
      return NextResponse.json({
        status: "NEEDS_HUMAN",
        confidence: 0.4,
        draft: {
          subject: `Re: ${body.subject}`,
          body:
            "Uw vraag bevat onvoldoende specifieke informatie of valt buiten de beschikbare kennisbasis. Deze ticket wordt doorgestuurd naar een medewerker.",
        },
        routing: "NEEDS_HUMAN" as const,
        knowledge: {
          used: false,
          topSimilarity: highestScore,
          sources: [],
        },
      });
    }

    const baseSystem = buildSupportSystemPrompt(config);

    const system = `
${baseSystem}

Relevant internal knowledge:
${knowledgeContext}
`;

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

    const llmConfidence = clamp01(validated.confidence);

    // Keep internal validation logic intact
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

    // New confidence model: topSimilarity drives 60%, LLM drives 40%
    const finalConfidence = clamp01(highestScore * 0.6 + llmConfidence * 0.4);

    const routing: "AUTO" | "HUMAN_REVIEW" =
      finalConfidence >= 0.65 ? "AUTO" : "HUMAN_REVIEW";

    const latencyMs = Date.now() - startedAt;

    await appendLog({
      ts: new Date().toISOString(),
      requestId,
      latencyMs,
      status: validated.status,
      confidence: finalConfidence,
      model: completion.model,
      subject: body.subject.slice(0, 120),
      customerEmail: maskEmail(body.customer?.email),
    });

    return NextResponse.json({
      routing,
      draft: validated.draft,
      confidence: {
        final: finalConfidence,
        llm: llmConfidence,
        retrieval: highestScore,
      },
      retrieval: {
        mode: retrievalMode,
        topSimilarity: highestScore,
        usedKnowledge: topItems.length > 0,
      },
      meta: {
        model: completion.model,
        latencyMs,
      },
    });
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