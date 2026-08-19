# Esnaf App — Design Direction

> Aşama 1 (Design Exploration) çıktısı. Durum: **kullanıcı onayı bekleniyor.**
> Bu doküman onaylanana kadar ekran implementasyonu yapılmaz.
> Referans: Stitch'te seçilen mobil-first küçük işletme dashboard'u.
> Referans birebir kopyalanmaz; aşağıdaki sistem Esnaf App için üretilmiştir.

---

## 0. Tasarım İlkeleri

1. **Hızlı anlaşılır** — Bir bakışta: kasa, bugünün işleri, bu ayın durumu, alacaklar.
2. **Tek elle kullanılır** — Kritik aksiyonlar ekranın alt yarısında, dokunma alanları ≥ 44px.
3. **Profesyonel ve güvenilir** — Esnafın parasını yönettiği bir alet gibi durmalı, oyuncak değil.
4. **Finansal bilgiler önce gelir** — Rakamlar büyük, hizalı (tabular), süslemesiz.
5. **Günlük akışı hızlandırır** — Bugünün işleri, tek dokunuşla durum değişimi.
6. **Sade ama karakterli** — Serif başlık + derin yeşil + sıcak zemin = kişilik; başka süs yok.

Kişilik cümlesi: *"Mahallenin güvenilir muhasebe defteri; dijital ama sıcak."*

---

## 1. Color System

Palet: kırık beyaz zemin üzerine derin orman yeşili, sıcak mürekkep metin, toprak tonlu
durum renkleri. **Gradient, mor, lacivert yok.**

| Token | Rol | Değer (oklch) | Yaklaşık hex | Kullanım |
| --- | --- | --- | --- | --- |
| `background` | Sayfa zemini | `oklch(0.972 0.005 85)` | `#F7F5F2` | Tüm ekranların arka planı |
| `surface` | Kart/yüzey | `oklch(0.995 0.002 85)` | `#FEFDFB` | Kartlar, listeler, nav |
| `surface-sunken` | Gömülü alan | `oklch(0.945 0.006 85)` | `#EFECE8` | Segmented control, kod alanları |
| `primary` | Ana renk | `oklch(0.32 0.05 155)` | `#1E3A2F` | Aktif nav, birincil buton, bağlantılar |
| `primary-hover` | Basılı durum | `oklch(0.27 0.05 155)` | `#16302A` | Buton hover/pressed |
| `primary-soft` | Yeşil ton | `oklch(0.95 0.018 155)` | `#E9EFEA` | Seçili satır, aktif kenar |
| `ink` | Birincil metin | `oklch(0.235 0.012 70)` | `#26221D` | Başlık, gövde, rakamlar (saf siyah değil) |
| `muted` | İkincil metin | `oklch(0.52 0.012 75)` | `#6E6A62` | Açıklamalar, alt metin |
| `faint` | Üçüncül metin | `oklch(0.68 0.010 75)` | `#99948A` | Yer tutucu, değersiz bilgi |
| `border` | Çizgiler | `oklch(0.905 0.006 80)` | `#E4E1DB` | Kart kenarları, ayraçlar, input |
| `border-strong` | Vurgulu çizgi | `oklch(0.85 0.008 80)` | `#D3CFC7` | Dış kontur, hover çizgisi |
| `success` | Olumlu durum | `oklch(0.47 0.085 152)` | `#1E5B3F` | Tamamlandı, ödendi |
| `success-soft` | Olumlu zemin | `oklch(0.95 0.028 152)` | `#E4F0E8` | Durum çipi zemini |
| `warning` | Dikkat | `oklch(0.58 0.115 72)` | `#8F6108` | Bekliyor, vade yaklaşıyor |
| `warning-soft` | Dikkat zemini | `oklch(0.955 0.028 85)` | `#F4EEDC` | Durum çipi zemini |
| `error` | Olumsuz | `oklch(0.54 0.135 26)` | `#AE3E24` | Gecikti, silme, hata |
| `error-soft` | Olumsuz zemin | `oklch(0.958 0.022 26)` | `#F6E7E1` | Durum çipi zemini |
| `pos` | Finansal artı | `oklch(0.46 0.088 152)` | `#1D573C` | Gelir, kâr, +₺ değerler |
| `neg` | Finansal eksi | `oklch(0.52 0.14 26)` | `#A63A21` | Gider, −₺ değerler |
| `chart-ink` | Grafik mürekkebi | `oklch(0.40 0.02 70)` | `#5A554B` | Grafiklerde nötr seri |

