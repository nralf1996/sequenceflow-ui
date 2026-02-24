"use client";

import React, { useEffect, useMemo, useState } from "react";

type KnowledgeItem = {
  id: string;
  originalName: string;
  storedName: string;
  storedAt: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  textLength: number;
  preview: string;
};

export default function KnowledgePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canUpload = useMemo(() => !!file && !uploading, [file, uploading]);

  async function refresh() {
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const json = await res.json();

      console.log("API RESPONSE:", json);

      if (!json.ok) {
        console.error("API not ok");
        return;
      }

      if (!Array.isArray(json.items)) {
        console.error("items is not array", json.items);
        return;
      }

      setItems(json.items);
    } catch (e) {
      console.error("refresh failed", e);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(json?.error?.message || "Upload failed");
      setUploading(false);
      return;
    }

    setFile(null);
    await refresh();
    setUploading(false);
  }

  async function onDelete(id: string) {
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Knowledge Library</h1>
        <p style={styles.subtitle}>
          Upload documents. Extract text. Build your internal AI memory.
        </p>
      </div>

      <form onSubmit={onUpload} style={styles.uploadCard}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={styles.fileInput}
        />

        <button
          type="submit"
          disabled={!canUpload}
          style={{
            ...styles.primaryButton,
            opacity: canUpload ? 1 : 0.5,
          }}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {items.length === 0 && (
          <div style={styles.empty}>No documents uploaded yet.</div>
        )}

        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.filename}>{item.originalName}</div>
              <div style={styles.meta}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={styles.stats}>
              <span>{(item.sizeBytes / 1024).toFixed(1)} KB</span>
              <span>{item.textLength.toLocaleString()} chars</span>
            </div>

            <div style={styles.preview}>
              {item.preview || "No text extracted"}
            </div>

            <div style={styles.cardActions}>
              <a
                href={item.storedAt}
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                Open PDF
              </a>

              <button
                onClick={() => onDelete(item.id)}
                style={styles.dangerButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "56px 48px",
    maxWidth: "1100px",
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
  uploadCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "20px 24px",
    borderRadius: "16px",
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "36px",
  },
  fileInput: {
    color: "var(--text)",
    flex: 1,
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
    whiteSpace: "nowrap" as const,
  },
  grid: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    padding: "24px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  filename: {
    fontWeight: 600,
    fontSize: "15px",
    color: "var(--text)",
  },
  meta: {
    fontSize: "12px",
    color: "var(--muted)",
    whiteSpace: "nowrap" as const,
  },
  stats: {
    fontSize: "12px",
    display: "flex",
    gap: "16px",
    color: "var(--muted)",
  },
  preview: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    maxHeight: "120px",
    overflow: "auto",
    whiteSpace: "pre-wrap" as const,
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  cardActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "4px",
  },
  link: {
    color: "#B4F000",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
  },
  dangerButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  empty: {
    padding: "28px 24px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    color: "var(--muted)",
    fontSize: "14px",
  },
  error: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#ef4444",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "24px",
    fontSize: "14px",
  },
};
