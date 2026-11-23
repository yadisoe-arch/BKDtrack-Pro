import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PILARS, semesterNow, tahunOptions } from "@/lib/bkd";
import { Dashboard } from "@/components/bkd/Dashboard";
import { Logbook } from "@/components/bkd/Logbook";
import { Karier } from "@/components/bkd/Karier";
import { Akses } from "@/components/bkd/Akses";
import { PdfTool } from "@/components/bkd/PdfTool";
import { Kalender } from "@/components/bkd/Kalender";
import { NotificationBell } from "@/components/bkd/NotificationBell";
import { LkdPrint } from "@/components/bkd/LkdPrint";
import { ROLE_LABEL, type Workspace } from "@/components/bkd/types";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — BKDTrack Pro" },
      { name: "description", content: "Kelola logbook dan kepatuhan BKD Anda." },
      { property: "og:title", content: "Dashboard — BKDTrack Pro" },
      { property: "og:description", content: "Kelola logbook dan kepatuhan BKD Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const now = semesterNow();
  const [semester, setSemester] = useState(now.semester);
  const [tahun, setTahun] = useState(now.tahun);
  const [wsId, setWsId] = useState(user.id);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces", user.id],
    queryFn: async (): Promise<Workspace[]> => {
      const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const { data: gs } = await supabase.from("access_grants").select("*").ilike("member_email", user.email ?? "");
      const others = (gs ?? []).filter((g) => g.owner_id !== user.id);
      const { data: profs } = others.length ? await supabase.from("profiles").select("id, full_name, email").in("id", others.map((g) => g.owner_id)) : { data: [] };
      return [
        { ownerId: user.id, name: me?.full_name ?? "Saya", role: "admin", pilars: [...PILARS] },
        ...others.map((g) => {
          const p = profs?.find((x) => x.id === g.owner_id);
          return { ownerId: g.owner_id, name: p?.full_name ?? p?.email ?? "Dosen", role: g.role as Workspace["role"], pilars: g.pilars };
        }),
      ];
    },
  });
  const ws = workspaces.find((w) => w.ownerId === wsId) ?? workspaces[0];

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", wsId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", wsId).maybeSingle()).data,
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["entries", wsId, semester, tahun],
    queryFn: async () => (await supabase.from("logbook_entries").select("*").eq("owner_id", wsId).eq("semester", semester).eq("tahun_akademik", tahun).order("tanggal_mulai", { ascending: false })).data ?? [],
  });
  const { data: agendas = [] } = useQuery({
    queryKey: ["agenda", wsId],
    queryFn: async () => (await supabase.from("agenda").select("*").eq("owner_id", wsId).order("mulai")).data ?? [],
  });
  const refreshAgenda = () => qc.invalidateQueries({ queryKey: ["agenda", wsId] });
  const refresh = () => qc.invalidateQueries({ queryKey: ["entries", wsId] });

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  if (!ws) return <div className="p-10 text-center text-muted-foreground">Memuat...</div>;
  return (
    <>
      <div className="no-print min-h-screen bg-secondary">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
            <span className="font-display text-xl font-bold text-primary">BKDTrack Pro</span>
            <div className="ml-auto flex items-center gap-2">
              {workspaces.length > 1 && (
                <Select value={wsId} onValueChange={setWsId}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>{workspaces.map((w) => <SelectItem key={w.ownerId} value={w.ownerId}>{w.name} · {ROLE_LABEL[w.role]}</SelectItem>)}</SelectContent></Select>
              )}
              <NotificationBell agendas={agendas} />
              <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
              <Button size="icon" variant="ghost" title="Keluar" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div><h1 className="text-2xl font-bold">{ws.name}</h1><Badge variant="secondary">{ROLE_LABEL[ws.role]}</Badge></div>
            <div className="ml-auto flex gap-2">
              <Select value={semester} onValueChange={setSemester}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ganjil">Ganjil</SelectItem><SelectItem value="Genap">Genap</SelectItem></SelectContent></Select>
              <Select value={tahun} onValueChange={setTahun}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{tahunOptions().map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="dashboard">Dashboard Kepatuhan</TabsTrigger>
              <TabsTrigger value="logbook">Logbook Tridharma</TabsTrigger>
              <TabsTrigger value="karier">Penjenjangan Karier</TabsTrigger>
              <TabsTrigger value="kalender">Kalender Agenda</TabsTrigger>
              <TabsTrigger value="pdf">Gabung & Kompres PDF</TabsTrigger>
              {ws.role === "admin" && <TabsTrigger value="akses">Hak Akses</TabsTrigger>}
            </TabsList>
            <TabsContent value="dashboard"><Dashboard entries={entries} /></TabsContent>
            <TabsContent value="logbook"><Logbook ws={ws} entries={entries} userId={user.id} semester={semester} tahun={tahun} refresh={refresh} onPrint={() => window.print()} /></TabsContent>
            <TabsContent value="karier">{profile ? <Karier key={profile.id} profile={profile} editable={ws.role === "admin"} onSaved={() => refetchProfile()} /> : <p className="text-muted-foreground">Profil tidak tersedia.</p>}</TabsContent>
            <TabsContent value="kalender"><Kalender ws={ws} agendas={agendas} refresh={refreshAgenda} onConverted={refresh} /></TabsContent>
            <TabsContent value="pdf"><PdfTool /></TabsContent>
            {ws.role === "admin" && <TabsContent value="akses"><Akses ownerId={user.id} /></TabsContent>}
          </Tabs>
        </main>
      </div>
      <LkdPrint profile={profile ?? null} entries={entries} semester={semester} tahun={tahun} />
    </>
  );
}
