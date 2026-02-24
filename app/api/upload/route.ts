import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

import { chunkText } from "@/lib/chunkText";
import { createEmbedding } from "@/lib/embeddings";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const INDEX_PATH = path.join(UPLOADS_DIR, "index.json");
const VECTOR_PATH = path.join(UPLOADS_DIR, "vector-store.json");

async function readVectorStore() {
  try {
    const raw = await fs.readFile(VECTOR_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeVectorStore(items: any[]) {
  await fs.writeFile(VECTOR_PATH, JSON.stringify(items));
}

function makeId() {
  return crypto.randomUUID();
}

async function readIndex() {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeIndex(items: any[]) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(INDEX_PATH, JSON.stringify(items, null, 2));
}

async function extractText(pdfPath: string) {
  return new Promise<{ ok: boolean; text?: string; err?: string }>((resolve) => {
    const child = spawn("pdftotext", ["-layout", pdfPath, "-"]);
    let out = "";
    let err = "";

    child.stdout.on("data", d => out += d.toString());
    child.stderr.on("data", d => err += d.toString());

    child.on("close", code => {
      if (code === 0) resolve({ ok: true, text: out });
      else resolve({ ok: false, err });
    });

    child.on("error", e => {
      resolve({ ok: false, err: String(e) });
    });
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const id = makeId();
  const storedName = `${id}.pdf`;
  const storedPath = path.join(UPLOADS_DIR, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storedPath, buffer);

  const result = await extractText(storedPath);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.err },
      { status: 500 }
    );
  }

  const text = result.text || "";

  const chunks = chunkText(text, 1000, 200);
  const vectorStore = await readVectorStore();

  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);

    vectorStore.push({
      documentId: id,
      chunkId: crypto.randomUUID(),
      chunk,
      embedding,
    });
  }

  await writeVectorStore(vectorStore);

  const preview = text.slice(0, 800);

  const item = {
    id,
    originalName: file.name,
    storedName,
    storedAt: `/uploads/${storedName}`,
    sizeBytes: file.size,
    mimeType: file.type,
    createdAt: new Date().toISOString(),
    textLength: text.length,
    preview
  };

  const items = await readIndex();
  items.unshift(item);
  await writeIndex(items);

  return NextResponse.json({
    ok: true,
    id,
    preview,
    textLength: text.length
  });
}