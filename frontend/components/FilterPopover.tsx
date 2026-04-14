"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface FilterPopoverProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeCount: number;
  children: React.ReactNode;
  onApply: () => void;
  onClear: () => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  onOpen,
  onClose,
  activeCount,
  children,
  onApply,
  onClear,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [prevCount, setPrevCount] = useState(activeCount);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Animate badge on count change
  useEffect(() => {
    if (activeCount !== prevCount) {
      setShouldAnimate(true);
      const t = setTimeout(() => setShouldAnimate(false), 300);
      setPrevCount(activeCount);
      return () => clearTimeout(t);
    }
  }, [activeCount, prevCount]);

  const handleApply = useCallback(() => {
    onApply();
    onClose();
  }, [onApply, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "Enter") {
        // Only apply if we are not in a textarea or searching
        const target = event.target as HTMLElement;
        if (target.tagName !== "TEXTAREA") {
            handleApply();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, handleApply]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={() => (isOpen ? onClose() : onOpen())}
        className={`flex items-center gap-2.5 rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-200 ${
          isOpen || activeCount > 0
            ? "border-neutral-900 bg-neutral-900 text-white shadow-md shadow-neutral-200"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filter
        {activeCount > 0 && (
          <span
            className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black transition-transform duration-300 ${
              shouldAnimate ? "scale-125" : "scale-100"
            } ${
              isOpen || activeCount > 0 ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
            }`}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop Popover */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 hidden w-[340px] origin-top-right rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-dropdown sm:block md:w-[460px]">
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Filters</h3>
                {activeCount > 0 && (
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Clear all
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
              {children}
            </div>

            <div className="border-t border-neutral-100 bg-neutral-50/50 p-4 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.97]"
                >
                  Apply Changes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-2.5 text-center text-[10px] font-medium text-neutral-400">
                Press <kbd className="font-sans px-1 rounded border border-neutral-200 bg-white">Enter</kbd> to apply, <kbd className="font-sans px-1 rounded border border-neutral-200 bg-white">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm sm:hidden transition-opacity" onClick={onClose} />
      )}

      {/* Mobile Bottom Sheet */}
      {isOpen && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[70] flex max-h-[90vh] flex-col rounded-t-[24px] bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.12)] animate-slide-up sm:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Drag Handle */}
          <div className="flex shrink-0 flex-col items-center pt-3 pb-5 sticky top-0 bg-white rounded-t-[24px] z-20">
            <div className="h-1.5 w-12 rounded-full bg-neutral-200 mb-4" />
            <div className="flex w-full items-center justify-between px-6">
              <h3 className="text-xl font-black tracking-tight text-neutral-900">Filters</h3>
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-bold text-neutral-400 active:text-neutral-900"
              >
                Reset all
              </button>
            </div>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-2 overscroll-contain">
            <div className="pb-8">
               {children}
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="p-6 pb-safe-area shrink-0 bg-white border-t border-neutral-100 flex gap-3 sticky bottom-0 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-2xl bg-neutral-900 py-4 text-base font-black text-white active:scale-95 transition-all shadow-xl shadow-neutral-200"
            >
              Apply Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-base font-bold text-neutral-500 active:bg-neutral-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
