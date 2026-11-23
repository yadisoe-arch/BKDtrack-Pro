import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PILARS } from "@/lib/bkd";
import { REMINDERS } from "@/lib/agenda";
import type { Agenda } from "./types";

const local = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export function AgendaDialog({ agenda, defaultDate, onClose, onSaved }: { agenda: Agenda | null; defaultDate: Date; onClose: () => void; onSaved: () => void }) {
  const base = new Date(defaultDate); base.setHours(9, 0, 0, 0);
  const end = new Date(base); end.setHours(11);
  const [f, setF] = useState({
    judul: agenda?.judul ?? "", pilar: agenda?.pilar ?? "Pendidikan",
    mulai: local(agenda?.mulai ?? base.toISOString()), selesai: local(agenda?.selesai ?? end.toISOString()),
    lokasi: agenda?.lokasi ?? "", tautan: agenda?.tautan ?? "", catatan: agenda?.catatan ?? "",
    reminder: String(agenda?.reminder_minutes ?? 60),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.selesai < f.mulai) return void toast.error("Waktu selesai harus setelah waktu mulai");
    const payload = { judul: f.judul, pilar: f.pilar, mulai: new Date(f.mulai).toISOString(), selesai: new Date(f.selesai).toISOString(),
      lokasi: f.lokasi || null, tautan: f.tautan || null, catatan: f.catatan || null, reminder_minutes: Number(f.reminder) };
    const { error } = agenda ? await supabase.from("agenda").update(payload).eq("id", agenda.id) : await supabase.from("agenda").insert(payload);
    if (error) return void toast.error(error.message);
    toast.success("Agenda disimpan"); onSaved(); onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{agenda ? "Edit Agenda" : "Tambah Agenda"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Judul</Label><Input required value={f.judul} onChange={(e) => set("judul", e.target.value)} /></div>
          <div><Label>Pilar</Label><Select value={f.pilar} onValueChange={(v) => set("pilar", v)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PILARS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mulai</Label><Input type="datetime-local" required value={f.mulai} onChange={(e) => set("mulai", e.target.value)} /></div>
            <div><Label>Selesai</Label><Input type="datetime-local" required value={f.selesai} onChange={(e) => set("selesai", e.target.value)} /></div>
          </div>
          <div><Label>Lokasi</Label><Input value={f.lokasi} onChange={(e) => set("lokasi", e.target.value)} /></div>
          <div><Label>Tautan rapat</Label><Input type="url" placeholder="https://" value={f.tautan} onChange={(e) => set("tautan", e.target.value)} /></div>
          <div><Label>Catatan</Label><Textarea value={f.catatan} onChange={(e) => set("catatan", e.target.value)} /></div>
          <div><Label>Atur Pengingat/Alarm</Label><Select value={f.reminder} onValueChange={(v) => set("reminder", v)}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REMINDERS.map((r) => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          <Button className="w-full">Simpan</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
