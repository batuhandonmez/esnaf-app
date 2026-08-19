# Esnaf App

Türkiye'deki küçük esnaf ve dükkan sahipleri için işletme yönetim uygulaması.
Geliştirme aşamasındadır; ayrıntılar için [AGENTS.md](./AGENTS.md) dosyasına bakın.

## Kurulum

```bash
npm install
npm run db:up        # Postgres'i Docker ile başlatır (Docker gerektirir)
npm run prisma:generate
```

`DATABASE_URL` `.env` dosyasında tanımlıdır (örnek: `.env.example`).

## Geliştirme

```bash
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run test         # Vitest unit testleri
npm run test:e2e     # Playwright E2E
npm run build        # Prod build
```

## Kalite

- UI metinleri Türkçe; para/tarih `Intl` ile `tr-TR` formatlanır.
- Görsel tasarım henüz seçilmedi; mevcut token'lar placeholder'dır.
