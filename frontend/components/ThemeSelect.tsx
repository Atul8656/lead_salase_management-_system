"use client";

import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSelect({ className = "" }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="sr-only">Theme</span>
      <select
        value={preference}
        onChange={(e) => setPreference(e.target.value as ThemePreference)}
        className="crm-theme-select rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
        title="Theme"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
