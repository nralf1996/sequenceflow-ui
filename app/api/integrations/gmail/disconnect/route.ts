import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/tenant";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// ─── POST /api/integrations/gmail/disconnect ────────────────────────────────
// Sets the Gmail integration status to 'disconnected' for this tenant.

export async function POST(req: NextRequest) {
  let tenantId: string;
  try {
    ({ tenantId } = await getTenantId(req));
  } catch (err: any) {
    const status = err.message === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: err.message }, { status });
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("tenant_integrations")
    .update({ status: "disconnected", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("provider", "gmail");

  if (error) {
    console.error("[gmail/disconnect] DB error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
