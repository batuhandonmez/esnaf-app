import {
  dateOnlySchema,
  kurusSchema,
  paginationSchema,
  timeSchema,
} from "@/server/validation";
import { describe, expect, it } from "vitest";

describe("kurusSchema", () => {
  it("pozitif tamsayı kuruşu kabul eder", () => {
    expect(kurusSchema.safeParse(100).success).toBe(true);
    expect(kurusSchema.safeParse(2_147_483_647).success).toBe(true);
  });

  it("0'ı reddeder", () => {
    expect(kurusSchema.safeParse(0).success).toBe(false);
  });

  it("negatifi reddeder", () => {
    expect(kurusSchema.safeParse(-100).success).toBe(false);
  });

  it("ondalıklıyı reddeder", () => {
    expect(kurusSchema.safeParse(100.5).success).toBe(false);
  });

  it("int4 tavanını aşanı reddeder", () => {
    expect(kurusSchema.safeParse(2_147_483_648).success).toBe(false);
  });
});

describe("dateOnlySchema", () => {
  it("geçerli tarihi kabul eder", () => {
    expect(dateOnlySchema.safeParse("2026-08-19").success).toBe(true);
    expect(dateOnlySchema.safeParse("2024-02-29").success).toBe(true);
  });

  it("gerçek olmayan takvim gününü reddeder", () => {
    expect(dateOnlySchema.safeParse("2026-02-30").success).toBe(false);
    expect(dateOnlySchema.safeParse("2025-02-29").success).toBe(false);
    expect(dateOnlySchema.safeParse("2026-13-01").success).toBe(false);
    expect(dateOnlySchema.safeParse("2026-00-10").success).toBe(false);
  });

  it("format dışı girişi reddeder", () => {
    expect(dateOnlySchema.safeParse("19.08.2026").success).toBe(false);
    expect(dateOnlySchema.safeParse("2026-8-19").success).toBe(false);
  });
});

describe("timeSchema", () => {
  it("geçerli 24 saat formatını kabul eder", () => {
    expect(timeSchema.safeParse("14:30").success).toBe(true);
    expect(timeSchema.safeParse("00:00").success).toBe(true);
    expect(timeSchema.safeParse("23:59").success).toBe(true);
  });

  it("24:00'ü reddeder", () => {
    expect(timeSchema.safeParse("24:00").success).toBe(false);
  });

  it("bozuk formatı reddeder", () => {
    expect(timeSchema.safeParse("09:5").success).toBe(false);
    expect(timeSchema.safeParse("9:30").success).toBe(false);
    expect(timeSchema.safeParse("14.30").success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("varsayılan değerleri uygular", () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 50 });
  });

  it("string sayıları dönüştürür", () => {
    expect(paginationSchema.parse({ page: "3", pageSize: "25" })).toEqual({
      page: 3,
      pageSize: 25,
    });
  });

  it("page 0'ı reddeder", () => {
    expect(paginationSchema.safeParse({ page: "0" }).success).toBe(false);
  });

  it("pageSize tavanını uygular", () => {
    expect(paginationSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});
