import { getSupabaseClient } from "@/lib/supabase";

export type AgentConfig = {
  empathyEnabled: boolean;
  allowDiscount: boolean;
  maxDiscountAmount: number;
  signature: string;
};

export async function loadAgentConfig(): Promise<AgentConfig> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("agent_config")
    .select("config")
    .eq("id", "default")
    .single();

  if (error) {
    throw new Error("Failed to load agent config: " + error.message);
  }

  return data?.config ?? {
    empathyEnabled: true,
    allowDiscount: false,
    signature: "Team SequenceFlow",
  };
}
