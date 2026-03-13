"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import type {
  TopServicePoint,
  WeeklyBookingsPoint,
} from "@/lib/supabase/reports";

function TooltipCard({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl px-3 py-2 text-xs text-slate-800">
      <div className="font-medium">{label}</div>
      <div className="mt-1 text-slate-700">{payload[0]?.value}</div>
    </div>
  );
}

export function ReportsClient() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsToday, setBookingsToday] = useState(0);
  const [servedToday, setServedToday] = useState(0);
  const [noShowToday, setNoShowToday] = useState(0);
  const [weeklyBookings, setWeeklyBookings] = useState<WeeklyBookingsPoint[]>(
    [],
  );
  const [topServices, setTopServices] = useState<TopServicePoint[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/reports/summary");
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Failed to load analytics.");
        }

        const body = (await res.json()) as {
          data?: {
            bookingsToday: number;
            servedToday: number;
            noShowToday: number;
            weeklyBookings: WeeklyBookingsPoint[];
            topServices: TopServicePoint[];
          };
        };

        if (!isMounted || !body.data) return;
        setBookingsToday(body.data.bookingsToday);
        setServedToday(body.data.servedToday);
        setNoShowToday(body.data.noShowToday);
        setWeeklyBookings(body.data.weeklyBookings);
        setTopServices(body.data.topServices);
      } catch (err) {
        if (!isMounted) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load analytics.";
        setError(msg);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const weeklyTotal = weeklyBookings.reduce(
    (acc, d) => acc + d.bookings,
    0,
  );
  const noShowRate =
    weeklyTotal > 0 ? ((noShowToday / weeklyTotal) * 100).toFixed(1) : "0.0";
  const top = topServices[0]?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold tracking-tight text-slate-900">
          Reports
        </div>
        <div className="mt-1 text-xs text-slate-600">
          Recharts · Supabase-backed analytics
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Bookings today"
          value={loading ? "…" : bookingsToday}
          tone="blue"
        />
        <StatCard
          label="Served today"
          value={loading ? "…" : servedToday}
          tone="purple"
          hint="Completed today"
        />
        <StatCard
          label="No-show rate (week)"
          value={loading ? "…" : `${noShowRate}%`}
          tone="red"
          hint="Share of no-shows this week"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">
                Weekly bookings
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Bar chart · last 7 days
              </div>
            </div>
          </div>
          <div className="mt-5 h-56">
            {mounted && !loading && !error ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBookings}>
                  <CartesianGrid stroke="rgba(255,255,255,0.25)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#334155", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
                  <Tooltip content={<TooltipCard />} />
                  <Bar
                    dataKey="bookings"
                    fill="rgba(59, 130, 246, 0.7)"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl bg-white/15 border border-white/20 animate-pulse" />
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">
                Top services
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Based on last 7 days of bookings
              </div>
            </div>
          </div>
          <div className="mt-5 h-56">
            {mounted && !loading && !error ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {topServices.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl p-4"
                  >
                    <div className="text-xs font-medium text-slate-700/80">
                      {s.name}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full rounded-2xl bg-white/15 border border-white/20 animate-pulse" />
            )}
          </div>
        </GlassCard>
      </section>

      {error && (
        <div className="text-xs text-red-600">
          Failed to load analytics: {error}
        </div>
      )}
    </div>
  );
}

