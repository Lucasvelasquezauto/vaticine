﻿import { CATEGORIES } from "../../../vault/oscars2026/categories";
import { MOVIES } from "../../../vault/oscars2026/movies";

export type VotesRow = {
  category_id: string;
  win: string | null;
  second: string | null;
  fav: string | null;
};

export type SeenRow = {
  movie_id: string;
};

function movieTitleFromId(
  movieId: string | null | undefined,
  movieById: Map<string, { title: string; titleCo?: string | null }>
) {
  if (!movieId) return "";
  const m = movieById.get(movieId);
  if (!m) return "";
  const t = m.titleCo && m.titleCo.trim() ? m.titleCo.trim() : m.title;
  return t || "";
}

function isSameLoose(a: string, b: string) {
  const na = (a ?? "").trim().toLocaleLowerCase("es");
  const nb = (b ?? "").trim().toLocaleLowerCase("es");
  return na && nb && na === nb;
}

function abbreviateOnePerson(fullName: string): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return raw;

  // No tocar si parece un título raro (muy corto o sin espacios)
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return raw;

  const suffixes = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);
  const last = parts[parts.length - 1].toLowerCase();
  const hasSuffix = suffixes.has(last);

  const lastName = hasSuffix ? parts[parts.length - 2] : parts[parts.length - 1];
  const firstName = parts[0];

  const suffix = hasSuffix ? " " + parts[parts.length - 1] : "";
  return `${firstName[0]}. ${lastName}${suffix}`;
}

function abbreviatePeopleList(s: string): string {
  const txt = (s ?? "").trim();
  if (!txt) return txt;

  // Separadores típicos en créditos
  // Primero por "&", luego por "," y ";"
  const splitKeep = (input: string, delim: string) => input.split(delim).map((x) => x.trim()).filter(Boolean);

  // Manejar "&" como separador principal si existe
  if (txt.includes("&")) {
    return splitKeep(txt, "&").map(abbreviatePeopleList).join(" & ");
  }

  const delim = txt.includes(";") ? ";" : (txt.includes(",") ? "," : "");
  if (!delim) return abbreviateOnePerson(txt);

  return splitKeep(txt, delim).map((p) => abbreviateOnePerson(p)).join(delim + " ");
}

export function buildPdfData(opts: {
  userName: string;
  printDate: string;

  // Compatibilidad: forma nueva
  votesRows?: VotesRow[];
  seenRows?: SeenRow[];

  // Compatibilidad: forma antigua (route.ts actual)
  votes?: VotesRow[];
  seen?: SeenRow[];
}) {
  const votes = (opts.votesRows ?? opts.votes ?? []) as VotesRow[];
  const seen = (opts.seenRows ?? opts.seen ?? []) as SeenRow[];

  const { userName, printDate } = opts;

  const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));
  const movieById = new Map(MOVIES.map((m) => [m.id, m]));
  const seenSet = new Set(seen.map((s) => s.movie_id));

  // Categorías "movie-only"
  const movieOnlyCats = new Set<string>([
    "animated_feature",
    "animated_short",
    "casting",
    "costume_design",
    "documentary_feature",
    "documentary_short",
    "film_editing",
    "international_feature",
    "live_action_short",
    "makeup_hairstyling",
    "production_design",
    "score_original",
    "song_original",
    "sound",
    "visual_effects",
  ]);

  const categoriesOut: Record<string, { win?: string; runner_up?: string; fav?: string }> = {};

  const formatPick = (catId: string, nom: any, isMovieOnly: boolean) => {
    if (!nom) return "";

    const movieTitle = movieTitleFromId(nom.movieId, movieById);

    // 1) Movie-only: siempre título de película completo
    if (isMovieOnly) return movieTitle || nom.title || "";

    // 2) Mejor Película: NO imprimir subtítulo ("Productores")
    if (catId === "best_picture") return nom.title || movieTitle || "";

    const title = (nom.title ?? "").trim();
    const subtitle = (nom.subtitle ?? "").trim();

    // Detectar si subtitle es la película (actuación): Persona — Película
    if (movieTitle && isSameLoose(subtitle, movieTitle) && !isSameLoose(title, movieTitle)) {
      const person = abbreviatePeopleList(title);
      return subtitle ? `${person} — ${movieTitle}` : person;
    }

    // Detectar si title es la película (dirección/escritura/etc): Película — Persona(s)
    if (movieTitle && isSameLoose(title, movieTitle)) {
      const people = subtitle ? abbreviatePeopleList(subtitle) : "";
      return people ? `${movieTitle} — ${people}` : movieTitle;
    }

    // Caso general:
    // - si hay movieId, aseguramos que la película salga completa cuando aplica como "title"
    // - si subtitle parece personas, lo abreviamos
    const right = subtitle ? abbreviatePeopleList(subtitle) : "";
    return right ? `${title} — ${right}` : title;
  };

  for (const v of votes) {
    const cat = categoryById.get(v.category_id);
    if (!cat) continue;

    const nomineeById = new Map((cat.nominees ?? []).map((n: any) => [n.id, n]));
    const isMovieOnly = movieOnlyCats.has(cat.id);

    const winNom = v.win ? nomineeById.get(v.win) : null;
    const secNom = v.second ? nomineeById.get(v.second) : null;
    const favNom = v.fav ? nomineeById.get(v.fav) : null;

    categoriesOut[cat.id] = {
      win: formatPick(cat.id, winNom, isMovieOnly),
      runner_up: formatPick(cat.id, secNom, isMovieOnly),
      fav: formatPick(cat.id, favNom, isMovieOnly),
    };
  }

  // Filtrar cortometrajes SOLO en listas "Vistas / Por ver"
  const shortCategoryIds = new Set(["animated_short", "documentary_short", "live_action_short"]);
  const shortMovieIds = new Set(
    CATEGORIES.filter((c) => shortCategoryIds.has(c.id))
      .flatMap((c) => c.nominees ?? [])
      .map((n: any) => n?.movieId)
      .filter((id: any) => typeof id === "string" && id.length > 0)
  );

  const allMovieTitles = MOVIES.filter((m) => !shortMovieIds.has(m.id)).map((m) => ({
    id: m.id,
    title: m.titleCo && m.titleCo.trim() ? m.titleCo.trim() : m.title,
  }));

  const seenMovies = allMovieTitles.filter((m) => seenSet.has(m.id)).map((m) => m.title);
  const toWatchMovies = allMovieTitles.filter((m) => !seenSet.has(m.id)).map((m) => m.title);

  return {
    user_name: userName,
    print_date: printDate,
    categories: categoriesOut,
    seen_movies: seenMovies,
    to_watch_movies: toWatchMovies,
  };
}
