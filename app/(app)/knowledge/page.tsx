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
            opacity: canUpload ? 1 : 0.6,
          }}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {items.length === 0 && (
          <div style={styles.empty}>
            No documents uploaded yet.
          </div>
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
    padding: "48px",
    maxWidth: "1100px",
    margin: "0 auto",
    background: "#0f172a",
    minHeight: "100vh",
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
  uploadCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "32px",
  },
  fileInput: {
    color: "white",
  },
  primaryButton: {
    background: "#3b82f6",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gap: "20px",
  },
  card: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
  },
  filename: {
    fontWeight: 600,
  },
  meta: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  stats: {
    fontSize: "12px",
    display: "flex",
    gap: "16px",
    color: "#94a3b8",
  },
  preview: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    maxHeight: "140px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
  },
  cardActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: {
    color: "#60a5fa",
    fontSize: "13px",
  },
  dangerButton: {
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  empty: {
    padding: "20px",
    background: "#1e293b",
    borderRadius: "12px",
    color: "#94a3b8",
  },
  error: {
    background: "#7f1d1d",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};
