import { getSupabaseClient } from "@/lib/supabase";
import { chunkText } from "@/lib/chunkText";
import { createEmbedding } from "@/lib/embeddings";

// ─── Text extraction ───────────────────────────────────────────────────────────
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    // Import the internal implementation directly to bypass index.js which
    // tries to load a test PDF at module evaluation time (breaks Next.js build).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")) as any;
    const parse = pdfParse.default ?? pdfParse;
    const data = await parse(buffer) as { text: string };
    const text = data.text;
    if (!text.trim()) {
      throw new Error("PDF extraction failed: no readable text detected");
    }
    return text;
  }
  // TXT / MD / CSV — read as UTF-8
  return buffer.toString("utf8");
}

// ─── processDocument ──────────────────────────────────────────────────────────
// Fetches document metadata, downloads the file from storage, extracts text,
// chunks it, generates embeddings, inserts chunks, and updates document status.
// Pass `fileBuffer` for fresh uploads to skip the storage download step.
export async function processDocument(
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
      // Download from Supabase Storage
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

    // Remove old chunks before (re)indexing
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
      `[processDocument] document=${documentId} type=${doc.type} chunks=${chunks.length} status=ready`
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
