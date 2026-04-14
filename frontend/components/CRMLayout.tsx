"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import UserAccountMenu from "@/components/UserAccountMenu";
import { AuthUserProvider } from "@/contexts/AuthUserContext";
import { getToken, usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "") || "/";
  }
  return pathname;
}

/** Sidebar: spec — Dashboard, Leads, Pipeline, Follow-ups, Team (Add lead only on Leads page). */
const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/follow-ups", label: "Follow-ups" },
  { href: "/todo", label: "Todo" },
  { href: "/team", label: "Team" },
];

/** Only the matching nav item is active ( /leads/new does not activate "Leads" ). */
function isNavActive(pathname: string, href: string): boolean {
  const p = normalizePath(pathname);
  if (href === "/leads") {
    if (p === "/leads/new") return false;
    return p === "/leads" || /^\/leads\/(?!new$)[^/]+/.test(p);
  }
  if (href === "/leads/new") {
    return p === "/leads/new";
  }
  if (p === href) return true;
  if (href === "/dashboard") {
    return p.startsWith("/dashboard/");
  }
  return p.startsWith(`${href}/`);
}

/** Header label: prefer the longest matching nav path so /leads/new maps to Add Lead, not Leads. */
function navLabelForPath(pathname: string): string {
  const p = normalizePath(pathname);
  if (p === "/profile") return "Profile";
  if (p === "/leads/new") return "Add lead";
  const sorted = [...nav].sort((a, b) => b.href.length - a.href.length);
  const hit = sorted.find((item) => isNavActive(p, item.href));
  return hit?.label ?? "SALENLO";
}

function MobileNavIcon({
  name,
  className,
}: {
  name: "home" | "leads" | "pipeline" | "followups" | "team" | "todo";
  className?: string;
}) {
  const cn = className ?? "h-5 w-5";
  switch (name) {
    case "home":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      );
    case "leads":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 4.5h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 4.5h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      );
    case "pipeline":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      );
    case "followups":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      );
    case "todo":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "team":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      );
    default:
      return null;
  }
}

const mobileNavItems: { href: string; label: string; icon: "home" | "leads" | "pipeline" | "followups" | "team" | "todo" }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/pipeline", label: "Board", icon: "pipeline" },
  { href: "/todo", label: "Todo", icon: "todo" },
  { href: "/team", label: "Team", icon: "team" },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = useMemo(() => normalizePath(pathname), [pathname]);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const refreshMe = useCallback((u: User) => setMe(u), []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    // Use a small delay to avoid synchronous state update during effect
    setReady(true);
    setMeLoading(true);
    usersApi
      .me()
      .then((u) => setMe(u))
      .catch(() => setMe(null))
      .finally(() => setMeLoading(false));
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-semibold text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <AuthUserProvider value={{ user: me, loading: meLoading, onUserUpdated: refreshMe }}>
      <div className="flex h-screen w-full bg-white text-neutral-900 overflow-hidden">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
          <div className="flex items-center gap-3 p-6">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-900">
              <Image
                src="/brand-mark.png"
                alt=""
                width={28}
                height={28}
                className="h-auto w-auto max-h-full max-w-full object-contain"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                SALENLO
              </h1>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--foreground-muted)" }}
              >
                Sales & leads
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {nav.map((item) => {
              const active = isNavActive(path, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-neutral-900 text-white shadow-md"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
            <UserAccountMenu variant="sidebar" />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 sm:px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 md:hidden">
                <Image
                  src="/brand-mark.png"
                  alt=""
                  width={22}
                  height={22}
                  className="max-h-full max-w-full object-contain"
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-neutral-400 md:hidden">
                  SALENLO
                </p>
                <div className="truncate text-sm font-semibold text-neutral-800 md:text-neutral-500">
                  {navLabelForPath(path)}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <UserAccountMenu variant="header" />
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-24 sm:p-4 md:p-8 md:pb-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-neutral-200 bg-white/95 px-1 pt-1 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
            style={{ paddingBottom: "max(5px, env(safe-area-inset-bottom))" }}
            aria-label="Main navigation"
          >
            {mobileNavItems.map((item) => {
              const active = isNavActive(path, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold leading-tight transition-colors ${
                    active ? "text-neutral-900" : "text-neutral-500"
                  }`}
                >
                  <MobileNavIcon
                    name={item.icon}
                    className={`h-5 w-5 shrink-0 ${active ? "text-neutral-900" : "text-neutral-400"}`}
                  />
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </AuthUserProvider>
  );
}
