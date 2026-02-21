import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const INDEX_PATH = path.join(UPLOADS_DIR, "index.json");

async function readIndex() {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeIndex(items: any[]) {
  await fs.writeFile(INDEX_PATH, JSON.stringify(items, null, 2));
}

export async function GET() {
  const items = await readIndex();
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const items = await readIndex();
  const item = items.find((i: any) => i.id === id);

  if (!item) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // verwijder PDF file
  const filePath = path.join(UPLOADS_DIR, item.storedName);
  await fs.unlink(filePath).catch(() => {});

  // update index
  const updated = items.filter((i: any) => i.id !== id);
  await writeIndex(updated);

  return NextResponse.json({ ok: true });
}