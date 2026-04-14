"use client";

import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";

import { CustomSelect } from "@/components/CustomSelect";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSelect({ className = "" }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div className={className}>
      <CustomSelect
        value={preference}
        onChange={(val) => setPreference(val as ThemePreference)}
        options={OPTIONS}
        placeholder="Theme"
      />
    </div>
  );
}
