import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// DEFAULT_TENANT_ID is the single tenant used by the Agent Console until
// full multi-tenant auth is introduced.
function resolveTenantId(): string {
  const id = process.env.DEFAULT_TENANT_ID;
  if (!id) throw new Error("DEFAULT_TENANT_ID env var is not set.");
  return id;
}

// ─── GET /api/agent-config ─────────────────────────────────────────────────────
// Returns { tenantId, config } from tenant_agent_config.

export async function GET() {
  try {
    const tenantId = resolveTenantId();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("tenant_agent_config")
      .select(
        "empathy_enabled, allow_discount, max_discount_amount, signature, language_default"
      )
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      // Row not yet seeded — return safe defaults so the console renders.
      return NextResponse.json({
        tenantId,
        config: {
          empathyEnabled:    true,
          allowDiscount:     false,
          maxDiscountAmount: null,
          signature:         "",
        },
      });
    }

    return NextResponse.json({
      tenantId,
      config: {
        empathyEnabled:    data.empathy_enabled,
        allowDiscount:     data.allow_discount,
        maxDiscountAmount: data.max_discount_amount ?? null,
        signature:         data.signature ?? "",
      },
    });
  } catch (err: any) {
    console.error("[agent-config] GET:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/agent-config ────────────────────────────────────────────────────
// Upserts { empathyEnabled, allowDiscount, maxDiscountAmount, signature } into
// tenant_agent_config. Keyed by tenant_id.

export async function POST(req: Request) {
  try {
    const tenantId = resolveTenantId();
    const body     = await req.json();
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("tenant_agent_config")
      .upsert(
        {
          tenant_id:           tenantId,
          empathy_enabled:     body.empathyEnabled     ?? true,
          allow_discount:      body.allowDiscount      ?? false,
          max_discount_amount: body.maxDiscountAmount  ?? 0,
          signature:           body.signature          ?? "",
          updated_at:          new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    if (error) {
      console.error("[agent-config] POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[agent-config] POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
