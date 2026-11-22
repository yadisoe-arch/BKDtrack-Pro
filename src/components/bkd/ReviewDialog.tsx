import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Entry } from "./types";

export function ReviewDialog({ entry, onClose, onSaved }: { entry: Entry | null; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState(entry?.catatan_reviewer ?? "");
  async function save(status: string) {
    if (!entry) return;
    const { error } = await supabase.from("logbook_entries").update({ status, catatan_reviewer: note || null }).eq("id", entry.id);
    if (error) return void toast.error(error.message);
    toast.success("Verifikasi disimpan"); onSaved(); onClose();
  }
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Verifikasi: {entry?.judul}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{entry?.pilar} · {entry?.sks} SKS</p>
        <div><Label>Catatan reviewer</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => save("Disetujui")}>Disetujui</Button>
          <Button className="flex-1" variant="destructive" onClick={() => save("Perlu Revisi")}>Perlu Revisi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
