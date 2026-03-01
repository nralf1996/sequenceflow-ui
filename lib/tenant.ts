import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Resolves the tenant_id for the currently authenticated user.
 *
 * Supports two auth paths:
 *  1. Bearer token  — machine-to-machine (e.g. n8n). Reads the JWT directly
 *     from the Authorization header: `Authorization: Bearer <access_token>`
 *  2. Session cookie — browser / Next.js client. Falls back to the Supabase
 *     session stored in HTTP-only cookies (standard SSR flow).
 *
 * In both cases the user is looked up in the `profiles` table to resolve
 * their tenant_id.  RLS on that table is enforced via the anon key.
 *
 * Required env vars:
 *   SUPABASE_URL       — Supabase project URL
 *   SUPABASE_ANON_KEY  — public anon key (Settings → API in Supabase dashboard)
 *
 * Throws:
 *   "Not authenticated"      — no valid session or token
 *   "Tenant not found for user" — user exists but has no profiles row
 */
export async function getTenantId(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization") ?? "";
  const isBearer   = authHeader.toLowerCase().startsWith("bearer ");

  let supabase: ReturnType<typeof createServerClient>;

  if (isBearer) {
    // ── Bearer path (machine-to-machine) ───────────────────────────────────
    // Use a no-op cookie adapter; the JWT is passed directly to getUser().
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

    // Use service-role key for the profiles lookup so RLS doesn't block it
    // (the Bearer user may not have an active session cookie).
    const { data, error } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (error || !data?.tenant_id) {
      throw new Error("Tenant not found for user");
    }

    return data.tenant_id as string;

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

    const { data, error } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (error || !data?.tenant_id) {
      throw new Error("Tenant not found for user");
    }

    return data.tenant_id as string;
  }
}
