import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildPdf, fmtSize, kindOf, PRESETS, type Item, type Preset } from "@/lib/pdf-merge";

export function PdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [preset, setPreset] = useState<Preset>("kecil");
  const [title, setTitle] = useState("Berkas Bukti Kinerja Dosen");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState("");
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);

  function add(files: FileList | null) {
    if (!files) return;
    const ok: Item[] = [];
    for (const f of Array.from(files)) {
      if (!kindOf(f)) { toast.error(`${f.name}: format tidak didukung`); continue; }
      ok.push({ id: crypto.randomUUID(), file: f, title: f.name.replace(/\.[^.]+$/, ""), cover: false });
    }
    setItems((s) => [...s, ...ok]);
  }
  const move = (i: number, d: number) => setItems((s) => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });
  const upd = (id: string, patch: Partial<Item>) => setItems((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const before = items.reduce((a, b) => a + b.file.size, 0);

  async function run() {
    if (!items.length) return void toast.error("Tambahkan file terlebih dahulu");
    try {
      setBusy("Memulai...");
      const bytes = await buildPdf(items, preset, title, setBusy);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setOut({ url: URL.createObjectURL(blob), size: blob.size });
      toast.success("PDF berhasil dibuat");
    } catch (e) {
      toast.error("Gagal memproses: " + (e instanceof Error ? e.message : String(e)));
    } finally { setBusy(""); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
          onClick={() => input.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? "border-primary bg-accent" : "border-border bg-card"}`}>
          <FileUp className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 font-medium">Seret & lepas file di sini, atau klik untuk memilih</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, DOCX, XLSX · diproses di perangkat Anda, tidak diunggah</p>
          <input ref={input} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.xls,.csv" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>
        <div><Label>Judul halaman sampul utama (kosongkan jika tidak perlu)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Susunan File ({items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada file.</p>}
            {items.map((it, i) => (
              <div key={it.id} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-sm font-bold text-primary">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{it.file.name}</p><p className="text-xs text-muted-foreground">{kindOf(it.file)?.toUpperCase()} · {fmtSize(it.file.size)}</p></div>
                  <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-2 flex items-center gap-2 pl-8">
                  <label className="flex shrink-0 items-center gap-2 text-xs"><Checkbox checked={it.cover} onCheckedChange={(v) => upd(it.id, { cover: !!v })} />Halaman pembatas</label>
                  {it.cover && <Input className="h-8 text-xs" placeholder="Judul bukti kegiatan" value={it.title} onChange={(e) => upd(it.id, { title: e.target.value })} />}
                </div>
              </div>
            ))}
          </CardContent></Card>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(PRESETS) as Preset[]).map((k) => (
            <button key={k} onClick={() => setPreset(k)} className={`rounded-lg border p-3 text-left transition ${preset === k ? "border-primary bg-accent" : "border-border bg-card"}`}>
              <p className="text-sm font-semibold">{PRESETS[k].label}</p><p className="text-xs text-muted-foreground">{PRESETS[k].desc}</p>
            </button>
          ))}
        </div>
        <Button className="w-full" size="lg" disabled={!!busy || !items.length} onClick={run}>{busy || "Gabung & Kompres PDF"}</Button>
      </div>
      <Card><CardHeader><CardTitle>Hasil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Sebelum</p><p className="text-xl font-bold">{fmtSize(before)}</p></div>
            <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">Sesudah</p><p className="text-xl font-bold text-primary">{out ? fmtSize(out.size) : "—"}</p>
              {out && before > 0 && <p className="text-xs text-muted-foreground">{out.size < before ? `hemat ${Math.round((1 - out.size / before) * 100)}%` : `+${Math.round((out.size / before - 1) * 100)}%`}</p>}</div>
          </div>
          {out && preset === "kecil" && out.size > 2 * 1024 * 1024 && <p className="text-xs text-destructive">Hasil masih di atas 2 MB. Kurangi jumlah halaman atau pisahkan berkas.</p>}
          {out ? (<>
            <iframe title="Pratinjau PDF" src={out.url} className="h-[600px] w-full rounded-md border border-border" />
            <Button asChild className="w-full"><a href={out.url} download={`${(title || "bukti-bkd").replace(/[^\w-]+/g, "_")}.pdf`}><Download className="h-4 w-4" /> Unduh PDF</a></Button>
          </>) : <p className="py-20 text-center text-sm text-muted-foreground">Pratinjau PDF akan tampil di sini.</p>}
        </CardContent></Card>
    </div>
  );
}
