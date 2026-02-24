"use client";

import { useEffect, useState } from "react";

type Config = {
  companyName: string;
  tone: "friendly" | "formal" | "direct";
  rules: {
    empathyEnabled: boolean;
    allowDiscount: boolean;
    maxDiscountAmount: number | null;
  };
  signature: string;
};

type PreviewResponse = {
  routing?: "AUTO" | "HUMAN_REVIEW";
  draft: {
    subject: string;
    body: string;
  };
  confidence?: {
    final: number;
    llm: number;
    retrieval: number;
  };
  retrieval?: {
    mode?: string;
    topSimilarity?: number;
    usedKnowledge?: boolean;
  };
  meta?: {
    model: string;
    latencyMs: number;
  };
};

export default function TestAIPage() {
  const [config, setConfig] = useState<Config>({
    companyName: "",
    tone: "friendly",
    rules: {
      empathyEnabled: true,
      allowDiscount: false,
      maxDiscountAmount: null,
    },
    signature: "",
  });

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/agent-config");
      const data = await res.json();
      setConfig(data);
    }
    load();
  }, []);

  async function saveConfig() {
    await fetch("/api/agent-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  }

  async function generatePreview() {
    setLoading(true);
    setPreview(null);

    const res = await fetch("/api/support/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Order #1234 arrived damaged",
        body: "Hi, my product arrived damaged. What can you do?",
        channel: "email",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          language: "nl",
        },
        order: {
          orderId: "1234",
          productName: "Office Chair",
          pricePaid: 199,
          currency: "EUR",
        },
        config: {
          companyName: config.companyName,
          tone: config.tone,
          empathyEnabled: config.rules.empathyEnabled,
          allowDiscount: config.rules.allowDiscount,
          maxDiscountAmount: config.rules.maxDiscountAmount ?? 0,
          signature: config.signature,
        },
      }),
    });

    const data = await res.json();
    setPreview(data);
    setLoading(false);
  }

  function confidenceColor(score: number): string {
    if (score >= 0.8) return "#B4F000";
    if (score >= 0.6) return "#eab308";
    return "#ef4444";
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Test AI</h1>
        <p style={styles.subtitle}>
          Configure the support agent and generate a live AI preview.
        </p>
      </div>

      <div style={styles.layout}>
        {/* Config panel */}
        <div style={styles.configPanel}>
          <div style={styles.field}>
            <label style={styles.label}>Company Name</label>
            <input
              style={styles.input}
              value={config.companyName}
              onChange={(e) =>
                setConfig({ ...config, companyName: e.target.value })
              }
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tone</label>
            <select
              style={styles.input}
              value={config.tone}
              onChange={(e) =>
                setConfig({ ...config, tone: e.target.value as Config["tone"] })
              }
            >
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              id="empathy"
              checked={config.rules.empathyEnabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rules: { ...config.rules, empathyEnabled: e.target.checked },
                })
              }
            />
            <label htmlFor="empathy" style={styles.checkboxLabel}>
              Enable empathy
            </label>
          </div>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              id="discount"
              checked={config.rules.allowDiscount}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rules: {
                    ...config.rules,
                    allowDiscount: e.target.checked,
                    maxDiscountAmount: e.target.checked
                      ? config.rules.maxDiscountAmount ?? 10
                      : null,
                  },
                })
              }
            />
            <label htmlFor="discount" style={styles.checkboxLabel}>
              Allow discount
            </label>
          </div>

          {config.rules.allowDiscount && (
            <div style={styles.field}>
              <label style={styles.label}>Max discount (€)</label>
              <input
                type="number"
                style={styles.input}
                value={config.rules.maxDiscountAmount ?? 0}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: {
                      ...config.rules,
                      maxDiscountAmount: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Signature</label>
            <textarea
              style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
              value={config.signature}
              onChange={(e) =>
                setConfig({ ...config, signature: e.target.value })
              }
            />
          </div>

          <div style={styles.actions}>
            <button style={styles.secondaryButton} type="button" onClick={saveConfig}>
              Save Config
            </button>
            <button style={styles.primaryButton} type="button" onClick={generatePreview}>
              Generate Preview
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div style={styles.previewPanel}>
          <h2 style={styles.previewTitle}>AI Preview</h2>

          {loading && (
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>Generating...</p>
          )}

          {preview && (
            <div style={styles.previewContent}>
              <div style={styles.previewRow}>
                <span style={styles.previewKey}>Routing</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                    color: preview?.routing === "AUTO" ? "#B4F000" : "#ef4444",
                  }}
                >
                  {preview?.routing ?? "—"}
                </span>
              </div>

              <div style={{ ...styles.previewRow, ...styles.previewDivider }}>
                <span style={styles.previewKey}>Confidence</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: confidenceColor(preview?.confidence?.final ?? 0),
                  }}
                >
                  {preview?.confidence?.final != null
                    ? (preview.confidence.final * 100).toFixed(0) + "%"
                    : "—"}
                  <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "12px", marginLeft: "8px" }}>
                    (llm {preview?.confidence?.llm != null ? (preview.confidence.llm * 100).toFixed(0) + "%" : "—"} · retrieval {preview?.confidence?.retrieval != null ? (preview.confidence.retrieval * 100).toFixed(0) + "%" : "—"})
                  </span>
                </span>
              </div>

              <div style={{ ...styles.previewRow, ...styles.previewDivider }}>
                <span style={styles.previewKey}>Retrieval</span>
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>
                  {preview?.retrieval?.mode ?? "—"} · similarity {preview?.retrieval?.topSimilarity != null ? preview.retrieval.topSimilarity.toFixed(3) : "—"} · knowledge {preview?.retrieval?.usedKnowledge ? "used" : "not used"}
                </span>
              </div>

              <div style={{ ...styles.previewDivider, paddingTop: "16px" }}>
                <div style={styles.previewKey}>Subject</div>
                <div style={styles.previewText}>{preview?.draft?.subject ?? "—"}</div>
              </div>

              <div style={{ ...styles.previewDivider, paddingTop: "16px" }}>
                <div style={styles.previewKey}>Body</div>
                <div style={{ ...styles.previewText, whiteSpace: "pre-wrap", marginTop: "8px" }}>
                  {preview?.draft?.body ?? "—"}
                </div>
              </div>

              <div style={{ ...styles.previewDivider, paddingTop: "12px" }}>
                <span style={{ ...styles.previewKey, fontSize: "11px" }}>
                  {preview?.meta?.model ?? "—"} · {preview?.meta?.latencyMs != null ? `${preview.meta.latencyMs}ms` : "—"}
                </span>
              </div>
            </div>
          )}

          {!loading && !preview && (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              Hit "Generate Preview" to see a live AI response using the current config.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "56px 48px",
    maxWidth: "1200px",
    margin: "0 auto",
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
  },
  header: {
    marginBottom: "40px",
  },
  title: {
    fontSize: "30px",
    fontWeight: 700,
    marginBottom: "8px",
    color: "var(--text)",
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "14px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    alignItems: "start",
  },
  configPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text)",
  },
  input: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  checkboxLabel: {
    fontSize: "14px",
    color: "var(--text)",
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: "12px",
    paddingTop: "4px",
  },
  primaryButton: {
    background: "#B4F000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "#0B1220",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
  },
  secondaryButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    padding: "10px 20px",
    borderRadius: "8px",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },
  previewPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "28px",
  },
  previewTitle: {
    fontSize: "17px",
    fontWeight: 600,
    marginBottom: "20px",
    color: "var(--text)",
  },
  previewContent: {
    display: "flex",
    flexDirection: "column",
  },
  previewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
  },
  previewDivider: {
    borderTop: "1px solid var(--border)",
    paddingTop: "12px",
    paddingBottom: "12px",
  },
  previewKey: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  previewText: {
    fontSize: "14px",
    color: "var(--text)",
    lineHeight: 1.6,
  },
};
