import { NextResponse } from "next/server";
import { MOVIES } from "@/src/vault/oscars2026/movies";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const OMDB_KEY = process.env.OMDB_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 7 días
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheRow = { movie_id: string; imdb_rating: string | null; updated_at: string };

async function omdb(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return json;
}

function normRating(v: any) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return String(v);
}

function isFresh(updatedAt: string | null | undefined) {
  if (!updatedAt) return false;
  const t = new Date(updatedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < TTL_MS;
}

function omdbErrorKind(json: any): "rate_limited" | "invalid_key" | "other" | null {
  const err = String(json?.Error ?? json?.error ?? "").toLowerCase();
  if (!err) return null;
  if (err.includes("limit reached") || err.includes("daily request limit")) return "rate_limited";
  if (err.includes("invalid api key") || err.includes("invalid key") || err.includes("apikey")) return "invalid_key";
  return "other";
}

async function getRatingForMovie(m: any): Promise<
  { ok: true; rating: string | null } |
  { ok: false; reason: "not_found" | "rate_limited" | "invalid_key" | "omdb_error" }
> {
  // 1) si tenemos imdbId, mejor
  if (m.imdbId) {
    const detail = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${m.imdbId}`);
    const kind = omdbErrorKind(detail);
    if (kind === "rate_limited") return { ok: false, reason: "rate_limited" };
    if (kind === "invalid_key") return { ok: false, reason: "invalid_key" };
    if (detail?.Response === "False") return { ok: false, reason: "omdb_error" };
    return { ok: true, rating: normRating(detail?.imdbRating ?? null) };
  }

  // 2) título exacto
  const t = encodeURIComponent(m.title);
  const detailByTitle = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${t}&type=movie`);
  {
    const kind = omdbErrorKind(detailByTitle);
    if (kind === "rate_limited") return { ok: false, reason: "rate_limited" };
    if (kind === "invalid_key") return { ok: false, reason: "invalid_key" };
  }
  if (detailByTitle?.Response === "True") {
    return { ok: true, rating: normRating(detailByTitle?.imdbRating ?? null) };
  }

  // 3) búsqueda amplia + primer resultado
  const search = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${t}&type=movie`);
  {
    const kind = omdbErrorKind(search);
    if (kind === "rate_limited") return { ok: false, reason: "rate_limited" };
    if (kind === "invalid_key") return { ok: false, reason: "invalid_key" };
  }
  const first = Array.isArray(search?.Search) ? search.Search[0] : null;
  if (!first?.imdbID) return { ok: false, reason: "not_found" };

  const detail = await omdb(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${first.imdbID}`);
  {
    const kind = omdbErrorKind(detail);
    if (kind === "rate_limited") return { ok: false, reason: "rate_limited" };
    if (kind === "invalid_key") return { ok: false, reason: "invalid_key" };
  }
  if (detail?.Response === "False") return { ok: false, reason: "omdb_error" };
  return { ok: true, rating: normRating(detail?.imdbRating ?? null) };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh") === "1";

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ids = MOVIES.map((m) => m.id);

    const { data: cacheRows } = await supabase
      .from("imdb_cache")
      .select("movie_id, imdb_rating, updated_at")
      .in("movie_id", ids);

    const cacheMap = new Map<string, CacheRow>();
    for (const r of (cacheRows ?? []) as any[]) {
      if (r?.movie_id) cacheMap.set(r.movie_id, r as CacheRow);
    }

    const out: Record<string, any> = {};
    const toFetch: any[] = [];

    for (const m of MOVIES as any[]) {
      const cached = cacheMap.get(m.id);
      if (!refresh && cached && isFresh(cached.updated_at)) {
        out[m.id] = { ok: true, imdbRating: normRating(cached.imdb_rating) };
      } else {
        toFetch.push(m);
      }
    }

    for (const m of toFetch) {
      const result = await getRatingForMovie(m);

      if (result.ok) {
        out[m.id] = { ok: true, imdbRating: result.rating };

        await supabase
          .from("imdb_cache")
          .upsert(
            { movie_id: m.id, imdb_rating: result.rating, updated_at: new Date().toISOString() },
            { onConflict: "movie_id" }
          );

        continue;
      }

      // Si OMDb está rate-limited o key inválida, NO tocamos la cache (evita envenenar 7 días)
      if (result.reason === "rate_limited" || result.reason === "invalid_key") {
        out[m.id] = { ok: false, reason: result.reason };
        continue;
      }

      // Para "not_found" u otros errores, sí cacheamos null (para no repetir búsquedas inútiles)
      out[m.id] = { ok: false, reason: result.reason };

      await supabase
        .from("imdb_cache")
        .upsert(
          { movie_id: m.id, imdb_rating: null, updated_at: new Date().toISOString() },
          { onConflict: "movie_id" }
        );
    }

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: "imdb_movies_failed", message: e?.message ?? "unknown" }, { status: 500 });
  }
}
