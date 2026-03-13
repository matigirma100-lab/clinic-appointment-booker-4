import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

type AppointmentInsert = {
  patient_name: string;
  phone: string;
  service?: string | null;
  doctor?: string | null;
  date_time: string; // ISO string
  status?: string;
  notes?: string | null;
  reminder_sent?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<AppointmentInsert>;

    const missingFields: string[] = [];
    if (!body.patient_name) missingFields.push("patient_name");
    if (!body.phone) missingFields.push("phone");
    if (!body.date_time) missingFields.push("date_time");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required field(s): ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Basic booking conflict detection:
    // If a doctor is provided, prevent multiple appointments at the exact same time.
    if (body.doctor) {
      const { data: existing, error: conflictError } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor", body.doctor)
        .eq("date_time", body.date_time)
        .limit(1);

      if (conflictError) {
        return NextResponse.json(
          {
            success: false,
            error: "Unable to check for booking conflicts. Please try again.",
          },
          { status: 500 }
        );
      }

      if (existing && existing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "This time slot is already booked.",
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_name: body.patient_name,
        phone: body.phone,
        service: body.service ?? null,
        doctor: body.doctor ?? null,
        date_time: body.date_time,
        status: body.status ?? "booked",
        notes: body.notes ?? null,
        reminder_sent: body.reminder_sent ?? false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // expected format: YYYY-MM-DD
    const doctor = searchParams.get("doctor");
    const status = searchParams.get("status");

    const supabase = getSupabaseClient();
    let query = supabase.from("appointments").select("*");

    if (date) {
      const start = new Date(date);
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid date format; expected YYYY-MM-DD" },
          { status: 400 }
        );
      }
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      query = query
        .gte("date_time", start.toISOString())
        .lt("date_time", end.toISOString());
    }

    if (doctor) {
      query = query.eq("doctor", doctor);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("date_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

