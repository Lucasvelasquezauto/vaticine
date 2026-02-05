import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { CATEGORIES, type Nominee } from "../vault/oscars2026/categories";
import { MOVIES } from "../vault/oscars2026/movies";

type VoteRow = { category_id: string; win: string | null; second: string | null; fav: string | null };
type SeenRow = { movie_id: string; seen: boolean | null };

type Anchor = {
  page: number; // 0-based in pdf-lib
  bbox: [number, number, number, number]; // [x0,y0,x1,y1] in top-left origin (from extractor)
  font: string;
  size: number;
  color: string; // hex
};

type Layout = {
  pages?: any[];
  text_anchors_by_literal?: Record<string, Anchor[]>;
};

function hexToRgb01(hex: string) {
  const h = hex.replace("#", "").trim();
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return { r, g, b };
}

// Convert extractor top-left bbox to pdf-lib bottom-left coords
function toPdfRect(pageHeight: number, bboxTopLeft: [number, number, number, number]) {
  const [x0, y0, x1, y1] = bboxTopLeft;
  const w = x1 - x0;
  const h = y1 - y0;
  const x = x0;
  const y = pageHeight - y1; // bottom
  return { x, y, w, h };
}

function formatEsCo(dt: Date) {
  // "04 feb 2026 09:15"
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const dd = String(dt.getDate()).padStart(2, "0");
  const mon = months[dt.getMonth()];
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${dd} ${mon} ${yyyy} ${hh}:${mm}`;
}

function buildNomineeMap() {
  const byId = new Map<string, Nominee>();
  const catById = new Map<string, (typeof CATEGORIES)[number]>();
  for (const c of CATEGORIES) {
    catById.set(c.id, c);
    for (const n of c.nominees) byId.set(n.id, n);
  }
  return { byId, catById };
}

function buildMovieTitleById() {
  const m = new Map<string, string>();
  for (const x of MOVIES) m.set(x.id, x.title);
  return m;
}

// We overwrite text by painting a dark rect over old text then writing new.
function overwriteText(
  page: any,
  pageHeight: number,
  anchor: Anchor,
  newText: string,
  font: any,
  fontSize: number,
  colorHex: string,
  padX = 1.5,
  padY = 1.0
) {
  const { x, y, w, h } = toPdfRect(pageHeight, anchor.bbox);
  const bg = hexToRgb01("#0B0D10"); // near-black; blends with template

  // cover old text
  page.drawRectangle({
    x: x - padX,
    y: y - padY,
    width: w + padX * 2,
    height: h + padY * 2,
    color: rgb(bg.r, bg.g, bg.b),
  });

  const c = hexToRgb01(colorHex);
  // draw new text near baseline (approx)
  page.drawText(newText, {
    x,
    y: y + 1, // small baseline lift
    size: fontSize,
    font,
    color: rgb(c.r, c.g, c.b),
  });
}

function pickAnchors(layout: Layout, literal: string): Anchor[] {
  return (layout.text_anchors_by_literal?.[literal] ?? []).map((a) => ({
    ...a,
    page: a.page, // extractor uses 0/1 already
  }));
}

export async function renderBallotPdfV13(params: {
  templatePdfPath: string;
  layoutJsonPath: string;
  userName: string;
  votes: VoteRow[];
  seenRows: SeenRow[];
}) {
  const { templatePdfPath, layoutJsonPath, userName, votes, seenRows } = params;

  const templateBytes = await fs.readFile(templatePdfPath);
  const layout = JSON.parse(await fs.readFile(layoutJsonPath, "utf8")) as Layout;

  const pdfDoc = await PDFDocument.load(templateBytes);

  // standard fonts (no embedding external fonts)
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const p0 = pages[0];
  const p1 = pages[1];
  const h0 = p0.getHeight();
  const h1 = p1.getHeight();

  const { byId: nomineeById, catById } = buildNomineeMap();

  const seenSet = new Set<string>();
  for (const r of seenRows ?? []) if (r?.movie_id && r.seen) seenSet.add(r.movie_id);

  const voteByCategory = new Map<string, VoteRow>();
  for (const r of votes ?? []) voteByCategory.set(r.category_id, r);

  const movieTitleById = buildMovieTitleById();

  // --- Header line: "Lucas Pérez · 04 feb 2026 09:15" (page 1) ---
  {
    const a = pickAnchors(layout, "Lucas Pérez · 04 feb 2026 09:15")[0];
    if (a) {
      const now = new Date();
      const text = `${userName} · ${formatEsCo(now)}`;
      overwriteText(p0, h0, a, text, helv, 11, a.color);
    }
  }

  // --- Page 2 header user name (right) ---
  {
    const a = pickAnchors(layout, "Lucas Pérez")[0]; // appears page 2 header
    if (a && a.page === 1) {
      overwriteText(p1, h1, a, userName, helv, 12, a.color);
    }
  }

  // --- Featured boxes on page 1: positions come from "Gana:" and "2da:" labels ---
  // Order as in template (by y)
  const featuredNames = [
    "Mejor Película",
    "Mejor Dirección",
    "Mejor Actor Protagónico",
    "Mejor Actriz Protagónica",
    "Mejor Actor de Reparto",
    "Mejor Actriz de Reparto",
    "Mejor Guion Original",
    "Mejor Guion Adaptado",
    "Mejor Fotografía",
  ];

  const featuredCats = featuredNames
    .map((name) => CATEGORIES.find((c) => c.name === name))
    .filter(Boolean) as (typeof CATEGORIES)[number][];

  const ganaLabels = pickAnchors(layout, "Gana:").filter((a) => a.page === 0).sort((a, b) => a.bbox[1] - b.bbox[1]);
  const secondLabels = pickAnchors(layout, "2da:").filter((a) => a.page === 0).sort((a, b) => a.bbox[1] - b.bbox[1]);
  const favLabels = pickAnchors(layout, "Fav:").filter((a) => a.page === 0).sort((a, b) => a.bbox[1] - b.bbox[1]);

  function nomineeLabel(nomineeId: string | null, kind: "win" | "second" | "fav") {
    if (!nomineeId) return "—";
    const n = nomineeById.get(nomineeId);
    if (!n) return "—";
    const base = n.title;
    const star = kind !== "fav" && n.movieId && seenSet.has(n.movieId) ? " ★" : "";
    return base + star;
  }

  // write win/second values aligned to right of their label
  for (let i = 0; i < featuredCats.length; i++) {
    const c = featuredCats[i];
    const v = voteByCategory.get(c.id) ?? { category_id: c.id, win: null, second: null, fav: null };

    const aG = ganaLabels[i];
    const aS = secondLabels[i];
    if (aG) {
      const x = aG.bbox[2] + 18; // gap to the right of label
      const anchorForValue: Anchor = { ...aG, bbox: [x, aG.bbox[1], x + 320, aG.bbox[3]] };
      overwriteText(p0, h0, anchorForValue, nomineeLabel(v.win, "win"), helv, 12, "#FFFFFF");
    }
    if (aS) {
      const x = aS.bbox[2] + 18;
      const anchorForValue: Anchor = { ...aS, bbox: [x, aS.bbox[1], x + 320, aS.bbox[3]] };
      overwriteText(p0, h0, anchorForValue, nomineeLabel(v.second && v.second !== v.win ? v.second : null, "second"), helv, 12, "#FFFFFF");
    }
  }

  // Fav appears only in 2 featured boxes in the template: Best Picture + Actress Supporting
  // We map them in that order by y.
  {
    const favTargets = [
      CATEGORIES.find((c) => c.name === "Mejor Película"),
      CATEGORIES.find((c) => c.name === "Mejor Actriz de Reparto"),
    ].filter(Boolean) as (typeof CATEGORIES)[number][];

    for (let i = 0; i < favTargets.length; i++) {
      const c = favTargets[i];
      const v = voteByCategory.get(c.id);
      const aF = favLabels[i];
      if (aF) {
        const x = aF.bbox[2] + 18;
        const anchorForValue: Anchor = { ...aF, bbox: [x, aF.bbox[1], x + 320, aF.bbox[3]] };
        overwriteText(p0, h0, anchorForValue, nomineeLabel(v?.fav ?? null, "fav"), helv, 12, "#FFFFFF");
      }
    }
  }

  // --- Page 2 table: remaining 15 categories in template order ---
  const tableCategoryLiterals = [
    "Casting",
    "Sonido",
    "Música original",
    "Montaje",
    "Diseño de producción",
    "Vestuario",
    "Maquillaje y peluquería",
    "Efectos visuales",
    "Canción original",
    "Largometraje animado",
    "Documental",
    "Película internacional",
    "Cortometraje animado",
    "Cortometraje documental",
    "Cortometraje de acción real",
  ];

  // Determine X positions using first row sample anchors present in template
  const aCat0 = pickAnchors(layout, "Casting")[0];
  const aWin0 = pickAnchors(layout, "Sing Sing")[0];
  const aSec0 = pickAnchors(layout, "Barbie ★")[0] ?? pickAnchors(layout, "Barbie")[0];
  const aFav0 = pickAnchors(layout, "—")[0]; // first em dash cell appears in table

  const xCat = aCat0 ? aCat0.bbox[0] : 70;
  const xWin = aWin0 ? aWin0.bbox[0] : 235;
  const xSec = aSec0 ? aSec0.bbox[0] : 390;
  const xFav = aFav0 ? aFav0.bbox[0] : 545;

  // Map literals -> real category ids by matching CATEGORIES.name
  function categoryIdFromLiteral(lit: string) {
    // The vault uses full names ("Mejor Sonido", etc). The table uses short labels.
    // We map by checking inclusion.
    const norm = lit.toLowerCase();
    const c = CATEGORIES.find((x) => x.name.toLowerCase().includes(norm));
    return c?.id ?? null;
  }

  for (const lit of tableCategoryLiterals) {
    const aRow = pickAnchors(layout, lit)[0];
    if (!aRow) continue;

    const catId = categoryIdFromLiteral(lit);
    if (!catId) continue;

    const v = voteByCategory.get(catId);
    const win = nomineeLabel(v?.win ?? null, "win");
    const second = nomineeLabel(v?.second && v?.second !== v?.win ? v.second : null, "second");
    const fav = v?.fav ? nomineeLabel(v.fav, "fav") : "—";

    // Use row's y-band (from category cell bbox) and draw each column
    const y0 = aRow.bbox[1];
    const y1 = aRow.bbox[3];

    const band: [number, number, number, number] = [0, y0, 0, y1];

    const catAnchor: Anchor = { ...aRow, bbox: [xCat, y0, xWin - 12, y1], color: "#FFFFFF", font: aRow.font, size: aRow.size };
    const winAnchor: Anchor = { ...aRow, bbox: [xWin, y0, xSec - 12, y1], color: "#FFFFFF", font: aRow.font, size: aRow.size };
    const secAnchor: Anchor = { ...aRow, bbox: [xSec, y0, xFav - 12, y1], color: "#FFFFFF", font: aRow.font, size: aRow.size };
    const favAnchor: Anchor = { ...aRow, bbox: [xFav, y0, xFav + 220, y1], color: "#FFFFFF", font: aRow.font, size: aRow.size };

    // Category label stays as template literal; no change
    overwriteText(p1, h1, winAnchor, win, helv, 12, "#FFFFFF");
    overwriteText(p1, h1, secAnchor, second, helv, 12, "#FFFFFF");
    overwriteText(p1, h1, favAnchor, fav, helv, 12, "#FFFFFF");
  }

  // --- Seen / Unseen lists on page 2 ---
  // Slots are exactly those bullet literals present in template.
  const seenSlots = [
    "• Anora",
    "• Oppenheimer",
    "• Zona de interés",
    "• Poor Things",
    "• Barbie",
    "• Cónclave",
    "• Flow",
    "• Sing Sing",
  ];
  const unseenSlots = [
    "• Dune: Parte Dos",
    "• The Brutalist",
    "• Emilia Pérez",
    "• Nosferatu",
    "• Wicked",
    "• A Complete Unknown",
    "• Furiosa",
    "• La semilla del fruto sagrado",
    "• Cortos (selección)",
    "• Documentales (selección)",
    "• Internacional (selección)",
  ];

  // Compute lists based on MOVIES and seenSet
  const seenTitles: string[] = [];
  const unseenTitles: string[] = [];
  for (const m of MOVIES) {
    if (seenSet.has(m.id)) seenTitles.push(m.title);
    else unseenTitles.push(m.title);
  }

  // Some "selección" entries are not movies; keep template placeholders if we don't have enough titles.
  function fillBulletList(page: any, pageHeight: number, slots: string[], titles: string[]) {
    for (let i = 0; i < slots.length; i++) {
      const lit = slots[i];
      const a = pickAnchors(layout, lit)[0];
      if (!a) continue;
      const t = titles[i] ? `• ${titles[i]}` : ""; // blank if missing
      overwriteText(page, pageHeight, a, t, helv, 12, "#FFFFFF");
    }
  }

  fillBulletList(p1, h1, seenSlots, seenTitles);
  fillBulletList(p1, h1, unseenSlots, unseenTitles);

  // Update counts in headers: "Vistas (8)" and "Por ver (11)"
  {
    const a = pickAnchors(layout, "Vistas (8)")[0];
    if (a) overwriteText(p1, h1, a, `Vistas (${seenTitles.length})`, helvBold, 14, "#0B0D10"); // text is dark on gold
  }
  {
    const a = pickAnchors(layout, "Por ver (11)")[0];
    if (a) overwriteText(p1, h1, a, `Por ver (${unseenTitles.length})`, helvBold, 14, "#0B0D10");
  }

  const out = await pdfDoc.save();
  return out;
}

