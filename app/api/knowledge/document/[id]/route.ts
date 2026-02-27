import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    // Fetch doc to check ownership and determine storage path
    const { data: doc, error: fetchError } = await supabase
      .from("knowledge_documents")
      .select("client_id, source, type")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    if (session.role !== "admin") {
      // Clients can only delete their own docs and never platform docs
      if (doc.type === "platform" || doc.client_id !== session.clientId) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Remove file from Supabase Storage
    const storagePath = `${doc.client_id ?? "platform"}/${id}/${doc.source}`;
    await supabase.storage.from("knowledge-uploads").remove([storagePath]);

    // Delete document row (knowledge_chunks cascade via FK)
    const { error } = await supabase
      .from("knowledge_documents")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
