"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { SearchInput } from "@/components/SearchInput";
import {
  Appointment,
  AppointmentStatus,
  getTodayRange,
  isSameDay,
} from "@/lib/mock";
import { mapDbStatusToAppointmentStatus } from "@/lib/mock";
import { useAppointmentsRealtime, useDebouncedValue } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { AppointmentTable } from "@/app/list/AppointmentTable";
import { NewBookingButton } from "@/components/NewBookingButton";

type Filter = "All" | "Today" | "Upcoming" | "No Shows";

const filters: Filter[] = ["All", "Today", "Upcoming", "No Shows"];

export function ListClient() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const dq = useDebouncedValue(q, 300);

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const mapFromDb = (row: any): Appointment => {
    const startIso = row.date_time as string;
    return {
      id: row.id,
      patientName: row.patient_name ?? "",
      phone: row.phone ?? "",
      service: row.service ?? "",
      doctor: row.doctor ?? "",
      start: startIso,
      end: startIso,
      status: mapDbStatusToAppointmentStatus(row.status),
      notes: row.notes ?? undefined,
    };
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appointments");
        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            setAllAppointments(body.data.map(mapFromDb));
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load list:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useAppointmentsRealtime((event) => {
    setAllAppointments((prev) => {
      if (event.type === "INSERT") {
        return [...prev, mapFromDb(event.record)];
      }

      if (event.type === "UPDATE") {
        return prev.map((a) =>
          a.id === event.record.id ? mapFromDb(event.record) : a,
        );
      }

      if (event.type === "DELETE") {
        const idToRemove = event.oldRecord?.id ?? event.record?.id;
        if (!idToRemove) return prev;
        return prev.filter((a) => a.id !== idToRemove);
      }

      return prev;
    });
  });

  const data = useMemo(() => {
    const now = new Date();
    const { start, end } = getTodayRange(now);

    let list = allAppointments
      .slice()
      .sort((a, b) => (a.start > b.start ? 1 : -1));

    if (filter === "Today") {
      list = list.filter((a) => {
        const t = new Date(a.start);
        return t.getTime() >= start.getTime() && t.getTime() <= end.getTime();
      });
    } else if (filter === "Upcoming") {
      list = list.filter((a) => new Date(a.start).getTime() > now.getTime());
    } else if (filter === "No Shows") {
      list = list.filter((a) => a.status === "No-show");
    }

    if (dq.trim()) {
      const query = dq.trim().toLowerCase();
      list = list.filter((a) => {
        return (
          a.patientName.toLowerCase().includes(query) ||
          a.phone.toLowerCase().includes(query)
        );
      });
    }

    // For "All", still bias today to top for a nicer UX.
    if (filter === "All") {
      const today = list.filter((a) => isSameDay(new Date(a.start), now));
      const rest = list.filter((a) => !isSameDay(new Date(a.start), now));
      return [...today, ...rest];
    }

    return list;
  }, [allAppointments, dq, filter]);

  const pageSize = 5;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [dq, filter]);

  const paged = useMemo(
    () => data.slice(page * pageSize, page * pageSize + pageSize),
    [data, page],
  );

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    // Optimistic local update
    setAllAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );

    // Persist to backend
    try {
      await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Opt-out logic omitted; realtime will reconcile if needed.
    }
  }

  async function handleUpdateAppointment(updated: Appointment) {
    setAllAppointments((prev) => 
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    // Optimistic local update
    setAllAppointments((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete appointment on server.");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Delete failed:", err);
      // Realtime or next refresh will bring it back if it truly failed.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold tracking-tight text-slate-900">
            Appointment List
          </div>
          <div className="mt-1 text-xs text-slate-600">
            TanStack Table · mock data · fast filters
          </div>
        </div>
        <NewBookingButton label="New" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search patient, phone, service, doctor…"
        />

        <div className="flex items-center gap-2 overflow-x-auto">
          {filters.map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 0.95 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-xs font-medium border shadow-xl",
                f === filter
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white/20 text-slate-700 border-white/30 hover:bg-white/25",
              )}
            >
              {f}
            </motion.button>
          ))}
        </div>
      </div>

      <GlassCard className="p-6">
        {data.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">
            No patients found
          </div>
        ) : (
          <AppointmentTable
            data={paged}
            allData={allAppointments}
            query={dq}
            onStatusChange={handleStatusChange}
            onUpdateAppointment={handleUpdateAppointment}
            onDelete={handleDelete}
          />
        )}
        {data.length > pageSize && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing{" "}
              <span className="font-medium">
                {page * pageSize + 1}-
                {Math.min((page + 1) * pageSize, data.length)}
              </span>{" "}
              of <span className="font-medium">{data.length}</span> appointments
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={cn(
                  "rounded-full px-3 py-1.5 border text-[11px] font-medium",
                  page === 0
                    ? "border-white/20 text-slate-400 cursor-not-allowed"
                    : "border-white/30 text-slate-800 bg-white/20 hover:bg-white/30",
                )}
              >
                Previous
              </button>
              <span className="text-[11px]">
                Page{" "}
                <span className="font-semibold">
                  {page + 1}/{totalPages}
                </span>
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() =>
                  setPage((p) => (p < totalPages - 1 ? p + 1 : p))
                }
                className={cn(
                  "rounded-full px-3 py-1.5 border text-[11px] font-medium",
                  page >= totalPages - 1
                    ? "border-white/20 text-slate-400 cursor-not-allowed"
                    : "border-white/30 text-slate-800 bg-white/20 hover:bg-white/30",
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

