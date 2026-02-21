"use client";

export default function DashboardPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          Overview of your SupportFlow OS.
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.metricValue}>12</div>
          <div style={styles.metricLabel}>Documents</div>
        </div>

        <div style={styles.card}>
          <div style={styles.metricValue}>8,987</div>
          <div style={styles.metricLabel}>Total Characters</div>
        </div>

        <div style={styles.card}>
          <div style={styles.metricValue}>92%</div>
          <div style={styles.metricLabel}>AI Confidence</div>
        </div>

        <div style={styles.card}>
          <div style={styles.metricValue}>1.8s</div>
          <div style={styles.metricLabel}>Avg Response Time</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>System Status</h2>

        <div style={styles.statusCard}>
          <div style={styles.statusRow}>
            <span>Knowledge Engine</span>
            <span style={styles.statusGreen}>Active</span>
          </div>

          <div style={styles.statusRow}>
            <span>PDF Extraction</span>
            <span style={styles.statusGreen}>Operational</span>
          </div>

          <div style={styles.statusRow}>
            <span>Vector Index</span>
            <span style={styles.statusYellow}>Not Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "48px",
    maxWidth: "1100px",
    margin: "0 auto",
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    background: "#1e293b",
    padding: "24px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  metricValue: {
    fontSize: "26px",
    fontWeight: 700,
  },
  metricLabel: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  section: {
    marginTop: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "16px",
  },
  statusCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  statusGreen: {
    color: "#22c55e",
    fontWeight: 600,
  },
  statusYellow: {
    color: "#eab308",
    fontWeight: 600,
  },
};