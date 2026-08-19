# Esnaf App — Agent Rehberi

## Proje

Türkiye'deki küçük esnaf ve dükkan sahipleri için işletme yönetim uygulaması.

Hedef özellikler: gelir/gider takibi, banka/kasa takibi, müşteri ve alacak takibi,
iş/emir takibi, hizmet/fiyat listesi, teklif oluşturma (PDF/WhatsApp paylaşımı),
iş bazlı gerçek kâr hesabı, aylık finansal raporlar.

## Mevcut Durum

- **Aşama 0 tamamlandı:** Proje iskeleti (framework, DB altyapısı, test altyapısı, CI).
- Ürün ekranı **yok**. Mock dashboard **yok**. Database schema **yok** (Aşama 3'te).
- **Görsel tasarım henüz seçilmedi.** Renk paleti, typography, radius, shadow ve
  component stili **placeholder**'dır (shadcn "nova" preset'i, Geist fontu).
  Bunlarla ilgili karar verme; önce design exploration (Aşama 1) yapılacak.
- Design system **henüz implement edilmedi** (Aşama 2'de).

## Stack

- Next.js (App Router) + TypeScript — **Next.js 16**: API ve klasör kuralları için
  `node_modules/next/dist/docs/` içindeki dokümanları oku; eğitim verilerine güvenme.
- PostgreSQL + Prisma (v7): schema `prisma/schema.prisma`, config `prisma.config.ts`,
  client `src/generated/prisma` (gitignored, `npm run prisma:generate` ile üretilir).
- shadcn/ui + Radix primitives — **default shadcn görünümü yasak**; özgün design system.
- Tailwind CSS v4, TanStack Query, Zustand, Vitest, Playwright, ESLint, Prettier.

## Komutlar

| Komut                             | Açıklama                                    |
| --------------------------------- | ------------------------------------------- |
| `npm run dev`                     | Geliştirme sunucusu (http://localhost:3000) |
| `npm run db:up` / `db:down`       | Postgres'i Docker Compose ile başlat/durdur |
| `npm run lint`                    | ESLint                                      |
| `npm run typecheck`               | TypeScript kontrolü                         |
| `npm run test`                    | Vitest unit testleri                        |
| `npm run test:e2e`                | Playwright E2E                              |
| `npm run format` / `format:check` | Prettier                                    |
| `npm run build` / `start`         | Prod build / start                          |
| `npm run prisma:generate`         | Prisma client üretimi                       |
| `npm run prisma:studio`           | Prisma Studio                               |

Her değişiklikten sonra en az: `lint` + `typecheck` + `test`.

## Çalışma Düzeni (Engineering Loops)

Her feature şu sırayla ilerler; her döngünün çıktısı kullanıcı onayına sunulur:

1. **Spec loop** — Şartname + kabul kriterleri (`spec-writing` skill'i).
2. **Design loop** — Stitch keşfi → Design Direction → Design System →
   Implementation → Browser Screenshot → Visual QA → Polish.
3. **Implement loop** — Şartnameye göre kod, unit test, lint/typecheck.
4. **QA loop** — Playwright E2E (fonksiyonel) + canlı browser screenshot incelemesi (görsel).
5. **Release loop** — CHANGELOG, versiyon, commit.

## Zorunlu Kurallar

- Arayüz kesinlikle "AI üretimi generic SaaS dashboard" gibi görünmemeli.
  Anti-AI kuralları `design-system` skill'inin zorunlu parçasıdır; her UI işi önce onu okur.
- UI metinleri Türkçe. Para/tarih formatı için `turkish-locale` skill'i.
- Görsel QA yalnızca kod incelemesi değildir: çalışan uygulama browser'da açılır,
  gerçek screenshot'lar üzerinden değerlendirilir (`qa-visual-review` skill'i).
- PWA/offline ilk aşamada yok; ancak mimari buna izin verecek şekilde tasarlanır
  (UI veriye hook'lar üzerinden erişir, API servis katmanı üzerinden konuşur).
- Onaylanmamış feature geliştirme. Placeholder'ları "düzeltmek" için tasarım kararı verme.
- Kodda yorum yazma (zorunlu açıklama gerekmedikçe).
- Commit yalnızca istendiğinde.

## opencode Yapılandırması

- Agent'lar: `.opencode/agents/`, Skill'ler: `.opencode/skills/`.
- Config değişiklikleri açık opencode oturumlarında etkili olmaz; yeniden başlatma gerekir.
