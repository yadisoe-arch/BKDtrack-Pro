import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BKD — Badan Kepegawaian Daerah" },
      { name: "description", content: "Informasi dan layanan kepegawaian ASN: kenaikan pangkat, mutasi, cuti, dan pensiun." },
      { property: "og:title", content: "BKD — Badan Kepegawaian Daerah" },
      { property: "og:description", content: "Informasi dan layanan kepegawaian ASN daerah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const layanan = [
  ["Kenaikan Pangkat", "Pengajuan dan verifikasi berkas kenaikan pangkat ASN."],
  ["Mutasi & Rotasi", "Proses perpindahan jabatan dan unit kerja."],
  ["Cuti Pegawai", "Permohonan cuti tahunan, besar, dan alasan penting."],
  ["Pensiun", "Pengurusan berkas pensiun dan SK pemberhentian."],
  ["Pengembangan Kompetensi", "Diklat, pelatihan, dan tugas belajar."],
  ["Data Kepegawaian", "Pemutakhiran data ASN secara mandiri."],
];

const berita = [
  ["12 Nov 2026", "Jadwal seleksi PPPK tahap II telah diumumkan"],
  ["05 Nov 2026", "Pemutakhiran data mandiri ASN diperpanjang hingga akhir bulan"],
  ["28 Okt 2026", "Sosialisasi manajemen talenta untuk pejabat struktural"],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-gold">B</div>
            <div className="leading-tight">
              <p className="font-display text-lg font-bold text-primary">BKD</p>
              <p className="text-xs text-muted-foreground">Badan Kepegawaian Daerah</p>
            </div>
          </div>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#layanan" className="hover:text-primary">Layanan</a>
            <a href="#berita" className="hover:text-primary">Berita</a>
            <a href="#kontak" className="hover:text-primary">Kontak</a>
          </nav>
        </div>
      </header>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">Melayani ASN dengan sepenuh hati</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Kepegawaian yang tertib, transparan, dan cepat.</h1>
          <p className="mt-6 max-w-xl text-primary-foreground/80">Satu pintu untuk seluruh layanan administrasi Aparatur Sipil Negara di lingkungan pemerintah daerah.</p>
          <a href="#layanan" className="mt-8 inline-block rounded-md bg-gold px-6 py-3 font-semibold text-primary">Lihat Layanan</a>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {[["8.420", "ASN aktif"], ["46", "Perangkat daerah"], ["1.250", "Layanan / bulan"], ["3 hari", "Rata-rata proses"]].map(([n, l]) => (
            <div key={l}><p className="font-display text-3xl font-bold text-primary">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      <section id="layanan" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold text-primary">Layanan Kami</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {layanan.map(([t, d], i) => (
            <div key={t} className="rounded-lg border border-border bg-card p-6 transition hover:border-primary">
              <p className="font-display text-sm text-gold">0{i + 1}</p>
              <h3 className="mt-2 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="berita" className="bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold text-primary">Berita & Pengumuman</h2>
          <ul className="mt-8 divide-y divide-border">
            {berita.map(([d, t]) => (
              <li key={t} className="flex flex-col gap-1 py-5 md:flex-row md:gap-8">
                <span className="w-32 shrink-0 text-sm text-muted-foreground">{d}</span>
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer id="kontak" className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <div><p className="font-display text-xl font-bold">BKD</p><p className="mt-2 text-sm text-primary-foreground/70">Badan Kepegawaian Daerah</p></div>
          <div className="text-sm text-primary-foreground/80"><p className="font-semibold text-gold">Alamat</p><p>Jl. Merdeka No. 1, Kota</p></div>
          <div className="text-sm text-primary-foreground/80"><p className="font-semibold text-gold">Jam Layanan</p><p>Senin–Jumat, 08.00–16.00</p></div>
        </div>
      </footer>
    </div>
  );
}
