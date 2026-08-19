---
name: whatsapp-share
description: Use when implementing WhatsApp sharing of quotes/PDFs. Front-load keywords: whatsapp, wa.me, paylaşım, teklif paylaş, PDF paylaş.
---

# WhatsApp Paylaşımı

Teklif/PDF paylaşımı native uygulama kurulumu istemez; `wa.me` linkleri kullanılır.

## Akış

1. PDF üretilir ve erişilebilir bir URL'ye kaydedilir (uygulamanın kendi statik/özel URL'i).
2. Paylaş butonu `https://wa.me/?text=...` linkini açar (mobilde WhatsApp'ı açar):
   ```
   https://wa.me/?text=<URL-encoded mesaj + PDF linki>
   ```
3. Telefon numarası biliniyorsa `https://wa.me/905xxxxxxxxx?text=...` kullanılır.
4. Masaüstünde bu link WhatsApp Web'i açar; kullanıcı isterse PDF'i indirir.

## Kurallar

- Mesaj şablonu esnaf dilinde kısa olur: "Merhaba <Müşteri>, <İş> için teklifimiz:
  <link> — <İşletme Adı>"
- URL her zaman URL-encode edilir (`encodeURIComponent`).
- PDF linki, paylaşılan kişinin login olmadan açabileceği bir link olmalı.
- Özel/gizli bilgi (maliyet, kâr marjı) teklif PDF'ine GİRMEZ.
