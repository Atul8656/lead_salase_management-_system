"use client";

import { useCallback, useEffect, useState } from "react";
import { leadsApi } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { normalizeLead } from "@/lib/leadNormalize";
import { PipelineBoard } from "@/components/PipelineBoard";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await leadsApi.list({ limit: 500 });
      setLeads(res.items.map(normalizeLead));
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Sales pipeline</h2>
        <p className="text-sm font-medium text-neutral-500">
          Drag one stage at a time (no skipping). Mark <strong className="font-semibold text-neutral-800">Lost</strong> from any open stage.{" "}
          <strong className="font-semibold text-neutral-800">Converted</strong> only from Follow-up. Interested sets a follow-up date. Converted requires payment details.
        </p>
      </div>
      {err && (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-900">
          {err}
        </p>
      )}
      <PipelineBoard leads={leads} onUpdated={load} />
    </div>
  );
}
