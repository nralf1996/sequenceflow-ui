"use client";

import type React from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// Typed status keys — the server sends these, the client maps to translated labels
export type SystemStatus = {
  knowledgeEngine: "active" | "unavailable";
  pdfExtraction: "operational" | "unavailable";
  vectorIndex: "connected" | "not_connected";
};

export function DashboardClient({ status }: { status: SystemStatus }) {
  const { t } = useTranslation();

  // Map typed keys to translated labels
  const statusLabels = {
    knowledgeEngine:
      status.knowledgeEngine === "active" ? t.dashboard.active : t.dashboard.unavailable,
    pdfExtraction:
      status.pdfExtraction === "operational"
        ? t.dashboard.operational
        : t.dashboard.unavailable,
    vectorIndex:
      status.vectorIndex === "connected"
        ? t.dashboard.connected
        : t.dashboard.notConnected,
  };

  const isGreen = {
    knowledgeEngine: status.knowledgeEngine === "active",
    pdfExtraction: status.pdfExtraction === "operational",
    vectorIndex: status.vectorIndex === "connected",
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t.dashboard.title}</h1>
        <p style={styles.subtitle}>{t.dashboard.subtitle}</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>12</div>
          <div style={styles.metricLabel}>{t.dashboard.documents}</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>8,987</div>
          <div style={styles.metricLabel}>{t.dashboard.totalCharacters}</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={{ ...styles.metricValue, color: "#B4F000" }}>92%</div>
          <div style={styles.metricLabel}>{t.dashboard.aiConfidence}</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>1.8s</div>
          <div style={styles.metricLabel}>{t.dashboard.avgResponseTime}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t.dashboard.systemStatus}</h2>

        <div style={styles.statusCard}>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>{t.dashboard.knowledgeEngine}</span>
            <span style={isGreen.knowledgeEngine ? styles.statusGreen : styles.statusYellow}>
              {statusLabels.knowledgeEngine}
            </span>
          </div>

          <div style={{ ...styles.statusRow, ...styles.statusDivider }}>
            <span style={styles.statusLabel}>{t.dashboard.pdfExtraction}</span>
            <span style={isGreen.pdfExtraction ? styles.statusGreen : styles.statusYellow}>
              {statusLabels.pdfExtraction}
            </span>
          </div>

          <div style={{ ...styles.statusRow, ...styles.statusDivider }}>
            <span style={styles.statusLabel}>{t.dashboard.vectorIndex}</span>
            <span style={isGreen.vectorIndex ? styles.statusGreen : styles.statusYellow}>
              {statusLabels.vectorIndex}
            </span>
          </div>
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
    marginBottom: "52px",
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
  section: {
    marginTop: "8px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 600,
    marginBottom: "14px",
    color: "var(--text)",
    letterSpacing: "-0.01em",
  },
  statusCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "4px 0",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    padding: "14px 24px",
  },
  statusDivider: {
    borderTop: "1px solid var(--border)",
  },
  statusLabel: {
    color: "var(--text)",
  },
  statusGreen: {
    color: "#B4F000",
    fontWeight: 600,
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  statusYellow: {
    color: "#eab308",
    fontWeight: 600,
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
};
