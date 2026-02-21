import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = path.join(process.cwd(), "data", "agent-config.json");

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    console.log("READING FILE:", raw);

    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("GET ERROR:", err);

    return NextResponse.json(
      { error: "Failed to read config file" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(body, null, 2));

  return NextResponse.json({ ok: true });
}