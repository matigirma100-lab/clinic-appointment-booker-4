import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  return NextResponse.json({
    now: now.toISOString(),
    localString: now.toString(),
    getDate: now.getDate(),
    timezoneOffset: now.getTimezoneOffset(),
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    }
  });
}
