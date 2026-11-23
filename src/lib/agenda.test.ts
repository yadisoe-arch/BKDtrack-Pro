import { describe, it, expect } from "vitest";
import { reminderDue, timeStatus } from "./agenda";

const a = { mulai: "2026-11-23T09:00:00Z", selesai: "2026-11-23T11:00:00Z" };
describe("status waktu agenda", () => {
  it("sebelum mulai = Akan Datang", () => expect(timeStatus(a, new Date("2026-11-23T08:00:00Z"))).toBe("Akan Datang"));
  it("di antara mulai dan selesai = Sedang Berlangsung", () => expect(timeStatus(a, new Date("2026-11-23T10:00:00Z"))).toBe("Sedang Berlangsung"));
  it("setelah selesai = Sudah Selesai", () => expect(timeStatus(a, new Date("2026-11-23T12:00:00Z"))).toBe("Sudah Selesai"));
});
describe("pengingat", () => {
  it("1 jam sebelum aktif 30 menit sebelum acara", () => expect(reminderDue({ ...a, reminder_minutes: 60 }, new Date("2026-11-23T08:30:00Z"))).toBe(true));
  it("15 menit sebelum belum aktif 30 menit sebelum acara", () => expect(reminderDue({ ...a, reminder_minutes: 15 }, new Date("2026-11-23T08:30:00Z"))).toBe(false));
  it("H-1 aktif sehari sebelumnya", () => expect(reminderDue({ ...a, reminder_minutes: 1440 }, new Date("2026-11-22T10:00:00Z"))).toBe(true));
});
