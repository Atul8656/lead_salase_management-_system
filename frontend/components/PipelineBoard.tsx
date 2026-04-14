"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { leadsApi } from "@/lib/api";
import type { Lead, LeadPriority, LeadStatus } from "@/lib/types";
import { coerceLeadPriority, coerceLeadStatus } from "@/lib/leadNormalize";
import { LEAD_PRIORITY } from "@/lib/leadPriorityTheme";

const COLUMNS: { id: LeadStatus; title: string }[] = [
  { id: "new", title: "New" },
  { id: "contacted", title: "Contacted" },
  { id: "interested", title: "Interested" },
  { id: "follow-up", title: "Follow-up" },
  { id: "converted", title: "Converted" },
  { id: "lost", title: "Lost" },
];

function normalizeLeadRow(l: Lead): Lead {
  const status = coerceLeadStatus(l.status as unknown as string);
  const priority = coerceLeadPriority(l.priority as string | null | undefined);
  return { ...l, status, priority };
}

const PRI_RANK: Record<string, number> = { HOT: 0, WARM: 1, COLD: 2 };

function sortLeadsByPriorityThenDate(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const pa = a.priority ? PRI_RANK[String(a.priority)] ?? 3 : 3;
    const pb = b.priority ? PRI_RANK[String(b.priority)] ?? 3 : 3;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function PipelinePriorityLabel({ priority }: { priority: LeadPriority | null | undefined }) {
  if (!priority || !LEAD_PRIORITY[priority]) return null;
  const t = LEAD_PRIORITY[priority];
  return (
    <span className="shrink-0 text-[11px] font-medium" style={{ color: t.accent }}>
      {t.label}
    </span>
  );
}

function DroppableCol({
  status,
  dimmed,
  children,
}: {
  status: LeadStatus;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[min(420px,55dvh)] w-[min(16.5rem,calc(100vw-2.5rem))] shrink-0 flex-col rounded-xl border bg-white p-2 transition-opacity sm:min-h-[420px] sm:w-64 ${
        dimmed ? "opacity-40" : ""
      } ${isOver ? "border-neutral-900 ring-1 ring-neutral-900/20" : "border-neutral-200"}`}
    >
      {children}
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const pr = coerceLeadPriority(lead.priority);
  const borderAccent =
    pr && LEAD_PRIORITY[pr]
      ? {
          borderLeftWidth: "3px",
          borderLeftColor: LEAD_PRIORITY[pr].accent,
          borderLeftStyle: "solid" as const,
        }
      : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...borderAccent }}
      {...listeners}
      {...attributes}
      className={`relative mb-2 flex gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-sm shadow-sm ${
        isDragging ? "opacity-60" : ""
      } cursor-grab active:cursor-grabbing`}
    >
      <div
        className="mt-0.5 flex h-8 w-6 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-500"
        aria-hidden
      >
        <span className="flex flex-col gap-px text-neutral-500">
          <span className="h-0.5 w-3 rounded-full bg-current" />
          <span className="h-0.5 w-3 rounded-full bg-current" />
          <span className="h-0.5 w-3 rounded-full bg-current" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/leads/${lead.id}`}
            className="app-link min-w-0 text-sm font-semibold leading-snug"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {lead.name}
          </Link>
          <PipelinePriorityLabel priority={pr} />
        </div>
        <p className="mt-1 text-xs font-medium text-neutral-500">{lead.company_name ?? "—"}</p>
        <Link
          href={`/leads/${lead.id}`}
          className="mt-1 inline-block text-[10px] font-semibold text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          Edit lead
        </Link>
      </div>
    </div>
  );
}

export function PipelineBoard({
  leads,
  onUpdated,
}: {
  leads: Lead[];
  onUpdated: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const normalizedLeads = useMemo(() => leads.map(normalizeLeadRow), [leads]);

  const byStatus = useMemo(() => {
    const m: Record<string, Lead[]> = {};
    for (const c of COLUMNS) m[c.id] = [];
    for (const l of normalizedLeads) {
      const st = l.status;
      if (!m[st]) m[st] = [];
      m[st].push(l);
    }
    for (const k of Object.keys(m)) {
      m[k as LeadStatus] = sortLeadsByPriorityThenDate(m[k as LeadStatus] ?? []);
    }
    return m;
  }, [normalizedLeads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const leadId = Number(String(active.id).replace(/^lead-/, ""));
    const overId = String(over.id);
    let newStatus: LeadStatus | null = null;
    if (overId.startsWith("col-")) {
      newStatus = overId.replace(/^col-/, "") as LeadStatus;
    } else if (overId.startsWith("lead-")) {
      const target = normalizedLeads.find((l) => `lead-${l.id}` === overId);
      if (target) newStatus = target.status;
    }
    if (!newStatus) return;
    const lead = normalizedLeads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const body: Record<string, unknown> = { status: newStatus };

    if (newStatus === "interested") {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      body.follow_up_date = d.toISOString();
    }

    if (newStatus === "converted") {
      const amt = window.prompt("Payment amount (required)?", "0");
      const meth = window.prompt("Payment method (required)?", "");
      if (!amt || !meth) {
        setMsg("Converted requires amount and method.");
        return;
      }
      body.payment_amount = parseFloat(amt);
      body.payment_method = meth;
    }

    try {
      await leadsApi.pipeline(leadId, body);
      setMsg("");
      onUpdated();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    }
  }

  const activeLead = activeId
    ? normalizedLeads.find((l) => `lead-${l.id}` === activeId)
    : undefined;

  return (
    <div>
      {msg && (
        <p className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-900">
          {msg}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col">
              <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {col.title}
              </div>
              <DroppableCol
                status={col.id}
                dimmed={false}
              >
                {(byStatus[col.id] ?? []).map((lead) => (
                  <DraggableCard key={lead.id} lead={lead} />
                ))}
              </DroppableCol>
            </div>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="rounded-lg border border-neutral-900 bg-white p-3 text-sm shadow-xl">
              <p className="font-semibold text-neutral-900">{activeLead.name}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
