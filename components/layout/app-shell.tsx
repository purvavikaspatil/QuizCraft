"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { MainNav } from "./nav";
import { ThemeToggle } from "./theme-toggle";

function SidebarFooter() {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">Theme</p>
        <ThemeToggle />
      </div>
      <p className="px-1 text-xs leading-relaxed text-muted">
        Progress is saved in this browser only. No account needed.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col justify-between border-r border-border bg-surface px-4 py-6 lg:flex">
        <div className="space-y-8">
          <div className="px-2">
            <Logo />
          </div>
          <MainNav />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo onNavigate={close} />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-xl text-fg transition-colors hover:bg-surface-muted"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        <div
          id="mobile-menu"
          hidden={!menuOpen}
          className={cn("border-t border-border px-4 pt-3 pb-5", menuOpen && "animate-fade-in")}
        >
          <MainNav onNavigate={close} />
          <div className="mt-4 border-t border-border pt-4">
            <SidebarFooter />
          </div>
        </div>
      </header>

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
