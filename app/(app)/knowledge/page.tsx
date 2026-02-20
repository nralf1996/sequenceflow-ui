"use client";

import { useState } from "react";

export default function KnowledgePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: any) => {
    e.preventDefault();

    const file = e.target.file.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("API response:", data);

    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Knowledge Upload</h1>

      <form onSubmit={handleUpload}>
        <input type="file" name="file" />
        <button type="submit">Upload</button>
      </form>

      {loading && <p>Uploading...</p>}

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>Result:</h3>
          <pre
            style={{
              background: "#111",
              padding: 20,
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
