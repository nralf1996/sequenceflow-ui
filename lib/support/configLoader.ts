import fs from "fs/promises";
import path from "path";

export type AgentConfig = {
  empathyEnabled: boolean;
  allowDiscount: boolean;
  maxDiscountAmount: number;
  signature: string;
};

const CONFIG_PATH = path.join(process.cwd(), "data", "agent-config.json");

export async function loadAgentConfig(): Promise<AgentConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, any>;

    // Support both flat format (new) and nested rules format (legacy)
    const empathyEnabled =
      parsed.empathyEnabled ?? parsed.rules?.empathyEnabled ?? false;
    const allowDiscount =
      parsed.allowDiscount ?? parsed.rules?.allowDiscount ?? false;
    const rawMax =
      parsed.maxDiscountAmount ?? parsed.rules?.maxDiscountAmount ?? 0;

    return {
      empathyEnabled: !!empathyEnabled,
      allowDiscount: !!allowDiscount,
      maxDiscountAmount: Number.isFinite(Number(rawMax)) ? Number(rawMax) : 0,
      signature: parsed.signature ?? "Met vriendelijke groet,",
    };
  } catch {
    return {
      empathyEnabled: false,
      allowDiscount: false,
      maxDiscountAmount: 0,
      signature: "Met vriendelijke groet,",
    };
  }
}
