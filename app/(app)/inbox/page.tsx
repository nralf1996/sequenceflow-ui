"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { createClient } from "@/lib/supabaseClient";

type TicketStatus = "draft" | "approved" | "escalated" | "sent" | "ignored";
type TicketIntent =
  | "order_status"
  | "return"
  | "return_request"
  | "damaged"
  | "complaint"
  | "missing_items"
  | "unknown"
  | "fallback"
  | string;

type Ticket = {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  intent: string | null;
  confidence: number | null;
  status: TicketStatus;
  created_at: string;
};

const INTENT_COLORS: Record<string, { bg: string; color: string }> = {
  order_status:   { bg: "rgba(59,130,246,0.14)",   color: "#60a5fa" },
  return:         { bg: "rgba(139,92,246,0.14)",   color: "#a78bfa" },
  return_request: { bg: "rgba(139,92,246,0.14)",   color: "#a78bfa" },
  damaged:        { bg: "rgba(239,68,68,0.14)",    color: "#f87171" },
  complaint:      { bg: "rgba(239,68,68,0.14)",    color: "#f87171" },
  missing_items:  { bg: "rgba(249,115,22,0.14)",   color: "#fb923c" },
  unknown:        { bg: "rgba(107,114,128,0.14)",  color: "#9ca3af" },
  fallback:       { bg: "rgba(107,114,128,0.14)",  color: "#9ca3af" },
};

const STATUS_COLORS: Record<TicketStatus, { bg: string; color: string }> = {
  draft:     { bg: "rgba(251,191,36,0.14)",  color: "#fbbf24" },
  approved:  { bg: "rgba(180,240,0,0.14)",   color: "#B4F000" },
  escalated: { bg: "rgba(248,113,113,0.14)", color: "#f87171" },
  sent:      { bg: "rgba(107,114,128,0.14)", color: "#9ca3af" },
  ignored:   { bg: "rgba(107,114,128,0.14)", color: "#9ca3af" },
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, borderRadius: "6px",
      padding: "2px 8px", background: bg, color,
      letterSpacing: "0.03em", display: "inline-block", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function intentColors(intent: string | null) {
  if (!intent) return INTENT_COLORS.fallback;
  return INTENT_COLORS[intent] ?? INTENT_COLORS.fallback;
}

export default function InboxPage() {
  const { t } = useTranslation();
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [loading, setLoading]           = useState(true);
  const [gmailConnected, setGmailConnected] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Get tenant_id from tenant_members
        const { data: member } = await supabase
          .from("tenant_members")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!member?.tenant_id) { setLoading(false); return; }

        const tenantId = member.tenant_id;

        // Check Gmail integration status
        const { data: integration } = await supabase
          .from("tenant_integrations")
          .select("status")
          .eq("tenant_id", tenantId)
          .eq("provider", "gmail")
          .single();

        const connected =
          integration?.status === "connected" || integration?.status === "active";
        setGmailConnected(connected);

        // Fetch tickets
        const { data: rows } = await supabase
          .from("tickets")
          .select("id, subject, from_email, from_name, intent, confidence, status, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        setTickets(rows ?? []);
      } catch (err) {
        console.error("[inbox] load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-10 lg:py-12">

      <div className="mb-8">
        <h1 style={{ fontSize: "26px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
          {t.inbox.title}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "6px" }}>
          {t.inbox.subtitle}
        </p>
      </div>

      {/* Gmail not connected banner */}
      {!gmailConnected && !loading && (
        <div style={{
          marginBottom: "20px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "rgba(251,191,36,0.10)",
          border: "1px solid rgba(251,191,36,0.35)",
          color: "#fbbf24",
          fontSize: "13px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <span>Koppel Gmail om emails te ontvangen</span>
          <Link
            href="/settings?tab=integrations"
            style={{
              color: "#fbbf24",
              fontWeight: 600,
              textDecoration: "underline",
              whiteSpace: "nowrap",
            }}
          >
            Verbinden →
          </Link>
        </div>
      )}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>

        {/* Desktop: table header */}
        <div
          className="hidden md:grid"
          style={{
            gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            gap: "16px",
          }}
        >
          {[t.inbox.colSubject, t.inbox.colCustomer, t.inbox.colIntent, t.inbox.colConfidence, t.inbox.colStatus].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {h}
            </span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Laden…</p>
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              Nog geen tickets. Emails worden automatisch opgehaald.
            </p>
          </div>
        )}

        {!loading && tickets.map((ticket, i) => {
          const intent    = intentColors(ticket.intent);
          const status    = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.draft;
          const conf      = ticket.confidence ?? 0;
          const confColor = conf >= 0.8 ? "#B4F000" : conf >= 0.6 ? "#fbbf24" : "#f87171";
          const confBg    = conf >= 0.8 ? "rgba(180,240,0,0.12)" : conf >= 0.6 ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.12)";
          const isLast    = i === tickets.length - 1;
          const customerLabel = ticket.from_name || ticket.from_email;

          return (
            <Link
              key={ticket.id}
              href={`/inbox/${ticket.id}`}
              className="block transition-colors duration-100 hover:bg-[var(--bg)]"
              style={{ borderBottom: isLast ? "none" : "1px solid var(--border)", textDecoration: "none" }}
            >
              {/* Mobile: card */}
              <div className="flex flex-col gap-2 px-4 py-4 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", lineHeight: 1.4 }}>
                    {ticket.subject}
                  </span>
                  <Badge bg={status.bg} color={status.color} label={ticket.status} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{customerLabel}</span>
                <div className="flex flex-wrap gap-2">
                  <Badge bg={intent.bg} color={intent.color} label={ticket.intent ?? "—"} />
                  {ticket.confidence !== null && (
                    <Badge bg={confBg} color={confColor} label={`${Math.round(conf * 100)}%`} />
                  )}
                </div>
              </div>

              {/* Desktop: table row */}
              <div
                className="hidden md:grid"
                style={{
                  gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr",
                  padding: "14px 20px",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{ticket.subject}</span>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{customerLabel}</span>
                <Badge bg={intent.bg} color={intent.color} label={ticket.intent ?? "—"} />
                <Badge bg={confBg} color={confColor} label={ticket.confidence !== null ? `${Math.round(conf * 100)}%` : "—"} />
                <Badge bg={status.bg} color={status.color} label={ticket.status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
