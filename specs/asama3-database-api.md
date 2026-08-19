# Aşama 3 — Database & API Temeli Şartnamesi

> Durum: **Kullanıcı onayı bekleniyor.** Onaylanmadan schema/API implementasyonu yapılmaz.
> Kapsam: Veri modeli (Prisma v7) + API servis katmanı. UI değişikliği YOK.

## Amaç

"Bugün" ekranındaki kasa bakiyesi, bugünkü işler, bu ay gelir/gider ve alacak özeti
şu anda mock veri. Bu aşama:

1. 8 iş alanını (müşteri, iş/emir, gelir, gider, kasa/banka, alacak, teklif, hizmet
   listesi) kapsayan PostgreSQL veri modelini kurar,
2. Ekranların konuşacağı API servis katmanını hazırlar,
3. Kasa bakiyesi, iş bazlı kâr, müşteri bazlı alacak gibi hesapları tek merkezde
   tutarlı kurallara bağlar.

Katman sırası: UI → TanStack Query hook → API client (thin fetch) → Route Handler →
servis katmanı (`(prisma, ctx, input)` imzası, Prisma enjekte edilir) → DB.
PWA/offline hazırlığı bu katmanlaşmaya dayanır; UI asla doğrudan DB'ye gitmez.

## Varsayımlar

| No | Varsayım |
| --- | --- |
| V1 | **Tek dükkan / tek işletme.** Login, kullanıcı, çok kullanıcılı yapı yok. Multi-tenant geçişi: `ctx` parametresi bugün boş `{}`; yarın `{ tenantId }` olur, servis imzaları değişmez (Q11). |
| V2 | Tüm para tutarları **kuruş cinsinden pozitif integer** (`*Kurus`), negatif/ondalık yasak; yön ayrı alandadır. Int (int4) tavanı ₺21.474.836,47 — tek kayıt için yeterli. Float/Decimal para yasak; Decimal yalnızca teklif kalemi `quantity` (adet/saat: 1,5 gibi). |
| V3 | İş günü/vade/tarih alanları **tarih-sadece** (`@db.Date`, API'de `YYYY-MM-DD` string). Saat `"HH:mm"` metin (24 saat, regex doğrulanır). Kayıt zaman damgaları UTC `@db.Timestamp(3)`. Saat dilimi: **Europe/Istanbul (sabit UTC+3)**; "bugün" hesapları daima Istanbul takvim günü. |
| V4 | API: Next.js 16 Route Handler (`src/app/api/**/route.ts`), JSON, `export const dynamic = "force-dynamic"`. Doğrulama zod ile, iş mantığı servis katmanında. |
| V5 | Giderler **kayıt anında ödenmiş** varsayılır (kasadan/bankadan düşer). "Ödenecek/borç" yok (Q3). |
| V6 | Teklif PDF'i ve WhatsApp paylaşımı bu aşamada üretilmez; veri modeli buna uygun kurulur (BR-14). `GET /api/quotes/[id]/pdf` 501 stub'ı planlanır. |
| V7 | Kimlik: `String @id @default(cuid())` tüm modellerde (ileride offline senkron için client üretilebilir id). |
| V8 | Seed idempotent, sabit deterministik id'lerle upsert. |

## Uzlaştırma Kararları (product-manager ↔ backend çakışmaları)

İki agent'ın çıktıları arasındaki farklar şöyle çözüldü:

| Konu | Karar | Gerekçe |
| --- | --- | --- |
| İş durumu | **3 durum:** `PLANLANDI / BEKLIYOR / TAMAMLANDI` | Onaylı UI'daki StatusDot tonlarıyla birebir (Tamamlandı=success, Bekliyor=warning, Planlandı=muted). `draft/cancelled/iptal` yok (Q2). |
| Veresiye akışı | Gelir kaydı (`odendi=false`) → Alacak açılır; Tahsilat → hesap hareketi + alacak azalır. **Tahsilatta yeni Gelir kaydı üretilmez.** | "Gelir, iş yapıldığında" (esnafın defter mantığı). Alternatif (tahsilat anında gelir) Q1'de. |
| Alacak durumu | **Saklanmaz, hesaplanır** (kalan = tutar − tahsilatlar; 0 → "Ödendi"; >0 ve vade geçmiş → "Gecikti"; değilse "Açık") | Saklanan durumun veriyle çelişme riski yok. |
| Silme | MVP'de **hard delete** (deletedAt yok). Müşteri/hesap silinemez; iş silinince bağlı gelir/gider korunur (`jobId` boşalır); gelir/gider silinince bağlı hareket de silinir. | Esnaf "yanlış girdim, geri alayım" ihtiyacı; soft delete karmaşıklığı MVP'ye gerekmez (Q4). |
| Gider kategorileri | **Sabit seed listesi** (Malzeme, Personel, Kira, Fatura, Vergi, Ulaşım, Diğer); yalnızca `GET`. Kullanıcı yönetimi yok (Q5). | MVP kapsam kontrolü. |
| Teklif | KDV oranı ve indirim alanı **yok** (Q6). Durumlar 4: `TASLAK/GONDERILDI/KABUL/RED` (`expired` yok, Q7). | Kalem tutarları girilen nihai fiyat; MVP basitliği. |
| İş saati | `Job.startTime String?` ("HH:mm") eklendi | Backend şemasında eksikti; "Bugün" ekranı saat gösteriyor (14:30). |
| Hesap transferi | `POST /api/accounts/transfer` var (tek transaction, `transferGroupId` ile iki hareket) | Kasadan bankaya para taşıma gerçek ihtiyaç; backend önerisi kabul edildi. |
| Manuel hareket | `POST /api/movements` var (kasaya para koy / kasadan çek, kaynaksız) | PM BR-7 gereği. |
| API path'leri | **İngilizce** (`/api/customers`, `/api/jobs`...) | Model adlarıyla ve `RouteContext<'/api/...'>` tip üretimiyle tutarlılık. |
| Response envelope | Başarı: `{ data }` / `{ data, meta }`; hata: `{ error: { code, message, fields? } }` — `message` daima Türkçe, kullanıcıya gösterilebilir. | Kod tarafı İngilizce anahtar, mesaj Türkçe. |
| Tahsilat yöntemi | `PaymentMethod` enum (cash/bank_card/credit_card/bank_transfer/other) gelir ve tahsilatta | Küçük maliyet, gerçek bilgi. |

## Onaylanan Kararlar (Q1-Q12)

Kullanıcı onayı: **19 Ağustos 2026.** Tüm açık sorular önerilen yönde karara bağlandı:

| No | Karar |
| --- | --- |
| Q1 | Gelir **kayıt anında** sayılır (tahsilat anında değil). |
| Q2 | İş durumu **3 değer**: `planned / pending / completed`. İptal/taslak yok. |
| Q3 | Borç/ödenecek takibi **yok** (giderler kayıt anında ödenmiş). |
| Q4 | MVP'de **hard delete** (soft delete yok). |
| Q5 | Gider kategorileri **sabit seed**; kullanıcı yönetimi yok. |
| Q6 | Teklifte **KDV/indirim yok**. |
| Q7 | Teklifte **expired durumu yok**. |
| Q8 | **Müşteri silinemez.** |
| Q9 | CashMovement referans bütünlüğü **servis katmanında** (DB CHECK yok). |
| Q10 | Teklif kabulünde **otomatik alacak açılmaz**. |
| Q11 | **Tenant context sınırı korunur**: servisler `(prisma, ctx, input)` imzasıyla yazılır; `ctx` bugün boş. |
| Q12 | Seed'de **yalnızca "Kasa"** hesabı; banka kullanıcı ekler. |

## CashMovement Kuralları (Onaylı Düzeltme)

Kullanıcı onayıyla BR-19 şöyle netleştirildi:

- **CashMovement için doğrudan edit/delete endpoint'i YOKTUR.** (`POST /api/movements` yalnızca
  yeni manuel hareket oluşturur; PATCH/DELETE yok.)
