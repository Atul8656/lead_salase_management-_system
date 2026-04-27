"use client";

import React, { useState, useRef, useEffect } from "react";

const OPTIONS = [
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "friends", label: "Friends" },
  { value: "other", label: "Other" },
];

interface SourceSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function SourceSelect({ value, onChange, label }: SourceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOther = value === "other" || value?.startsWith("Other: ");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Requirement: If "Other" is selected but input is empty, reset to "Select..."
        if (value === "other") {
          onChange("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, onChange]);

  const displayValue = value?.startsWith("Other: ") 
    ? value.substring(7) 
    : (value === "other" ? "" : (OPTIONS.find(o => o.value === value)?.label || ""));

  return (
    <div className="relative" ref={containerRef}>
      {label && <span className="mb-1 block text-xs font-semibold text-black">{label}</span>}
      
      <div className={`flex w-full items-center justify-between rounded-xl border transition-all duration-200 ${
        isOpen ? "border-black ring-2 ring-neutral-100" : "border-neutral-200 bg-white"
      }`}>
        <input
          type="text"
          readOnly={!isOther}
          value={displayValue}
          placeholder={value === "other" ? "Type other source..." : "Select source..."}
          onClick={() => {
            if (!isOther) setIsOpen(!isOpen);
          }}
          onFocus={() => {
            if (!isOther) setIsOpen(true);
          }}
          onChange={(e) => {
            if (isOther) {
              // Ensure we don't duplicate the "Other: " prefix if the user types it
              const cleanVal = e.target.value.replace(/^Other:\s*/i, "");
              onChange(cleanVal ? `Other: ${cleanVal}` : "other");
            }
          }}
          className={`w-full bg-transparent px-3 py-2.5 text-sm font-bold focus:outline-none ${
            value ? "text-black" : "text-neutral-400"
          } ${!isOther ? "cursor-pointer" : "cursor-text"}`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 text-neutral-400 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl animate-dropdown">
          <div className="max-h-60 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); }}
              className="flex w-full items-center px-3 py-2.5 text-left text-sm font-bold text-neutral-400 hover:bg-[#f3f3f3] hover:text-black"
            >
              Select...
            </button>
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                  value === option.value ? "bg-black text-white" : "text-neutral-700 hover:bg-[#f3f3f3] hover:text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
