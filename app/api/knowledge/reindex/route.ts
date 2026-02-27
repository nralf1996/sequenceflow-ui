import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/knowledge/ingest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { ok: false, error: "documentId is required" },
        { status: 400 }
      );
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
