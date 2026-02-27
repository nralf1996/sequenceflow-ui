import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

import { getSupabaseClient } from "@/lib/supabase";
import { chunkText } from "@/lib/chunkText";
import { createEmbedding } from "@/lib/embeddings";

// ─── PDF extraction via pdftotext ─────────────────────────────────────────────
async function extractPdfText(buffer: Buffer): Promise<string> {
  const tmpPath = path.join(tmpdir(), `${crypto.randomUUID()}.pdf`);
  try {
    await writeFile(tmpPath, buffer);
    return await new Promise<string>((resolve, reject) => {
      const child = spawn("pdftotext", ["-layout", tmpPath, "-"]);
      let out = "";
      child.stdout.on("data", (d: Buffer) => (out += d.toString()));
      child.on("close", (code: number) => {
        if (code === 0) resolve(out);
        else reject(new Error(`pdftotext exited with code ${code}`));
      });
      child.on("error", reject);
    });
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

// ─── Text extraction dispatcher ───────────────────────────────────────────────
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }
  // TXT / MD / CSV — read as UTF-8
  return buffer.toString("utf8");
}

// ─── Main ingestion function ──────────────────────────────────────────────────
// Pass `fileBuffer` for fresh uploads to avoid downloading from storage.
// Omit `fileBuffer` for reindex — it will be downloaded from Supabase Storage.
export async function ingestDocument(
  documentId: string,
  fileBuffer?: Buffer
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: doc, error: docError } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    throw new Error("Document not found: " + (docError?.message ?? documentId));
  }

  // Mark as processing
  await supabase
    .from("knowledge_documents")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", documentId);

  try {
    let buffer: Buffer;

    if (fileBuffer) {
      buffer = fileBuffer;
    } else {
      // Download from Supabase Storage for reindex
      const storagePath = `${doc.client_id ?? "platform"}/${documentId}/${doc.source}`;
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("knowledge-uploads")
        .download(storagePath);

      if (dlErr || !fileData) {
        throw new Error("Failed to download file: " + (dlErr?.message ?? "unknown"));
      }

      buffer = Buffer.from(await fileData.arrayBuffer());
    }

    const text = await extractText(buffer, doc.mime_type ?? "text/plain");

    if (!text.trim()) {
      throw new Error("No text could be extracted from the document.");
    }

    // Remove old chunks before reindexing
    await supabase.from("knowledge_chunks").delete().eq("document_id", documentId);

    const chunks = chunkText(text, 1000, 200);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);

      const { error: insertErr } = await supabase.from("knowledge_chunks").insert({
        document_id: documentId,
        client_id: doc.client_id,
        type: doc.type,
        chunk_index: i,
        content: chunks[i],
        // Pass as JSON string — pgvector accepts '[0.1,0.2,...]' text format
        embedding: JSON.stringify(embedding),
      });

      if (insertErr) {
        throw new Error(`Failed to insert chunk ${i}: ${insertErr.message}`);
      }
    }

    await supabase
      .from("knowledge_documents")
      .update({
        status: "ready",
        chunk_count: chunks.length,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    console.log(
      `[ingest] document=${documentId} type=${doc.type} chunks=${chunks.length} status=ready`
    );
  } catch (err: any) {
    const msg = String(err?.message ?? err);

    await supabase
      .from("knowledge_documents")
      .update({
        status: "error",
        error: msg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    throw err;
  }
}
