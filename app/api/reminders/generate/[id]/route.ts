import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = getSupabaseClient();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("patient_name, doctor, date_time")
      .eq("id", id)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found." },
        { status: 404 }
      );
    }

    const date = new Date(appointment.date_time);
    const timeStr = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    const message = `Hello ${appointment.patient_name},

Reminder: You have an appointment with ${appointment.doctor} at ${timeStr} today.

Please arrive 10 minutes early.

Clinic Phone: +251945398634`;

    return NextResponse.json({
      success: true,
      data: {
        message,
        phone: appointment.phone
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
