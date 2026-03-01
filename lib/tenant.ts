import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type TenantContext = {
  tenantId: string;
  role: string;
};

/**
 * Resolves the tenant_id and role for the currently authenticated user.
 *
 * Supports two auth paths:
 *  1. Bearer token  — machine-to-machine (e.g. n8n). Reads the JWT directly
 *     from the Authorization header: `Authorization: Bearer <access_token>`
 *  2. Session cookie — browser / Next.js client. Falls back to the Supabase
 *     session stored in HTTP-only cookies (standard SSR flow).
 *
 * Required env vars:
 *   SUPABASE_URL       — Supabase project URL
 *   SUPABASE_ANON_KEY  — public anon key (Settings → API in Supabase dashboard)
 *
 * Throws:
 *   "Not authenticated"         — no valid session or token
 *   "Tenant not found for user" — user exists but has no profiles row
 */
export async function getTenantId(req: Request): Promise<TenantContext> {
  const authHeader = req.headers.get("authorization") ?? "";
  const isBearer   = authHeader.toLowerCase().startsWith("bearer ");

  let supabase: ReturnType<typeof createServerClient>;
  let userId: string;

  if (isBearer) {
    // ── Bearer path (machine-to-machine) ───────────────────────────────────
    supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() { /* no-op for machine callers */ },
        },
      }
    );

    const token = authHeader.slice(7).trim();
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    userId = user.id;

  } else {
    // ── Cookie path (browser / Next.js SSR) ───────────────────────────────
    const cookieStore = await cookies();

    supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Route handlers may not be able to set cookies in all contexts.
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    userId = user.id;
  }

  // ── Profiles lookup (same for both paths) ────────────────────────────────
  const { data, error } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", userId)
    .single();

  if (error || !data?.tenant_id) {
    throw new Error("Tenant not found for user");
  }

  return {
    tenantId: data.tenant_id as string,
    role:     (data.role as string) ?? "admin",
  };
}
