import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "client";

export type Session = {
  role: UserRole;
  /** null for admin (platform-wide), UUID for client-scoped access */
  clientId: string | null;
};

// ─── Token resolution ─────────────────────────────────────────────────────────
// Compares a token against ADMIN_TOKEN / CLIENT_TOKEN env vars.
//
// Dev fallback:
//   If neither ADMIN_TOKEN nor CLIENT_TOKEN is configured, all requests are
//   treated as admin in non-production environments. This lets you run the app
//   without auth config during development.
//   In production, unconfigured tokens → null (→ 401).
function resolveToken(token: string): Session | null {
  const adminToken = process.env.ADMIN_TOKEN;
  const clientToken = process.env.CLIENT_TOKEN;
  const defaultClientId = process.env.DEFAULT_CLIENT_ID ?? null;

  // Dev fallback: no tokens configured → open as admin
  if (!adminToken && !clientToken) {
    return process.env.NODE_ENV !== "production"
      ? { role: "admin", clientId: null }
      : null;
  }

  if (adminToken && token === adminToken) {
    return { role: "admin", clientId: null };
  }

  if (clientToken && token === clientToken) {
    return { role: "client", clientId: defaultClientId };
  }

  return null;
}

// ─── Cookie parser ────────────────────────────────────────────────────────────
function parseCookieHeader(cookieStr: string, name: string): string {
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

// ─── API route session (reads from Request) ───────────────────────────────────
// Priority:
//   1. Authorization: Bearer <token>
//   2. sf_token cookie
//   3. Dev fallback (if no tokens configured)
export function getSession(req: Request): Session | null {
  // 1. Bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (bearerToken) return resolveToken(bearerToken);

  // 2. sf_token cookie
  const cookieStr = req.headers.get("cookie") ?? "";
  const cookieToken = parseCookieHeader(cookieStr, "sf_token");

  if (cookieToken) return resolveToken(cookieToken);

  // 3. No explicit token — dev fallback handles it
  return resolveToken("");
}

// ─── Server Component session (reads from Next.js cookies()) ─────────────────
export async function getSessionFromCookies(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sf_token")?.value ?? "";
  return resolveToken(token);
}
