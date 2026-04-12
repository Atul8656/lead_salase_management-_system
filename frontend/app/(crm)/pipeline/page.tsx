"use client";

import { useCallback, useEffect, useState } from "react";
import { leadsApi } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { PipelineBoard } from "@/components/PipelineBoard";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await leadsApi.list({ limit: 500 });
      setLeads(res.items);
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
          Drag cards between stages · updates via API immediately
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
