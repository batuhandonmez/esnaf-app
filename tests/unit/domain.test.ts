import {
  canTransitionQuote,
  computeProfitKurus,
  computeReceivable,
  isIncomingMovement,
} from "@/server/domain";
import { describe, expect, it } from "vitest";

const today = "2026-08-19";

function receivableView(
  totalKurus: number,
  dueDate: string | null,
  paidAmounts: number[],
) {
  return {
    totalKurus,
    dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`) : null,
    collections: paidAmounts.map((amountKurus) => ({ amountKurus })),
  };
}

describe("computeReceivable", () => {
  it("tahsilat yoksa kalan = toplam, durum Açık", () => {
    const result = computeReceivable(receivableView(10_000, null, []), today);
    expect(result).toEqual({
      paidKurus: 0,
      remainingKurus: 10_000,
      status: "open",
    });
  });

  it("kısmi tahsilat sonrası kalanı doğru hesaplar", () => {
    const result = computeReceivable(
      receivableView(10_000, null, [4_000]),
      today,
    );
    expect(result).toEqual({
      paidKurus: 4_000,
      remainingKurus: 6_000,
      status: "open",
    });
  });

  it("bakiye 0 olunca Ödendi döner", () => {
    const result = computeReceivable(
      receivableView(10_000, null, [6_000, 4_000]),
      today,
    );
    expect(result.status).toBe("paid");
    expect(result.remainingKurus).toBe(0);
  });

  it("vadesi geçmiş ve bakiye varsa Gecikti döner", () => {
    const result = computeReceivable(
      receivableView(10_000, "2026-08-10", [2_000]),
      today,
    );
    expect(result.status).toBe("overdue");
  });

  it("vadesi geçmiş ama bakiye yoksa Gecikti dönmez", () => {
    const result = computeReceivable(
      receivableView(10_000, "2026-08-10", [10_000]),
      today,
    );
    expect(result.status).toBe("paid");
  });

  it("vadesi bugün olan alacak Gecikti sayılmaz", () => {
    const result = computeReceivable(
      receivableView(10_000, "2026-08-19", []),
      today,
    );
    expect(result.status).toBe("open");
  });
});

describe("canTransitionQuote", () => {
  it("draft → sent geçerlidir", () => {
    expect(canTransitionQuote("draft", "sent")).toBe(true);
  });

  it("sent → accepted geçerlidir", () => {
    expect(canTransitionQuote("sent", "accepted")).toBe(true);
  });

  it("sent → rejected geçerlidir", () => {
    expect(canTransitionQuote("sent", "rejected")).toBe(true);
  });

  it("draft → accepted geçersizdir", () => {
    expect(canTransitionQuote("draft", "accepted")).toBe(false);
  });

  it("accepted sonrası geçiş yoktur", () => {
    expect(canTransitionQuote("accepted", "sent")).toBe(false);
    expect(canTransitionQuote("rejected", "draft")).toBe(false);
  });
});

describe("isIncomingMovement", () => {
  it("giriş türlerini doğru sınıflar", () => {
    expect(isIncomingMovement("income")).toBe(true);
    expect(isIncomingMovement("collection")).toBe(true);
    expect(isIncomingMovement("transfer_in")).toBe(true);
    expect(isIncomingMovement("manual_in")).toBe(true);
  });

  it("çıkış türlerini doğru sınıflar", () => {
    expect(isIncomingMovement("expense")).toBe(false);
    expect(isIncomingMovement("transfer_out")).toBe(false);
    expect(isIncomingMovement("manual_out")).toBe(false);
  });

  it("bilinmeyen tür çıkış sayılır", () => {
    expect(isIncomingMovement("bilinmeyen")).toBe(false);
  });
});

describe("computeProfitKurus", () => {
  it("gelirden gideri düşer", () => {
    expect(computeProfitKurus(12_000, 5_000)).toBe(7_000);
  });

  it("kayıt yoksa 0 döner", () => {
    expect(computeProfitKurus(0, 0)).toBe(0);
  });

  it("gider geliri aşarsa negatif döner", () => {
    expect(computeProfitKurus(5_000, 12_000)).toBe(-7_000);
  });
});
