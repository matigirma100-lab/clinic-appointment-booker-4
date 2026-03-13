"use client";

import { useEffect, useMemo, useState } from "react";
import { Appointment } from "@/lib/mock";
import { DoctorTimeline } from "@/components/DoctorTimeline";
import { mapDbStatusToAppointmentStatus } from "@/lib/mock";
import { useAppointmentsRealtime } from "@/lib/hooks";

export function DoctorScheduleClient({ doctor }: { doctor: string }) {
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
        const res = await fetch(`/api/appointments?doctor=${encodeURIComponent(doctor)}`);
        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            setAllAppointments(body.data.map(mapFromDb));
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load doctor schedule:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctor]);

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

  const doctorAppointments = useMemo(
    () => allAppointments.filter((a) => a.doctor === doctor),
    [allAppointments, doctor],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold tracking-tight text-slate-900">
          {doctor}
        </div>
        <div className="mt-1 text-xs text-slate-600">Schedule · 8AM → 6PM</div>
      </div>

      <DoctorTimeline doctor={doctor} appointments={doctorAppointments} />
    </div>
  );
}

