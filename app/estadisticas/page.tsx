"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "../../src/vault/oscars2026/categories";
import { MOVIES } from "../../src/vault/oscars2026/movies";

type StatsRow = { nominee_id: string; win_count: number; fav_count: number };
type ViewsRow = { movie_id: string; seen_count: number };

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Mock determinista (demo sin libs)
function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function formatNum(n: number) {
  return new Intl.NumberFormat("es-CO").format(n);
}

function Dot({
  tone,
  size = "md",
}: {
  tone: "win" | "fav" | "views";
  size?: "sm" | "md";
}) {
  const bg =
    tone === "win"
      ? "bg-indigo-500"
      : tone === "fav"
      ? "bg-fuchsia-500"
      : "bg-emerald-500";

  const s = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  return <span className={clsx("inline-block rounded-full", s, bg)} />;
}

function LollipopDouble({
  win,
  fav,
  max,
}: {
  win: number;
  fav: number;
  max: number;
}) {
  const w = clamp((win / max) * 100, 0, 100);
  const f = clamp((fav / max) * 100, 0, 100);

  return (
    <div className="relative h-8">
      {/* baseline */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />

      {/* win stem */}
      <div
        className="absolute left-0 top-1/2 h-px bg-gradient-to-r from-sky-400 to-indigo-500"
        style={{ width: w + "%" }}
      />

      {/* win dot */}
      <div className="absolute top-1/2" style={{ left: w + "%" }}>
        <div className="h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_0_2px_rgba(0,0,0,0.55)] flex items-center justify-center">
          <span className="text-[11px] font-semibold tabular-nums text-black">{win}</span>
        </div>
      </div>

      {/* fav dot (sobre la misma línea) */}
      <div className="absolute top-1/2" style={{ left: f + "%" }}>
        <div className="h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-500 shadow-[0_0_0_2px_rgba(0,0,0,0.55)] flex items-center justify-center">
          <span className="text-[11px] font-semibold tabular-nums text-black">{fav}</span>
        </div>
      </div>
    </div>
  );
}

function LollipopSingle({ value, max }: { value: number; max: number }) {
  const p = clamp((value / max) * 100, 0, 100);
  return (
    <div className="relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
      <div
        className="absolute left-0 top-1/2 h-px bg-gradient-to-r from-emerald-400 to-lime-500"
        style={{ width: p + "%" }}
      />
      <div className="absolute top-1/2" style={{ left: p + "%" }}>
        <div className="h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-500 shadow-[0_0_0_2px_rgba(0,0,0,0.55)] flex items-center justify-center">
          <span className="text-[11px] font-semibold tabular-nums text-black">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const searchParams = useSearchParams();
  const isMock = searchParams.get("mock") === "1";

  const defaultCategoryId = "best_picture";
  const [categoryId, setCategoryId] = useState(defaultCategoryId);

  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingViews, setLoadingViews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<StatsRow[]>([]);
  const [views, setViews] = useState<ViewsRow[]>([]);

  const movieTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of MOVIES) map.set(m.id, m.title);
    return map;
  }, []);

  const nomineeById = useMemo(() => {
    const map = new Map<string, { title: string; subtitle?: string; movieId: string; categoryId: string }>();
    for (const c of CATEGORIES) {
      for (const n of c.nominees) {
        map.set(n.id, { title: n.title, subtitle: n.subtitle, movieId: n.movieId, categoryId: c.id });
      }
    }
    return map;
  }, []);

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
  }, [categoryId]);

  function buildMockCategory(catId: string): StatsRow[] {
    const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0];
    const out: StatsRow[] = [];
    for (const n of cat.nominees) {
      const h = hashToInt(catId + "::" + n.id);
      const win = 3 + (h % 22);
      const fav = h % 14;
      out.push({ nominee_id: n.id, win_count: win, fav_count: fav });
    }
    return out;
  }

  function buildMockViews(): ViewsRow[] {
    const out: ViewsRow[] = [];
    for (const m of MOVIES) {
      const h = hashToInt("views::" + m.id);
      const seen = h % 55;
      if (seen > 0) out.push({ movie_id: m.id, seen_count: seen });
    }
    out.sort((a, b) => b.seen_count - a.seen_count);
    return out;
  }

  async function fetchCategoryStats(catId: string) {
    setLoadingCat(true);
    setError(null);
    try {
      const res = await fetch("/api/stats/category?category_id=" + encodeURIComponent(catId), { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No pude cargar estadísticas de categoría.");
      setRows(Array.isArray(json?.rows) ? json.rows : []);
    } catch (e: any) {
      setError(e?.message ?? "Error inesperado.");
      setRows([]);
    } finally {
      setLoadingCat(false);
    }
  }

  async function fetchViews() {
    setLoadingViews(true);
    setError(null);
    try {
      const res = await fetch("/api/stats/views", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No pude cargar 'Más vistas'.");
      setViews(Array.isArray(json?.rows) ? json.rows : []);
    } catch (e: any) {
      setError(e?.message ?? "Error inesperado.");
      setViews([]);
    } finally {
      setLoadingViews(false);
    }
  }

  useEffect(() => {
    if (isMock) {
      setError(null);
      setRows(buildMockCategory(categoryId));
      return;
    }
    void fetchCategoryStats(categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, isMock]);

  useEffect(() => {
    if (isMock) {
      setError(null);
      setViews(buildMockViews());
      return;
    }
    void fetchViews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  useEffect(() => {
    if (isMock) return;
    const t = setInterval(() => {
      void fetchCategoryStats(categoryId);
      void fetchViews();
    }, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, isMock]);

  const rowsEnriched = useMemo(() => {
    const filtered = (rows ?? [])
      .map((r) => {
        const n = nomineeById.get(r.nominee_id);
        return {
          nominee_id: r.nominee_id,
          win_count: Number(r.win_count || 0),
          fav_count: Number(r.fav_count || 0),
          title: n?.title ?? r.nominee_id,
          subtitle: n?.subtitle,
        };
      })
      .filter((r) => r.win_count > 0 || r.fav_count > 0);

    filtered.sort((a, b) => {
      if (b.win_count !== a.win_count) return b.win_count - a.win_count;
      return b.fav_count - a.fav_count;
    });

    return filtered;
  }, [rows, nomineeById]);

  const viewsEnriched = useMemo(() => {
    const out = (views ?? [])
      .map((v) => ({
        movie_id: v.movie_id,
        seen_count: Number(v.seen_count || 0),
        title: movieTitleById.get(v.movie_id) ?? v.movie_id,
      }))
      .filter((v) => v.seen_count > 0);

    out.sort((a, b) => b.seen_count - a.seen_count);
    return out;
  }, [views, movieTitleById]);

  const maxScale = useMemo(() => {
    let m = 1;
    for (const r of rowsEnriched) m = Math.max(m, r.win_count, r.fav_count);
    return m;
  }, [rowsEnriched]);

  const maxViews = useMemo(() => viewsEnriched.reduce((m, r) => Math.max(m, r.seen_count), 0) || 1, [viewsEnriched]);

  const hideSubtitle = categoryId === "best_picture";

  return (
    <main className="min-h-screen p-3 sm:p-5 flex justify-center">
      <div className="w-full max-w-5xl">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold">Estadísticas</h1>
              {isMock ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                  Modo demo
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-white/70">Público. Datos agregados. Sin correos, sin nombres.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-medium hover:border-white/30">
              Inicio
            </Link>
            <Link href="/boleta" className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-medium hover:border-white/30">
              Boleta
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        {/* Por categoría */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{activeCategory?.name ?? "Categoría"}</h2>
                <div className="mt-1 flex items-center gap-4 text-xs text-white/70">
                  <span className="inline-flex items-center gap-2"><Dot tone="win" size="sm" />Gana</span>
                  <span className="inline-flex items-center gap-2"><Dot tone="fav" size="sm" />Favorita</span>
                  </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
                <span>Escala máx</span>
                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 tabular-nums">{formatNum(maxScale)}</span>
              </div>
            </div>

            {/* Menú: scroll horizontal para móvil */}
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={clsx(
                    "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border",
                    c.id === categoryId ? "bg-white text-black border-white" : "bg-black/40 text-white border-white/15 hover:border-white/30"
                  )}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            {loadingCat ? (
              <div className="px-3 py-2 text-sm text-white/70">Cargando…</div>
            ) : rowsEnriched.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/70">Aún no hay votos para esta categoría.</div>
            ) : (
              <div className="max-h-[560px] overflow-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rowsEnriched.map((r, idx) => (
                  <div key={r.nominee_id} className={clsx("border-b border-white/5 last:border-b-0", idx % 2 === 1 && "bg-white/[0.02]")}>
                    <div className="px-3 py-2">
                      <div className="flex gap-3">
                        <div className="w-6 shrink-0 text-xs text-white/45 tabular-nums pt-0.5">{idx + 1}</div>

                        <div className="min-w-0 w-[132px] sm:w-[200px] pr-2">
                          <div className="text-[15px] sm:text-[16px] font-semibold leading-tight text-center truncate">{r.title}</div>
                          {!hideSubtitle && r.subtitle ? (
                            <div className="text-[11px] text-white/60 leading-tight mt-0.5 truncate">{r.subtitle}</div>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <LollipopDouble win={r.win_count} fav={r.fav_count} max={maxScale} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Más vistas */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Más vistas</h2>
              <p className="mt-0.5 text-sm text-white/70">Global. Solo películas con ≥1 (1 por usuario).</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
              <span>Escala máx</span>
              <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 tabular-nums">{formatNum(maxViews)}</span>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            {loadingViews ? (
              <div className="px-3 py-2 text-sm text-white/70">Cargando…</div>
            ) : viewsEnriched.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/70">Aún no hay “Ya la vi”.</div>
            ) : (
              <div className="max-h-[420px] overflow-auto overflow-x-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {viewsEnriched.map((v, idx) => (
                  <div key={v.movie_id} className={clsx("border-b border-white/5 last:border-b-0", idx % 2 === 1 && "bg-white/[0.02]")}>
                    <div className="px-3 py-2">
                      <div className="flex gap-3">
                        <div className="w-6 shrink-0 text-xs text-white/45 tabular-nums pt-0.5">{idx + 1}</div>

                        <div className="min-w-0 w-[132px] sm:w-[200px] pr-2">
                          <div className="font-medium leading-tight truncate">{v.title}</div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <LollipopSingle value={v.seen_count} max={maxViews} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-white/55 flex items-center gap-4">
            <span className="inline-flex items-center gap-2"><Dot tone="views" size="sm" />Vistas</span>
          </div>
        </section>
      </div>
    </main>
  );
}


