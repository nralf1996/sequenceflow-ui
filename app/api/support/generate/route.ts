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
import type { SupportGenerateRequest } from "@/types/support";
import { maskEmail } from "@/types/support";

export const runtime = "nodejs";

const LOG_PATH = path.join(process.cwd(), "data", "support-logs.jsonl");
const VECTOR_PATH = path.join(
  process.cwd(),
  "public",
  "uploads",
  "vector-store.json"
);

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

async function appendLog(line: object) {
  await fs.appendFile(LOG_PATH, JSON.stringify(line) + "\n", "utf-8").catch(
    () => {}
  );
}

async function readVectorStore() {
  try {
    const raw = await fs.readFile(VECTOR_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function extractEmail(value: any): string {
  const str = String(value ?? "").trim();
  if (!str) return "";
  const match = str.match(/<([^>]+)>/);
  return (match?.[1] ?? str).trim();
}

function extractAndParseJSON(raw: string) {
  let cleaned = raw
    .trim()
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON found in model response.");
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

// ─── Damage keywords ──────────────────────────────────────────────────────────
const DAMAGE_KEYWORDS = [
  "beschadigd",
  "kapot",
  "defect",
  "ingedeukt",
  "scheur",
  "kras",
  "damaged",
  "broken",
];

// ─── Retrieval thresholds ─────────────────────────────────────────────────────
const HIGH_THRESHOLD = 0.6;
const MEDIUM_THRESHOLD = 0.4;

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const data = await req.json();

    console.log("=== FULL REQUEST BODY ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=== END REQUEST BODY ===");

    // ── Input mapping ────────────────────────────────────────────────────────
    const subject: string = (data.subject || "").trim();
    const ticketBody: string = (
      data.body ??
      data.text ??
      data.snippet ??
      ""
    ).trim();
    const from: string = extractEmail(
      data.from ??
      data.From ??
      data.sender ??
      data.email
    );
    const customerName: string = data.customer?.name || from || "";
    const config = await loadAgentConfig();
    console.log("CONFIG USED IN GENERATE:", JSON.stringify(config));

    if (!subject && !ticketBody) {
      return NextResponse.json(
        { error: "Missing subject/body" },
        { status: 400 }
      );
    }

    const text = `${subject} ${ticketBody}`.toLowerCase();

    // ── STEP A: Damage rule (deterministic) ──────────────────────────────────
    const damageMatch = DAMAGE_KEYWORDS.find((k) => text.includes(k));

    if (damageMatch) {
      let replyBody =
        `Beste ${customerName || "klant"},\n\n` +
        `Wat vervelend om te horen dat uw product beschadigd is aangekomen. ` +
        `Onze excuses voor het ongemak.\n\n` +
        `We lossen dit direct voor u op:\n` +
        `- We sturen kosteloos een vervangend exemplaar naar u op.\n` +
        `- U hoeft het beschadigde product niet terug te sturen.\n` +
        `- U ontvangt binnen 24 uur een bevestiging met de verzendinformatie.\n\n` +
        `Mocht u nog vragen hebben, staat ons team voor u klaar.`;

      if (config?.signature?.trim()) {
        replyBody = replyBody + "\n\n" + config.signature.trim();
      }

      console.log(
        `[generate] route=AUTO_REPLY confidence=0.95 hasKnowledge=false`
      );

      await appendLog({
        ts: new Date().toISOString(),
        requestId,
        latencyMs: Date.now() - startedAt,
        route: "AUTO_REPLY",
        confidence: 0.95,
        subject: subject.slice(0, 120),
      });

      return NextResponse.json({
        status: "AUTO_REPLY",
        confidence: 0.95,
        routing: "AUTO_REPLY",
        draft: {
          subject: `Re: ${subject}`,
          body: replyBody,
          from,
        },
        knowledge: {
          used: false,
          topSimilarity: null,
          sources: [],
        },
      });
    }

    // ── STEP B: Knowledge retrieval ──────────────────────────────────────────
    type ScoredItem = {
      chunk: string;
      score: number;
      documentId: string;
      chunkId: string;
    };

    let topItems: ScoredItem[] = [];
    let highestScore = 0;

    const vectorStore = await readVectorStore();

    if (vectorStore.length > 0) {
      const queryEmbedding = await createEmbedding(`${subject} ${ticketBody}`);

      const scored: ScoredItem[] = vectorStore.map((item: any) => ({
        chunk: item.chunk,
        score: cosineSimilarity(queryEmbedding, item.embedding),
        documentId: item.documentId as string,
        chunkId: item.chunkId as string,
      }));

      scored.sort((a, b) => b.score - a.score);
      highestScore = scored[0]?.score ?? 0;

      const highMatches = scored.filter((s) => s.score >= HIGH_THRESHOLD);
      const mediumMatches = scored.filter(
        (s) => s.score >= MEDIUM_THRESHOLD && s.score < HIGH_THRESHOLD
      );

      if (highMatches.length > 0) {
        topItems = highMatches.slice(0, 5);
      } else if (mediumMatches.length > 0) {
        topItems = mediumMatches.slice(0, 5);
      }
    }

    const usedKnowledge = topItems.length > 0;
    const knowledgeContext = topItems.map((s) => s.chunk).join("\n\n---\n\n");

    // ── STEP C: LLM generate ─────────────────────────────────────────────────
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ticketReq: SupportGenerateRequest = {
      subject,
      body: ticketBody,
      channel: data.channel,
      customer: data.customer,
      order: data.order,
    };

    const baseSystem = buildSupportSystemPrompt(config);
    const systemPrompt = usedKnowledge
      ? `${baseSystem}\n\nRelevante interne kennis:\n${knowledgeContext}`
      : baseSystem;
    const userPrompt = buildSupportUserPrompt(ticketReq, config);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 600,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Model returned empty content.");

    const parsed = extractAndParseJSON(raw);
    const validated = validateSupportResponse(parsed);

    // ── STEP D: Confidence scoring ───────────────────────────────────────────
    const llmConfidence = clamp01(validated.confidence);
    const finalConfidence = usedKnowledge
      ? clamp01(highestScore * 0.6 + llmConfidence * 0.4)
      : llmConfidence;

    // ── STEP E: Routing ──────────────────────────────────────────────────────
    const needsHuman =
      finalConfidence < 0.6 || validated.status === "NEEDS_HUMAN";
    const routing: "AUTO" | "HUMAN_REVIEW" = needsHuman
      ? "HUMAN_REVIEW"
      : "AUTO";

    // Append signature
    if (config?.signature?.trim()) {
      validated.draft.body =
        validated.draft.body.trim() + "\n\n" + config.signature.trim();
    }

    // Filter disallowed actions
    if (!config.allowDiscount) {
      validated.actions = validated.actions.filter(
        (a: any) => a.type !== "OFFER_DISCOUNT"
      );
    }

    console.log(
      `[generate] route=${routing} confidence=${finalConfidence.toFixed(2)} hasKnowledge=${usedKnowledge}`
    );

    await appendLog({
      ts: new Date().toISOString(),
      requestId,
      latencyMs: Date.now() - startedAt,
      route: routing,
      confidence: finalConfidence,
      model: completion.model,
      subject: subject.slice(0, 120),
      customerEmail: maskEmail(data.customer?.email),
    });

    return NextResponse.json({
      status: validated.status,
      confidence: finalConfidence,
      routing,
      draft: { ...validated.draft, from },
      knowledge: {
        used: usedKnowledge,
        topSimilarity: highestScore || null,
        sources: topItems.map((s) => ({
          documentId: s.documentId,
          chunkId: s.chunkId,
        })),
      },
    });
  } catch (err: any) {
    const errorMessage = String(err?.message ?? err);

    await appendLog({
      ts: new Date().toISOString(),
      requestId,
      latencyMs: Date.now() - startedAt,
      route: "ERROR",
      error: errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
