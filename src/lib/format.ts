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
