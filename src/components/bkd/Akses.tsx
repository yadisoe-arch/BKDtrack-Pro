import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PILARS } from "@/lib/bkd";

export function Akses({ ownerId }: { ownerId: string }) {
  const qc = useQueryClient();
  const { data: grants = [] } = useQuery({
    queryKey: ["grants", ownerId],
    queryFn: async () => (await supabase.from("access_grants").select("*").eq("owner_id", ownerId).order("created_at")).data ?? [],
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("kontributor");
  const [pilars, setPilars] = useState<string[]>([...PILARS]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!pilars.length) return void toast.error("Pilih minimal satu pilar");
    const { error } = await supabase.from("access_grants").upsert({ owner_id: ownerId, member_email: email.trim().toLowerCase(), role, pilars }, { onConflict: "owner_id,member_email" });
    if (error) return void toast.error(error.message);
    toast.success("Akses diberikan. Minta pengguna mendaftar dengan email tersebut."); setEmail("");
    qc.invalidateQueries({ queryKey: ["grants", ownerId] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("access_grants").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["grants", ownerId] });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card><CardHeader><CardTitle>Undang Pengguna</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Peran</Label>
              <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="kontributor">Asisten/Staf (Kontributor)</SelectItem><SelectItem value="reviewer">Asesor/Kaprodi (Reviewer)</SelectItem></SelectContent></Select></div>
            <div><Label>Pilar yang diizinkan</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">{PILARS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm"><Checkbox checked={pilars.includes(p)} onCheckedChange={(v) => setPilars((s) => v ? [...s, p] : s.filter((x) => x !== p))} />{p}</label>
              ))}</div></div>
            <Button className="w-full">Berikan Akses</Button>
          </form>
        </CardContent></Card>
      <Card><CardHeader><CardTitle>Pengguna dengan Akses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {grants.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengguna yang diundang.</p>}
          {grants.map((g) => (
            <div key={g.id} className="flex items-start justify-between rounded-md border border-border p-3">
              <div><p className="font-medium">{g.member_email}</p>
                <p className="text-xs text-muted-foreground">{g.role === "reviewer" ? "Reviewer" : "Kontributor"} · {g.pilars.join(", ")}</p></div>
              <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent></Card>
    </div>
  );
}
