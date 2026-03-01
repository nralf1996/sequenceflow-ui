import fs from "fs/promises";
import path from "path";
import { DashboardClient, type SystemStatus } from "./dashboard/DashboardClient";

// Server component: runs status checks, passes typed keys to the client component.
// The client component handles translated label rendering.
async function getSystemStatus(): Promise<SystemStatus> {
  // Knowledge Engine: always active if the page renders
  const knowledgeEngine = "active" as const;

  // PDF Extraction: check if index.json exists
  let pdfExtraction: SystemStatus["pdfExtraction"] = "unavailable";
  try {
    await fs.access(path.join(process.cwd(), "public", "uploads", "index.json"));
    pdfExtraction = "operational";
  } catch {
    // file does not exist
  }

  // Vector Index: check if vector-store.json exists and has entries
  let vectorIndex: SystemStatus["vectorIndex"] = "not_connected";
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "uploads", "vector-store.json"),
      "utf8"
    );
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      vectorIndex = "connected";
    }
  } catch {
    // file missing or invalid
  }

  return { knowledgeEngine, pdfExtraction, vectorIndex };
}

export default async function DashboardPage() {
  const status = await getSystemStatus();
  return <DashboardClient status={status} />;
}
