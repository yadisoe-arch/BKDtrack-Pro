import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { reminderDue } from "@/lib/agenda";
import type { Agenda } from "./types";

export function NotificationBell({ agendas }: { agendas: Agenda[] }) {
  const [now, setNow] = useState(() => new Date());
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => { if ("Notification" in window) setPerm(Notification.permission); const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const due = agendas.filter((a) => reminderDue(a, now));

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    for (const a of due) {
      const key = `bkd-notified-${a.id}-${a.mulai}-${a.reminder_minutes}`;
      if (localStorage.getItem(key)) continue;
      localStorage.setItem(key, "1");
      new Notification(`Pengingat: ${a.judul}`, { body: `${a.pilar} · mulai ${new Date(a.mulai).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}${a.lokasi ? ` · ${a.lokasi}` : ""}` });
    }
  }, [due, perm]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative" title="Notifikasi">
          <Bell className="h-4 w-4" />
          {due.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{due.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="mb-2 font-semibold">Pengingat Agenda</p>
        {due.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada pengingat aktif.</p>}
        <div className="space-y-2">{due.map((a) => (
          <div key={a.id} className="rounded-md border border-border p-2 text-sm"><p className="font-medium">{a.judul}</p>
            <p className="text-xs text-muted-foreground">Mulai {new Date(a.mulai).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p></div>
        ))}</div>
        {perm !== "granted" && (
          <Button size="sm" variant="outline" className="mt-3 w-full" disabled={perm === "denied"}
            onClick={async () => setPerm(await Notification.requestPermission())}>
            {perm === "denied" ? "Notifikasi diblokir di browser" : "Aktifkan pop-up pengingat browser"}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
