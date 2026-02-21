import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = path.join(process.cwd(), "data", "agent-config.json");

export async function POST(req: Request) {
  try {
    const { customerMessage, config } = await req.json();

    let greeting = "Hi there,";

    if (config.tone === "formal") {
      greeting = "Dear customer,";
    }

    if (config.tone === "direct") {
      greeting = "Hello.";
    }

    let empathy = "";
    if (config.rules.empathyEnabled) {
      empathy = "I understand how frustrating this can be.\n\n";
    }

    let discountText = "";
    if (
      config.rules.allowDiscount &&
      config.rules.maxDiscountAmount
    ) {
      discountText = `\n\nIf needed, we can offer a goodwill discount of €${config.rules.maxDiscountAmount}.`;
    }

    const reply = `${greeting}

${empathy}Thank you for contacting ${
      config.companyName || "us"
    } regarding: "${customerMessage}".

We are currently reviewing your request and will update you shortly.${discountText}

${config.signature || ""}`;

    return Response.json({ reply });
  } catch (err) {
    console.error("Preview error:", err);
    return Response.json({ error: "Preview failed" }, { status: 500 });
  }
}