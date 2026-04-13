"use client";

import type { Lead, User } from "@/lib/types";
import LeadsDataTable from "@/components/LeadsDataTable";

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  items: Lead[];
  users: User[];
  loading: boolean;
  err?: string;
};

export default function LeadsPanelModal({
  title,
  open,
  onClose,
  items,
  users,
  loading,
  err,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leads-panel-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-6">
          <h2 id="leads-panel-title" className="text-lg font-bold text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl font-light text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {err && (
            <p className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
              {err}
            </p>
          )}
          {loading ? (
            <p className="px-4 py-10 text-center text-sm font-medium text-neutral-500">Loading…</p>
          ) : (
            <LeadsDataTable items={items} users={users} />
          )}
        </div>
      </div>
    </div>
  );
}