Kurallar:

- Durum renkleri yalnızca metin/dot/ince çizgide kullanılır; **büyük renkli zemin blokları yok**.
- Durum çipleri daima `*-soft` zemin + ilgili koyu ton metin; dolu renkli çip yok.
- Finansal renkler: gelir/kâr/artı `pos`, gider/eksi `neg`. Renk asla tek işaret aracı değildir; daima `+` / `−` (U+2212) işareti eşlik eder.
- Kontrast: küçük metinlerde en az AA (4.5:1). `success`/`warning`/`error` metinleri `-soft` zemin üzerinde kontrol edilir.
- **Dark mode v1 kapsamı dışında.** Token yapısı buna izin verecek şekilde kurulur; `.dark` blokları daha sonra tanımlanır.
- Tek vurgu: `primary` yeşili. Ekranda aynı anda en fazla 1 "renkli" öğe öne çıkar (aktif sekme ya da birincil buton).

---

## 2. Typography

| Stil | Font | Boyut / Satır | Ağırlık | Kullanım |
| --- | --- | --- | --- | --- |
| `display` | Source Serif 4 | 40px / 44px | 600 | Kasa toplamı (tek, sayfada en fazla 1 adet) |
| `page-title` | Source Serif 4 | 24px / 30px | 600 | Ekran başlıkları, işletme adı |
| `card-title` | Manrope | 14px / 20px | 600 | Kart başlıkları, müşteri adı |
| `section-label` | Manrope | 11px / 16px | 600 | Bölüm etiketleri — **uppercase, letter-spacing 0.08em, muted** |
| `body` | Manrope | 15px / 22px | 400 | Gövde metni |
| `body-strong` | Manrope | 15px / 22px | 600 | Vurgulu gövde |
| `small` | Manrope | 13px / 18px | 500 | Alt açıklamalar, saat bilgisi |
| `caption` | Manrope | 12px / 16px | 500 | En küçük etiketler |
| `amount` | Manrope | 16px / 22px | 600 | Liste içi finansal tutarlar — `tnum` |
| `amount-sm` | Manrope | 13px / 18px | 600 | Kompakt tutarlar — `tnum` |
| `nav-label` | Manrope | 10px / 12px | 500 | Alt navigasyon etiketleri |

Kurallar:

- **Fontlar:** Google Fonts üzerinden `Manrope` (400/500/600/700) ve `Source_Serif_4` (400/600),
  Next.js `next/font/google` ile yüklenir. Türkçe karakterler için **`subsets: ["latin-ext"]` zorunlu**
  (ğ, ş, ı, İ, ç, ö, ü).
- Serif yalnızca `display` ve `page-title` için; gövde daima Manrope.
- Tüm para tutarları ve sayılar **tabular figures** (`font-variant-numeric: tabular-nums` /
  `tnum`); rakamlar hizalanır, değer değişince genişlik zıplamaz.