- **Bağımsız immutable hareketler** (`transfer_in`, `transfer_out`, `manual_in`, `manual_out`)
  herhangi bir kaynağa bağlı değildir ve **hiçbir durumda silinmez.**
- **Kaynak bağlı otomatik hareketler** (`income`, `expense`, `collection`) yalnızca bağlı oldukları
  kayıt (Revenue/Expense/Collection) silindiğinde, **aynı transaction içinde** kaldırılır.
- Bakiye her zaman `openingBalanceKurus + Σ(giriş) − Σ(çıkış)` formülüyle, hareketlerden
  hesaplanır; hiçbir yerde saklanmaz.
- Düzeltme ihtiyacı: otomatik hareketlerde bağlı kayıt PATCH ile güncellenince hareket aynı
  transaction'da senkron edilir; bağımsız hareketlerde düzeltme, ters yönlü yeni bir manuel
  hareket kaydıyla yapılır (silme yok).

## Veri Modeli

Ortak alanlar: `id` (cuid), `createdAt @default(now()) @db.Timestamp(3)`,
`updatedAt @updatedAt @db.Timestamp(3)`. Tüm tutarlar `*Kurus Int` (>0).

| Model | Alanlar | Notlar |
| --- | --- | --- |
| `Customer` | name (zorunlu), phone?, notes? | Silme yok. Index `[name]`. |
| `Job` | customerId?, title, description?, status (`PLANLANDI` varsayılan), priceKurus?, scheduledOn? (@db.Date), startTime? ("HH:mm"), completedOn? (@db.Date) | Silinince bağlı gelir/gider korunur (`SetNull`). Index `[customerId] [status] [scheduledOn]`. |
| `Revenue` | date (@db.Date), amountKurus, description?, method (varsayılan cash), odendi (Boolean, varsayılan true), customerId?, jobId?, accountId? | `odendi=true` → hesap hareketi; `false` → Receivable açılır (1:1, `revenueId @unique`). İş kârı bağı: `jobId`. Index `[date] [customerId] [jobId] [accountId,date]`. |
| `Expense` | date, amountKurus, description?, categoryId (Restrict), jobId?, accountId? | Kayıt anında hareket (çıkış). Index `[date] [categoryId] [jobId]`. |
| `ExpenseCategory` | name, sortOrder | Sabit seed; yönetim yok. |
| `Account` | name, type (`cash`/`bank`), openingBalanceKurus (0), sortOrder | Silme yok. Seed: "Kasa" (cash). Bakiye hesaplanır, saklanmaz. |
| `CashMovement` | accountId (Restrict), type (`income`/`expense`/`collection`/`transfer_in`/`transfer_out`/`manual_in`/`manual_out`), amountKurus, date, description?, transferGroupId?, revenueId? @unique, expenseId? @unique, collectionId? @unique | **Immutable ekstre:** updatedAt/silme yok; düzeltme = ters kayıt. "En fazla biri dolu" serviste doğrulanır (Q9). Index `[accountId,date] [date] [transferGroupId]`. |
| `Receivable` | customerId (Restrict), description, totalKurus, dueDate? (@db.Date), source (`job`/`quote`/`manual`), jobId?, quoteId?, revenueId? @unique | Durum hesaplanır (bkz. BR-8). Vade opsiyonel; işlem gününden önce olamaz. Index `[customerId] [dueDate]`. |
| `Collection` | receivableId (Restrict), amountKurus, date, method, accountId? | Tahsilat → aynı transaction'da hesaba `collection` girişi; toplam alacağı aşamaz. Index `[receivableId] [date]`. |
| `Quote` | customerId?, jobId?, title, status (`draft` varsayılan; `draft→sent→accepted|rejected`), validUntil? (@db.Date), notes? | Toplam kalemlerden hesaplanır; saklanmaz. `accepted` → isteğe bağlı Job üretimi. Index `[customerId] [status]`. |
| `QuoteItem` | quoteId (Cascade), name, unit?, quantity Decimal(10,2) varsayılan 1, unitPriceKurus, sortOrder | **Snapshot:** hizmete FK yok; fiyat o an kopyalanır. Satır tutarı = `unitPriceKurus × quantity`, kuruşa HALF_UP yuvarlanır (satır bazında). |
| `ServiceItem` | name, description?, unit?, unitPriceKurus, sortOrder | Silinebilir; eski teklifler etkilenmez. Index `[sortOrder]`. |

