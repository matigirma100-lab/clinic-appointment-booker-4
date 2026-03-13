import { NextResponse } from "next/server";
import { getReportsSummary } from "@/lib/supabase/reports";

export async function GET() {
  try {
    const summary = await getReportsSummary();

    return NextResponse.json(
      {
        success: true,
        data: summary,
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

