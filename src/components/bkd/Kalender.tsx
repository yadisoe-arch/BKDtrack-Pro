import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PILARS, semesterNow } from "@/lib/bkd";
import { PILAR_COLOR, REMINDERS, TIME_GROUPS, timeStatus } from "@/lib/agenda";
import { AgendaDialog } from "./AgendaDialog";
import type { Agenda, Workspace } from "./types";

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const fmt = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function Kalender({ ws, agendas, refresh, onConverted }: { ws: Workspace; agendas: Agenda[]; refresh: () => void; onConverted: () => void }) {
  const isAdmin = ws.role === "admin";
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<Date | null>(null);
  const [edit, setEdit] = useState<{ a: Agenda | null; date: Date } | null>(null);

  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const onDay = (d: Date) => agendas.filter((a) => { const s = new Date(a.mulai), e = new Date(a.selesai); const x = new Date(d); x.setHours(12); return sameDay(s, d) || sameDay(e, d) || (s < x && e > x); });
  const list = selected ? onDay(selected) : agendas;

  async function del(a: Agenda) {
    if (!confirm(`Hapus agenda "${a.judul}"?`)) return;
    const { error } = await supabase.from("agenda").delete().eq("id", a.id);
    if (error) return void toast.error(error.message);
    refresh();
  }
  async function convert(a: Agenda) {
    const sem = semesterNow(new Date(a.mulai));
    const desk = [a.catatan, a.lokasi && `Lokasi: ${a.lokasi}`, a.tautan && `Tautan: ${a.tautan}`].filter(Boolean).join("\n");
    const { data, error } = await supabase.from("logbook_entries").insert({
      owner_id: ws.ownerId, pilar: a.pilar, judul: a.judul, deskripsi: desk || null, sub_kegiatan: "Dari Kalender Agenda",
      tanggal_mulai: a.mulai.slice(0, 10), tanggal_selesai: a.selesai.slice(0, 10), sks: 0, status: "Menunggu Review",
      bukti_url: a.tautan, semester: sem.semester, tahun_akademik: sem.tahun,
    }).select("id").single();
    if (error) return void toast.error(error.message);
    await supabase.from("agenda").update({ converted_entry_id: data.id }).eq("id", a.id);
    toast.success(`Masuk ke logbook ${sem.semester} ${sem.tahun}. Isi bobot SKS di tab Logbook.`);
    refresh(); onConverted();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{month.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</CardTitle>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => { const d = new Date(); d.setDate(1); setMonth(d); setSelected(null); }}>Hari ini</Button>
            <Button size="icon" variant="ghost" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            {isAdmin && <Button size="sm" onClick={() => setEdit({ a: null, date: selected ?? new Date() })}><Plus className="h-4 w-4" /> Agenda</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{HARI.map((h) => <div key={h}>{h}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d) => {
              const items = onDay(d); const other = d.getMonth() !== month.getMonth(); const sel = selected && sameDay(d, selected);
              return (
                <button key={d.toISOString()} onClick={() => setSelected(sel ? null : d)}
                  className={`min-h-20 rounded-md border p-1 text-left align-top transition ${sel ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"} ${other ? "opacity-40" : ""}`}>
                  <span className={`text-xs font-semibold ${sameDay(d, new Date()) ? "rounded-full bg-primary px-1.5 text-primary-foreground" : ""}`}>{d.getDate()}</span>
                  <div className="mt-1 space-y-0.5">{items.slice(0, 2).map((a) => (
                    <div key={a.id} className="flex items-center gap-1 truncate text-[10px]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PILAR_COLOR[a.pilar]}`} />{a.judul}</div>
                  ))}{items.length > 2 && <div className="text-[10px] text-muted-foreground">+{items.length - 2} lagi</div>}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">{PILARS.map((p) => <span key={p} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-full ${PILAR_COLOR[p]}`} />{p}</span>)}</div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {selected && <div className="flex items-center justify-between text-sm"><span>Agenda {selected.toLocaleDateString("id-ID", { dateStyle: "full" })}</span><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Tampilkan semua</Button></div>}
        {TIME_GROUPS.map((g) => {
          const rows = list.filter((a) => timeStatus(a) === g).sort((x, y) => (g === "Sudah Selesai" ? y.mulai.localeCompare(x.mulai) : x.mulai.localeCompare(y.mulai)));
          return (
            <Card key={g}><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base">{g}<Badge variant="secondary">{rows.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {rows.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada agenda.</p>}
                {rows.map((a) => (
                  <div key={a.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PILAR_COLOR[a.pilar]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{a.judul}</p>
                        <p className="text-xs text-muted-foreground">{a.pilar} · {fmt(a.mulai)} – {fmt(a.selesai)}</p>
                        {a.lokasi && <p className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" />{a.lokasi}</p>}
                        {a.tautan && <a href={a.tautan} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary underline"><ExternalLink className="h-3 w-3" />Tautan rapat</a>}
                        {a.catatan && <p className="mt-1 text-xs text-muted-foreground">{a.catatan}</p>}
                        {a.reminder_minutes > 0 && <p className="mt-1 text-xs text-muted-foreground">🔔 {REMINDERS.find((r) => r.value === a.reminder_minutes)?.label}</p>}
                      </div>
                      {isAdmin && <div className="flex">
                        <Button size="icon" variant="ghost" onClick={() => setEdit({ a, date: new Date(a.mulai) })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del(a)}><Trash2 className="h-4 w-4" /></Button></div>}
                    </div>
                    {isAdmin && g === "Sudah Selesai" && (a.converted_entry_id
                      ? <p className="mt-2 text-xs text-success">✓ Sudah dikonversi ke logbook</p>
                      : <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => convert(a)}><ClipboardCheck className="h-4 w-4" /> Konversi ke Logbook BKD</Button>)}
                  </div>
                ))}
              </CardContent></Card>
          );
        })}
      </div>
      {edit && <AgendaDialog key={edit.a?.id ?? "new"} agenda={edit.a} defaultDate={edit.date} onClose={() => setEdit(null)} onSaved={refresh} />}
    </div>
  );
}
