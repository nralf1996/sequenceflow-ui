import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getTenantId } from "@/lib/tenant";

// ─── GET /api/agent-config ─────────────────────────────────────────────────────
// Returns { tenantId, config } scoped to the authenticated user's tenant.

export async function GET(req: Request) {
  let tenantId: string;
  try {
    ({ tenantId } = await getTenantId(req));
  } catch (err: any) {
    const status = err.message === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("tenant_agent_config")
      .select(
        "empathy_enabled, allow_discount, max_discount_amount, signature, language_default"
      )
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      // Row not yet seeded — return safe empty defaults.
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
// Upserts config for the authenticated user's tenant.

export async function POST(req: Request) {
  let tenantId: string;
  try {
    ({ tenantId } = await getTenantId(req));
  } catch (err: any) {
    const status = err.message === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
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
