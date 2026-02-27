import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { ingestDocument } from "@/lib/knowledge/ingest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { ok: false, error: "documentId is required" },
        { status: 400 }
      );
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    if (session.role !== "admin") {
      const supabase = getSupabaseClient();
      const { data: doc } = await supabase
        .from("knowledge_documents")
        .select("client_id, type")
        .eq("id", documentId)
        .single();

      if (!doc) {
        return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      }

      if (doc.type === "platform" || doc.client_id !== session.clientId) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    await ingestDocument(documentId);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
