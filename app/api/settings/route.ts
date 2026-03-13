import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("clinic_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: data },
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    // We assume a singleton pattern or use the first record found if no ID is provided
    const { data: current } = await supabase.from("clinic_settings").select("id").maybeSingle();
    
    let result;
    if (current?.id) {
      result = await supabase
        .from("clinic_settings")
        .update({
          doctors: body.doctors,
          services: body.services,
          daily_start: body.daily_start,
          daily_end: body.daily_end,
          slot_duration: body.slot_duration,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .select("*")
        .single();
    } else {
      // In case the seed didn't run or table is empty
      result = await supabase
        .from("clinic_settings")
        .insert({
          doctors: body.doctors || [],
          services: body.services || [],
          daily_start: body.daily_start || "08:00",
          daily_end: body.daily_end || "18:00",
          slot_duration: body.slot_duration || 15,
        })
        .select("*")
        .single();
    }

    const { data, error } = result;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: data },
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
