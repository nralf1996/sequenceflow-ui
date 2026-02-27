import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    // type filter is allowed from query (used by the UI tabs)
    const typeParam = searchParams.get("type");

    // Clients requesting platform docs explicitly → return empty, never 403
    // (the tab shouldn't exist in their UI, but guard the API too)
    if (session.role !== "admin" && typeParam === "platform") {
      return NextResponse.json({ ok: true, documents: [] });
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from("knowledge_documents")
      .select(
        "id, client_id, type, title, source, mime_type, status, chunk_count, error, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (typeParam) {
      query = query.eq("type", typeParam);
    }

    if (session.role === "admin") {
      // Admin sees all documents across all clients and platform
      // No additional filter
    } else {
      // Client: only their own client_id docs — never null (platform) docs
      // client_id is derived from session, never from query params
      query = query.eq("client_id", session.clientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, documents: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
