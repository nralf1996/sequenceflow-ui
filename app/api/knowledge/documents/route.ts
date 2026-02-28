import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type");

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
