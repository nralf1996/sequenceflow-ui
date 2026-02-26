import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = path.join(process.cwd(), "data", "agent-config.json");

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, any>;

    // Return nested format expected by the Test AI UI
    return NextResponse.json({
      rules: {
        empathyEnabled:
          parsed.empathyEnabled ?? parsed.rules?.empathyEnabled ?? false,
        allowDiscount:
          parsed.allowDiscount ?? parsed.rules?.allowDiscount ?? false,
        maxDiscountAmount:
          parsed.maxDiscountAmount ?? parsed.rules?.maxDiscountAmount ?? null,
      },
      signature: parsed.signature ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read config file" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  // Normalize to flat format so loadAgentConfig() always reads correctly
  const flat = {
    empathyEnabled: body.rules?.empathyEnabled ?? body.empathyEnabled ?? false,
    allowDiscount: body.rules?.allowDiscount ?? body.allowDiscount ?? false,
    maxDiscountAmount:
      body.rules?.maxDiscountAmount ?? body.maxDiscountAmount ?? 0,
    signature: body.signature ?? "",
  };

  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(flat, null, 2));

  return NextResponse.json({ ok: true });
}
