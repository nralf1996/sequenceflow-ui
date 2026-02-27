import { NextResponse } from "next/server";

// Legacy route — replaced by /api/knowledge/documents and /api/knowledge/document/[id]
export async function GET() {
  return NextResponse.json(
    { error: "Use /api/knowledge/documents" },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Use /api/knowledge/document/:id" },
    { status: 410 }
  );
}
