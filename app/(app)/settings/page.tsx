"use client";

import { useState } from "react";

type Tab = "policy" | "integrations" | "team";

const TABS: { id: Tab; label: string }[] = [
  { id: "policy",       label: "Policy"       },
  { id: "integrations", label: "Integrations" },
  { id: "team",         label: "Team"         },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 14px" }}>
      {children}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab]     = useState<Tab>("policy");
  const [allowDiscount, setAllow]     = useState(false);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [threshold, setThreshold]     = useState("0.60");
  const [signature, setSignature]     = useState("");

  return (
    <div style={{ padding: "52px 44px", maxWidth: "860px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "6px" }}>
          Configure your workspace, integrations, and team.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--border)", marginBottom: "32px" }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: "8px 18px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === id ? 600 : 400,
              color: activeTab === id ? "var(--text)" : "var(--muted)",
              borderBottom: activeTab === id ? "2px solid #B4F000" : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Policy tab ── */}
      {activeTab === "policy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "480px" }}>

          {/* Allow discount toggle */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", margin: "0 0 3px" }}>Allow Discount</p>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                Permit the AI to propose discounts in replies.
              </p>
            </div>
            <button
              onClick={() => setAllow(!allowDiscount)}
              style={{
                flexShrink: 0,
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                border: "none",
                background: allowDiscount ? "#B4F000" : "var(--border)",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.15s",
                marginTop: "2px",
              }}
            >
              <span style={{
                position: "absolute",
                top: "3px",
                left: allowDiscount ? "20px" : "3px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: allowDiscount ? "#0B1220" : "#6B7280",
                transition: "left 0.15s",
              }} />
            </button>
          </div>

          {/* Max discount */}
          <div>
            <Label>Max Discount (€)</Label>
            <input
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="e.g. 25"
              disabled={!allowDiscount}
              style={{ ...inputStyle, opacity: allowDiscount ? 1 : 0.4, cursor: allowDiscount ? "text" : "not-allowed" }}
            />
          </div>

          {/* Confidence threshold */}
          <div>
            <Label>Confidence Escalation Threshold</Label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              style={inputStyle}
            />
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "5px" }}>
              Tickets below this score are flagged for human review.
            </p>
          </div>

          {/* Signature */}
          <div>
            <Label>Email Signature</Label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={4}
              placeholder={"e.g. Kind regards,\nThe Support Team"}
              style={inputStyle}
            />
          </div>

          <button style={{
            alignSelf: "flex-start",
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            background: "#B4F000",
            color: "#0B1220",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}>
            Save
          </button>
        </div>
      )}

      {/* ── Integrations tab ── */}
      {activeTab === "integrations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", margin: "0 0 3px" }}>Gmail</p>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                Connect your Gmail inbox to process support emails automatically via SupportFlow.
              </p>
            </div>
            <button
              disabled
              style={{
                flexShrink: 0,
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--muted)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "not-allowed",
                opacity: 0.5,
              }}
            >
              Connect Gmail
            </button>
          </div>
        </div>
      )}

      {/* ── Team tab ── */}
      {activeTab === "team" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
          <SectionTitle>
            <span style={{ display: "block", padding: "14px 20px 0" }}>Team Members</span>
          </SectionTitle>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "10px 20px",
            borderBottom: "1px solid var(--border)",
          }}>
            {["Name", "Email", "Role"].map((h) => (
              <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {h}
              </span>
            ))}
          </div>

          {/* Empty state */}
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              No team members yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