### Prisma Schema Taslağı

> Implementasyonda `prisma/schema.prisma` içeriği birebir bu olur; ardından
> `npm run prisma:generate` + `npx prisma migrate dev --name init`.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum JobStatus {
  planned
  pending
  completed
}

enum AccountType {
  cash
  bank
}

enum MovementType {
  income
  expense
  collection
  transfer_in
  transfer_out
  manual_in
  manual_out
}

enum ReceivableSource {
  job
  quote
  manual
}

enum QuoteStatus {
  draft
  sent
  accepted
  rejected
}

enum PaymentMethod {
  cash
  bank_card
  credit_card
  bank_transfer
  other
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  notes     String?
  createdAt DateTime @default(now()) @db.Timestamp(3)
  updatedAt DateTime @updatedAt @db.Timestamp(3)

  jobs        Job[]
  revenues    Revenue[]
  receivables Receivable[]
  quotes      Quote[]

  @@index([name])
}

model Job {
  id          String    @id @default(cuid())
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  title       String
  description String?
  status      JobStatus @default(planned)
  priceKurus  Int?
  scheduledOn DateTime? @db.Date
  startTime   String?
  completedOn DateTime? @db.Date
  createdAt   DateTime  @default(now()) @db.Timestamp(3)
  updatedAt   DateTime  @updatedAt @db.Timestamp(3)

  revenues    Revenue[]
  expenses    Expense[]
  receivables Receivable[]
  quotes      Quote[]

  @@index([customerId])
  @@index([status])
  @@index([scheduledOn])
}

model Revenue {
  id          String        @id @default(cuid())
  date        DateTime      @db.Date
  amountKurus Int
  description String?
  method      PaymentMethod @default(cash)
  paid        Boolean       @default(true)
  customerId  String?
  customer    Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  jobId       String?
  job         Job?          @relation(fields: [jobId], references: [id], onDelete: SetNull)
  accountId   String?
  account     Account?      @relation(fields: [accountId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now()) @db.Timestamp(3)
  updatedAt   DateTime      @updatedAt @db.Timestamp(3)

  movement    CashMovement?
  receivable  Receivable?

  @@index([date])
  @@index([customerId])
  @@index([jobId])
  @@index([accountId, date])
}

model Expense {
  id          String          @id @default(cuid())
  date        DateTime        @db.Date
  amountKurus Int
  description String?
  categoryId  String
  category    ExpenseCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  jobId       String?
  job         Job?            @relation(fields: [jobId], references: [id], onDelete: SetNull)
  accountId   String?
  account     Account?        @relation(fields: [accountId], references: [id], onDelete: SetNull)
  createdAt   DateTime        @default(now()) @db.Timestamp(3)
  updatedAt   DateTime        @updatedAt @db.Timestamp(3)

  movement CashMovement?

  @@index([date])
  @@index([categoryId])
  @@index([jobId])
}

model ExpenseCategory {
  id        String   @id @default(cuid())
  name      String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now()) @db.Timestamp(3)
  updatedAt DateTime @updatedAt @db.Timestamp(3)

  expenses Expense[]

  @@index([sortOrder])
}

