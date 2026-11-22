import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES } from "@/lib/bkd";
import type { Entry, Workspace } from "./types";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; ws: Workspace; entry: Entry | null; semester: string; tahun: string; onSaved: () => void };

export function EntryDialog({ open, onOpenChange, ws, entry, semester, tahun, onSaved }: Props) {
  const isAdmin = ws.role === "admin";
  const [f, setF] = useState(() => ({
    pilar: entry?.pilar ?? ws.pilars[0] ?? "Pendidikan",
    sub_kegiatan: entry?.sub_kegiatan ?? "",
    judul: entry?.judul ?? "",
    deskripsi: entry?.deskripsi ?? "",
    tanggal_mulai: entry?.tanggal_mulai ?? "",
    tanggal_selesai: entry?.tanggal_selesai ?? "",
    sks: String(entry?.sks ?? ""),
    bukti_url: entry?.bukti_url ?? "",
    status: entry?.status ?? (isAdmin ? "Disetujui" : "Menunggu Review"),
  }));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.tanggal_mulai && f.tanggal_selesai && f.tanggal_selesai < f.tanggal_mulai) return void toast.error("Tanggal selesai harus setelah tanggal mulai");
    setBusy(true);
    let bukti_path = entry?.bukti_path ?? null;
    if (file) {
      const path = `${ws.ownerId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("bukti").upload(path, file);
      if (error) { setBusy(false); return void toast.error("Gagal unggah: " + error.message); }
      bukti_path = path;
    }
    const payload = {
      pilar: f.pilar, sub_kegiatan: f.sub_kegiatan || null, judul: f.judul, deskripsi: f.deskripsi || null,
      tanggal_mulai: f.tanggal_mulai || null, tanggal_selesai: f.tanggal_selesai || null, sks: Number(f.sks) || 0,
      bukti_url: f.bukti_url || null, bukti_path, status: isAdmin ? f.status : "Menunggu Review",
    };
    const { error } = entry
      ? await supabase.from("logbook_entries").update(payload).eq("id", entry.id)
      : await supabase.from("logbook_entries").insert({ ...payload, owner_id: ws.ownerId, semester, tahun_akademik: tahun });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(isAdmin ? "Kegiatan disimpan" : "Kegiatan dikirim, menunggu review");
    onSaved(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{entry ? "Edit Kegiatan" : "Tambah Kegiatan"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Pilar</Label>
              <Select value={f.pilar} onValueChange={(v) => set("pilar", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ws.pilars.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Bobot SKS</Label><Input type="number" step="0.25" min="0" required value={f.sks} onChange={(e) => set("sks", e.target.value)} /></div>
          </div>
          <div><Label>Sub-kegiatan</Label><Input placeholder="mis. Mengajar mata kuliah" value={f.sub_kegiatan} onChange={(e) => set("sub_kegiatan", e.target.value)} /></div>
          <div><Label>Judul</Label><Input required value={f.judul} onChange={(e) => set("judul", e.target.value)} /></div>
          <div><Label>Deskripsi</Label><Textarea value={f.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tanggal mulai</Label><Input type="date" value={f.tanggal_mulai} onChange={(e) => set("tanggal_mulai", e.target.value)} /></div>
            <div><Label>Tanggal selesai</Label><Input type="date" value={f.tanggal_selesai} onChange={(e) => set("tanggal_selesai", e.target.value)} /></div>
          </div>
          <div><Label>Tautan bukti</Label><Input type="url" placeholder="https://" value={f.bukti_url} onChange={(e) => set("bukti_url", e.target.value)} /></div>
          <div><Label>Unggah dokumen bukti (maks 10 MB)</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          {isAdmin && (
            <div><Label>Status verifikasi</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          )}
          <Button className="w-full" disabled={busy}>{busy ? "Menyimpan..." : "Simpan"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
