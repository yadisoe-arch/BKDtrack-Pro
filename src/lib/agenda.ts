export type TimeStatus = "Sedang Berlangsung" | "Akan Datang" | "Sudah Selesai";
export const TIME_GROUPS: TimeStatus[] = ["Sedang Berlangsung", "Akan Datang", "Sudah Selesai"];

export function timeStatus(a: { mulai: string; selesai: string }, now = new Date()): TimeStatus {
  const s = new Date(a.mulai).getTime(), e = new Date(a.selesai).getTime(), n = now.getTime();
  if (n < s) return "Akan Datang";
  if (n > e) return "Sudah Selesai";
  return "Sedang Berlangsung";
}

export const REMINDERS = [
  { value: 0, label: "Tanpa pengingat" },
  { value: 15, label: "15 menit sebelum" },
  { value: 60, label: "1 jam sebelum" },
  { value: 1440, label: "H-1 (1 hari sebelum)" },
];

/** A reminder is due from (start - minutes) until the event starts. */
export function reminderDue(a: { mulai: string; reminder_minutes: number }, now = new Date()) {
  if (!a.reminder_minutes) return false;
  const s = new Date(a.mulai).getTime();
  return now.getTime() >= s - a.reminder_minutes * 60_000 && now.getTime() < s;
}

export const PILAR_COLOR: Record<string, string> = {
  Pendidikan: "bg-chart-1",
  Penelitian: "bg-chart-2",
  Pengabdian: "bg-chart-3",
  Penunjang: "bg-chart-4",
};
