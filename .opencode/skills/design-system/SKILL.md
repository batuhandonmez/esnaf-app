---
name: design-system
description: Use when working on any UI code, components, screens, tokens, or visual QA. Contains design tokens, component patterns, and the mandatory anti-AI-generated-UI rules. Front-load keywords: UI, bileşen, tasarım, ekran, görsel, component, design, token, stil.
---

# Design System

> **Durum: Aşama 1 + 2 tamamlandı.**
> Tasarım kararları onaylı: `design/design-direction.md` tek yetkili kaynaktır.
> Token'lar `src/app/globals.css` içinde tanımlıdır (kırık beyaz zemin, derin yeşil
> primary, Manrope + Source Serif 4, 8-10px radius, 1px border, shadow'suz kartlar).
> Yeni görsel karar gerektiğinde önce `design/design-direction.md`'e bak;
> orada olmayan kararları kullanıcı onayı olmadan verme.

## Zorunlu: Anti-AI Kuralları

Bu uygulama gerçek esnafın günlük kullandığı, güvenilir bir işletme aracı olacak.
Arayüz KESİNLİKLE "AI tarafından üretilmiş generic SaaS dashboard" gibi görünmemeli.

Yasaklı desenler (tam liste `design/design-direction.md` §10'da):

- Mor/mavi gradyan "hero" başlıklar, gradient butonlar, gradient metinler
- Boş placeholder kartlar, lorem ipsum içerik, sahte istatistik dolu gösterişli dashboard
- Her yere serpiştirilmiş ikonlar, 3D/süslü illüstrasyonlar
- Generic isimler ("Dashboard", "Analytics") ve İngilizce UI metni
- Kopyala-yapıştır default shadcn görünümü (default renkler, default kompozisyon)
- İçi boş "insight" kartları, yapay mikro-interaction'lar, aşırı yuvarlatılmış köşeler
- Hap rozetler, renkli KPI kartları, ızgara çizgili grafik kalabalığı, gereksiz shadow

İlke: Sade, yoğun bilgili, hızlı okunabilir, esnafın gerçek iş akışına uygun arayüz.
Her UI işi bu kuralları uygular; ihlal görsel QA'da hata olarak raporlanır.

## Token'lar

Kaynak: `design/design-direction.md` (§1-5) ve `src/app/globals.css`.
Renk token'ları (oklch): `background`, `surface`, `surface-sunken`, `ink`,
`muted`, `faint`, `border`, `border-strong`, `primary`, `primary-hover`,
`primary-soft`, `primary-foreground`, `success/-soft`, `warning/-soft`,
`error/-soft`, `pos`, `neg`, `chart-ink`, `ring`.
Radius: `rounded-card` (10px), `rounded-control` (8px), `rounded-overlay` (12px),
`rounded-chip` (6px). Shadow: yalnızca `shadow-overlay` (dialog/sheet).
Fontlar: `font-sans` (Manrope), `font-display` (Source Serif 4);
ikonlar Material Symbols (`material-symbols-outlined` sınıfı, `icon-filled` varyantı).
Para/tarih: `src/lib/format.ts` helper'ları (tr-TR, kuruş integer, ₺, U+2212 eksi).
Bileşenler asla hardcoded renk kullanmaz; token'lara başvurur.

## Bileşen Kuralları

- Çekirdek bileşenler `src/components/ui/` içinde: card, button, input, label,
  list-row, section-label, status-dot, sheet, dialog, empty-state.
- Default shadcn görünümü kullanılmaz; her bileşen token'larla yeniden şekillenir.
- Ürün ekranları `src/components/features/` altında feature bazlı gruplanır.
- Mobile-first: önce dar ekran tasarımı, sonra geniş ekran.
- Alt nav mobilde altta 5 sekme; ≥1024px'te sol kenar çubuğuna dönüşür
  (`features/layout/app-nav.tsx`), içerik sütunu tek kalır (max-w 680px).
- Dokunma hedefleri her yerde ≥ 44px; kartlar shadow'suz, 1px border'lı.
