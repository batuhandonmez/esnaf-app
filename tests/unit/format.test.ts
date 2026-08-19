import {
  formatDateLong,
  formatDateShort,
  formatNumberTL,
  formatTL,
  formatTodayLine,
} from "@/lib/format";
import { describe, expect, it } from "vitest";

describe("formatTL", () => {
  it("kuruşu ₺ formatına çevirir", () => {
    expect(formatTL(123450)).toBe("₺1.234,50");
  });

  it("ondalık gizlenebilir", () => {
    expect(formatTL(4285000, 0)).toBe("₺42.850");
  });

  it("negatif tutarlarda eksi işareti (U+2212) kullanır", () => {
    expect(formatTL(-123450)).toBe("−₺1.234,50");
  });
});

describe("formatNumberTL", () => {
  it("sayıyı tr-TR formatına çevirir", () => {
    expect(formatNumberTL(42850, 0)).toBe("42.850");
  });
});

describe("tarih formatları", () => {
  const date = new Date(2026, 7, 19);

  it("uzun tarih", () => {
    expect(formatDateLong(date)).toBe("19 Ağustos 2026");
  });

  it("kısa tarih", () => {
    expect(formatDateShort(date)).toBe("19.08.2026");
  });

  it("bugün satırı gün adıyla başlar", () => {
    expect(formatTodayLine(date)).toBe("Çarşamba, 19 Ağustos 2026");
  });
});
