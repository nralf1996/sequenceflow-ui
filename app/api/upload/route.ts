import { NextResponse } from "next/server";

// Legacy route — replaced by /api/knowledge/upload
export async function POST() {
  return NextResponse.json(
    { error: "Use /api/knowledge/upload" },
    { status: 410 }
  );
}