model Account {
  id                  String      @id @default(cuid())
  name                String
  type                AccountType
  openingBalanceKurus Int         @default(0)
  sortOrder           Int         @default(0)
  createdAt           DateTime    @default(now()) @db.Timestamp(3)
  updatedAt           DateTime    @updatedAt @db.Timestamp(3)

  movements   CashMovement[]
  revenues    Revenue[]
  expenses    Expense[]
  collections Collection[]

  @@index([sortOrder])
}

model CashMovement {
  id              String        @id @default(cuid())
  accountId       String
  account         Account       @relation(fields: [accountId], references: [id], onDelete: Restrict)
  type            MovementType
  amountKurus     Int
  date            DateTime      @db.Date
  description     String?
  transferGroupId String?
  revenueId       String?       @unique
  revenue         Revenue?      @relation(fields: [revenueId], references: [id], onDelete: SetNull)
  expenseId       String?       @unique
  expense         Expense?      @relation(fields: [expenseId], references: [id], onDelete: SetNull)
  collectionId    String?       @unique
  collection      Collection?   @relation(fields: [collectionId], references: [id], onDelete: SetNull)
  createdAt       DateTime      @default(now()) @db.Timestamp(3)

  @@index([accountId, date])
  @@index([date])
  @@index([transferGroupId])
}

model Receivable {
  id          String           @id @default(cuid())
  customerId  String
  customer    Customer         @relation(fields: [customerId], references: [id], onDelete: Restrict)
  description String
  totalKurus  Int
  dueDate     DateTime?        @db.Date
  source      ReceivableSource @default(manual)
  jobId       String?
  job         Job?             @relation(fields: [jobId], references: [id], onDelete: SetNull)
  quoteId     String?
  quote       Quote?           @relation(fields: [quoteId], references: [id], onDelete: SetNull)
  revenueId   String?          @unique
  revenue     Revenue?         @relation(fields: [revenueId], references: [id], onDelete: SetNull)
  createdAt   DateTime         @default(now()) @db.Timestamp(3)
  updatedAt   DateTime         @updatedAt @db.Timestamp(3)

  collections Collection[]

  @@index([customerId])
  @@index([dueDate])
}

model Collection {
  id           String        @id @default(cuid())
  receivableId String
  receivable   Receivable    @relation(fields: [receivableId], references: [id], onDelete: Restrict)
  amountKurus  Int
  date         DateTime      @db.Date
  method       PaymentMethod @default(cash)
  accountId    String?
  account      Account?      @relation(fields: [accountId], references: [id], onDelete: SetNull)
  createdAt    DateTime      @default(now()) @db.Timestamp(3)
  updatedAt    DateTime      @updatedAt @db.Timestamp(3)

  movement CashMovement?

  @@index([receivableId])
  @@index([date])
}

model Quote {
  id         String      @id @default(cuid())
  customerId String?
  customer   Customer?   @relation(fields: [customerId], references: [id], onDelete: SetNull)
  jobId      String?
  job        Job?        @relation(fields: [jobId], references: [id], onDelete: SetNull)
  title      String
  status     QuoteStatus @default(draft)
  validUntil DateTime?   @db.Date
  notes      String?
  createdAt  DateTime    @default(now()) @db.Timestamp(3)
  updatedAt  DateTime    @updatedAt @db.Timestamp(3)

  items       QuoteItem[]
  receivables Receivable[]

  @@index([customerId])
  @@index([status])
}

model QuoteItem {
  id            String   @id @default(cuid())
  quoteId       String
  quote         Quote    @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  name          String
  unit          String?
  quantity      Decimal  @default(1) @db.Decimal(10, 2)
  unitPriceKurus Int
  sortOrder     Int      @default(0)

  @@index([quoteId, sortOrder])
}

