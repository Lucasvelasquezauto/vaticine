import { NextResponse } from "next/server";
import { MOVIES } from "@/src/vault/oscars2026/movies";

export const runtime = "nodejs";

const OMDB_KEY = process.env.OMDB_API_KEY!;

async function omdb(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return json;
}

function normRating(v: any) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  // OMDb a veces devuelve "N/A": lo mostramos tal cual (mejor que "—")
  return v;
}

export async function GET() {
  try {
    const out: Record<string, any> = {};

    for (const m of MOVIES) {
      // 1) si tenemos IMDb ID, usamos eso (mejor calidad)
      if (m.imdbId) {
        const detail = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${m.imdbId}`);
        out[m.id] = { ok: true, imdbRating: normRating(detail?.imdbRating ?? null) };
        continue;
      }

      // 2) intento exacto por título (t=)
      const t = encodeURIComponent(m.title);
      const detailByTitle = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${t}&type=movie`);
      if (detailByTitle?.Response === "True") {
        out[m.id] = { ok: true, imdbRating: normRating(detailByTitle?.imdbRating ?? null) };
        continue;
      }

      // 3) fallback: búsqueda amplia (s=) + primer resultado
      const search = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${t}&type=movie`);
      const first = Array.isArray(search?.Search) ? search.Search[0] : null;

      if (!first?.imdbID) {
        out[m.id] = { ok: false, reason: "not_found" };
        continue;
      }

      const detail = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${first.imdbID}`);
      out[m.id] = { ok: true, imdbRating: normRating(detail?.imdbRating ?? null) };
    }

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: "imdb_movies_failed", message: e?.message ?? "unknown" }, { status: 500 });
  }
}
