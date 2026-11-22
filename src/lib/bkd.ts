export const PILARS = ["Pendidikan", "Penelitian", "Pengabdian", "Penunjang"] as const;
export type Pilar = (typeof PILARS)[number];
export const STATUSES = ["Menunggu Review", "Disetujui", "Perlu Revisi"] as const;
export const JENJANG = ["Tenaga Pengajar", "Asisten Ahli", "Lektor", "Lektor Kepala", "Guru Besar"] as const;
export const SKS_MIN = 12;
export const SKS_MAX = 16;
export const SKS_INTI_MIN = 9;

export function semesterNow(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (m >= 8) return { semester: "Ganjil", tahun: `${y}/${y + 1}` };
  if (m === 1) return { semester: "Ganjil", tahun: `${y - 1}/${y}` };
  return { semester: "Genap", tahun: `${y - 1}/${y}` };
}

export function tahunOptions(d = new Date()) {
  const y = d.getFullYear();
  return [-2, -1, 0, 1].map((o) => `${y + o}/${y + o + 1}`);
}

export function compliance(rows: { pilar: string; sks: number | string }[]) {
  const per: Record<Pilar, number> = { Pendidikan: 0, Penelitian: 0, Pengabdian: 0, Penunjang: 0 };
  for (const r of rows) if (r.pilar in per) per[r.pilar as Pilar] += Number(r.sks) || 0;
  const total = Object.values(per).reduce((a, b) => a + b, 0);
  const inti = per.Pendidikan + per.Penelitian;
  const warnings: string[] = [];
  if (total < SKS_MIN) warnings.push(`Total SKS ${total} kurang dari batas minimal ${SKS_MIN} SKS.`);
  if (total > SKS_MAX) warnings.push(`Total SKS ${total} melebihi batas maksimal ${SKS_MAX} SKS.`);
  if (inti < SKS_INTI_MIN) warnings.push(`SKS Pendidikan + Penelitian ${inti} kurang dari minimal ${SKS_INTI_MIN} SKS.`);
  for (const p of PILARS) if (per[p] === 0) warnings.push(`Pilar ${p} belum terisi.`);
  return { per, total, inti, warnings, totalOk: total >= SKS_MIN && total <= SKS_MAX, intiOk: inti >= SKS_INTI_MIN };
}

export function masaKerja(tmt: string | null, now = new Date()) {
  if (!tmt) return null;
  const s = new Date(tmt);
  let months = (now.getFullYear() - s.getFullYear()) * 12 + (now.getMonth() - s.getMonth());
  if (now.getDate() < s.getDate()) months -= 1;
  if (months < 0) months = 0;
  return { tahun: Math.floor(months / 12), bulan: months % 12, totalBulan: months };
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
