import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { getSupabaseClient } from "@/lib/supabase";
import { ingestDocument } from "@/lib/knowledge/ingest";

export const runtime = "nodejs";

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

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No file provided." },
        { status: 400 }
      );
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

    const clientId: string | null = null;

    const supabase = getSupabaseClient();
    const documentId = crypto.randomUUID();
    const ext = file.name.split(".").pop() ?? "bin";
    const storedFilename = `original.${ext}`;
    const storagePath = `${clientId ?? "platform"}/${documentId}/${storedFilename}`;

    // Create document row (status = pending)
    const { error: insertError } = await supabase.from("knowledge_documents").insert({
      id: documentId,
      client_id: clientId,
      type,
      title: title.trim() || file.name,
      source: storedFilename,
      mime_type: mimeType,
      status: "pending",
    });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("knowledge-uploads")
      .upload(storagePath, buffer, { contentType: mimeType });

    if (uploadError) {
      await supabase.from("knowledge_documents").delete().eq("id", documentId);
      return NextResponse.json(
        { ok: false, error: "Storage upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

    // Run ingestion (pass buffer directly to avoid re-downloading)
    await ingestDocument(documentId, buffer);

    return NextResponse.json({ ok: true, id: documentId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
