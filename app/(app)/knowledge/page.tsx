import { getSessionFromCookies } from "@/lib/auth";
import { KnowledgeClient } from "./KnowledgeClient";

// Server Component — determines role server-side before rendering.
// The Platform tab is only passed through if role === 'admin'.
// This prevents the tab from being rendered client-side for non-admins.
export default async function KnowledgePage() {
  const session = await getSessionFromCookies();
  const isAdmin = session?.role === "admin";

  return <KnowledgeClient isAdmin={isAdmin} />;
}
