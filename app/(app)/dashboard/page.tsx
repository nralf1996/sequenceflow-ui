import fs from "fs/promises";
import path from "path";
import type React from "react";

async function getSystemStatus() {
  // Knowledge Engine: always active if the page renders
  const knowledgeEngine = "Active";

  // PDF Extraction: check if index.json exists
  let pdfExtraction = "Unavailable";
  try {
    await fs.access(path.join(process.cwd(), "public", "uploads", "index.json"));
    pdfExtraction = "Operational";
  } catch {
    // file does not exist
  }

  // Vector Index: check if vector-store.json exists and has entries
  let vectorIndex = "Not Connected";
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "uploads", "vector-store.json"),
      "utf8"
    );
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      vectorIndex = "Connected";
    }
  } catch {
    // file missing or invalid
  }

  return { knowledgeEngine, pdfExtraction, vectorIndex };
}

export default async function DashboardPage() {
  const status = await getSystemStatus();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Overview of your SupportFlow OS.</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>12</div>
          <div style={styles.metricLabel}>Documents</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>8,987</div>
          <div style={styles.metricLabel}>Total Characters</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={{ ...styles.metricValue, color: "#B4F000" }}>92%</div>
          <div style={styles.metricLabel}>AI Confidence</div>
        </div>

        <div style={styles.card} className="card-hover">
          <div style={styles.metricValue}>1.8s</div>
          <div style={styles.metricLabel}>Avg Response Time</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System Status</h2>

        <div style={styles.statusCard}>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>Knowledge Engine</span>
            <span style={styles.statusGreen}>{status.knowledgeEngine}</span>
          </div>

          <div style={{ ...styles.statusRow, ...styles.statusDivider }}>
            <span style={styles.statusLabel}>PDF Extraction</span>
            <span
              style={
                status.pdfExtraction === "Operational"
                  ? styles.statusGreen
                  : styles.statusYellow
              }
            >
              {status.pdfExtraction}
            </span>
          </div>

          <div style={{ ...styles.statusRow, ...styles.statusDivider }}>
            <span style={styles.statusLabel}>Vector Index</span>
            <span
              style={
                status.vectorIndex === "Connected"
                  ? styles.statusGreen
                  : styles.statusYellow
              }
            >
              {status.vectorIndex}
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
    textTransform: "uppercase",
  },
  statusYellow: {
    color: "#eab308",
    fontWeight: 600,
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
};
