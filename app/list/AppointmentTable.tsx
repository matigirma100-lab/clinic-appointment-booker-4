"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { Bell, CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/mock";
import { StatusChipInteractive } from "@/components/StatusChip";
import { EditAppointmentModal } from "@/components/EditAppointmentModal";
import { ReminderModal } from "@/components/ReminderModal";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";


function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) {
      parts.push(text.slice(i, idx));
    }
    parts.push(
      <span
        key={key++}
        className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5"
      >
        {text.slice(idx, idx + q.length)}
      </span>,
    );
    i = idx + q.length;
  }

  return parts;
}

const columns: (
  query: string,
  onStatusChange: (id: string, status: AppointmentStatus) => void,
  onEdit: (appointment: Appointment) => void,
  onDelete: (id: string) => void,
) => ColumnDef<Appointment>[] = (query, onStatusChange, onEdit, onDelete) => [
  {
    header: "Patient",
    accessorKey: "patientName",
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="truncate text-sm font-semibold tracking-tight text-slate-900">
            {highlight(row.original.patientName, query)}
          </div>
          {row.original.reminderSent ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-slate-300" />
          )}
        </div>
        <div className="truncate text-xs text-slate-600">
          {highlight(row.original.phone, query)}
        </div>
      </div>
    ),
  },
  {
    header: "Phone",
    accessorKey: "phone",
    cell: ({ row }) => (
      <div className="text-sm text-slate-800">
        {highlight(row.original.phone, query)}
      </div>
    ),
  },
  {
    header: "Service",
    accessorKey: "service",
    cell: ({ row }) => (
      <div className="text-sm text-slate-800">{row.original.service}</div>
    ),
  },
  {
    header: "Doctor",
    accessorKey: "doctor",
    cell: ({ row }) => (
      <Link
        className="text-sm text-slate-800 hover:text-blue-700"
        href={`/doctor/${encodeURIComponent(row.original.doctor)}`}
      >
        {row.original.doctor}
      </Link>
    ),
  },
  {
    header: "Time",
    accessorKey: "start",
    cell: ({ row }) => (
      <div className="text-sm text-slate-800">
        {new Date(row.original.start).toLocaleString(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <StatusChipInteractive
        status={row.original.status}
        onChange={(next) => onStatusChange(row.original.id, next)}
      />
    ),
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        {/* Note: This cell is overridden in AppointmentTable below */}
        <button
          type="button"
          onClick={() => onDelete(row.original.id)}
          className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-1 text-[11px] text-red-700 hover:bg-red-500/20"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    ),
  },
];

export function AppointmentTable({
  data,
  allData = [],
  query,
  onStatusChange,
  onUpdateAppointment,
  onDelete,
}: {
  data: Appointment[];
  allData?: Appointment[];
  query: string;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onUpdateAppointment: (updated: Appointment) => void;
  onDelete: (id: string) => void;
}) {
  const [preview, setPreview] = useState<Appointment | null>(null);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const table = useReactTable({
    data,
    columns: columns(query, onStatusChange, setEditingApt, onDelete).map((col) => {
      if (col.id === "actions") {
        return {
          ...col,
          cell: ({ row }: { row: { original: Appointment } }) => (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditingApt(row.original)}
                className="inline-flex items-center gap-1 rounded-full bg-white/25 border border-white/30 px-2 py-1 text-[11px] text-slate-800 hover:bg-white/40 active:scale-95 transition-all"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreview(row.original)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-all active:scale-95",
                  row.original.reminderSent
                    ? "bg-emerald-50/50 border-emerald-500/20 text-emerald-700"
                    : "bg-blue-500/15 border-blue-500/30 text-blue-700 hover:bg-blue-500/25"
                )}
              >
                <Bell className="h-3 w-3" />
                {row.original.reminderSent ? "Sent" : "Send Reminder"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(row.original.id)}
                className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-1 text-[11px] text-red-700 hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          ),
        } as ColumnDef<Appointment>;
      }
      return col;
    }),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full">
            <thead className="bg-white/15">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-white/20">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-medium text-slate-700/80",
                        h.column.id === "actions" && "w-[56px]",
                      )}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout" initial={false}>
                {table.getRowModel().rows.map((r) => (
                  <motion.tr
                    layout
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ 
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                      layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 }
                    }}
                    className="border-b border-white/15 hover:bg-white/10 transition-colors"
                  >
                    {r.getVisibleCells().map((c) => (
                      <td key={c.id} className="px-4 py-3 align-middle">
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs text-slate-600">
          {data.length} appointment{data.length === 1 ? "" : "s"}
        </div>
      </div>

      <ReminderModal
        open={!!preview}
        appointmentId={preview?.id || null}
        onClose={() => setPreview(null)}
        onMarkSent={(id) => {
          const updated = data.find(a => a.id === id);
          if (updated) {
            onUpdateAppointment({ ...updated, reminderSent: true });
          }
        }}
      />

      <EditAppointmentModal
        open={!!editingApt}
        appointment={editingApt}
        allAppointments={allData}
        onClose={() => setEditingApt(null)}
        onUpdated={(updated) => {
          onUpdateAppointment(updated);
        }}
      />

      {copied && (
        <div className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-900 text-white text-xs px-4 py-2 shadow-lg">
          Message copied
        </div>
      )}
    </>
  );
}

