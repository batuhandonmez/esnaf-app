const TIME_ZONE = "Europe/Istanbul";

export function todayIstanbul(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = new Map(parts.map((p) => [p.type, p.value]));
  return `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
}

export function dateOnlyToDate(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export function dateToDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthRangeIstanbul(): { start: string; end: string } {
  const today = todayIstanbul();
  const [year, month] = today.split("-");
  const y = Number(year);
  const m = Number(month);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}
