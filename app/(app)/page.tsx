import fs from "fs/promises";
import path from "path";
import { DashboardClient, type BusinessMetrics } from "./dashboard/DashboardClient";

const LOG_PATH = path.join(process.cwd(), "data", "support-logs.jsonl");

async function getBusinessMetrics(): Promise<BusinessMetrics> {
  type LogEntry = { latencyMs?: number; route?: string };
  let entries: LogEntry[] = [];

  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    entries = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is LogEntry => e !== null);
  } catch {
    // log file missing — no requests yet
  }

  const customerQuestions = entries.length;

  const draftRoutes = new Set(["AUTO", "AUTO_REPLY", "HUMAN_REVIEW"]);
  const draftEntries = entries.filter((e) => e.route && draftRoutes.has(e.route));
  const aiDraftsGenerated = draftEntries.length;

  // Auto-routed (no human review needed) as a proxy for acceptance
  // TODO: implement true no-edit tracking when Gmail draft events are available
  const autoCount = entries.filter(
    (e) => e.route === "AUTO" || e.route === "AUTO_REPLY"
  ).length;
  const aiAcceptanceRate = aiDraftsGenerated > 0 ? autoCount / aiDraftsGenerated : null;

  const latencies = entries
    .filter((e) => typeof e.latencyMs === "number")
    .map((e) => e.latencyMs as number);
  const avgResponseTimeMs =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : null;

  return { customerQuestions, aiDraftsGenerated, aiAcceptanceRate, avgResponseTimeMs };
}

export default async function DashboardPage() {
  const metrics = await getBusinessMetrics();
  return <DashboardClient metrics={metrics} />;
}