- Büyük tutarlarda ₺ simgesi tutardan küçük (`display`'te ~22px, üstte hizalı).
- Başlık hiyerarşisi: ekran başına tek `page-title`; geri kalan her şey küçük uppercase
  `section-label`'lar. **Aşırı büyük başlık yok.**
- Metin asla tamamen uppercase (Türkçe `İ` sorunu); uppercase yalnızca kısa etiketlerde CSS ile.

---

## 3. Spacing

Temel ızgara: **4px** (4, 8, 12, 16, 20, 24, 32, 40, 48).

| Alan | Değer |
| --- | --- |
| Sayfa yatay padding (mobil) | 16px |
| Sayfa yatay padding (≥640px) | 20px |
| Sayfa üst/alt boşluk | 16px + `env(safe-area-inset-*)` |
| Bölümler arası boşluk | 28px |
| Kart içi bölüm boşluğu | 16px |
| Kart padding | 16px (kompakt kart 14px) |
| Liste satırı min. yükseklik | 56px |
| Satır içi padding | 12px 16px |
| Ayraç (divider) içerden girinti | 16px |
| Buton yüksekliği | 48px (birincil aksiyon) / 44px (standart) / 40px (kompakt) |
| Input yüksekliği | 44px |
| Alt nav yüksekliği | 64px + `env(safe-area-inset-bottom)` |
| Alt nav ikon/label arası | 4px |
| Dokunma hedefi (minimum) | 44x44px — her yerde |

Kurallar:

- Yoğunluk kontrollü: kart içinde tek paragraflık bilgi; uzun metin listelerde 2 satırla sınırlı.
- Aksiyonlar tek elle erişilebilir yerlerde: alt nav, alt sheet'ler, kart altı butonlar.

---

## 4. Shape

| Öğe | Radius |
| --- | --- |
| Kart | 10px |
| Buton | 8px |
| Input / select | 8px |
| Sheet (üst köşeler) | 12px |
| Dialog | 12px |
| Durum çipi (chip) | 6px |
| Durum noktası (dot) | 8px çap (daire — tek istisna) |
| Segmented control | 8px (kap 10px) |

- **Border kalınlığı: 1px her yerde.** Daha kalın çizgi yok.
- `rounded-full` / hap şeklinde kart, buton ve rozet **yasak**; tek istisna 8px durum noktaları.
- Aşırı yuvarlaklık yok: 16px üzeri radius yalnızca büyük overlay'lerde kullanılmaz, hiçbir yerde kullanılmaz.

---

## 5. Elevation

| Öğe | Shadow |
| --- | --- |
| Kartlar | **Yok** — 1px `border` |
| Liste satırları | Yok |
| Input, buton, çip | Yok |
| Alt navigasyon | Yok — üstte 1px `border`, zemin `surface` (%95 opak + backdrop-blur opsiyonel) |
| Dialog / Popover / Dropdown | **Tek** yumuşak gölge: `0 8px 24px oklch(0.2 0.01 70 / 12%)` + 1px border |
| Sheet | Aynı tek gölge + 1px border |

Kurallar:

- Shadow bir "stil" değil, **katman ayracıdır**: yalnızca bir yüzey diğerinin üzerinde
  yüzdüğünde kullanılır.
- Kart hiyerarşisini shadow ile değil; zemin/surface farkı ve border ile ver.
- Gölge sayısı her overlay'de biri geçemez; çift gölge (soft + tight) yok.

---

## 6. Components

### 6.1 Card

- `surface` zemin, 1px `border`, 10px radius, 16px padding. Shadow yok.
- Kart içi başlık: `section-label` (uppercase, muted) sol üstte; sağında opsiyonel
  "Tümü →" bağlantısı (`primary`, 12px, 600).
- Kart içi bölümler 1px hairline ayraçla ayrılır; ayraç kart kenarından 16px girintili.
- Kartın tamamı tıklanabilirse hover'da `surface-sunken` tonuna kayar (yalnızca pointer cihazlarda).

### 6.2 Buton

- **Birincil:** `primary` zemin, beyaza yakın metin (`oklch(0.99 0.005 85)`), 8px radius,
  44-48px yükseklik, tam genişlik (mobilde). Gölge yok, gradient yok.
- **İkincil:** şeffaf zemin, 1px `border-strong`, `ink` metin.
- **Ghost:** çizgisiz; metin `primary`.
- **Yıkıcı (destructive):** `error` metin + 1px `error` çizgili ikincil stil; dolu zemin
  yalnızca onay dialoglarında.
- Basılı durum: `primary-hover` / `surface-sunken` (parlaklık animasyonu yok, direkt renk).
- Focus: 2px `primary` ring, 2px offset — klavye kullanımı için zorunlu.
- İkon + etiket düzeninde ikon 18-20px, Material Symbols.

### 6.3 Input

- Zemin `surface`, 1px `border`, 8px radius, 44px yükseklik.
- Label input'un üstünde: 12px, 600, `ink` (placeholder'lı float label yok).
- Yardımcı/hata metni altında: 12px; hata `error`.
- Focus: 1px border `primary` + 2px `primary` ring (2px offset).
- Para girişi: ₺ simgesi solda sabit, rakamlar `tnum`; virgül ondalık ayracı (tr-TR).

