import { describe, it, expect } from "vitest";
import { compliance, masaKerja } from "./bkd";

describe("aturan BKD", () => {
  it("total 12–16 SKS dan inti ≥ 9 dinyatakan patuh", () => {
    const c = compliance([{ pilar: "Pendidikan", sks: 6 }, { pilar: "Penelitian", sks: 3 }, { pilar: "Pengabdian", sks: 2 }, { pilar: "Penunjang", sks: 1 }]);
    expect(c.total).toBe(12);
    expect(c.totalOk).toBe(true);
    expect(c.intiOk).toBe(true);
  });
  it("total di bawah 12 SKS memberi peringatan", () => {
    expect(compliance([{ pilar: "Pendidikan", sks: 11 }]).totalOk).toBe(false);
  });
  it("total di atas 16 SKS memberi peringatan", () => {
    expect(compliance([{ pilar: "Pendidikan", sks: 17 }]).totalOk).toBe(false);
  });
  it("Pendidikan + Penelitian 8 SKS tidak memenuhi minimal 9", () => {
    const c = compliance([{ pilar: "Pendidikan", sks: 5 }, { pilar: "Penelitian", sks: 3 }, { pilar: "Penunjang", sks: 6 }]);
    expect(c.intiOk).toBe(false);
  });
  it("masa kerja dihitung dari TMT", () => {
    expect(masaKerja("2020-03-01", new Date("2026-11-22"))).toEqual({ tahun: 6, bulan: 8, totalBulan: 80 });
  });
});
