"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { leadsApi } from "@/lib/api";
import type { Lead, LeadStatus } from "@/lib/types";

const COLUMNS: { id: LeadStatus; title: string }[] = [
  { id: "new", title: "New" },
  { id: "contacted", title: "Contacted" },
  { id: "interested", title: "Interested" },
  { id: "follow-up", title: "Follow-up" },
  { id: "converted", title: "Converted" },
  { id: "not_interested", title: "Not interested" },
];

function DroppableCol({
  status,
  children,
}: {
  status: LeadStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] w-64 shrink-0 flex-col rounded-xl border bg-white p-2 ${
        isOver ? "border-neutral-900 ring-1 ring-neutral-900/20" : "border-neutral-200"
      }`}
    >
      {children}
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `lead-${lead.id}` });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-2 cursor-grab rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <Link
        href={`/leads/${lead.id}`}
        className="app-link text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {lead.name}
      </Link>
      <p className="mt-1 text-xs font-medium text-neutral-500">{lead.company_name ?? "—"}</p>
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

  const byStatus = useMemo(() => {
    const m: Record<string, Lead[]> = {};
    for (const c of COLUMNS) m[c.id] = [];
    for (const l of leads) {
      if (!m[l.status]) m[l.status] = [];
      m[l.status].push(l);
    }
    return m;
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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
      const target = leads.find((l) => `lead-${l.id}` === overId);
      if (target) newStatus = target.status;
    }
    if (!newStatus) return;
    const lead = leads.find((l) => l.id === leadId);
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
    ? leads.find((l) => `lead-${l.id}` === activeId)
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
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col">
              <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {col.title}
              </div>
              <DroppableCol status={col.id}>
                {(byStatus[col.id] ?? []).map((lead) => (
                  <DraggableCard key={lead.id} lead={lead} />
                ))}
              </DroppableCol>
            </div>
          ))}
        </div>
        <DragOverlay>
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
