import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JENJANG, masaKerja } from "@/lib/bkd";
import type { Profile } from "./types";

const AA = ["Ijazah S2 terverifikasi PDDikti", "Memiliki NIDN/NUPTK", "Karya ilmiah di jurnal nasional", "Laporan BKD memenuhi 2 semester terakhir", "Dokumen usulan PAK lengkap"];
const SERDOS = ["Lulus tes kemampuan bahasa (TKBI)", "Lulus tes potensi akademik (TKDA)", "Laporan BKD lengkap", "Deskripsi diri disusun", "Persetujuan pimpinan PT"];

export function Karier({ profile, editable, onSaved }: { profile: Profile; editable: boolean; onSaved: () => void }) {
  const [jabatan, setJabatan] = useState(profile.jabatan);
  const [tmt, setTmt] = useState(profile.tmt ?? "");
  const [nidn, setNidn] = useState(profile.nidn ?? "");
  const [check, setCheck] = useState<Record<string, boolean>>((profile.checklist as Record<string, boolean>) ?? {});
  const mk = masaKerja(tmt || null);
  const idx = JENJANG.indexOf(jabatan as (typeof JENJANG)[number]);

  async function save() {
    const { error } = await supabase.from("profiles").update({ jabatan, tmt: tmt || null, nidn: nidn || null, checklist: check }).eq("id", profile.id);
    if (error) return void toast.error(error.message);
    toast.success("Data karier disimpan"); onSaved();
  }
  const auto = { aa: (mk?.totalBulan ?? 0) >= 12, serdosJab: idx >= 1, serdosMk: (mk?.totalBulan ?? 0) >= 24 };
  const list = (title: string, items: string[], autos: [string, boolean][]) => {
    const done = items.filter((i) => check[i]).length + autos.filter(([, v]) => v).length;
    const total = items.length + autos.length;
    return (
      <Card><CardHeader><CardTitle className="flex justify-between text-base">{title}<span className="text-sm text-muted-foreground">{done}/{total} siap</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {autos.map(([l, v]) => <div key={l} className="flex items-center gap-3 text-sm"><Checkbox checked={v} disabled /><span>{l} <span className="text-xs text-muted-foreground">(otomatis)</span></span></div>)}
          {items.map((i) => <label key={i} className="flex items-center gap-3 text-sm"><Checkbox disabled={!editable} checked={!!check[i]} onCheckedChange={(v) => setCheck((c) => ({ ...c, [i]: !!v }))} />{i}</label>)}
        </CardContent></Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Peta Jalan Jabatan Akademik</CardTitle></CardHeader>
        <CardContent>
          <ol className="grid gap-3 md:grid-cols-5">
            {JENJANG.map((j, i) => (
              <li key={j} className={`rounded-lg border p-4 text-center ${i === idx ? "border-primary bg-primary text-primary-foreground" : i < idx ? "border-primary/40 bg-accent" : "border-border"}`}>
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-current text-sm font-bold">{i < idx ? <Check className="h-4 w-4" /> : i + 1}</div>
                <p className="text-sm font-semibold">{j}</p>
              </li>
            ))}
          </ol>
        </CardContent></Card>
      <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-4">
        <div><Label>Jabatan saat ini</Label>
          <Select value={jabatan} onValueChange={setJabatan} disabled={!editable}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{JENJANG.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>TMT (Tanggal Mulai Tugas)</Label><Input type="date" disabled={!editable} value={tmt} onChange={(e) => setTmt(e.target.value)} /></div>
        <div><Label>NIDN/NUPTK</Label><Input disabled={!editable} value={nidn} onChange={(e) => setNidn(e.target.value)} /></div>
        <div><Label>Masa kerja</Label><p className="pt-2 text-2xl font-bold text-primary">{mk ? `${mk.tahun} th ${mk.bulan} bl` : "—"}</p></div>
      </CardContent></Card>
      <div className="grid gap-6 md:grid-cols-2">
        {list("Kesiapan Asisten Ahli", AA, [["Masa kerja minimal 1 tahun", auto.aa]])}
        {list("Kesiapan Sertifikasi Dosen", SERDOS, [["Jabatan minimal Asisten Ahli", auto.serdosJab], ["Masa kerja minimal 2 tahun", auto.serdosMk]])}
      </div>
      {editable && <Button onClick={save}>Simpan Data Karier</Button>}
    </div>
  );
}