### 6.4 List Row

- Min. 56px yükseklik; sol: başlık + alt satır (12px `muted`), sağ: değer + durum.
- Başlık 1 satırla sınırlı, taşarsa `text-overflow: ellipsis`; alt satır 1-2 satır.
- Ayraç: hairline, soldan 16px girintili; son satırda ayraç yok.
- Tıklanabilir satırda sağda chevron (16px, `faint`); basılı durumda `surface-sunken`.
- Satır sağındaki tutarlar `amount` stili ve `tnum`; sağa hizalı.

### 6.5 Status Indicator

- 8px nokta (dot) + 12-13px etiket; gerekirse `*-soft` zeminli 6px radius'lu küçük çip.
- Durumlar:
  - **Tamamlandı / Ödendi** — `success` (nokta + metin)
  - **Bekliyor / Planlandı** — `warning`
  - **Gecikti / Vadesi geçti** — `error`
  - **Pasif / Bilgi** — `faint` veya `muted`
- Dolgulu, parlak rozetler yasak; durum, satırı okurken bir saniyede anlaşılmalı.

### 6.6 Financial Summary

- Etiket solda `section-label`, tutar sağda `amount`/`display` — **her zaman sağa hizalı, tnum**.
- Değişim satırı: `+₺1.240 bu hafta` / `−₺320 geçen aya göre`; işaret (U+2212) + renk (`pos`/`neg`).
- Renkli arka planlı KPI kutuları yok; finansal bilgiler kart içinde metin olarak yaşar.

### 6.7 Navigation (Alt Tab Bar)

- 5 sekme: **Bugün, İşler, Teklif, Müşteriler, Defter**.
- Her sekme: 24px Material Symbols ikon + 10px `nav-label`.
- Aktif: ikon + etiket `primary` (600). Pasif: `muted`. **Pill/hap vurgusu yok.**
- Zemin `surface`, üstte 1px `border`; yükseklik 64px + safe-area.
- Aktiflik yalnızca renkle anlatılır; ilave ikon doldurma (filled/outline) geçişi kabul edilebilir.

### 6.8 Empty State

- Dikey ortalanmış: `page-title` (18px serif) başlık + tek satır `muted` açıklama +
  tek birincil buton.
- **İllüstrasyon, ikon süsü, dekoratif grafik yok.** (Opsiyonel: tek ince çizgi ikon, `faint` tonunda.)

### 6.9 Dialog

- 12px radius, `surface` zemin, 1px border + tek gölge (bkz. Elevation).
- Başlık: Source Serif 4, 18px, 600. Metin: `body`/`small`, `muted`.
- Aksiyonlar altta sağa hizalı; yıkıcı aksiyon `error` renkte.
- Maks. genişlik 400px; mobilde kenarlardan 24px içeride.

### 6.10 Sheet (Bottom Sheet)

- Mobil birincil aksiyon kalıbı: yeni iş, yeni müşteri, teklif oluştur, tutar girişi.
- Ekran altına yapışık; üst köşeler 12px; başlık + kapatma (X, 44px dokunma alanı).
- İçerik `env(safe-area-inset-bottom)` + 16px padding; birincil buton altta sabit.
- Görünme animasyonu: 150-200ms yalnızca translate; spring/abartılı easing yok.

---

## 7. Data Visualization

İlke: **grafik, rakamın yerine geçmez; rakamı destekler.** Grafik kütüphanesi v1'de yok;
gerekenler saf CSS/şekil ile çizilir.

