import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Resolves the tenant_id for the currently authenticated user.
 *
 * - Uses the Supabase anon key + user session cookies (not the service role key)
 *   so that RLS policies on the profiles table are enforced.
 * - Throws "Not authenticated" if no valid session exists.
 * - Throws "Tenant not found for user" if the user has no profiles row.
 *
 * Required env vars (in addition to existing SUPABASE_SERVICE_ROLE_KEY):
 *   SUPABASE_URL         — already set
 *   SUPABASE_ANON_KEY    — public anon key from Supabase dashboard → Settings → API
 */
export async function getTenantId(): Promise<string> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
