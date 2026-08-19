---
name: spec-writing
description: Use when writing product specifications, acceptance criteria, or user stories for a feature. Front-load keywords: şartname, spec, kabul kriterleri, feature, gereksinim.
---

# Şartname Yazımı

Her feature için `specs/<feature-adı>.md` dosyası oluştur. Şablon:

```md
# <Feature Adı>

## Amaç

Esnaf için bu feature neden var, hangi gerçek sorunu çözer.

## Kullanıcı Hikayeleri

- <Kişi> olarak, <eylem> yapabilmeliyim; böylece <fayda>.

## Kabul Kriterleri

- [ ] <Ölçülebilir, test edilebilir kriter>

## Kapsam Dışı

- <Bu aşamada yapılmayacaklar>

## Açık Sorular

- <Kullanıcıya sorulacaklar>
```

Kurallar:

- Hedef kitle: küçük esnaf. Teknik terim yerine günlük dil ("cari hesap" yerine
  "alacak/vade" gibi gerçek kullanıma dikkat et).
- Kabul kriterleri QA agent'ının otomatik test yazabileceği netlikte olsun.
- Kapsamı küçük tut; bir spec tek döngüde geliştirilebilecek büyüklükte olsun.
