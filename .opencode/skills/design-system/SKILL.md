---
name: design-system
description: Use when working on any UI code, components, screens, tokens, or visual QA. Contains design tokens, component patterns, and the mandatory anti-AI-generated-UI rules. Front-load keywords: UI, bileşen, tasarım, ekran, görsel, component, design, token, stil.
---

# Design System

> **Durum: Aşama 1 (design exploration) tamamlanmadı.**
> Renk paleti, typography, radius, shadow ve component stili HENÜZ SEÇİLMEDİ.
> Mevcut token'lar (shadcn "nova" preset'i + Geist fontu) **placeholder**'dır.
> Yeni görsel karar verme; placeholder'ları olduğu gibi kullan.

## Zorunlu: Anti-AI Kuralları

Bu uygulama gerçek esnafın günlük kullandığı, güvenilir bir işletme aracı olacak.
Arayüz KESİNLİKLE "AI tarafından üretilmiş generic SaaS dashboard" gibi görünmemeli.

Yasaklı desenler (tam liste Aşama 2'de genişletilecek):

- Mor/mavi gradyan "hero" başlıklar, gradient butonlar, gradient metinler
- Boş placeholder kartlar, lorem ipsum içerik, sahte istatistik dolu gösterişli dashboard
- Her yere serpiştirilmiş ikonlar, 3D/süslü illüstrasyonlar
- Generic isimler ("Dashboard", "Analytics") ve İngilizce UI metni
- Kopyala-yapıştır default shadcn görünümü (default renkler, default kompozisyon)
- İçi boş "insight" kartları, yapay mikro-interaction'lar, aşırı yuvarlatılmış köşeler

İlke: Sade, yoğun bilgili, hızlı okunabilir, esnafın gerçek iş akışına uygun arayüz.
Her UI işi bu kuralları uygular; ihlal görsel QA'da hata olarak raporlanır.

## Token'lar

Placeholder (Aşama 1'de değişecek): `src/app/globals.css` içindeki CSS değişkenleri.
Bileşenler asla hardcoded renk kullanmaz; token'lara başvurur.

## Bileşen Kuralları

- shadcn CLI ile eklenen bileşenler `src/components/ui/` içinde yaşar.
- Default shadcn görünümü kullanılmaz; her bileşen token'larla yeniden şekillenir.
- Ürün ekranları `src/components/features/` altında feature bazlı gruplanır.
- Mobile-first: önce dar ekran tasarımı, sonra geniş ekran.
