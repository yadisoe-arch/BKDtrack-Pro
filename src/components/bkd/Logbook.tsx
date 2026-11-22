import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Pencil, Plus, Printer, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PILARS, STATUSES, toCsv } from "@/lib/bkd";
import { EntryDialog } from "./EntryDialog";
import { ReviewDialog } from "./ReviewDialog";
import { StatusBadge } from "./StatusBadge";
import type { Entry, Workspace } from "./types";

type Props = { ws: Workspace; entries: Entry[]; userId: string; semester: string; tahun: string; refresh: () => void; onPrint: () => void };

export function Logbook({ ws, entries, userId, semester, tahun, refresh, onPrint }: Props) {
  const [q, setQ] = useState("");
  const [pilar, setPilar] = useState("all");
  const [status, setStatus] = useState("all");
  const [edit, setEdit] = useState<Entry | null>(null);
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<Entry | null>(null);

  const rows = useMemo(() => entries.filter((e) =>
    (pilar === "all" || e.pilar === pilar) && (status === "all" || e.status === status) &&
    (!q || `${e.judul} ${e.sub_kegiatan ?? ""} ${e.deskripsi ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [entries, q, pilar, status]);

  const canEdit = (e: Entry) => ws.role === "admin" || (ws.role === "kontributor" && e.created_by === userId && e.status !== "Disetujui");

  async function del(e: Entry) {
    if (!confirm(`Hapus "${e.judul}"?`)) return;
    const { error } = await supabase.from("logbook_entries").delete().eq("id", e.id);
    if (error) return void toast.error(error.message);
    toast.success("Dihapus"); refresh();
  }
  async function openBukti(path: string) {
    const { data, error } = await supabase.storage.from("bukti").createSignedUrl(path, 300);
    if (error) return void toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }
  function exportCsv() {
    const csv = toCsv(rows.map((e) => ({ Pilar: e.pilar, "Sub-kegiatan": e.sub_kegiatan, Judul: e.judul, Deskripsi: e.deskripsi, Mulai: e.tanggal_mulai, Selesai: e.tanggal_selesai, SKS: e.sks, Status: e.status, Catatan: e.catatan_reviewer, Bukti: e.bukti_url })));
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `logbook-${semester}-${tahun.replace("/", "-")}.csv`; a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Cari kegiatan..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={pilar} onValueChange={setPilar}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua pilar</SelectItem>{PILARS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua status</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={onPrint}><Printer className="h-4 w-4" /> Cetak LKD</Button>
          {ws.role !== "reviewer" && <Button onClick={() => { setEdit(null); setOpen(true); }}><Plus className="h-4 w-4" /> Tambah</Button>}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Pilar</TableHead><TableHead>Kegiatan</TableHead><TableHead>Tanggal</TableHead><TableHead>SKS</TableHead><TableHead>Status</TableHead><TableHead>Bukti</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada kegiatan di semester ini.</TableCell></TableRow>}
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.pilar}</TableCell>
                <TableCell><p className="font-medium">{e.judul}</p><p className="text-xs text-muted-foreground">{e.sub_kegiatan}</p>
                  {e.catatan_reviewer && <p className="mt-1 text-xs italic text-muted-foreground">Catatan: {e.catatan_reviewer}</p>}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{e.tanggal_mulai ?? "-"} – {e.tanggal_selesai ?? "-"}</TableCell>
                <TableCell>{Number(e.sks)}</TableCell>
                <TableCell><StatusBadge status={e.status} /></TableCell>
                <TableCell className="space-x-2 text-xs">
                  {e.bukti_url && <a className="text-primary underline" href={e.bukti_url} target="_blank" rel="noreferrer">Tautan</a>}
                  {e.bukti_path && <button className="text-primary underline" onClick={() => openBukti(e.bukti_path!)}><FileText className="inline h-3 w-3" /> File</button>}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  {(ws.role === "reviewer" || ws.role === "admin") && <Button size="icon" variant="ghost" title="Verifikasi" onClick={() => setReview(e)}><ShieldCheck className="h-4 w-4" /></Button>}
                  {canEdit(e) && <Button size="icon" variant="ghost" title="Edit" onClick={() => { setEdit(e); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>}
                  {canEdit(e) && <Button size="icon" variant="ghost" title="Hapus" onClick={() => del(e)}><Trash2 className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {open && <EntryDialog key={edit?.id ?? "new"} open={open} onOpenChange={setOpen} ws={ws} entry={edit} semester={semester} tahun={tahun} onSaved={refresh} />}
      {review && <ReviewDialog key={review.id} entry={review} onClose={() => setReview(null)} onSaved={refresh} />}
    </div>
  );
}
