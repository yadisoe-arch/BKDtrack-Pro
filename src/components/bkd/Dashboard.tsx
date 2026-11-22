import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { compliance, PILARS, SKS_INTI_MIN, SKS_MAX, SKS_MIN } from "@/lib/bkd";
import type { Entry } from "./types";

export function Dashboard({ entries }: { entries: Entry[] }) {
  const c = compliance(entries);
  const data = PILARS.map((p, i) => ({ pilar: p, sks: c.per[p], fill: `var(--chart-${i + 1})` }));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total SKS</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{c.total}</p><p className="text-xs text-muted-foreground">Target {SKS_MIN}–{SKS_MAX} SKS</p>
            <Progress className="mt-3" value={Math.min(100, (c.total / SKS_MAX) * 100)} />
            <Ok ok={c.totalOk} /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendidikan + Penelitian</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{c.inti}</p><p className="text-xs text-muted-foreground">Minimal {SKS_INTI_MIN} SKS</p>
            <Progress className="mt-3" value={Math.min(100, (c.inti / SKS_INTI_MIN) * 100)} />
            <Ok ok={c.intiOk} /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Keterisian Pilar</CardTitle></CardHeader>
          <CardContent className="space-y-2">{PILARS.map((p) => (
            <div key={p} className="flex items-center justify-between text-sm"><span>{p}</span>
              <span className={c.per[p] > 0 ? "font-semibold text-success" : "text-muted-foreground"}>{c.per[p] > 0 ? `${c.per[p]} SKS ✓` : "Kosong"}</span></div>
          ))}</CardContent></Card>
      </div>
      {c.warnings.length > 0 && (
        <div className="rounded-lg border border-warning bg-warning/10 p-4">
          <p className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warning" /> Peringatan Kepatuhan</p>
          <ul className="list-disc space-y-1 pl-6 text-sm">{c.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      <Card><CardHeader><CardTitle>Distribusi SKS per Pilar</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={{ sks: { label: "SKS" } }} className="h-72 w-full">
            <BarChart data={data}><CartesianGrid vertical={false} /><XAxis dataKey="pilar" /><YAxis allowDecimals />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sks" radius={6}>{data.map((d) => <Cell key={d.pilar} fill={d.fill} />)}</Bar></BarChart>
          </ChartContainer>
        </CardContent></Card>
    </div>
  );
}
function Ok({ ok }: { ok: boolean }) {
  return ok ? <p className="mt-2 flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> Memenuhi</p>
    : <p className="mt-2 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> Belum memenuhi</p>;
}
