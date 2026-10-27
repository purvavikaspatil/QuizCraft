"use client";

import { ClockFading, Compass, LayoutDashboard, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; matches: (path: string) => boolean }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, matches: (path) => path === "/" },
  {
    href: "/quizzes",
    label: "Explore Quizzes",
    icon: Compass,
    matches: (path) => path.startsWith("/quizzes") || path.startsWith("/setup"),
  },
  {
    href: "/history",
    label: "Quiz History",
    icon: ClockFading,
    matches: (path) => path.startsWith("/history") || path.startsWith("/results"),
  },
  { href: "/settings", label: "Settings", icon: Settings, matches: (path) => path.startsWith("/settings") },
];

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname !== null && item.matches(pathname);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-text"
                  : "text-muted hover:bg-surface-muted hover:text-fg",
              )}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavList({ onNavigate }: { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

/**
 * Navigation links with the current page highlighted. The pathname is URL data,
 * so it is read inside Suspense to keep the surrounding shell prerenderable.
 */
export function MainNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main">
      <Suspense fallback={<NavList pathname={null} onNavigate={onNavigate} />}>
        <ActiveNavList onNavigate={onNavigate} />
      </Suspense>
    </nav>
  );
}
