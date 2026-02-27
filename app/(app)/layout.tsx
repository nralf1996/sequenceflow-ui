import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { Sidebar } from "@/components/Sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div
          className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ display: "flex", height: "100vh" }}
        >
          <Sidebar />

          {/* Right column: top bar + page content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Top bar */}
            <header
              className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                height: "44px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg)",
              }}
            >
              <LanguageSwitcher />
            </header>

            {/* Page content */}
            <main
              className="transition-colors duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}
            >
              {children}
            </main>
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
