import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

type TemplateField = {
  id: string;
  page: number;
  x: number;
  y: number; // y desde arriba (top-origin) en pt
  w: number;
  h: number;
  font: "Verdana";
  fontSize: number;
  color: string; // "#RRGGBB"
  align: "left" | "center";
  wrap: boolean;
  maxLines: number | null;
  leading: number | null;
};

type Template = {
  pageSize: { w: number; h: number; unit: "pt"; format: "A4" };
  backgrounds: Record<string, string>;
  fields: TemplateField[];
};

export type VaticinePdfData = {
  user_name: string;
  print_date: string; // "YYYY-MM-DD"
  categories: Record<
    string,
    { win?: string | null; runner_up?: string | null; fav?: string | null }
  >;
  seen_movies: string[];
  to_watch_movies: string[];
};

type Bindings = {
  meta: {
    header_user_date_field: string;
    header_user_field: string;
    seen_list_field: string;
    to_watch_list_field: string;
  };
  bindings: {
    header_user_date: { user_name: string; print_date: string; format: string };
    header_user: { user_name: string };
    categories: Record<
      string,
      { win?: string; runner_up?: string; fav?: string }
    >;
    lists: { seen_list: string; to_watch_list: string };
  };
};

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 1, g: 1, b: 1 };
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 255;
  const g = (v >> 8) & 255;
  const b = v & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function yTopToPdfY(pageH: number, yTop: number, h: number): number {
  return pageH - yTop - h;
}

function splitLinesForTwoColumns(
  items: string[],
  maxLinesPerCol: number
): { col1: string[]; col2: string[]; hidden: number } {
  const cap = maxLinesPerCol * 2;
  const visible = items.slice(0, cap);
  const hidden = Math.max(0, items.length - visible.length);
  const col1 = visible.slice(0, maxLinesPerCol);
  const col2 = visible.slice(maxLinesPerCol);
  return { col1, col2, hidden };
}

function fitTwoColumnFontSize(args: {
  items: string[];
  boxH: number;
  startFontSize: number;
  minFontSize: number;
  leadingBase?: number | null;
}) {
  const { items, boxH, startFontSize, minFontSize, leadingBase } = args;

  for (let fontSize = startFontSize; fontSize >= minFontSize; fontSize--) {
    const lineH = leadingBase ?? Math.max(fontSize, Math.round(fontSize * 1.15));
    const maxLinesPerCol = Math.max(1, Math.floor(boxH / lineH));
    const cap = maxLinesPerCol * 2;

    if (items.length <= cap) {
      return { fontSize, lineH, maxLinesPerCol, truncate: false };
    }
  }

  // No cabe ni en minFontSize → truncar
  const fontSize = minFontSize;
  const lineH = leadingBase ?? Math.max(fontSize, Math.round(fontSize * 1.15));
  const maxLinesPerCol = Math.max(1, Math.floor(boxH / lineH));
  return { fontSize, lineH, maxLinesPerCol, truncate: true };
}

