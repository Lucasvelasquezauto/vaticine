import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OMDB_KEY = process.env.OMDB_API_KEY!;

/**
 * Nota: OMDb exige un IMDb ID (tt....).
 * Para evitar consultas raras, guardamos el imdb_id en Supabase (movie_media.imdb_id).
 * Si no existe, por ahora hacemos búsqueda por título y tomamos el primer resultado.
 * Luego, en el siguiente paso, fijamos imdb_id 100% correcto por cada peli.
 */

type Item = { id: string; title: string };

const BEST_PICTURE: Item[] = [
  { id: "bugonia", title: "Bugonia" },
  { id: "f1", title: "F1" },
  { id: "frankenstein", title: "Frankenstein" },
  { id: "hamnet", title: "Hamnet" },
  { id: "marty_supreme", title: "Marty Supreme" },
  { id: "one_battle_after_another", title: "One Battle after Another" },
  { id: "the_secret_agent", title: "The Secret Agent" },
  { id: "sentimental_value", title: "Sentimental Value" },
  { id: "sinners", title: "Sinners" },
  { id: "train_dreams", title: "Train Dreams" },
];

async function omdb(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function GET() {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Leemos movie_media para intentar reutilizar imdb_id (si en el futuro lo guardamos)
    const ids = BEST_PICTURE.map((x) => x.id);
    const { data: rows, error } = await admin
      .from("movie_media")
      .select("id,title,updated_at")  // por ahora solo esto
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: "supabase_read_failed", message: error.message }, { status: 500 });
    }

    const out: Record<string, any> = {};

    for (const it of BEST_PICTURE) {
      // 1) Buscar por título en OMDb
      const q = encodeURIComponent(it.title);
      const { json: search } = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${q}&type=movie`);

      const first = Array.isArray(search?.Search) ? search.Search[0] : null;
      if (!first?.imdbID) {
        out[it.id] = { ok: false, reason: "not_found" };
        continue;
      }

      // 2) Traer detalle por imdbID
      const imdbID = first.imdbID as string;
      const { json: detail } = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbID}`);

      const rating = detail?.imdbRating ?? null;
      out[it.id] = { ok: true, imdbRating: rating };
    }

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: "imdb_failed", message: e?.message ?? "unknown" }, { status: 500 });
  }
}
