import { NextResponse } from "next/server";
import { createClient } from "../../../../src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");

    if (!categoryId) {
      return NextResponse.json({ error: "Falta category_id" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("stats_category", {
      p_category_id: categoryId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
