import { compliance, PILARS } from "@/lib/bkd";
import type { Entry, Profile } from "./types";

export function LkdPrint({ profile, entries, semester, tahun }: { profile: Profile | null; entries: Entry[]; semester: string; tahun: string }) {
  const c = compliance(entries);
  return (
    <div className="print-only p-8 text-sm">
      <h1 className="text-center text-xl font-bold">LAPORAN KINERJA DOSEN (LKD)</h1>
      <p className="text-center">Semester {semester} Tahun Akademik {tahun}</p>
      <table className="mt-6"><tbody>
        <tr><td className="pr-4">Nama</td><td>: {profile?.full_name}</td></tr>
        <tr><td className="pr-4">NIDN/NUPTK</td><td>: {profile?.nidn ?? "-"}</td></tr>
        <tr><td className="pr-4">Jabatan</td><td>: {profile?.jabatan}</td></tr>
      </tbody></table>
      {PILARS.map((p) => {
        const rows = entries.filter((e) => e.pilar === p);
        return (
          <div key={p} className="mt-6">
            <h2 className="font-bold">{p} ({c.per[p]} SKS)</h2>
            <table className="mt-2 w-full border-collapse">
              <thead><tr>{["No", "Kegiatan", "Tanggal", "SKS", "Status"].map((h) => <th key={h} className="border border-foreground p-1 text-left">{h}</th>)}</tr></thead>
              <tbody>{rows.length === 0 ? <tr><td colSpan={5} className="border border-foreground p-1 text-center">-</td></tr> : rows.map((e, i) => (
                <tr key={e.id}><td className="border border-foreground p-1">{i + 1}</td><td className="border border-foreground p-1">{e.judul}{e.sub_kegiatan ? ` (${e.sub_kegiatan})` : ""}</td>
                  <td className="border border-foreground p-1">{e.tanggal_mulai ?? "-"} s/d {e.tanggal_selesai ?? "-"}</td><td className="border border-foreground p-1">{Number(e.sks)}</td><td className="border border-foreground p-1">{e.status}</td></tr>
              ))}</tbody>
            </table>
          </div>
        );
      })}
      <div className="mt-6"><p><b>Total SKS:</b> {c.total} ({c.totalOk ? "Memenuhi" : "Belum memenuhi"} 12–16 SKS)</p>
        <p><b>Pendidikan + Penelitian:</b> {c.inti} SKS ({c.intiOk ? "Memenuhi" : "Belum memenuhi"} minimal 9 SKS)</p></div>
      <div className="mt-16 grid grid-cols-2 text-center"><div>Asesor<br /><br /><br /><br />(.................................)</div><div>Dosen ybs.<br /><br /><br /><br />({profile?.full_name})</div></div>
    </div>
  );
}