| Veri | Gösterim |
| --- | --- |
| Gelir / Gider (Bu Ay) | İki ince yatay bar (6px yükseklik): gelir `pos`, gider `neg`; sağda ₺ değerleri |
| Kasa | `display` tutar + altında `+₺X bu hafta` değişim satırı |
| Kasa haftalık mini trend | 7 adet 4px dikey bar, tek renk (`primary` veya `chart-ink`) |
| Alacaklar | Toplam + müşteri sayısı; vadesi geçen kısım `error` renkle işaretli |
| İş bazlı kâr | Satır başına 4px ince progress bar (`success` dolgu, `surface-sunken` zemin) + ₺ değer |
| Aylık rapor | Liste/tablo öncelikli; gerekirse 2px tek renkli çizgi grafik, dolgusuz veya %6 düz dolgu |

Grafik kuralları:

- **Izgara çizgisi, eksen, legend, tooltip yok.** Değerler doğrudan etiketlenir.
- Grafik başına en fazla 2 renk; renkler daima anlamlı (pos/neg/primary).
- Gradient dolgu, 3D, radar, pasta şöleni yasak. Donut yalnızca rapor ekranında,
  merkezde toplam değerle, düz renklerle kullanılabilir.
- Amaç "zengin dashboard" değil; esnafın 3 saniyede okuyabileceği özet.

---

## 8. Responsive Behavior

Mobil-first; referans hissiyat ~390px viewport.

| Aralık | Davranış |
| --- | --- |
| < 640px (mobil) | Tam genişlik içerik, alt tab bar; tüm birincil akışlar bottom sheet |
| 640–1023px (tablet) | İçerik ortalanır (max-w 600px), alt tab bar ortalanır (max-w 600px) |
| ≥ 1024px (desktop) | Alt tab bar **sol kenar çubuğuna** dönüşür (216px): aynı 5 öğe, satır düzeni (20px ikon + 14px etiket), aktif satır `primary-soft` zemin + `primary` metin + 8px radius, sağda 1px border. İçerik sütunu max-w **680px**, dikey ortalanmış |

Desktop kuralları:

- Veri yoğun çok sütunlu dashboard **yapılmaz**; içerik sütunu tek kalır, yalnızca konfor alanı artar.
- Dialog/sheet yerini gerektiğinde yan panel veya dialog alır; bottom sheet mobil kalıbıdır.
- Tüm dokunma hedefleri ≥ 44px masaüstünde de korunur (mouse hover stilleri eklenir).
- Sabit üst bar yok; işletme adı + tarih içerik sütununun başında durur.

---

## 9. Turkish UI Conventions

- **Para:** `Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" })` →
  `₺1.234,50`. Sembol ₺; negatifte `−` (U+2212) işareti. (DB tarafı: kuruş cinsinden integer.)
- **Tarih:** uzun `"19 Ağustos 2026"` (Bugün başlığı), kısa `"19.08.2026"` (liste satırları).
  Ay/gün adları cümle içinde küçük harf. Bugün yerine "Bugün", yarın yerine "Yarın" etiketi.
- **Sayı:** `Intl.NumberFormat("tr-TR")` → binlik ayraç nokta, ondalık virgül; tüm rakamlar `tnum`.
- **Metin:** Tüm UI metinleri Türkçe; İngilizce terim yok ("Dashboard" değil "Bugün").
  Hitap samimi-saygılı ("siz"), küçük esnafın dili: "Alacaklar", "Defter", "Kasa".
- **Saat:** 24 saat ("14:30").
- **Uyarılar:** doğrudan ve eylem odaklı ("Vadesi 2 gün geçti"), teknik jargon yok.

---

## 10. Anti-Generic UI Kuralları (Zorunlu)

1. Default shadcn görünümü yasak — her bileşen bu dokümandaki token'larla yeniden biçimlenir.
2. Mor / lacivert SaaS renkleri yasak.
3. `rounded-xl`/`rounded-full` kartlar ve hap rozetler yasak (istisna: 8px dot).
4. Gradient hero alanları, gradient buton/metin yasak.
5. Gereksiz shadow yasak (tek istisna: overlay katmanları).
6. Grafik kalabalığı, ızgara çizgili "analytics" estetiği yasak.
7. Renkli KPI kartları yasak; finansal bilgi kart içi metindir.
8. "AI dashboard" estetiği: ikon serpintisi, sahte istatistik, içi boş insight kartları yasak.
9. Abartılı animasyon yasak; yalnızca 150-200ms overlay geçişleri.
10. Ekran başına tek büyük başlık; dekoratif ama işlevsiz öğe yasak.

