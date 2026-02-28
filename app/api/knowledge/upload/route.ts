import { NextRequest, NextResponse } from "next/server";

import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1) Parse formData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const title = formData.get("title") as string | null;

    // 2) Validate
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }

    if (!type || !["policy", "training", "platform"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "type must be policy | training | platform" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 3) Insert document row
    const { data: inserted, error: insertError } = await supabase
      .from("knowledge_documents")
      .insert({
        client_id: null,
        type,
        title: title || null,
        source: file.name,
        mime_type: file.type,
        status: "pending",
        chunk_count: 0,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("[upload] DB insert failed:", insertError?.message);
      return NextResponse.json(
        { ok: false, error: insertError?.message ?? "Failed to create document record." },
        { status: 500 }
      );
    }

    // 4) Upload file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `platform/${inserted.id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("knowledge-uploads")
      .upload(storagePath, fileBuffer, { contentType: file.type });

    if (uploadError) {
      console.error("[upload] Storage upload failed:", uploadError.message);
      // Roll back document row
      await supabase.from("knowledge_documents").delete().eq("id", inserted.id);
      return NextResponse.json(
        { ok: false, error: "Storage upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

    // 5) Insert ingest job
    const { error: jobError } = await supabase
      .from("knowledge_ingest_jobs")
      .insert({ document_id: inserted.id, status: "pending" });

    if (jobError) {
      console.error("[upload] Failed to create ingest job:", jobError.message);
      // Non-fatal — document is stored, can be reindexed manually
    }

    console.log(
      `[upload] document=${inserted.id} type=${type} path=${storagePath} job_ok=${!jobError}`
    );

    // 6) Return success
    return NextResponse.json({ ok: true, documentId: inserted.id });
  } catch (err: any) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
