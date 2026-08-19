const MINUS = "−";

function formatNumber(
  value: number,
  minDecimals: number,
  maxDecimals: number,
): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  })
    .format(value)
    .replace("-", MINUS);
}

export function formatNumberTL(value: number, maxDecimals = 2): string {
  return formatNumber(value, 0, maxDecimals);
}

export function formatTL(kurus: number, decimals = 2): string {
  const negative = kurus < 0;
  const formatted = formatNumber(Math.abs(kurus) / 100, decimals, decimals);
  return `${negative ? MINUS : ""}₺${formatted}`;
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTodayLine(date: Date): string {
  const weekday = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(date);
  const capitalized =
    weekday.charAt(0).toLocaleUpperCase("tr-TR") + weekday.slice(1);
  return `${capitalized}, ${formatDateLong(date)}`;
}

export function parseTLToKurus(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = /^(-?)(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/.exec(
    trimmed.replace(/\u00a0/g, ""),
  );
  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const whole = Number(match[2].replace(/\./g, ""));
  const fractionRaw = match[3] ?? "";
  const fraction = fractionRaw
    ? Number(fractionRaw) * (fractionRaw.length === 1 ? 10 : 1)
    : 0;

  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction)) {
    return null;
  }

  return sign * (whole * 100 + fraction);
}
