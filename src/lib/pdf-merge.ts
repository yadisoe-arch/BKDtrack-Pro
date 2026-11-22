// Client-side PDF builder: all processing happens in the browser.
import type { PDFDocument as PDFDocType, PDFFont } from "pdf-lib";

export type Preset = "kecil" | "standar" | "tinggi";
export const PRESETS: Record<Preset, { label: string; desc: string; maxPx: number; quality: number; pdfScale: number; rasterPdf: boolean }> = {
  kecil: { label: "Ukuran Kecil", desc: "Kompresi maksimal, target < 1–2 MB untuk BKD/SISTER", maxPx: 1240, quality: 0.5, pdfScale: 1.1, rasterPdf: true },
  standar: { label: "Ukuran Standar", desc: "Seimbang antara keterbacaan dan ukuran", maxPx: 1754, quality: 0.72, pdfScale: 1.6, rasterPdf: true },
  tinggi: { label: "Kualitas Tinggi", desc: "Resolusi tajam untuk arsip cetak", maxPx: 2480, quality: 0.9, pdfScale: 2, rasterPdf: false },
};

export type Item = { id: string; file: File; title: string; cover: boolean };
export const kindOf = (f: File) => {
  const n = f.name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|webp)$/.test(n)) return "image";
  if (n.endsWith(".docx")) return "docx";
  if (/\.(xlsx|xls|csv)$/.test(n)) return "xlsx";
  return null;
};
export const fmtSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);

const A4: [number, number] = [595.28, 841.89];
// Standard fonts only support WinAnsi; strip anything else.
const clean = (s: string) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF\n\t]/g, "?");

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = [];
  for (const para of clean(text).split("\n")) {
    let line = "";
    for (const w of para.replace(/\t/g, "    ").split(" ")) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

async function addTextPages(doc: PDFDocType, font: PDFFont, bold: PDFFont, heading: string, lines: string[], size = 10) {
  const m = 50, lh = size * 1.4;
  let page = doc.addPage(A4), y = A4[1] - m;
  page.drawText(clean(heading), { x: m, y, size: 13, font: bold }); y -= 24;
  for (const l of lines.flatMap((x) => wrap(x, font, size, A4[0] - m * 2))) {
    if (y < m) { page = doc.addPage(A4); y = A4[1] - m; }
    page.drawText(l, { x: m, y, size, font }); y -= lh;
  }
}

async function compressImage(file: File, p: (typeof PRESETS)[Preset]) {
  const { default: imageCompression } = await import("browser-image-compression");
  return imageCompression(file, { maxWidthOrHeight: p.maxPx, initialQuality: p.quality, fileType: "image/jpeg", useWebWorker: true });
}

async function addImagePage(doc: PDFDocType, bytes: ArrayBuffer) {
  const img = await doc.embedJpg(bytes);
  const s = Math.min((A4[0] - 40) / img.width, (A4[1] - 40) / img.height, 1);
  const w = img.width * s, h = img.height * s;
  const landscape = img.width > img.height;
  const size: [number, number] = landscape ? [A4[1], A4[0]] : A4;
  const s2 = Math.min((size[0] - 40) / img.width, (size[1] - 40) / img.height);
  const page = doc.addPage(size);
  const W = img.width * s2, H = img.height * s2;
  page.drawImage(img, { x: (size[0] - W) / 2, y: (size[1] - H) / 2, width: W, height: H });
  void w; void h;
}

async function rasterPdf(doc: PDFDocType, file: File, p: (typeof PRESETS)[Preset]) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const src = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  for (let i = 1; i <= src.numPages; i++) {
    const pg = await src.getPage(i);
    const base = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: p.pdfScale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await pg.render({ canvasContext: ctx, viewport: vp, canvas } as never).promise;
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", p.quality));
    const img = await doc.embedJpg(await blob.arrayBuffer());
    const page = doc.addPage([base.width, base.height]);
    page.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
  }
}

export async function buildPdf(items: Item[], preset: Preset, mainTitle: string, onProgress: (msg: string) => void) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const p = PRESETS[preset];
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const primary = rgb(0.13, 0.3, 0.65);

  const cover = (title: string, sub: string, big: boolean) => {
    const page = doc.addPage(A4);
    page.drawRectangle({ x: 0, y: A4[1] - 12, width: A4[0], height: 12, color: primary });
    const lines = wrap(title, bold, big ? 24 : 18, A4[0] - 120);
    let y = A4[1] / 2 + lines.length * 14;
    for (const l of lines) { page.drawText(l, { x: 60, y, size: big ? 24 : 18, font: bold, color: primary }); y -= big ? 32 : 26; }
    page.drawText(clean(sub), { x: 60, y: y - 10, size: 11, font, color: rgb(0.4, 0.4, 0.45) });
  };

  if (mainTitle.trim()) cover(mainTitle, `Berkas Bukti BKD · ${new Date().toLocaleDateString("id-ID")}`, true);

  for (const [idx, it] of items.entries()) {
    onProgress(`Memproses ${idx + 1}/${items.length}: ${it.file.name}`);
    if (it.cover) cover(it.title || it.file.name, `Bukti ${idx + 1} · ${it.file.name}`, false);
    const k = kindOf(it.file);
    if (k === "image") {
      const c = await compressImage(it.file, p);
      await addImagePage(doc, await c.arrayBuffer());
    } else if (k === "pdf") {
      if (p.rasterPdf) await rasterPdf(doc, it.file, p);
      else {
        const src = await PDFDocument.load(await it.file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await doc.copyPages(src, src.getPageIndices());
        pages.forEach((pg) => doc.addPage(pg));
      }
    } else if (k === "docx") {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ arrayBuffer: await it.file.arrayBuffer() });
      await addTextPages(doc, font, bold, it.title || it.file.name, value.split(/\n+/));
    } else if (k === "xlsx") {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await it.file.arrayBuffer());
      for (const name of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name]!, { header: 1, blankrows: false });
        await addTextPages(doc, font, bold, `${it.title || it.file.name} — ${name}`, rows.map((r) => r.map((c) => String(c ?? "")).join("  |  ")), 8);
      }
    }
  }
  onProgress("Menyimpan PDF...");
  return doc.save({ useObjectStreams: true });
}
