import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TMDB_TOKEN = process.env.TMDB_TOKEN!;

// Si ya existe y es "reciente", no reconsulta TMDB.
// (Puedes cambiarlo luego; por ahora 14 días está bien.)
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

function tmdbHeaders() {
  return {
    Authorization: `Bearer ${TMDB_TOKEN}`,
    "Content-Type": "application/json;charset=utf-8",
  };
}

async function tmdbFetch(url: string) {
  const res = await fetch(url, { headers: tmdbHeaders(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status}: ${text}`);
  }
  return res.json();
}

function needsRefresh(row: any | null) {
  if (!row) return true;
  const missing = !row.poster_url || !row.trailer_url;
  return missing;
}export async function GET() {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json(
        { error: "missing_env", message: "Supabase server env missing" },
        { status: 500 }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // 1) Leer cache desde Supabase
    const ids = BEST_PICTURE.map((x) => x.id);
    const { data: existing, error: readErr } = await admin
      .from("movie_media")
      .select("id,title,poster_url,trailer_url,tmdb_id,updated_at")
      .in("id", ids);

    if (readErr) {
      return NextResponse.json(
        { error: "supabase_read_failed", message: readErr.message },
        { status: 500 }
      );
    }

    const byId = new Map<string, any>();
    for (const r of existing ?? []) byId.set(r.id, r);

    // 2) Ver qué falta o está viejo → consultar TMDB SOLO para esos
    const toUpdate: Array<{ id: string; title: string }> = [];
    for (const it of BEST_PICTURE) {
      const row = byId.get(it.id) ?? null;
      if (needsRefresh(row)) toUpdate.push(it);
    }

    for (const it of toUpdate) {
      const q = encodeURIComponent(it.title);
      const search = await tmdbFetch(
        `https://api.themoviedb.org/3/search/movie?query=${q}&include_adult=false&language=es-CO`
      );

      const first = search?.results?.[0];
      if (!first) {
        // guardamos al menos el título para que no quede "vacío"
        await admin.from("movie_media").upsert(
          {
            id: it.id,
            title: it.title,
            poster_url: null,
            trailer_url: null,
            tmdb_id: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        continue;
      }

      const tmdbId = first.id as number;
      const posterPath = (first.poster_path as string | null) ?? null;
      const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : null;

      const videos = await tmdbFetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}/videos?language=es-CO`
      );
      const list = Array.isArray(videos?.results) ? videos.results : [];

      const trailer =
        list.find((v: any) => v.site === "YouTube" && v.type === "Trailer" && v.official === true) ||
        list.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ||
        list.find((v: any) => v.site === "YouTube");

      const trailerUrl = trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

      await admin.from("movie_media").upsert(
        {
          id: it.id,
          title: it.title,
          poster_url: posterUrl,
          trailer_url: trailerUrl,
          tmdb_id: tmdbId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    // 3) Volver a leer (ya actualizado) y devolver en el formato que tu UI ya usa
    const { data: finalRows, error: read2Err } = await admin
      .from("movie_media")
      .select("id,title,poster_url,trailer_url,tmdb_id,updated_at")
      .in("id", ids);

    if (read2Err) {
      return NextResponse.json(
        { error: "supabase_read_failed", message: read2Err.message },
        { status: 500 }
      );
    }

    const out: Record<string, any> = {};
    for (const it of BEST_PICTURE) {
      const r = (finalRows ?? []).find((x: any) => x.id === it.id) ?? null;
      out[it.id] = r
        ? {
            ok: true,
            tmdbId: r.tmdb_id ?? null,
            posterUrl: r.poster_url ?? null,
            trailerUrl: r.trailer_url ?? null,
          }
        : { ok: false, reason: "missing_in_db" };
    }

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: "best_picture_failed", message: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}

