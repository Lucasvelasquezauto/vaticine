import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MOVIES } from "@/src/vault/oscars2026/movies";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TMDB_TOKEN = process.env.TMDB_TOKEN!;

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

function pickBestTrailer(list: any[]) {
  const ytTrailer = (v: any) => v.site === "YouTube" && v.type === "Trailer";
  const isEn = (v: any) => (v.iso_639_1 || "").toLowerCase() === "en";
  const official = (v: any) => v.official === true;

  return (
    list.find((v) => ytTrailer(v) && official(v) && isEn(v)) ||
    list.find((v) => ytTrailer(v) && official(v)) ||
    list.find((v) => ytTrailer(v) && isEn(v)) ||
    list.find((v) => ytTrailer(v)) ||
    null
  );
}

// Cache "para siempre": solo rellena si falta poster o trailer.
// Con ?refresh=1 forzamos recachear.
function needsFill(row: any | null, force: boolean) {
  if (force) return true;
  if (!row) return true;
  return !row.poster_url || !row.trailer_url;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("refresh") === "1";
    const onlyId = url.searchParams.get("id"); // opcional: id=f1 para refrescar solo esa

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const list = onlyId ? MOVIES.filter((m) => m.id === onlyId) : MOVIES;
    const ids = list.map((m) => m.id);

    const { data: existing, error: readErr } = await admin
      .from("movie_media")
      .select("id,poster_url,trailer_url,tmdb_id,updated_at")
      .in("id", ids);

    if (readErr) {
      return NextResponse.json({ error: "supabase_read_failed", message: readErr.message }, { status: 500 });
    }

    const byId = new Map<string, any>();
    for (const r of existing ?? []) byId.set(r.id, r);

    for (const m of list) {
      const row = byId.get(m.id) ?? null;
      if (!needsFill(row, force)) continue;

      // 1) Determinar TMDB id
      let tmdbId: number | null = m.tmdbId ?? null;

      if (!tmdbId) {
        const q = encodeURIComponent(m.title);
        const search = await tmdbFetch(
          `https://api.themoviedb.org/3/search/movie?query=${q}&include_adult=false&language=en-US`
        );
        const first = search?.results?.[0];
        tmdbId = first?.id ?? null;
      }

      if (!tmdbId) {
        await admin.from("movie_media").upsert(
          { id: m.id, title: m.title, poster_url: null, trailer_url: null, tmdb_id: null, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
        continue;
      }

      // 2) Detalle de película (para poster confiable)
      const detail = await tmdbFetch(`https://api.themoviedb.org/3/movie/${tmdbId}?language=en-US`);
      const posterPath = (detail?.poster_path as string | null) ?? null;
      const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : null;

      // 3) Videos (en inglés)
      const videos = await tmdbFetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?language=en-US`);
      const vlist = Array.isArray(videos?.results) ? videos.results : [];
      const trailer = pickBestTrailer(vlist);

      const trailerUrl = trailer?.key
        ? `https://www.youtube.com/watch?v=${trailer.key}&cc_load_policy=1&cc_lang_pref=en&hl=en`
        : null;

      await admin.from("movie_media").upsert(
        { id: m.id, title: m.title, poster_url: posterUrl, trailer_url: trailerUrl, tmdb_id: tmdbId, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    }

    const { data: finalRows, error: read2Err } = await admin
      .from("movie_media")
      .select("id,poster_url,trailer_url,tmdb_id,updated_at")
      .in("id", ids);

    if (read2Err) {
      return NextResponse.json({ error: "supabase_read_failed", message: read2Err.message }, { status: 500 });
    }

    const out: Record<string, any> = {};
    for (const m of list) {
      const r = (finalRows ?? []).find((x: any) => x.id === m.id) ?? null;
      out[m.id] = r
        ? { ok: true, tmdbId: r.tmdb_id ?? null, posterUrl: r.poster_url ?? null, trailerUrl: r.trailer_url ?? null }
        : { ok: false, reason: "missing_in_db" };
    }

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: "tmdb_movies_failed", message: e?.message ?? "unknown" }, { status: 500 });
  }
}
