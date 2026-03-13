"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/components/SearchInput";
import { Appointment } from "@/lib/mock";
import { Trash2 } from "lucide-react";

export function DashboardSearch({
  appointments,
  onDelete,
}: {
  appointments: Appointment[];
  onDelete?: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  const top = useMemo(() => {
    if (!q.trim()) return [];
    const query = q.trim().toLowerCase();
    return appointments
      .filter((a) => a.patientName.toLowerCase().includes(query))
      .slice(0, 4);
  }, [q, appointments]);

  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Find patient…" />
      {top.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {top.map((a) => (
            <div
              key={a.id}
              className="rounded-xl bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-sm px-4 py-3 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold tracking-tight text-[#1D1E20]">
                    {a.patientName}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-slate-500">
                    {a.service} · {new Date(a.start).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(a.id);
                    }}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-600">
          Start typing to search mock patients.
        </div>
      )}
    </div>
  );
}