export async function renderVatiCinePdfV4(data: VaticinePdfData): Promise<Uint8Array> {
  const assetsDir = path.join(process.cwd(), "src", "pdf", "vaticine", "v4", "assets");

  const [templateRaw, bindingsRaw] = await Promise.all([
    fs.readFile(path.join(assetsDir, "vatiCINE_template_v4.json"), "utf-8"),
    fs.readFile(path.join(assetsDir, "vatiCINE_bindings.json"), "utf-8"),
  ]);

  const template = JSON.parse(templateRaw.replace(/^\uFEFF/, "")) as Template;
  const bindings = JSON.parse(bindingsRaw.replace(/^\uFEFF/, "")) as Bindings;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageW = template.pageSize.w;
  const pageH = template.pageSize.h;

  const page1 = pdfDoc.addPage([pageW, pageH]);
  const page2 = pdfDoc.addPage([pageW, pageH]);

  // Fondos
  const [bg1Bytes, bg2Bytes] = await Promise.all([
    fs.readFile(path.join(assetsDir, "Pag1.png")),
    fs.readFile(path.join(assetsDir, "Pag2.png")),
  ]);

  const bg1 = await pdfDoc.embedPng(bg1Bytes);
  const bg2 = await pdfDoc.embedPng(bg2Bytes);
  page1.drawImage(bg1, { x: 0, y: 0, width: pageW, height: pageH });
  page2.drawImage(bg2, { x: 0, y: 0, width: pageW, height: pageH });

  // Fuentes Verdana
  const [ttfR, ttfB, ttfI, ttfBI] = await Promise.all([
    fs.readFile(path.join(assetsDir, "verdana.ttf")),
    fs.readFile(path.join(assetsDir, "verdanab.ttf")),
    fs.readFile(path.join(assetsDir, "verdanai.ttf")),
    fs.readFile(path.join(assetsDir, "verdanaz.ttf")),
  ]);

  const fontR = await pdfDoc.embedFont(ttfR);
  const fontB = await pdfDoc.embedFont(ttfB);
  const fontI = await pdfDoc.embedFont(ttfI);
  const fontBI = await pdfDoc.embedFont(ttfBI);

  const getFont = (id: string) => {
    // Por ahora, el template no distingue bold/italic por campo.
    // Usamos regular siempre, salvo que luego definamos reglas.
    void id;
    return fontR || fontB || fontI || fontBI;
  };

  const fieldById = new Map<string, TemplateField>();
  for (const f of template.fields) fieldById.set(f.id, f);

  const out: Record<string, string> = {};

  // Header
  const fmt = bindings.bindings.header_user_date.format;
  out[bindings.meta.header_user_date_field] = fmt
    .replace("{user_name}", data.user_name)
    .replace("{print_date}", data.print_date);

  out[bindings.meta.header_user_field] = data.user_name;

  // Categorías
  for (const [catKey, map] of Object.entries(bindings.bindings.categories)) {
    const c = data.categories[catKey] ?? {};
    if (map.win) out[map.win] = (c.win ?? "") || "";
    if (map.runner_up) out[map.runner_up] = (c.runner_up ?? "") || "";
    if (map.fav) out[map.fav] = (c.fav ?? "") || "";
  }

  // Listas
  out[bindings.meta.seen_list_field] = "";      // Se dibuja con 2 columnas abajo
  out[bindings.meta.to_watch_list_field] = "";  // Se dibuja con 2 columnas abajo

  // Dibujar campos normales
  const drawFieldText = (page: any, f: TemplateField, text: string) => {
    const { r, g, b } = hexToRgb01(f.color);
    const font = getFont(f.id);
    const x = f.x;
    const y = yTopToPdfY(pageH, f.y, f.h);

    if (!text) return;

    // Sin wrap (la mayoría)
    if (!f.wrap) {
      const size = f.fontSize;
      const textW = font.widthOfTextAtSize(text, size);
      let drawX = x;
      if (f.align === "center") drawX = x + (f.w - textW) / 2;
      page.drawText(text, { x: drawX, y: y + (f.h - size) / 2, size, font, color: rgb(r, g, b) });
      return;
    }

    // Wrap simple (si aparece alguno que no sea lista)
    const size = f.fontSize;
    const lineH = f.leading ?? Math.max(size, Math.round(size * 1.15));
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";

    for (const w of words) {
      const cand = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(cand, size) <= f.w) {
        line = cand;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);

    const maxLines = f.maxLines ?? Math.floor(f.h / lineH);
    const clipped = lines.slice(0, Math.max(1, maxLines));

    for (let i = 0; i < clipped.length; i++) {
      page.drawText(clipped[i], { x, y: y + f.h - lineH * (i + 1), size, font, color: rgb(r, g, b) });
    }
  };

  for (const [id, text] of Object.entries(out)) {
    const f = fieldById.get(id);
    if (!f) continue;
    const page = f.page === 1 ? page1 : page2;
    drawFieldText(page, f, text);
  }

  // Dibujar listas en 2 columnas (fontSize dinámico 12→8)
  const drawTwoColumnList = (fieldId: string, items: string[]) => {
    const f = fieldById.get(fieldId);
    if (!f) return;

    // SOLO estas dos cajas (listas)
    const isListsField =
      fieldId === bindings.meta.seen_list_field ||
      fieldId === bindings.meta.to_watch_list_field;

    const page = f.page === 1 ? page1 : page2;
    const { r, g, b } = hexToRgb01(f.color);
    const font = getFont(f.id);

    const gutter = 10;
    const colW = (f.w - gutter) / 2;

    // Sangría francesa para líneas continuadas
    const indentPt = 12;

    const wrapWithIndent = (text: string, size: number, maxW: number) => {
      const words = (text ?? "").split(/\s+/).filter(Boolean);
      if (words.length === 0) return [] as { t: string; ind: number }[];

      const lines: { t: string; ind: number }[] = [];
      let line = "";

      const pushLine = (t: string, ind: number) => {
        const tt = (t ?? "").trim();
        if (tt) lines.push({ t: tt, ind });
      };

      // Primera línea: sin sangría, maxW completo
      const firstMax = maxW;
      // Siguientes: con sangría, menos ancho
      const nextMax = Math.max(10, maxW - indentPt);

      let currentMax = firstMax;
      let currentIndent = 0;

      for (const w of words) {
        const cand = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(cand, size) <= currentMax) {
          line = cand;
        } else {
          // Si la palabra sola no cabe, forzarla igual (evita loop)
          if (!line) {
            pushLine(w, currentIndent);
            line = "";
          } else {
            pushLine(line, currentIndent);
            line = w;
          }
          // A partir de la segunda línea: sangría
          currentMax = nextMax;
          currentIndent = indentPt;
        }
      }
      if (line) pushLine(line, currentIndent);

      return lines;
    };

    const computeLayout = (size: number) => {
      const lineH = f.leading ?? Math.max(size, Math.round(size * 1.15));
      const maxLinesPerCol = Math.max(1, Math.floor(f.h / lineH));
      const cap = maxLinesPerCol * 2;

      // Cada item puede usar múltiples líneas
      const wrapped = items.map((it) => wrapWithIndent(it, size, colW));
      const totalLines = wrapped.reduce((acc, arr) => acc + arr.length, 0);

      return { size, lineH, maxLinesPerCol, cap, wrapped, totalLines };
    };

    // Elegir tamaño: startFontSize→8, evaluando líneas reales
    let chosen = computeLayout(f.fontSize);
    for (let s = f.fontSize; s >= 8; s--) {
      const test = computeLayout(s);
      if (test.totalLines <= test.cap) {
        chosen = test;
        break;
      }
      chosen = test; // si nada cabe, queda el último (8) y truncamos
    }

    const { size, lineH, maxLinesPerCol, cap, wrapped } = chosen;

    // Truncado + "+N más" (solo si no cabe)
    const needsTruncate = chosen.totalLines > cap;
    const reserveMoreLine = needsTruncate; // si truncamos, reservamos 1 línea
    const effectiveCap = reserveMoreLine ? Math.max(1, cap - 1) : cap;

    const col1: { t: string; ind: number }[] = [];
    const col2: { t: string; ind: number }[] = [];

    let used = 0;
    let hiddenItems = 0;

    // Colocación secuencial por líneas: llena col1 luego col2
    const placeLine = (ln: { t: string; ind: number }) => {
      if (used >= effectiveCap) return false;
      if (used < maxLinesPerCol) col1.push(ln);
      else col2.push(ln);
      used++;
      return true;
    };

    for (let i = 0; i < wrapped.length; i++) {
      const lines = wrapped[i];
      // Si el item completo no cabe, truncamos desde aquí
      if (used + lines.length > effectiveCap) {
        hiddenItems = wrapped.length - i;
        break;
      }
      for (const ln of lines) {
        if (!placeLine(ln)) {
          hiddenItems = wrapped.length - i;
          break;
        }
      }
      if (hiddenItems > 0) break;
    }

    const y0 = yTopToPdfY(pageH, f.y, f.h);

    const drawCol = (lines: { t: string; ind: number }[], colIndex: 0 | 1) => {
      const baseX = f.x + (colIndex === 0 ? 0 : colW + gutter);
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        page.drawText(ln.t, {
          x: baseX + (isListsField ? ln.ind : 0),
          y: y0 + f.h - lineH * (i + 1),
          size,
          font,
          color: rgb(r, g, b),
        });
      }
    };

    drawCol(col1, 0);
    drawCol(col2, 1);

    // "+N más" en última línea de la segunda columna
    if (reserveMoreLine && hiddenItems > 0) {
      const baseX2 = f.x + (colW + gutter);
      const moreLine = `+${hiddenItems} más`;
      page.drawText(moreLine, {
        x: baseX2,
        y: y0 + f.h - lineH * (Math.min(maxLinesPerCol, col2.length + 1)),
        size,
        font,
        color: rgb(r, g, b),
      });
    }
  };

  // Orden estable: alfabético
  const seen = [...data.seen_movies].sort((a, b) => a.localeCompare(b, "es"));
  const toWatch = [...data.to_watch_movies].sort((a, b) => a.localeCompare(b, "es"));

  drawTwoColumnList(bindings.meta.seen_list_field, seen);
  drawTwoColumnList(bindings.meta.to_watch_list_field, toWatch);

  return await pdfDoc.save();
}


