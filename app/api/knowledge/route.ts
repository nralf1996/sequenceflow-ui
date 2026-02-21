import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const INDEX_PATH = path.join(UPLOADS_DIR, "index.json");

export async function GET() {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    const items = JSON.parse(raw);
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}