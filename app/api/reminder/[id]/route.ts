import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

function buildReminderMessage(opts: {
  patientName: string;
  doctor: string;
  dateTimeIso: string;
}) {
  const date = new Date(opts.dateTimeIso);

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const dayLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return [
    `Hello ${opts.patientName},`,
    "",
    `Reminder: You have an appointment with ${opts.doctor} on ${dayLabel} at ${time}.`,
    "",
    "Please reply 1 to confirm.",
  ].join("\n");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing appointment id" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .select("patient_name, doctor, date_time")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not load appointment for reminder.",
        },
        { status: 404 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found.",
        },
        { status: 404 },
      );
    }

    const { patient_name, doctor, date_time } = data as {
      patient_name: string;
      doctor: string;
      date_time: string;
    };

    const message = buildReminderMessage({
      patientName: patient_name,
      doctor,
      dateTimeIso: date_time,
    });

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