---

## 11. "Bugün" Ekranı Düzeni (Referans Uyarlaması)

Referans dashboard'un yapısı Esnaf App'e şöyle uyarlanır (implementasyon öncesi onay gerekir):

```
┌──────────────────────────────┐
│ ⚡ Yıldız Elektrik            │  işletme adı (page-title) + küçük ikon
│ Çarşamba, 19 Ağustos 2026    │  tarih (small, muted)
│                              │
│ ┌──────────────────────────┐ │
│ │ KASA                     │ │  section-label
│ │ ₺ 42.850                 │ │  display (Source Serif 4)
│ │ +₺1.240 bu hafta         │ │  pos + small
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ BUGÜNKÜ İŞLER    Tümü →  │ │
│ │ 14:30  Ahmet Usta         │ │  satır: saat + müşteri + iş
│ │        Kombi bakımı   ●   │ │  durum noktası sağda
│ │ 16:00  Aylin Hanım        │ │
│ │        Priz değişimi  ●   │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ BU AY                    │ │
│ │ Gelir  ▬▬▬▬▬  ₺28.400   │ │  yatay barlar + değerler
│ │ Gider  ▬▬      ₺11.750   │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ ALACAKLAR            →   │ │  toplam + müşteri sayısı + ok
│ │ ₺6.300 · 4 müşteri        │ │
│ └──────────────────────────┘ │
│                              │
│  Bugün  İşler  Teklif  ...   │  alt nav (5 sekme)
└──────────────────────────────┘
```

---

## 12. Stitch Referansından Alınan / Uyarlanan Prensipler

**Aynen alınan:**
- Mobil-first 390px hissiyatı; altta 5 sekmeli nav.
- Kırık beyaz zemin + beyaza yakın yüzey + 1px ince border, shadow'suz kart.
- Derin yeşil ana renk; sakin, ciddi, güvenilir ton.
- Küçük uppercase, letter-spacing'li bölüm etiketleri.
- Manrope gövde + Source Serif 4 başlık eşleşmesi.
- Finansal rakamlar belirgin ama abartısız; status noktaları sade.
- İçerik yoğunluğu kontrolü; sade liste satırları; Material Symbols ikonları.

**Uyarlanan / kararlaştırılan farklar:**
- İçerik esnaf iş akışına uyarlandı: Kasa → Bugünkü İşler → Bu Ay → Alacaklar hiyerarşisi,
  Türkçe etiketler ve ₺ formatı.
- Renkler Stitch ekranından birebir alınmadı; oklch token sistemine uygun üretildi
  (yeri geldiğinde kopyalama değil, aynı his).
- Grafikler referansta yok; yukarıda tanımlı minimal gösterimler yeni eklendi.
- Desktop davranışı (alt nav → sol çubuk) bu dokümanda tanımlandı.

---

## 13. Kapsam Dışı (Non-Goals) — v1

- Dark mode (token yapısı hazır, tema sonra).
- Grafik kütüphanesi (Chart.js / Recharts vb.).
- Çok sütunlu desktop dashboard.
- İllüstrasyonlar, onboarding animasyonları, haptic/ses geri bildirimleri.
- Özel ikon seti çizimi (Material Symbols kullanılır).

---

## 14. Sonraki Adımlar (onay sonrası)

1. **Aşama 2 — Design System:** bu dokümandaki token'ların `globals.css`'e aktarılması,
   font kurulumu, çekirdek UI bileşenlerinin (`Card`, `Button`, `Input`, `ListRow`,
   `StatusDot`, `BottomNav`, `Sheet`, `Dialog`, `EmptyState`) token'larla biçimlenmesi.
2. **Aşama 2 — Örnek ekran:** "Bugün" ekranının statik implementasyonu (mock veri ile).
3. **Görsel QA:** çalışan uygulamanın browser screenshot'ları üzerinden bu dokümana göre denetim.
