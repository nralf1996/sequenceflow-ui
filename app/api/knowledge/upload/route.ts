import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "md") return "text/markdown";
  if (ext === "csv") return "text/csv";
  return "text/plain";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const type = (form.get("type") as string) ?? "platform";
    const title = (form.get("title") as string) ?? "";

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }

    if (!["policy", "training", "platform"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "type must be policy | training | platform" },
        { status: 400 }
      );
    }

    const mimeType = resolveMimeType(file);
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported file type. Use PDF, TXT, MD, or CSV." },
        { status: 400 }
      );
    }

    // ── Build paths ───────────────────────────────────────────────────────────
    // client_id is null until OAuth; all docs stored under "platform/"
    const clientId: string | null = null;
    const documentId = crypto.randomUUID();
    const ext = file.name.split(".").pop() ?? "bin";
    const storedFilename = `original.${ext}`;
    const storagePath = `${clientId ?? "platform"}/${documentId}/${storedFilename}`;

    const supabase = getSupabaseClient();

    // ── Insert document row (status = pending) ────────────────────────────────
    const { error: insertError } = await supabase.from("knowledge_documents").insert({
      id: documentId,
      client_id: clientId,
      type,
      title: title.trim() || file.name,
      source: storedFilename,
      mime_type: mimeType,
      status: "pending",
      chunk_count: 0,
    });

    if (insertError) {
      console.error("[upload] DB insert failed:", insertError.message);
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    // ── Upload file to Supabase Storage ───────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("knowledge-uploads")
      .upload(storagePath, buffer, { contentType: mimeType });

    if (uploadError) {
      // Roll back document row so we don't orphan it
      await supabase.from("knowledge_documents").delete().eq("id", documentId);
      console.error("[upload] Storage upload failed:", uploadError.message);
      return NextResponse.json(
        { ok: false, error: "Storage upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

    // ── Enqueue ingestion job ─────────────────────────────────────────────────
    const { error: jobError } = await supabase.from("knowledge_ingest_jobs").insert({
      document_id: documentId,
      status: "pending",
    });

    if (jobError) {
      // Non-fatal: document is stored, job can be manually triggered via reindex
      console.error("[upload] Failed to create ingest job:", jobError.message);
    }

    console.log(
      `[upload] document=${documentId} type=${type} mime=${mimeType} path=${storagePath} job_ok=${!jobError}`
    );

    return NextResponse.json({ ok: true, documentId });
  } catch (err: any) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
