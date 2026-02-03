"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../src/lib/supabase/client";
import { CATEGORIES } from "../../src/vault/oscars2026/categories";
import { MOVIES } from "../../src/vault/oscars2026/movies";
import { ROTTEN_BY_TITLE } from "../../src/vault/oscars2026/rotten.manual";
import BrandLogo from "../../src/components/brand/BrandLogo";
import type { Category, Nominee } from "../../src/vault/oscars2026/categories";


import { InstructionsList } from "../../src/components/vaticine/InstructionsList";
type Pick = { win?: string; second?: string; fav?: string };
type PicksByCategory = Record<string, Pick>;
type SeenByMovie = Record<string, boolean>;

type Media = {
  ok: boolean;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  tmdbId?: number | null;
};

function normalizeTitle(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8.5 7.7v8.6c0 1 .9 1.6 1.8 1.1l7.3-4.3c.9-.5.9-1.7 0-2.2l-7.3-4.3c-.9-.5-1.8.1-1.8 1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function BallotPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="text-white/70">Cargando…</div>
        </main>
      }
    >
      <BallotInner />
    </Suspense>
  );
}

function BallotInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);


  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const rottenByMovieId = useMemo(() => {
    const byNormTitle = new Map<string, number | null>();
    for (const r of ROTTEN_BY_TITLE) byNormTitle.set(normalizeTitle(r.title), r.score);

    const out: Record<string, number | null> = {};
    for (const m of MOVIES) {
      const a = byNormTitle.get(normalizeTitle(m.title));
      const b = m.titleCo ? byNormTitle.get(normalizeTitle(m.titleCo)) : undefined;
      out[m.id] = (a !== undefined ? a : b !== undefined ? b : null) ?? null;
    }
    return out;
  }, []);

  // Mapa nomineeId -> movieId (para que "Ya la vi" sea global por película)
  const nomineeToMovieId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of CATEGORIES) {
      for (const n of c.nominees) {
        map[n.id] = (n as any).movieId ?? n.id;
      }
    }
    return map;
  }, []);

  const [status, setStatus] = useState<"checking" | "ok" | "guest">("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0]?.id ?? "");
  const [picks, setPicks] = useState<PicksByCategory>({});
  const [seenMovies, setSeenMovies] = useState<SeenByMovie>({});
  const [msg, setMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [seenDialog, setSeenDialog] = useState<{
    open: boolean;
    nomineeId: string | null;
    movieId: string | null;
  }>({
    open: false,
    nomineeId: null,
    movieId: null,
  });
  const [media, setMedia] = useState<Record<string, Media>>({});
  const [imdbMap, setImdbMap] = useState<Record<string, string | null>>({});

  const activeCategory: Category =
    CATEGORIES.find((c) => c.id === activeCategoryId) ?? CATEGORIES[0];

  // Cierre de votaciones: 15 de marzo 2026, 16:00 (Colombia, UTC-5)
  // Nota: esto bloquea cambios en UI. Puedes ver la boleta igual.
  const closesAt = new Date("2026-03-15T16:00:00-05:00");

  // Modo prueba (solo DEV): agrega ?closed=1 para forzar solo-lectura sin esperar la fecha real.
  const devForcedClosed =
    process.env.NODE_ENV !== "production" && searchParams.get("closed") === "1";

  const isClosed = devForcedClosed || Date.now() >= closesAt.getTime();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      if (cancelled) return;

      if (!user) {
        setStatus("guest");
        // modo invitado: no redirigir a /login
        return;
      }

      setEmail(user.email ?? null);
      setUserId(user.id);
      setStatus("ok");

      // Cargar votos + vistas globales (silencioso)
      const [{ data: voteRows }, { data: seenRows }] = await Promise.all([
        supabase
          .from("votes")
          .select("category_id, win, second, fav")
          .eq("user_id", user.id),
        supabase
          .from("seen_movies")
          .select("movie_id, seen")
          .eq("user_id", user.id),
      ]);

      if (cancelled) return;

      const next: PicksByCategory = {};
      for (const r of voteRows ?? []) {
        next[r.category_id] = {
          win: r.win ?? undefined,
          second: r.second ?? undefined,
          fav: r.fav ?? undefined,
        };
      }

      const seenNext: SeenByMovie = {};
      for (const r of seenRows ?? []) {
        if (r?.movie_id && r?.seen) seenNext[r.movie_id] = true;
      }

      setPicks(next);
      setSeenMovies(seenNext);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    // Media de películas (TMDB cacheado en Supabase)
    (async () => {
      try {
        const res = await fetch("/api/tmdb/movies");
        const json = await res.json();
        if (res.ok) setMedia(json);
      } catch { }
    })();

    // IMDb rating (OMDb)
    (async () => {
      try {
        const res = await fetch("/api/imdb/movies");
        const json = await res.json();
        if (!res.ok) return;

        const next: Record<string, string | null> = {};
        for (const k of Object.keys(json || {})) {
          next[k] = json[k]?.imdbRating ?? null;
        }
        setImdbMap(next);
      } catch { }
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
    // modo invitado: no redirigir a /login
  }

  async function setSeen(movieId: string, value: boolean) {
    setSavedMsg(null);
    setMsg(null);

    if (!userId) {
      setMsg("__LOGIN_TO_SAVE__");
      return;
    }

    // Optimista
    setSeenMovies((prev) => ({ ...prev, [movieId]: value }));

    if (!value) {
      // Si desmarca "ya la vi" de una película, quitamos "Favorita" en cualquier categoría donde esa película fuera la favorita
      setPicks((prev) => {
        const next = { ...prev };
        for (const catId of Object.keys(next)) {
          const favNominee = next[catId]?.fav;
          if (favNominee && nomineeToMovieId[favNominee] === movieId) {
            next[catId] = { ...next[catId], fav: undefined };
          }
        }
        return next;
      });
    }

    // Persistencia
    if (value) {
      const { error } = await supabase
        .from("seen_movies")
        .upsert(
          {
            user_id: userId,
            movie_id: movieId,
            seen: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,movie_id" }
        );

      if (error) setMsg("No pude guardar 'Ya la vi'. Intenta otra vez.");
      return;
    }

    const { error } = await supabase
      .from("seen_movies")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) setMsg("No pude actualizar 'Ya la vi'. Intenta otra vez.");
  }

  function updatePick(categoryId: string, patch: Partial<Pick>) {
    setMsg(null);
    setSavedMsg(null);

    setPicks((prev) => {
      const current = prev[categoryId] ?? {};
      const next: Pick = { ...current, ...patch };      // Si por alguna razón quedan iguales, resolvemos según el último click (sin mensaje)
      if (next.win && next.second && next.win === next.second) {
        if (patch.win) next.second = undefined;
        else if (patch.second) next.win = undefined;
        else next.second = undefined;
      }
      // Si elijo win y coincide con second, limpiamos second (y viceversa)
      if (patch.win && current.second === patch.win) next.second = undefined;
      if (patch.second && current.win === patch.second) next.win = undefined;

      return { ...prev, [categoryId]: next };
    });
  }

  function buttonStyle(active: boolean) {
    return clsx(
      "rounded-lg px-3 py-2 text-sm font-medium border",
      active
        ? "bg-white text-black border-white"
        : "bg-black/40 text-white border-white/15 hover:border-white/30"
    );
  }

  async function saveCurrentCategory() {
    setMsg(null);
    setSavedMsg(null);

    if (!userId) {
      setMsg("__LOGIN_TO_SAVE__");
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();
    const payload = CATEGORIES.map((c) => {
      const v = picks[c.id] ?? {};
      return {
        user_id: userId,
        category_id: c.id,
        win: v.win ?? null,
        second: v.second && v.second !== v.win ? v.second : null,
        fav: v.fav ?? null,
        updated_at: now,
      };
    });

    const { error } = await supabase
      .from("votes")
      .upsert(payload, { onConflict: "user_id,category_id" });

    setSaving(false);

    if (error) {
      setMsg("No pude guardar. Intenta otra vez.");
      return;
    }

    setSavedMsg("Guardado ✅");
  }

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-white/70">Cargando…</div>
      </main>
    );
  }

  const currentPick = picks[activeCategoryId] ?? {};

  return (
    <main className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-5xl">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold">vatiCINE</h1>
              <button
                type="button"
                className="group inline-flex h-11 w-11 items-center justify-center rounded-full
             border border-white/15
             bg-gradient-to-br from-sky-500/35 via-indigo-500/25 to-fuchsia-500/30
             shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_rgba(56,189,248,0.18)]
             hover:border-white/25 hover:from-sky-500/45 hover:via-indigo-500/35 hover:to-fuchsia-500/40
             hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_14px_40px_rgba(236,72,153,0.18)]
             active:scale-[0.98] transition"
                aria-label="Estadísticas"
                title="Estadísticas"
                onClick={() => router.push("/estadisticas")}
              >
                <span className="flex items-end gap-1" aria-hidden="true">
                  <span className="h-3.5 w-1.5 rounded-full bg-gradient-to-b from-sky-300 to-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.35)]" />
                  <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-indigo-300 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]" />
                  <span className="h-4.5 w-1.5 rounded-full bg-gradient-to-b from-fuchsia-300 to-fuchsia-500 shadow-[0_0_12px_rgba(232,121,249,0.35)]" />
                </span>
              </button>
            </div>

            {isClosed ? (
              <div className="mt-3 rounded-xl border border-white/15 bg-black/40 p-3 text-sm text-white/80">
                Votaciones cerradas. Puedes ver tu boleta, pero ya no puedes cambiarla.
              </div>
            ) : null}

            <p className="mt-2 text-white/70">Sesión activa{email ? `: ${email}` : "."}</p>

            {msg ? (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {msg === "__LOGIN_TO_SAVE__" ? (<a href="/login" className="underline underline-offset-2 hover:text-white">Inicia sesión para guardar</a>) : (msg)}
              </div>
            ) : null}

            {savedMsg ? (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {savedMsg}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "guest" ? (
              <a
                href="/login"
                className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 font-medium"
              >
                Acceder
              </a>
            ) : null}
            <button
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 font-medium"
              onClick={() => setInstructionsOpen(true)}
            >
              Instrucciones
            </button>

            {!isClosed ? (
              <button
                className={clsx(
                  "rounded-xl px-4 py-2 font-medium",
                  saving ? "bg-white/70 text-black" : "bg-white text-black"
                )}
                disabled={saving}
                onClick={saveCurrentCategory}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            ) : null}

            {status === "ok" ? (
              <button
                className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 font-medium"
                onClick={logout}
              >
                Cerrar sesión
              </button>
            ) : null}

          </div>        </header>

        {instructionsOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-black/90 p-4 shadow-2xl">
              <div className="text-lg font-semibold text-white">Instrucciones</div>
              <div className="mt-3">
                <InstructionsList />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium hover:border-white/30"
                  onClick={() => setInstructionsOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {seenDialog.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/90 p-4 shadow-2xl">
              <div className="text-lg font-semibold">¿Ya la viste?</div>
              <div className="mt-1 text-sm text-white/70">
                Para marcarla como favorita necesitamos que la hayas visto.
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium hover:border-white/30"
                  onClick={() => {
                    setSeenDialog({ open: false, nomineeId: null, movieId: null });
                    setMsg("Cuando la veas nos cuentas que te gusta");
                  }}
                >
                  No
                </button>

                <button
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  onClick={() => {
                    const nomineeId = seenDialog.nomineeId;
                    const movieId = seenDialog.movieId;
                    setSeenDialog({ open: false, nomineeId: null, movieId: null });
                    if (!nomineeId || !movieId) return;
                    void setSeen(movieId, true);
                    // Refuerzo: garantiza que el checkbox quede marcado de inmediato
                    updatePick(activeCategoryId, { fav: nomineeId });
                  }}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{activeCategory?.name ?? "Categoría"}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Categoría anterior"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-xl font-black text-yellow-300 hover:border-white/30 disabled:opacity-40"
                onClick={() => {
                  setSavedMsg(null);
                  setMsg(null);
                  const idx = CATEGORIES.findIndex((x) => x.id === activeCategoryId);
                  const prev = idx <= 0 ? CATEGORIES.length - 1 : idx - 1;
                  setActiveCategoryId(CATEGORIES[prev]!.id);
                }}
              >◀</button>

              <div className="min-w-[240px]">
                <select
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-medium text-white hover:border-white/30"
                  value={activeCategoryId}
                  onChange={(e) => {
                    setSavedMsg(null);
                    setMsg(null);
                    setActiveCategoryId(e.target.value);
                  }}
                >
                  {CATEGORIES.map((c: Category) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                aria-label="Categoría siguiente"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-xl font-black text-yellow-300 hover:border-white/30 disabled:opacity-40"
                onClick={() => {
                  setSavedMsg(null);
                  setMsg(null);
                  const idx = CATEGORIES.findIndex((x) => x.id === activeCategoryId);
                  const next = idx >= CATEGORIES.length - 1 ? 0 : idx + 1;
                  setActiveCategoryId(CATEGORIES[next]!.id);
                }}
              >▶</button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategory?.nominees.map((n: Nominee) => {
              const isWin = currentPick.win === n.id;
              const isSecond = currentPick.second === n.id;
              const isFav = currentPick.fav === n.id;

              // movieId global para "Ya la vi"
              const movieId = (n as any).movieId ?? n.id;
              const hasSeen = !!seenMovies[movieId];

              const m = media[movieId] ?? null;
              const imdb = imdbMap[movieId] ?? null;

              return (
                <div key={n.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                  <div className="aspect-[2/3] w-full rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center relative">
                    {m?.posterUrl ? (
                      <img src={m.posterUrl} alt={n.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-white/40 text-sm">Poster</div>
                    )}
                    {/* Botones flotantes sobre el póster */}
                    <div className="absolute inset-x-2 bottom-2 z-10 flex gap-2">
                      <button
                        className={clsx(
                          "flex-1 rounded-lg px-2 py-2 text-xs font-semibold border backdrop-blur",
                          isWin
                            ? "bg-white text-black border-white"
                            : "bg-black/35 text-white border-white/20 hover:border-white/35"
                        )}
                        onClick={() => {
                          if (isClosed) return;
                          updatePick(activeCategoryId, { win: isWin ? undefined : n.id });
                        }}
                      >
                        Gana
                      </button>

                      <button
                        className={clsx(
                          "flex-1 rounded-lg px-2 py-2 text-xs font-semibold border backdrop-blur",
                          isSecond
                            ? "bg-white text-black border-white"
                            : "bg-black/35 text-white border-white/20 hover:border-white/35"
                        )}
                        onClick={() => {
                          if (isClosed) return;
                          updatePick(activeCategoryId, { second: isSecond ? undefined : n.id });
                        }}
                      >
                        2da
                      </button>

                      <button
                        className={clsx(
                          "flex-1 rounded-lg px-2 py-2 text-xs font-semibold border backdrop-blur",
                          !hasSeen && "opacity-70",
                          isFav
                            ? "bg-white text-black border-white"
                            : "bg-black/35 text-white border-white/20 hover:border-white/35"
                        )}
                        onClick={() => {
                          if (isClosed) return;

                          // Si ya es favorita, permitir apagarla sin diálogo
                          if (isFav) {
                            updatePick(activeCategoryId, { fav: undefined });
                            return;
                          }

                          // Si no la ha visto, preguntar
                          if (!hasSeen) {
                            setMsg(null);
                            setSavedMsg(null);
                            setSeenDialog({ open: true, nomineeId: n.id, movieId });
                            return;
                          }

                          // Si ya la vio, marcar favorita
                          updatePick(activeCategoryId, { fav: isFav ? undefined : n.id });
                        }}
                        disabled={isClosed}
                      >
                        Favorita
                      </button>
                    </div>

                  </div>

                  <div className="mt-3">
                    <div className="font-semibold">{n.title}</div>
                    {n.subtitle && activeCategoryId !== "best_picture" ? <div className="text-sm text-white/70">{n.subtitle}</div> : null}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {m?.trailerUrl ? (
                        <a
                          href={m.trailerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:border-white/35 hover:bg-white/15"
                          aria-label="Ver tráiler"
                          title="Ver tráiler"
                        >
                          <PlayIcon className="h-7 w-7" />
                        </a>
                      ) : (
                        <span
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 opacity-35"
                          aria-hidden="true"
                          title="Sin tráiler"
                        >
                          <PlayIcon className="h-6 w-6" />
                        </span>
                      )}

                      <button
                        type="button"
                        className={clsx(
                          "inline-flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur transition-colors",
                          hasSeen
                            ? "bg-emerald-500/25 border-emerald-300/40 text-emerald-200 hover:bg-emerald-500/35 hover:border-emerald-200/60"
                            : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/35"
                        )}
                        onClick={() => {
                          if (isClosed) return;
                          void setSeen(movieId, !hasSeen);
                        }}
                        disabled={isClosed}
                        aria-pressed={hasSeen}
                        aria-label={hasSeen ? "Ya la vi" : "Marcar como vista"}
                        title={hasSeen ? "Ya la vi" : "Marcar como vista"}
                      >
                        <EyeIcon className="h-7 w-7" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 whitespace-nowrap text-[16px] font-medium tabular-nums text-white/90">
                      <span className="inline-flex items-center gap-2">
                        <span className="scale-105 origin-left">
                          <BrandLogo kind="imdb" />
                        </span>
                        <span>{imdb ?? "—"}</span>
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <img
                          src="/brands/Fresh_Tomato_logo.svg"
                          alt="Rotten Tomatoes"
                          className="h-8 w-8"
                        />
                        <span>{rottenByMovieId[movieId] ?? "—"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  aria-label="Categoría anterior (abajo)"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-xl font-black text-yellow-300 hover:border-white/30 disabled:opacity-40"
                  onClick={() => {
                    setSavedMsg(null);
                    setMsg(null);
                    const idx = CATEGORIES.findIndex((x) => x.id === activeCategoryId);
                    const prev = idx <= 0 ? CATEGORIES.length - 1 : idx - 1;
                    setActiveCategoryId(CATEGORIES[prev]!.id);
                  }}
                >
                  ◀
                </button>

                <div className="min-w-[240px]">
                  <select
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-medium text-white hover:border-white/30"
                    value={activeCategoryId}
                    onChange={(e) => {
                      setSavedMsg(null);
                      setMsg(null);
                      setActiveCategoryId(e.target.value);
                    }}
                  >
                    {CATEGORIES.map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  aria-label="Categoría siguiente (abajo)"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-xl font-black text-yellow-300 hover:border-white/30 disabled:opacity-40"
                  onClick={() => {
                    setSavedMsg(null);
                    setMsg(null);
                    const idx = CATEGORIES.findIndex((x) => x.id === activeCategoryId);
                    const next = idx >= CATEGORIES.length - 1 ? 0 : idx + 1;
                    setActiveCategoryId(CATEGORIES[next]!.id);
                  }}
                >
                  ▶
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}













































