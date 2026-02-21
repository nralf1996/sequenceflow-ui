import fs from "fs/promises";
import path from "path";

export type AgentConfig = {
  companyName: string;
  tone: "friendly" | "formal" | "direct";
  empathyEnabled: boolean;
  allowDiscount: boolean;
  maxDiscountAmount: number;
  signature: string;
};

const CONFIG_PATH = path.join(process.cwd(), "data", "agent-config.json");

export async function loadAgentConfig(): Promise<AgentConfig> {
  const raw = await fs.readFile(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Partial<AgentConfig>;

  return {
    companyName: parsed.companyName ?? "Company",
    tone: (parsed.tone as AgentConfig["tone"]) ?? "friendly",
    empathyEnabled: !!parsed.empathyEnabled,
    allowDiscount: !!parsed.allowDiscount,
    maxDiscountAmount: Number.isFinite(parsed.maxDiscountAmount) ? Number(parsed.maxDiscountAmount) : 0,
    signature: parsed.signature ?? "Met vriendelijke groet,",
  };
}