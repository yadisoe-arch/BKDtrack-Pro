import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk — BKDTrack Pro" },
      { name: "description", content: "Masuk atau daftar ke BKDTrack Pro." },
      { property: "og:title", content: "Masuk — BKDTrack Pro" },
      { property: "og:description", content: "Masuk atau daftar ke BKDTrack Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return void toast.error(error.message);
    nav({ to: "/app" });
  }
  async function register(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: window.location.origin + "/app", data: { full_name: name } },
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (data.session) nav({ to: "/app" });
    else toast.success("Pendaftaran berhasil. Periksa email Anda untuk konfirmasi.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="font-display text-2xl font-bold text-primary">BKDTrack Pro</Link>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Logbook Tridharma & karier dosen</p>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Masuk</TabsTrigger><TabsTrigger value="register">Daftar</TabsTrigger></TabsList>
          <TabsContent value="login">
            <form onSubmit={login} className="mt-4 space-y-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Kata sandi</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" disabled={busy}>Masuk</Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={register} className="mt-4 space-y-4">
              <div><Label>Nama lengkap</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Kata sandi</Label><Input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" disabled={busy}>Daftar</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
