import { NextResponse } from "next/server";

// This endpoint has been superseded by /api/support/generate.
// The Agent Console calls /api/support/generate directly with a tenantId.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is no longer active. Use /api/support/generate." },
    { status: 410 }
  );
}
