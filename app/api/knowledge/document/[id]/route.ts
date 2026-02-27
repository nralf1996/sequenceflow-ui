import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    // Fetch doc to determine storage path before deletion
    const { data: doc } = await supabase
      .from("knowledge_documents")
      .select("client_id, source")
      .eq("id", id)
      .single();

    if (doc?.source) {
      const storagePath = `${doc.client_id ?? "platform"}/${id}/${doc.source}`;
      await supabase.storage.from("knowledge-uploads").remove([storagePath]);
    }

    // Delete document row (chunks cascade via FK)
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
