"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type KnowledgeType = "policy" | "training" | "platform";

type KnowledgeDoc = {
  id: string;
  client_id: string | null;
  type: KnowledgeType;
  title: string;
  source: string;
  mime_type: string;
  status: "pending" | "processing" | "ready" | "error";
  chunk_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: KnowledgeDoc["status"] }) {
  const colors: Record<KnowledgeDoc["status"], React.CSSProperties> = {
    ready:      { background: "rgba(180,240,0,0.12)", color: "#B4F000", border: "1px solid rgba(180,240,0,0.25)" },
    processing: { background: "rgba(234,179,8,0.12)",  color: "#eab308", border: "1px solid rgba(234,179,8,0.25)" },
    pending:    { background: "rgba(148,163,184,0.1)", color: "var(--muted)", border: "1px solid var(--border)" },
    error:      { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" },
  };

  return (
    <span style={{ ...colors[status], fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", letterSpacing: "0.03em" }}>
      {status.toUpperCase()}
    </span>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: { key: KnowledgeType; label: string; description: string }[] = [
  { key: "policy",   label: "Policy",   description: "Return policies, warranty rules, shipping terms." },
  { key: "training", label: "Training", description: "Q&A pairs and scripts for agent training." },
  { key: "platform", label: "Platform", description: "Platform-wide docs visible to all clients." },
];

// ─── Upload card ──────────────────────────────────────────────────────────────
function UploadCard({
  type,
  onUploaded,
}: {
  type: KnowledgeType;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("title", title.trim() || file.name);

    const res = await fetch("/api/knowledge/upload", { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(json?.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    setFile(null);
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    onUploaded();
  }

  return (
    <form onSubmit={handleUpload} style={styles.uploadCard}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.textInput}
        />

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ color: "var(--text)", flex: 1, fontSize: "13px" }}
          />

          <button
            type="submit"
            disabled={!file || uploading}
            style={{
              ...styles.primaryButton,
              opacity: !file || uploading ? 0.5 : 1,
              cursor: !file || uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}
    </form>
  );
}

// ─── Document row ─────────────────────────────────────────────────────────────
function DocRow({
  doc,
  onDeleted,
  onReindexed,
}: {
  doc: KnowledgeDoc;
  onDeleted: () => void;
  onReindexed: () => void;
}) {
  const [reindexing, setReindexing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleReindex() {
    setReindexing(true);
    await fetch("/api/knowledge/reindex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id }),
    });
    setReindexing(false);
    onReindexed();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    setDeleting(true);
    await fetch(`/api/knowledge/document/${doc.id}`, { method: "DELETE" });
    setDeleting(false);
    onDeleted();
  }

  return (
    <div style={styles.docRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={styles.docTitle}>{doc.title}</span>
          <StatusBadge status={doc.status} />
        </div>

        <div style={styles.docMeta}>
          <span>{doc.source}</span>
          <span>·</span>
          <span>{doc.chunk_count} chunks</span>
          <span>·</span>
          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
          {doc.error && (
            <>
              <span>·</span>
              <span style={{ color: "#ef4444" }}>{doc.error}</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={handleReindex}
          disabled={reindexing || doc.status === "processing"}
          style={styles.actionButton}
        >
          {reindexing ? "…" : "Reindex"}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ ...styles.actionButton, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── Tab panel ────────────────────────────────────────────────────────────────
function TabPanel({ type }: { type: KnowledgeType }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/knowledge/documents?type=${type}`, { cache: "no-store" });
    const json = await res.json();
    setDocs(json.documents ?? []);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <UploadCard type={type} onUploaded={refresh} />

      {loading ? (
        <div style={styles.emptyState}>Loading…</div>
      ) : docs.length === 0 ? (
        <div style={styles.emptyState}>No documents yet. Upload one above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {docs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              onDeleted={refresh}
              onReindexed={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<KnowledgeType>("policy");

  const activeTabDef = TABS.find((t) => t.key === activeTab)!;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Knowledge Library</h1>
        <p style={styles.subtitle}>
          Manage documents used by the support agent. Policy and training docs are
          client-specific; platform docs are global.
        </p>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.key ? styles.tabButtonActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p style={styles.tabDescription}>{activeTabDef.description}</p>

      {/* Tab content */}
      <TabPanel key={activeTab} type={activeTab} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    marginBottom: "36px",
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
  tabBar: {
    display: "flex",
    gap: "4px",
    borderBottom: "1px solid var(--border)",
    marginBottom: "16px",
  },
  tabButton: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "8px 16px",
    marginBottom: "-1px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--muted)",
    transition: "color 0.15s",
  },
  tabButtonActive: {
    color: "var(--text)",
    borderBottomColor: "#B4F000",
  },
  tabDescription: {
    fontSize: "13px",
    color: "var(--muted)",
    marginBottom: "24px",
  },
  uploadCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "18px 22px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  textInput: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "var(--text)",
    outline: "none",
    width: "100%",
  },
  primaryButton: {
    background: "#B4F000",
    border: "none",
    padding: "9px 20px",
    borderRadius: "8px",
    color: "#0B1220",
    fontWeight: 700,
    fontSize: "13px",
    whiteSpace: "nowrap" as const,
    transition: "opacity 0.15s",
  },
  errorBanner: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
  },
  emptyState: {
    padding: "28px 24px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    color: "var(--muted)",
    fontSize: "14px",
  },
  docRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "14px 18px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    marginBottom: "6px",
  },
  docTitle: {
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  docMeta: {
    display: "flex",
    gap: "6px",
    fontSize: "12px",
    color: "var(--muted)",
    flexWrap: "wrap" as const,
  },
  actionButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    padding: "5px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
};
