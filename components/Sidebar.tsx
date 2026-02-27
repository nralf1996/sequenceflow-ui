"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { label: t.sidebar.dashboard,    href: "/dashboard" },
    { label: t.sidebar.knowledge,    href: "/knowledge" },
    { label: t.sidebar.agentConsole, href: "/agent-console" },
  ];

  return (
    <aside className="w-52 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg)] flex flex-col h-full transition-colors duration-300 ease-in-out">
      {/* Header: brand + theme toggle */}
      <div
        className="px-5 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="font-semibold text-[13px] tracking-wide text-[var(--text)]"
          style={{ letterSpacing: "0.01em" }}
        >
          SequenceFlow
        </span>
        <ThemeToggle />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-3 pt-3">
        {navItems.map(({ label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "px-3 py-2 rounded-lg text-[13px] transition-all duration-150",
                isActive
                  ? "bg-[var(--surface)] text-[var(--text)] font-medium border border-[var(--border)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] font-normal",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
