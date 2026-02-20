import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
      <aside style={{ width: "250px", background: "#111", color: "white", padding: "20px" }}>
        <h2>SequenceFlow</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/knowledge">Knowledge</Link>
          <Link href="/test-ai">Test AI</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "40px" }}>
        {children}
      </main>
    </div>
  );
}
