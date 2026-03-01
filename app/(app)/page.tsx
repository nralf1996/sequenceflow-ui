import fs from "fs/promises";
import path from "path";
import { DashboardClient, type DashboardData } from "./dashboard/DashboardClient";

const LOG_PATH = path.join(process.cwd(), "data", "support-logs.jsonl");
const AVG_MANUAL_REPLY_MINUTES = 3;

type LogEntry = {
  ts: string;
  latencyMs?: number;
  route?: string;
};

const DRAFT_ROUTES = new Set(["AUTO", "AUTO_REPLY", "HUMAN_REVIEW"]);
const AUTO_ROUTES = new Set(["AUTO", "AUTO_REPLY"]);

async function readLogEntries(): Promise<LogEntry[]> {
  try {
    const raw = await fs.readFile(LOG_PATH, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is LogEntry => e !== null && typeof e.ts === "string");
  } catch {
    return [];
  }
}

function computePctTrend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function routeToEvent(route: string | undefined): string {
  switch (route) {
    case "AUTO":         return "AI draft generated";
    case "AUTO_REPLY":   return "Auto-reply sent";
    case "HUMAN_REVIEW": return "Draft flagged for review";
    case "ERROR":        return "Request error";
    default:             return "Event processed";
  }
}

async function getDashboardData(): Promise<DashboardData> {
  const entries = await readLogEntries();
  const now = new Date();

  // ── 7-day comparison windows ────────────────────────────────────────────────
  const curStart = new Date(now);
  curStart.setDate(curStart.getDate() - 7);
  const prevStart = new Date(curStart);
  prevStart.setDate(prevStart.getDate() - 7);

  const curEntries  = entries.filter((e) => new Date(e.ts) >= curStart);
  const prevEntries = entries.filter((e) => new Date(e.ts) >= prevStart && new Date(e.ts) < curStart);

  function windowMetrics(w: LogEntry[]) {
    const drafts = w.filter((e) => e.route && DRAFT_ROUTES.has(e.route));
    const auto   = w.filter((e) => e.route && AUTO_ROUTES.has(e.route)).length;
    const lats   = w.filter((e) => typeof e.latencyMs === "number").map((e) => e.latencyMs as number);
    return {
      questions:   w.length,
      drafts:      drafts.length,
      accRate:     drafts.length > 0 ? auto / drafts.length : null,
      avgMs:       lats.length > 0 ? lats.reduce((a, b) => a + b, 0) / lats.length : null,
    };
  }

  const cur  = windowMetrics(curEntries);
  const prev = windowMetrics(prevEntries);

  // ── All-time totals ─────────────────────────────────────────────────────────
  const allDrafts = entries.filter((e) => e.route && DRAFT_ROUTES.has(e.route));
  const allAuto   = entries.filter((e) => e.route && AUTO_ROUTES.has(e.route)).length;
  const allLats   = entries.filter((e) => typeof e.latencyMs === "number").map((e) => e.latencyMs as number);

  const metrics = {
    customerQuestions: entries.length,
    aiDraftsGenerated: allDrafts.length,
    aiAcceptanceRate:  allDrafts.length > 0 ? allAuto / allDrafts.length : null,
    avgResponseTimeMs: allLats.length > 0 ? allLats.reduce((a, b) => a + b, 0) / allLats.length : null,
  };

  // ── Trends ──────────────────────────────────────────────────────────────────
  const trends = {
    customerQuestions: { pct: computePctTrend(cur.questions, prev.questions) },
    aiDraftsGenerated: { pct: computePctTrend(cur.drafts, prev.drafts) },
    aiAcceptanceRate: {
      // percentage-point difference
      pct: cur.accRate !== null && prev.accRate !== null
        ? Math.round((cur.accRate - prev.accRate) * 100)
        : null,
    },
    avgResponseTime: {
      pct: cur.avgMs !== null && prev.avgMs !== null
        ? computePctTrend(cur.avgMs, prev.avgMs)
        : null,
    },
  };

  // ── Workload saved (this calendar month) ────────────────────────────────────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const acceptedThisMonth = entries
    .filter((e) => new Date(e.ts) >= monthStart && e.route && AUTO_ROUTES.has(e.route))
    .length;

  // ── Activity by day — last 30 days ──────────────────────────────────────────
  const chartStart = new Date(now);
  chartStart.setDate(chartStart.getDate() - 29);
  chartStart.setHours(0, 0, 0, 0);

  const dayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(chartStart);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  entries
    .filter((e) => new Date(e.ts) >= chartStart)
    .forEach((e) => {
      const day = e.ts.slice(0, 10);
      if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    });

  const activityByDay = [...dayMap.entries()].map(([date, count]) => ({ date, count }));

  // ── Recent activity feed — last 10 ──────────────────────────────────────────
  const recentActivity = entries
    .slice(-10)
    .reverse()
    .map((e) => ({ ts: e.ts, event: routeToEvent(e.route) }));

  return {
    metrics,
    trends,
    workload: {
      acceptedThisMonth,
      savedMinutes: acceptedThisMonth * AVG_MANUAL_REPLY_MINUTES,
    },
    activityByDay,
    recentActivity,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
