"use client";

import { useState } from "react";

export default function KnowledgePage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      setMessage("Bestand succesvol geüpload.");
    } else {
      setMessage("Upload mislukt.");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Knowledge Upload</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} style={{ marginLeft: 10 }}>
        Upload
      </button>

      <p>{message}</p>
    </div>
  );
}
