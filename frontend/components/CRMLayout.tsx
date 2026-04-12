"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearToken, getToken } from "@/lib/api";

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "") || "/";
  }
  return pathname;
}

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/follow-ups", label: "Follow-ups" },
  { href: "/team", label: "Team" },
  { href: "/profile", label: "Profile" },
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
  const sorted = [...nav].sort((a, b) => b.href.length - a.href.length);
  const hit = sorted.find((item) => isNavActive(p, item.href));
  return hit?.label ?? "CRM";
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = useMemo(() => normalizePath(pathname), [pathname]);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        <span className="font-semibold">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-neutral-50 text-neutral-900">
      <aside className="hidden w-60 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white text-neutral-900 ring-1 ring-neutral-200">
            <Image
              src="/brand-mark.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900">Lead CRM</h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Sales & pipeline
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
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-neutral-900 ring-1 ring-neutral-200 hover:ring-neutral-400"
              title="Profile"
            >
              <Image
                src="/brand-mark.png"
                alt=""
                width={26}
                height={26}
                className="object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => {
                clearToken();
                router.push("/login");
              }}
              className="min-w-0 flex-1 rounded-xl border border-neutral-300 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-8">
          <div className="text-sm font-semibold text-neutral-500">
            {navLabelForPath(path)}
          </div>
          <Link
            href="/leads/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
          >
            + New lead
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
