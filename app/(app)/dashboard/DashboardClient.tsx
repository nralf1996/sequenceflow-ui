"use client";

import type React from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export type BusinessMetrics = {
  customerQuestions: number;
  aiDraftsGenerated: number;
  aiAcceptanceRate: number | null;
  avgResponseTimeMs: number | null;
};

function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function DashboardClient({ metrics }: { metrics: BusinessMetrics }) {
  const { t } = useTranslation();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t.dashboard.title}</h1>
        <p style={styles.subtitle}>{t.dashboard.subtitle}</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>{metrics.customerQuestions}</div>
          <div style={styles.metricLabel}>{t.dashboard.customerQuestions}</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>{metrics.aiDraftsGenerated}</div>
          <div style={styles.metricLabel}>{t.dashboard.aiDraftsGenerated}</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={{ ...styles.metricValue, color: metrics.aiAcceptanceRate !== null ? "#B4F000" : "var(--text)" }}>
            {formatRate(metrics.aiAcceptanceRate)}
          </div>
          <div style={styles.metricLabel}>{t.dashboard.aiAcceptanceRate}</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>{formatResponseTime(metrics.avgResponseTimeMs)}</div>
          <div style={styles.metricLabel}>{t.dashboard.avgResponseTime}</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "52px 44px",
    maxWidth: "960px",
    margin: "0 auto",
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
  },
  header: {
    marginBottom: "48px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "var(--text)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "28px 24px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  metricValue: {
    fontSize: "26px",
    fontWeight: 600,
    color: "var(--text)",
    letterSpacing: "-0.02em",
  },
  metricLabel: {
    fontSize: "12px",
    color: "var(--muted)",
    letterSpacing: "0.01em",
  },
};
