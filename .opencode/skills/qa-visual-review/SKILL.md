---
name: qa-visual-review
description: Use for visual QA of UI work. Opens the RUNNING app in a real browser, captures screenshots, and reviews them against the design system. Front-load keywords: görsel QA, screenshot, visual review, ekran görüntüsü, tasarım kontrolü.
---

# Görsel QA — Screenshot Tabanlı İnceleme

Kural: Bu değerlendirme YALNIZCA source code incelemesiyle yapılamaz.
Çalışan uygulama gerçek bir browser'da açılır, screenshot alınır, onlar değerlendirilir.

## Adımlar

1. **Uygulamayı çalıştır:** `npm run dev` (zaten çalışıyorsa kullan).
2. **Ekranları aç:** İncelenecek tüm route'ları ve durumları (boş, dolu, hata, yükleme)
   gerçek browser'da gez.
3. **Screenshot al:** Her ekran için:
   - Masaüstü genişliği (1280px)
   - Dar genişlik / mobil (390px)
   - Gerekirse durum bazlı varyantlar
4. **Değerlendir:** design-system skill'indeki kurallara göre (anti-AI kurallar dahil):
   - Yasaklı generic desenler var mı?
   - Token'lar dışına çıkılmış mı (hardcoded renk vb.)?
   - Hizalama, boşluk, hiyerarşi, okunabilirlik, taşma sorunları
   - Türkçe metinler doğru ve kırpılmamış mı?
5. **Raporla:** Ekran adı, ciddiyet (bloklayıcı / önemli / öneri),
   sorun açıklaması + düzeltme önerisi. Başarılıysa "onay" belirt.

## Notlar

- Screenshot dosyaları geçici klasörde tutulur (örn. `tests/visual/` gitignored).
- Yalnızca ekranın kendisi değil, gerçek kullanım akışı içindeki hali değerlendirilir.
