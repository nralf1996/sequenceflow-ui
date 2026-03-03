"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/inbox");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #0B1220)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          padding: "40px",
          borderRadius: "14px",
          background: "var(--surface, #111927)",
          border: "1px solid var(--border, rgba(229,231,235,0.08))",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text, #E5E7EB)",
              margin: 0,
            }}
          >
            Sign in
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted, #6B7280)", marginTop: "6px" }}>
            SequenceFlow OS
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted, #6B7280)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border, rgba(229,231,235,0.08))",
                background: "var(--bg, #0B1220)",
                color: "var(--text, #E5E7EB)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted, #6B7280)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border, rgba(229,231,235,0.08))",
                background: "var(--bg, #0B1220)",
                color: "var(--text, #E5E7EB)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#f87171", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "#B4F000",
              color: "#0B1220",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
