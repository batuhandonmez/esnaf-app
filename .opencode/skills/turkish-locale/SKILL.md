---
name: turkish-locale
description: Use when formatting money (TL/₺), dates, or numbers in Turkish UI. Front-load keywords: para, TL, ₺, lira, tarih, format, Intl, para birimi.
---

# Türkçe Locale

Türkiye'de para ve tarih formatı standartları (TTK - Türk Lirası).

## Para (₺)

```ts
new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
}).format(1234.5); // "₺1.234,50"
```

- Sembol: `₺` (TL değil). Negatif tutarlar için eksi işareti kullan.
- Ondalık gösterim: virgül; binlik ayraç: nokta.

## Tarih

```ts
new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date());
// "19 Ağustos 2026"
new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" }).format(new Date());
// "19.08.2026"
```

- Kısa liste tarihleri: `gg.aa.yyyy` (örn. 19.08.2026).
- Ay adları küçük harfle: "ağustos" (cümle başı hariç).

## Sayı

```ts
new Intl.NumberFormat("tr-TR").format(12345); // "12.345"
```

## Kurallar

- Her yerde `Intl` kullan; elle ayraç/format yazma.
- Kullanıcı girişi için `Intl` parse etmez; virgül/nokta girişini ayrı normalleştir.
- DB'de tutarlar her zaman kuruş cinsinden tamsayı (integer) sakla; float kullanma.
