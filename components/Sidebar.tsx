"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Agent Console", href: "/test-ai" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[var(--border)] bg-[var(--bg)] flex flex-col h-full transition-colors duration-300 ease-in-out">
      <div className="px-6 py-6 flex items-center justify-between">
        <span className="font-bold text-base text-[var(--text)]">SequenceFlow</span>
        <ThemeToggle />
      </div>

      <nav className="flex flex-col gap-2 px-4">
        {navItems.map(({ label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "px-4 py-2 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
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
