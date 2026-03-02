import { getSupabaseClient } from "@/lib/supabase";

export type TenantTemplate = {
  id: string;
  templateText: string;
  confidenceWeight: number;
};

/** Used when the tenant has no matching template and no "fallback" intent row. */
export const FALLBACK_BLUEPRINT =
  "Beantwoord het ticket professioneel en behulpzaam. Houd het beknopt en oplossingsgericht.";

/**
 * Loads all active templates for a tenant.
 * Returns a Map keyed by intent slug (e.g. "refund", "shipping", "fallback").
 */
export async function loadTemplates(
  tenantId: string
): Promise<Map<string, TenantTemplate>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("tenant_templates")
    .select("id, intent, template_text, confidence_weight")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (error) {
    console.warn("[templateLoader] failed to load templates:", error.message);
    return new Map();
  }

  const map = new Map<string, TenantTemplate>();
  for (const row of data ?? []) {
    map.set(row.intent as string, {
      id:               row.id               as string,
      templateText:     row.template_text    as string,
      confidenceWeight: (row.confidence_weight as number) ?? 1.0,
    });
  }

  return map;
}

/**
 * Picks the best template from the map for the given intent.
 * Falls back to the "fallback" intent row, or null if neither exists.
 */
export function selectTemplate(
  templates: Map<string, TenantTemplate>,
  intent: string | null
): TenantTemplate | null {
  if (intent && templates.has(intent)) return templates.get(intent)!;
  if (templates.has("fallback"))       return templates.get("fallback")!;
  return null;
}
