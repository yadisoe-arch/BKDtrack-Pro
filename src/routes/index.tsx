import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BKDTrack Pro — Logbook Tridharma & Karier Dosen" },
      { name: "description", content: "Kelola logbook Tridharma, kepatuhan BKD, dan penjenjangan karier dosen sesuai Permendiktisaintek No. 52 Tahun 2025." },
      { property: "og:title", content: "BKDTrack Pro" },
      { property: "og:description", content: "Logbook Tridharma, kepatuhan BKD, dan karier dosen dalam satu tempat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const fitur = [
  ["Dashboard Kepatuhan", "Total SKS 12–16, validasi Pendidikan + Penelitian ≥ 9 SKS, dan peringatan otomatis."],
  ["Logbook Tridharma", "Catat kegiatan per pilar lengkap dengan bukti dokumen, ekspor CSV, dan cetak LKD."],
  ["Kolaborasi Aman", "Undang asisten sebagai kontributor dan asesor sebagai reviewer dengan hak akses per pilar."],
  ["Penjenjangan Karier", "Peta jalan JAD hingga Guru Besar, masa kerja otomatis, dan checklist Serdos."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-xl font-bold text-primary">BKDTrack Pro</span>
        <Button asChild variant="outline"><Link to="/auth">Masuk</Link></Button>
      </header>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Selaras PO BKD & Permendiktisaintek No. 52/2025</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Beban kerja dosen, tercatat rapi dan siap diverifikasi.</h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Satu tempat untuk logbook Tridharma, pemantauan kepatuhan SKS, dan persiapan kenaikan jabatan akademik.</p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Mulai Sekarang</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link to="/app">Buka Dashboard</Link></Button>
        </div>
      </section>
      <section className="border-t border-border bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-4">
          {fitur.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-primary">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
