"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { VerticalTimeline } from "@/components/VerticalTimeline";
import {
  Appointment,
  clinic,
  formatDateLong,
  getTodayRange,
} from "@/lib/mock";
import { Plus } from "lucide-react";
import { DashboardSearch } from "@/app/DashboardSearch";
import { NewBookingButton } from "@/components/NewBookingButton";
import { BookingModalProvider } from "@/components/BookingModalProvider";
import { mapDbStatusToAppointmentStatus } from "@/lib/mock";
import { useAppointmentsRealtime } from "@/lib/hooks";
import { UpcomingRemindersWidget } from "@/components/UpcomingRemindersWidget";

export default function Home() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [clinicName, setClinicName] = useState("Northstar Clinic");
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
      reminderSent: !!row.reminder_sent,
    };
  };

  useEffect(() => {
    async function load() {
      try {
        const [apptsRes, settingsRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/settings")
        ]);

        if (apptsRes.ok) {
          const body = await apptsRes.json();
          if (body.success) {
            setAllAppointments(body.data.map(mapFromDb));
          }
        }

        if (settingsRes.ok) {
          const body = await settingsRes.json();
          if (body.success && body.data) {
            // If the user hasn't set a name yet, keep default
            if (body.data.name) setClinicName(body.data.name);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load dashboard data:", err);
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
 
  const today = new Date();
  const { start, end } = getTodayRange(today);

  const todays = useMemo(
    () =>
      allAppointments.filter((a) => {
        const t = new Date(a.start).getTime();
        return t >= start.getTime() && t <= end.getTime();
      }),
    [allAppointments, start, end],
  );

  const served = todays.filter((a) => a.status === "Served").length;
  const noShows = todays.filter((a) => a.status === "No-show").length;

  const timeLabels = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
  ];

  const slots = timeLabels.map((label, index) => {
    // Find appointment for this hour
    const [hStr, ampm] = label.split(" ");
    let h = parseInt(hStr);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const apt = todays.find((a) => {
      const d = new Date(a.start);
      return d.getHours() === h;
    });

    return {
      timeLabel: label,
      appointment: apt,
    };
  });

  return (
    <PageContainer>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center px-1 py-0.5 rounded bg-blue-50 text-[10px] font-black tracking-widest text-[#266DF0] uppercase">
            {clinicName}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#1D1E20]">
            Dashboard
          </h1>
          <div className="text-sm font-bold text-slate-400">
            {formatDateLong(today)}
          </div>
        </div>
        <NewBookingButton label="New Booking" />
      </header>

      <section className="grid grid-cols-1 gap-8 sm:grid-cols-3 items-stretch">
        <StatCard label="Today's Appointments" value={loading ? "..." : todays.length} tone="blue" />
        <StatCard
          label="Served"
          value={loading ? "..." : served}
          tone="purple"
          hint="Completed today"
        />
        <StatCard 
          label="No Shows" 
          value={loading ? "..." : todays.filter((a) => a.status === "No-show").length} 
          tone="red" 
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VerticalTimeline appointments={todays} onDelete={handleDelete} />
        </div>
        <div className="lg:col-span-1">
          <UpcomingRemindersWidget />
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          <div className="text-sm font-bold tracking-tight text-[#1D1E20]">
            Find patient
          </div>
        </div>
        <DashboardSearch appointments={allAppointments} onDelete={handleDelete} />
      </section>
    </PageContainer>
  );
}
