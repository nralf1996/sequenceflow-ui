import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ display: "flex", height: "100vh" }}>
          <Sidebar />

          <main className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ flex: 1, padding: "0", overflow: "auto", background: "var(--bg)" }}>
            {children}
          </main>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
