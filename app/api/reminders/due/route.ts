import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // Appointments within the next 1 hour
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("reminder_sent", false)
      .gte("date_time", now.toISOString())
      .lte("date_time", oneHourLater.toISOString())
      .order("date_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? []
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
