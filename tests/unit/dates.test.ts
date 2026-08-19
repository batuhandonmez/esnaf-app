import {
  dateOnlyToDate,
  dateToDateOnly,
  monthRangeIstanbul,
  todayIstanbul,
} from "@/server/dates";
import { describe, expect, it } from "vitest";

describe("dateOnlyToDate", () => {
  it("YYYY-MM-DD'yi UTC gece yarısına çevirir", () => {
    const date = dateOnlyToDate("2026-08-19");
    expect(date.toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });
});

describe("dateToDateOnly", () => {
  it("Date'i YYYY-MM-DD'ye çevirir", () => {
    expect(dateToDateOnly(new Date("2026-08-19T12:30:00.000Z"))).toBe(
      "2026-08-19",
    );
  });
});

describe("todayIstanbul", () => {
  it("YYYY-MM-DD biçiminde döner", () => {
    expect(todayIstanbul()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("monthRangeIstanbul", () => {
  it("ayın ilk gününden başlar ve geçerli bitiş günü döner", () => {
    const range = monthRangeIstanbul();
    const today = todayIstanbul();
    const [year, month] = today.split("-");

    expect(range.start).toBe(`${year}-${month}-01`);
    expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const endDay = Number(range.end.split("-")[2]);
    const lastDay = new Date(
      Date.UTC(Number(year), Number(month), 0),
    ).getUTCDate();
    expect(endDay).toBe(lastDay);
    expect(range.start <= today && today <= range.end).toBe(true);
  });
});
