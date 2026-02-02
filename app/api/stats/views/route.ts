import { NextResponse } from "next/server";
import { createClient } from "../../../../src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("stats_views");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
