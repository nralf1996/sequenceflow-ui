import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ display: "flex", height: "100vh" }}>
        <Sidebar />

        <main className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ flex: 1, padding: "40px", overflow: "auto", background: "var(--bg)" }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
