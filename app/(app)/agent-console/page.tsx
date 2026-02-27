"use client";

import { useEffect, useState } from "react";

type Config = {
  empathyEnabled: boolean;
  allowDiscount: boolean;
  maxDiscountAmount: number | null;
  signature: string;
};

const DEFAULT_CONFIG: Config = {
  empathyEnabled: true,
  allowDiscount: false,
  maxDiscountAmount: null,
  signature: "Team SequenceFlow",
};

type PreviewResponse = {
  routing?: string;
  draft: {
    subject: string;
    body: string;
  };
  confidence?: number;
};

export default function AgentConsolePage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [discountModal, setDiscountModal] = useState(false);

  useEffect(() => {
    fetch("/api/agent-config")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data?.config ?? DEFAULT_CONFIG);
      });
  }, []);

  async function saveConfig() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/agent-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    } finally {
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  async function generatePreview() {
    setLoading(true);
    setPreview(null);

    // Always read latest saved config before generating
    let latestConfig = config;
    try {
      const configRes = await fetch("/api/agent-config");
      if (configRes.ok) {
        const data = await configRes.json();
        latestConfig = data?.config ?? DEFAULT_CONFIG;
        setConfig(latestConfig);
      }
    } catch {
      // fall back to local state
    }

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
          empathyEnabled: latestConfig.empathyEnabled,
          allowDiscount: latestConfig.allowDiscount,
          maxDiscountAmount: latestConfig.maxDiscountAmount ?? 0,
          signature: latestConfig.signature,
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

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved ✓"
        : saveState === "error"
          ? "Save failed"
          : "Save Config";

  return (
    <div style={styles.page}>
      {/* Discount confirmation modal */}
      {discountModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Allow Discounts?</h3>
            <p style={styles.modalText}>
              Are you sure you want to allow the AI to offer discounts to
              customers?
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.secondaryButton}
                className="btn-secondary"
                onClick={() => setDiscountModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.primaryButton}
                className="btn-primary"
                onClick={() => {
                  setConfig({
                    ...config,
                    allowDiscount: true,
                    maxDiscountAmount: config.maxDiscountAmount ?? 10,
                  });
                  setDiscountModal(false);
                }}
              >
                Yes, allow
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>Agent Console</h1>
        <p style={styles.subtitle}>
          Configure the support agent and generate a live AI preview.
        </p>
      </div>

      <div style={styles.layout}>
        {/* Config panel */}
        <div style={styles.configPanel}>
          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              id="empathy"
              checked={config.empathyEnabled}
              onChange={(e) =>
                setConfig({ ...config, empathyEnabled: e.target.checked })
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
              checked={config.allowDiscount}
              onChange={(e) => {
                if (e.target.checked) {
                  setDiscountModal(true);
                } else {
                  setConfig({
                    ...config,
                    allowDiscount: false,
                    maxDiscountAmount: null,
                  });
                }
              }}
            />
            <label htmlFor="discount" style={styles.checkboxLabel}>
              Allow discount
            </label>
          </div>

          {config.allowDiscount && (
            <div style={styles.field}>
              <label style={styles.label}>Please specify max discount (€)</label>
              <input
                type="number"
                style={styles.input}
                value={config.maxDiscountAmount ?? 0}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxDiscountAmount: Number(e.target.value),
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
            <button
              style={styles.secondaryButton}
              className="btn-secondary"
              type="button"
              onClick={saveConfig}
              disabled={saveState === "saving"}
            >
              {saveLabel}
            </button>
            <button
              style={styles.primaryButton}
              className="btn-primary"
              type="button"
              onClick={generatePreview}
              disabled={loading}
            >
              Generate Preview
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div style={styles.previewPanel}>
          <h2 style={styles.previewTitle}>AI Preview</h2>

          {loading && (
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              Generating...
            </p>
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
                    color:
                      preview?.routing === "AUTO" ||
                      preview?.routing === "AUTO_REPLY"
                        ? "#B4F000"
                        : "#ef4444",
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
                    color: confidenceColor(
                      typeof preview?.confidence === "number"
                        ? preview.confidence
                        : 0
                    ),
                  }}
                >
                  {typeof preview?.confidence === "number"
                    ? (preview.confidence * 100).toFixed(0) + "%"
                    : "—"}
                </span>
              </div>

              <div style={{ ...styles.previewDivider, paddingTop: "16px" }}>
                <div style={styles.previewKey}>Subject</div>
                <div style={styles.previewText}>
                  {preview?.draft?.subject ?? "—"}
                </div>
              </div>

              <div style={{ ...styles.previewDivider, paddingTop: "16px" }}>
                <div style={styles.previewKey}>Body</div>
                <div
                  style={{
                    ...styles.previewText,
                    whiteSpace: "pre-wrap",
                    marginTop: "8px",
                  }}
                >
                  {preview?.draft?.body ?? "—"}
                </div>
              </div>
            </div>
          )}

          {!loading && !preview && (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              Hit &quot;Generate Preview&quot; to see a live AI response using
              the current config.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "52px 44px",
    maxWidth: "1100px",
    margin: "0 auto",
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
  },
  header: {
    marginBottom: "44px",
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
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    alignItems: "start",
  },
  configPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
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
    borderRadius: "14px",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "28px",
    maxWidth: "400px",
    width: "90%",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
    color: "var(--text)",
  },
  modalText: {
    fontSize: "14px",
    color: "var(--muted)",
    marginBottom: "24px",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
};