model ServiceItem {
  id             String   @id @default(cuid())
  name           String
  description    String?
  unit           String?
  unitPriceKurus Int
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now()) @db.Timestamp(3)
  updatedAt      DateTime @updatedAt @db.Timestamp(3)

  @@index([sortOrder])
}
```

### Bağımlılık ve Config Değişiklikleri

- `npm i @prisma/adapter-pg` — Prisma v7 `prisma-client` generator'ı **driver adapter zorunlu** kılar (`new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`). Client girişi `src/generated/prisma/client.ts`.
- `npm i zod` — tek validasyon kütüphanesi (v4).
- `npm i -D tsx` — seed/script'ler TS çalıştırmak için.
- `prisma.config.ts`: `migrations: { seed: "tsx prisma/seed.ts" }` eklenir (v7 `MigrationsConfigShape.seed` ile doğrulandı). `datasource.url` config'den gelir (schema'ya yazılmaz — mevcut durum doğru).
- Yeni script'ler: `db:migrate` (`prisma migrate dev`), `db:seed` (`prisma db seed`), `db:test:setup`.
- `src/server/db.ts`: Prisma singleton (adapter ile; dev'de `globalThis` üzerinde tekil).

## API Yüzeyi

Konvansiyonlar:

- Tüm rotalarda `export const dynamic = "force-dynamic"` (GET zaten v15+ default dynamic; açık yazılır).
- Next 16 imzası: `params` bir **Promise**; `RouteContext<'/api/...'>` tipi (typegen ile üretilir).
  Fallback: `{ params }: { params: Promise<{ id: string }> }`.
- Listeleme: `page` (1'den), `pageSize` (varsayılan 50, tavan 100) → `{ data: [], meta: { total, page, pageSize } }`.
- Tutarlar API'de daima integer kuruş (`amountKurus` vb.); TL string'i API'ye girmez/çıkmaz.
  Kullanıcının "1.234,56" girdisi client'ta `parseTLToKurus()` ile normalize edilir (Intl parse etmez — skill kuralı).
- Hata: `{ error: { code, message, fields? } }`; 400 `BAD_REQUEST`, 404 `NOT_FOUND` (P2025 dahil),
  409 `CONFLICT` (iş kuralı) / `INVALID_TRANSITION` (durum geçişi), 422 `VALIDATION_ERROR` (zod, `fields` dolu),
  500 `INTERNAL` ("Beklenmeyen bir hata oluştu"). `message` Türkçe.
- Silme yanıtı `200 { data: { id } }`.
- Tarih-saat alanları API'de ISO UTC string; tarih-sadece alanlar `YYYY-MM-DD` string.

### Endpointler

| Method | Path | İşlev |
| --- | --- | --- |
| GET | `/api/customers` | Liste (`q` ad/telefon araması, büyük/küçük harf duyarsız) |
| POST | `/api/customers` | `{ name, phone?, notes? }` |
| GET | `/api/customers/[id]` | Detay + alacak bakiyesi |
| PATCH | `/api/customers/[id]` | Kısmi güncelle (silme yok) |
| GET | `/api/expense-categories` | Sabit kategoriler (sortOrder) |
| GET | `/api/jobs` | Liste (`date, status, customerId` filtreleri; saat sıralı) |
| POST | `/api/jobs` | `{ customerId, title, description?, priceKurus?, scheduledOn?, startTime? }` |
| GET | `/api/jobs/[id]` | Detay + `summary: { revenueTotalKurus, expenseTotalKurus, profitKurus }` |
| PATCH | `/api/jobs/[id]` | Kısmi güncelle (status dahil; `completed` → `completedOn` = bugün) |
| DELETE | `/api/jobs/[id]` | Sil; bağlı gelir/gider korunur (bağ kopar) |
| GET | `/api/revenues` | Liste (`from, to, customerId, jobId, accountId`) |
| POST | `/api/revenues` | `{ date, amountKurus, description?, method?, paid?, customerId?, jobId?, accountId? }` — `paid=true`+`accountId` → hareket; `paid=false` → alacak (BR-3) |
| PATCH | `/api/revenues/[id]` | Kısmi güncelle (bağlı hareket senkron) |
| DELETE | `/api/revenues/[id]` | Sil + bağlı hareket silinir; tahsilatlı alacak varsa 409 (BR-12) |
| GET | `/api/expenses` | Liste (`from, to, categoryId, jobId, accountId`) |
| POST | `/api/expenses` | `{ date, amountKurus, categoryId, description?, jobId?, accountId? }` — hareket birlikte |
| PATCH | `/api/expenses/[id]` | Kısmi güncelle (hareket senkron) |
| DELETE | `/api/expenses/[id]` | Sil + bağlı hareket silinir |
| GET | `/api/accounts` | Hesaplar + hesaplanmış `balanceKurus` |
| POST | `/api/accounts` | `{ name, type, openingBalanceKurus?, sortOrder? }` |
| PATCH | `/api/accounts/[id]` | Kısmi güncelle (silme yok) |
| GET | `/api/accounts/[id]/movements` | Hareket listesi (`from, to`) |
| POST | `/api/movements` | Manuel para koy/çek: `{ accountId, direction: "in"/"out", amountKurus, date, description? }` — **PATCH/DELETE yok** |
| POST | `/api/accounts/transfer` | `{ fromAccountId, toAccountId, amountKurus, date, description? }` → tek transaction, `transferGroupId` ile iki hareket; `from ≠ to` zorunlu |
| GET | `/api/receivables` | Liste (`customerId, overdue` filtreleri) + satırda `paidKurus, remainingKurus, status` (hesaplanır) |
| POST | `/api/receivables` | Manuel alacak: `{ customerId, description, totalKurus, dueDate? }` |
| PATCH | `/api/receivables/[id]` | Kısmi güncelle |
| DELETE | `/api/receivables/[id]` | Tahsilat varsa 409 |
| GET | `/api/receivables/[id]/collections` | Tahsilat listesi |
| POST | `/api/receivables/[id]/collections` | `{ amountKurus, date, method?, accountId? }` — atomik: tahsilat + hesaba `collection` girişi; fazla tahsilat 409 |
| DELETE | `/api/collections/[id]` | Tahsilat sil + bağlı hareket silinir |
| GET | `/api/quotes` | Liste (`q, status, customerId`) + hesaplanmış `totalKurus` |
| POST | `/api/quotes` | `{ customerId?, title, validUntil?, notes?, items: [{ name, unit?, quantity, unitPriceKurus }] }` |
| GET | `/api/quotes/[id]` | Detay + kalemler + toplam |
| PATCH | `/api/quotes/[id]` | Kısmi güncelle (kalemler dahil; replace) |
| POST | `/api/quotes/[id]/accept` | Kabul + `{ createJob: true }` isteğe bağlı iş üretimi (tek transaction); `draft/sent` dışı 409; aynı tekliften ikinci iş 409 |
| DELETE | `/api/quotes/[id]` | Sil |
| GET | `/api/quotes/[id]/pdf` | **501 stub** (PDF/WhatsApp sonraki aşama, `whatsapp-share` skill) |
| GET | `/api/service-items` | Hizmet listesi (sortOrder) |
| POST | `/api/service-items` | `{ name, description?, unit?, unitPriceKurus, sortOrder? }` |
| PATCH | `/api/service-items/[id]` | Kısmi güncelle |
| DELETE | `/api/service-items/[id]` | Sil (teklif snapshot'ları etkilenmez) |
| GET | `/api/summary/today` | "Bugün": kasa bakiyesi, bugünkü işler (saat sıralı), bu ay gelir/gider, alacak özeti (toplam + müşteri sayısı + geciken) — tek yanıt |

## İş Kuralları

**Para ve tarih**

- BR-1: Tüm tutarlar kuruş integer, > 0 (girişlerde); negatif/ondalık API'ye giremez.
- BR-2: Tarih `YYYY-MM-DD` (gerçek takvim doğrulanır), saat `"HH:mm"` (regex `^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$`). "Bugün" = Europe/Istanbul takvim günü; UTC günü kullanılmaz.

**Gelir / Gider / Hesap akışı**

- BR-3: Gelir `paid=true` + `accountId` → aynı transaction'da `income` hareketi. `paid=false` → aynı transaction'da o müşteriye Receivable açılır (hareket yazılmaz).
- BR-4: Gider → aynı transaction'da seçilen hesaba `expense` (çıkış) hareketi. Ödenmemiş gider kavramı yok.
- BR-5: Tahsilat → aynı transaction'da alacak azalır + seçilen hesaba `collection` girişi. Toplam tahsilat alacağı aşamaz.
- BR-6: Hesap bakiyesi = açılış bakiyesi + girişler − çıkışlar (her istekte hareketlerden hesaplanır, saklanmaz).
- BR-7: Manuel hareket yalnızca para koy/çek içindir; gelir/gider kaydının yerine geçmez. Transfer, `transferGroupId`'li iki hareketle tek transaction'da yazılır.

**Kâr, alacak, durumlar**

- BR-8: İş kârı = işe bağlı gelirler − işe bağlı giderler; her sorguda hesaplanır, saklanmaz. Bağ yoksa 0.
- BR-9: Alacak durumu hesaplanır: kalan 0 → "Ödendi"; kalan > 0, vade var ve geçmiş → "Gecikti"; değilse "Açık". Vade işlem gününden önce olamaz.
- BR-10: İş durumları yalnızca `planned/pending/completed`. Tamamlanınca `completedOn` = bugün yazılır; işe bağlı gelir/gider durumdan bağımsız girilebilir.

**Teklif**

- BR-11: Teklif toplamı = Σ(adet × birim fiyat), satır kuruşa HALF_UP yuvarlanır.
- BR-12: Hizmetten eklenen kalem fiyatı **kopyalanır** (snapshot); hizmet sonra değişse/silinse teklif bozulmaz.
- BR-13: Geçişler: `draft → sent → accepted | rejected`; `accepted/rejected` son durumdur.
- BR-14: Kabul → isteğe bağlı iş üretimi (müşteri tekliften, açıklama kalem listesi, `priceKurus` = teklif toplamı). Teklif kalır; ikinci iş üretimi reddedilir. **Teklif tarafında maliyet/kâr alanı yoktur** (PDF'e asla maliyet/kâr girmez — veri modelinde garanti).

**Silme ve bütünlük**

- BR-15: Gelir silinince bağlı hareket ve tahsilatsız alacağı da silinir; tahsilatlı alacak varsa gelir silinemez (409).
- BR-16: Gider silinince bağlı hareket silinir.
- BR-17: İş silinince bağlı gelir/gider **korunur**, yalnızca bağ kopar.
- BR-18: Müşteri ve hesap silinemez. Kategoriler sabittir.
- BR-19: `CashMovement` immutable: **doğrudan edit/delete endpoint'i yoktur.** Bağımsız
  hareketler (`transfer_in/out`, `manual_in/out`) kaynaksızdır ve silinmez; düzeltme ters
  yönlü yeni manuel hareketle yapılır. Kaynak bağlı hareketler (`income/expense/collection`)
  yalnızca bağlı kayıt (gelir/gider/tahsilat) silindiğinde aynı transaction'da kaldırılır;
  kayıt güncellenince aynı transaction'da senkron edilir. Bakiye daima
  `openingBalance + hareketler` toplamından hesaplanır.

## Kabul Kriterleri

**Şema ve kurulum**

- [ ] `prisma migrate dev` temiz DB'de hatasız çalışır; seed ile "Kasa" hesabı ve 7 gider kategorisi oluşur; seed tekrar çalıştırınca aynı sonucu verir (idempotent).
- [ ] Tüm tutar sütunları integer kuruş; API yanıtında ondalıklı tutar dönmez.
- [ ] Tarih sütunları tarih-sadece; saat `"HH:mm"` doğrulanır (23:59 geçerli, 24:00 ve 09:5 red).

**Müşteri**

- [ ] `POST /api/customers` boş adı 422 + Türkçe mesajla reddeder; geçerli kaydı oluşturur.
- [ ] `GET /api/customers?q=ahmet` ad/telefonda büyük/küçük harf duyarsız arar.
- [ ] `PATCH /api/customers/[id]` günceller; bilinmeyen id 404.

**İş / Emir**

- [ ] `POST /api/jobs` başlık ve müşteri olmadan reddedilir; geçerli kayıtta durum `planned` olur.
- [ ] `GET /api/jobs?date=2026-08-19` yalnızca o günü saat sırasıyla döner.
- [ ] Durum `completed`'a geçince `completedOn` bugün (Istanbul) yazılır; tanımsız durum 422.
- [ ] İş silinince bağlı gelir/gider silinmez, bağ kopar.

**Gelir / Gider / Hesaplar**

- [ ] Peşin gelir: gelir + `income` hareketi aynı transaction'da; bakiye artar.
- [ ] Veresiye gelir: hareket OLUŞMAZ; müşteriye aynı tutarda alacak açılır.
- [ ] Gider: gider + `expense` hareketi aynı transaction'da; bakiye azalır.
- [ ] 0 veya negatif tutarlı gelir/gider/hareket 422 red.
- [ ] Manuel para koy/çek bakiyeyi doğru günceller; transfer iki hareket üretir, `from=to` reddedilir.
- [ ] Gelir/gider silinince bağlı hareket silinir, bakiye eski değere döner.

**CashMovement (onaylı düzeltme)**

- [ ] `CashMovement` için PATCH/DELETE endpoint'i YOKTUR; yalnızca `POST /api/movements` (manuel) ve listeleme vardır.
- [ ] Manuel (`manual_in/out`) ve transfer (`transfer_in/out`) hareketleri hiçbir silme akışında kaldırılmaz.
- [ ] Gelir/gider/tahsilat silinince bağlı hareket aynı transaction'da kaldırılır; bağımsız hareketler kalır.
- [ ] Bakiye her zaman `openingBalance + girişler − çıkışlar` toplamıdır; herhangi bir harekette saklı bakiye alanı yoktur.

**Alacak ve tahsilat**

- [ ] 10.000 kuruşluk alacağa 4.000 kuruşluk tahsilat: kalan 6.000, durum "Açık", hesaba 4.000 kuruşluk `collection` girişi.
- [ ] Kalanı aşan tahsilat 409; bakiye 0 → "Ödendi"; vadesi geçmiş bakiye > 0 → "Gecikti".
- [ ] Vadesi işlem gününden önce olan alacak açılamaz (422).
- [ ] `GET /api/receivables` müşteri bazlı bakiye ve geciken toplamı doğru döner.

**İş bazlı kâr**

- [ ] İşe bağlı 12.000 kuruş gelir + 5.000 kuruş gider → kâr 7.000 kuruş; bağ yoksa 0.
- [ ] `GET /api/jobs/[id]` summary'de bu değerler döner; gelir/gider değişince yeniden hesaplanır.

**Teklif**

- [ ] Kalemli teklif oluşturulur; toplam = Σ(adet × birim fiyat) doğru (yarım saat/saat miktarları dahil).
- [ ] Hizmet fiyatı sonra değişse de mevcut teklif tutarı değişmez (snapshot).
- [ ] `draft→sent→accepted` çalışır; `accepted/rejected` sonrası değişim 409.
- [ ] Kabul + `createJob`: iş oluşur (müşteri, kalem açıklaması, `priceKurus` = toplam); ikinci kez 409.
- [ ] Teklif modelinde maliyet/kâr alanı bulunmaz.

**Özet ve genel**

- [ ] `GET /api/summary/today` tek yanıtta: kasa bakiyesi, bugünkü işler (saat sıralı), bu ay gelir/gider toplamları, alacak özeti (toplam + müşteri sayısı + geciken) — değerler doğru.
- [ ] "Bu ay" o ayın kayıt tarihli kayıtlarının toplamıdır; önceki ay dahil edilmez.
- [ ] Tüm listeler `{ data, meta }` envelope; geçersiz id 404, doğrulama 422 (fields dolu), iş kuralı 409; mesajlar Türkçe.
- [ ] Unit testler: `parseTLToKurus`, kâr/bakiye/alacak durumu hesapları, durum geçiş tabloları, tarih/saat doğrulama.
- [ ] E2E (test DB): veresiye gelir → tahsilat → bakiye; teklif → kabul → iş üretimi akışları.
- [ ] `lint` + `typecheck` + `test` + `test:e2e` hatasız geçer.

## Test ve Seed Stratejisi

- **Seed** (`prisma/seed.ts`, tsx): 7 kategori, "Kasa" hesabı, ~8 hizmet kalemi, 5 müşteri,
  4 iş (farklı durumlarda), işlere bağlı gelir/giderler, 3 alacak + tahsilatlar, 2 teklif.
  Sabit id'lerle upsert (tekrar çalıştırma güvenli). Akış: `npm run db:up` → `db:migrate` → `db:seed`.
- **Test DB:** docker-compose'a `db-test` (port 5433, `esnaf_test`); `db:test:setup` script'i
  migrate reset + seed. API E2E'leri 3001 portunda ikinci webServer ile test DB'ye bağlanır;
  dev DB'ye (5432) dokunulmaz.
- **Unit:** saf mantık (para parse, kâr/bakiye/durum hesabı, geçiş tabloları, zod şemaları) DB'siz;
  servisler sahte Prisma client enjekte edilerek.
- **API E2E:** Playwright `request` fixture ile gerçek endpoint'ler (envelope, 404/409/422,
  atomiklik, bakiye hesabı).

## Kapsam Dışı (Bu Aşamada Yapılmayacaklar)

- UI/hook değişiklikleri (ekranlar aynı kalır; sonraki aşamada bu API'ye bağlanır).
- Teklif PDF üretimi ve WhatsApp paylaşımı (model hazır; 501 stub yeterli).
- Auth/kullanıcı, çok işletme; ödenecek/borç takibi; stok; personel.
- Gider kategorisi yönetimi; müşteri/hesap silme.
- Aylık rapor ekranı ve grafikler (`/api/reports/summary` sonraki aşamada).
- Teklifte KDV/indirim; iş durumuna iptal; hesap bakiyesi snapshot'ı.
- PWA/offline (katmanlaşma hazırlığı yeterli).

## Açık Sorular (Karar Gerektiren)

> **TÜMÜ ÇÖZÜLDÜ** — 19 Ağustos 2026 kullanıcı onayıyla. Kararlar "Onaylanan Kararlar (Q1-Q12)"
> bölümündedir; tablo yalnızca iz sürmek için bırakılmıştır.

| No | Soru | Öneri |
| --- | --- | --- |
| Q1 | Gelir ne zaman sayılır: iş yapıldığında (kayıt anında) mı, tahsil edildiğinde mi? | Kayıt anında (bu spec); esnafın defteriyle uyumlu |
| Q2 | İş durumuna "iptal" veya "taslak" gerekir mi? | Gerekmez; 3 durum yeterli, iptal edilen silinir |
| Q3 | Ödenecek/borç takibi (veresiye malzeme) gerekir mi? | MVP'de hayır; sonraki aşama |
| Q4 | Soft delete (deletedAt) yerine hard delete yeterli mi? | Yeterli; "yanlış girdim" hard delete ile çözülür |
| Q5 | Gider kategorilerini kullanıcı yönetebilmeli mi? | Sabit liste + "Diğer" yeterli |
| Q6 | Teklifte KDV oranı/indirim gerekir mi? | Gerekmez; kalemler nihai fiyat |
| Q7 | Teklifte "süresi doldu" (expired) durumu gerekir mi? | Gerekmez; geçerlilik `validUntil` bilgi amaçlı |
| Q8 | Müşteri silme gerekir mi? | Hayır; yanlış kayıt düzenlenir |
| Q9 | `CashMovement`'ta "en fazla bir referans dolu" DB CHECK'i eklensin mi? | Servis yeterli; DB katılaştırması sonra |
| Q10 | Teklif `accepted` + `createJob` akışında otomatik alacak açılsın mı? | Hayır; alacak veresiye gelir kaydıyla açılır |
| Q11 | Multi-tenant geçişi için `withTenant(ctx)` noktaları şimdi dondurulsun mu? | Evet; kod incelemesinde kriter |
| Q12 | Banka hesabı seed'de oluşturulsun mu? | Hayır; yalnızca "Kasa"; banka kullanıcı ekler |
