import {
  computeLineTotalKurus,
  computeQuoteTotalKurus,
} from "@/server/money";
import { describe, expect, it } from "vitest";

describe("computeLineTotalKurus", () => {
  it("tam sayı çarpım", () => {
    expect(computeLineTotalKurus(2, 4_500)).toBe(9_000);
  });

  it("yarım saat çarpımını kuruşa HALF_UP yuvarlar", () => {
    expect(computeLineTotalKurus(1.5, 50_000)).toBe(75_000);
  });

  it("küsuratlı sonucu en yakın kuruşa yuvarlar", () => {
    expect(computeLineTotalKurus(1.33, 1_000)).toBe(1_330);
  });
});

describe("computeQuoteTotalKurus", () => {
  it("kalem toplamlarını birleştirir", () => {
    expect(
      computeQuoteTotalKurus([
        { quantity: 20, unitPriceKurus: 4_500 },
        { quantity: 6, unitPriceKurus: 50_000 },
      ]),
    ).toBe(390_000);
  });

  it("boş kalem listesinde 0 döner", () => {
    expect(computeQuoteTotalKurus([])).toBe(0);
  });
});
