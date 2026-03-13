"use client";

import { useEffect, useState } from "react";
import { fetchAppointments, type AppointmentRow } from "@/lib/supabase/appointments";

export default function AppointmentsTestPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchAppointments()
      .then((rows) => {
        if (!isMounted) return;
        setAppointments(rows);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message ?? "Unknown Supabase error");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading appointments from Supabase…</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-2 text-sm">
        <div className="font-semibold text-red-600">Supabase is NOT connected.</div>
        <div className="text-slate-700">Error: {error}</div>
        <div className="text-slate-500">
          Check your <code>.env.local</code> variables and ensure the <code>appointments</code> table exists.
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Supabase is connected, but no appointments were found in the <code>appointments</code> table.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 text-sm">
      <div className="font-semibold text-slate-900">
        Supabase is connected. Loaded {appointments.length} appointment(s).
      </div>

      <ul className="space-y-2">
        {appointments.map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-slate-200 bg-white/60 p-3 shadow-sm backdrop-blur"
          >
            <div className="font-medium text-slate-900">
              {a.patient_name} with {a.doctor_name}
            </div>
            <div className="text-xs text-slate-600">
              {new Date(a.start_time).toLocaleString()} –{" "}
              {new Date(a.end_time).toLocaleTimeString()}
            </div>
            <div className="mt-1 text-xs text-slate-500">Status: {a.status ?? "Unknown"}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

