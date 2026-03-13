import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

type AppointmentUpdate = {
  patient_name?: string;
  phone?: string;
  service?: string | null;
  doctor?: string | null;
  date_time?: string; // ISO string
  status?: string;
  notes?: string | null;
  reminder_sent?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing appointment id" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as AppointmentUpdate;

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided for update" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("appointments")
      .update(body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing appointment id" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: null },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

