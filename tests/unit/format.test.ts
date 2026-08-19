import {
  formatDateLong,
  formatDateShort,
  formatNumberTL,
  formatTL,
  formatTodayLine,
  parseTLToKurus,
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

describe("parseTLToKurus", () => {
  it("TL metnini kuruşa çevirir", () => {
    expect(parseTLToKurus("1.234,56")).toBe(123456);
  });

  it("virgülsüz tam sayıyı çevirir", () => {
    expect(parseTLToKurus("50")).toBe(5000);
  });

  it("tek haneli kuruşu çevirir", () => {
    expect(parseTLToKurus("10,5")).toBe(1050);
  });

  it("negatif değeri çevirir", () => {
    expect(parseTLToKurus("-250")).toBe(-25000);
  });

  it("boş girişte null döner", () => {
    expect(parseTLToKurus("")).toBeNull();
    expect(parseTLToKurus("   ")).toBeNull();
  });

  it("geçersiz girişte null döner", () => {
    expect(parseTLToKurus("abc")).toBeNull();
    expect(parseTLToKurus("1,234")).toBeNull();
    expect(parseTLToKurus("12.34")).toBeNull();
  });
});
