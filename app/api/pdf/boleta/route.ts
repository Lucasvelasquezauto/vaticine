import { NextResponse } from "next/server";
import { createClient } from "../../../../src/lib/supabase/server";
import { buildPdfData } from "../../../../src/pdf/vaticine/v4/data";
import { renderVatiCinePdfV4 } from "../../../../src/pdf/vaticine/v4/render";

function todayBogotaYYYYMMDD() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

export async function GET() {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData.user ?? null;

  if (userErr || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [{ data: votesRows, error: vErr }, { data: seenRows, error: sErr }] = await Promise.all([
    supabase
      .from("votes")
      .select("category_id, win, second, fav")
      .eq("user_id", user.id),
    supabase
      .from("seen_movies")
      .select("movie_id")
      .eq("user_id", user.id)
      .eq("seen", true),
  ]);

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const pdfData = buildPdfData({
    userName: (user.user_metadata?.name as string) || (user.email ?? "Usuario"),
    printDate: todayBogotaYYYYMMDD(),
    votes: (votesRows as any) ?? [],
    seen: (seenRows as any) ?? [],
  });

  const pdfBytes = await renderVatiCinePdfV4(pdfData);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="vatiCINE-boleta.pdf"',
      "Cache-Control": "no-store",
    },
  });
}

