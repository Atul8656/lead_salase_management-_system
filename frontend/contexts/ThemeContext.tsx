"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  resolved: "light" | "dark";
};

const STORAGE_KEY = "lead-crm-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemIsDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        const s = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
        if (s === "light" || s === "dark" || s === "system") {
          setPreferenceState(s);
        }
      } catch {
        /* ignore */
      }
      setMounted(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = useMemo((): "light" | "dark" => {
    if (!mounted) return "light";
    if (preference === "system") return systemIsDark() ? "dark" : "light";
    return preference;
  }, [preference, mounted]);

  const applyDom = useCallback((mode: "light" | "dark") => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.classList.toggle("dark", mode === "dark");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyDom(resolved);
  }, [mounted, resolved, applyDom]);

  useEffect(() => {
    if (!mounted || preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDom(systemIsDark() ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted, preference, applyDom]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference, resolved }),
    [preference, setPreference, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
