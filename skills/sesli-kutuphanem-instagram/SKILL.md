---
name: sesli-kutuphanem-instagram
description: Instagram'daki sesli.kutuphanem gönderilerinden kitap bilgilerini (ad, yazar, özet, yaş aralığı, gelişim konuları, ilgi alanları, kapak görseli, gönderi bağlantısı ve tarihi) Sesli Kütüphanem'in kitap ekleme biçiminde JSON olarak çıkarır. Çıktı Claude Code'a yapıştırılır, orada `npm run book:add` ile siteye eklenir. Instagram'da bir kitap gönderisi ya da profil sayfası açıkken "bu kitabı aktar", "bu gönderiyi çıkar", "son gönderileri listele", "kitap bilgilerini hazırla" gibi isteklerde kullan.
---

# Sesli Kütüphanem — Instagram'dan kitap aktarımı

Amaç: Tarayıcıda açık Instagram gönderisindeki kitabı, Sesli Kütüphanem
sitesine eklenmeye hazır bir JSON bloğuna çevirmek. Sen **yalnızca çıkarırsın**;
siteye ekleme işini kullanıcı bu çıktıyı Claude Code'a yapıştırınca oradaki
ajan yapar. Instagram'da hiçbir şeye tıklayıp değiştirme (beğeni, yorum, takip
yok) — yalnızca oku ve gönderiler arasında gezin.

Kullanıcı öğretmen; teknik ayrıntıyla uğraştırma. Türkçe konuş.

## 1. Hangi gönderi?

- **Tek gönderi açıksa** (`instagram.com/p/…` ya da `/reel/…`, sayfa ya da
  açılır pencere): yalnızca onu çıkar.
- **Profil ızgarası açıksa** ve kullanıcı birden fazla istiyorsa ("son 5
  gönderi", "bu sayfadakiler"): gönderileri sırayla aç, her birini çıkar,
  sonunda hepsini tek listede ver. Bir seferde en fazla 10 gönderi; fazlası
  istenirse 10'arlık partiler öner.
- **Kitap olmayan gönderileri atla** (çekiliş, duyuru, etkinlik). Sonda kısaca
  söyle: "2 gönderi kitap olmadığı için atlandı."
- **Tek gönderide birden çok kitap** ("5 kış kitabı önerisi" gibi): her kitap
  ayrı kayıt olur ama bir gönderi yalnızca BİR kitaba bağlanabilir. Bu
  kayıtlara `instagram` alanı KOYMA; gönderi adresini `_notlar` içine yaz.
  Kapak görseli yalnızca o kitabın kapağı tek başına görünüyorsa ver.

## 2. Sayfadan ne okunur

Önce sayfanın metnini ve görünen gönderiyi oku. JavaScript çalıştırabiliyorsan
şu parça işi kolaylaştırır (Instagram'ın sayfa yapısı değişebilir; sonuç boş
dönerse ekran görüntüsünden ve sayfa metninden oku):

```js
;(() => {
  const root =
    document.querySelector('div[role="dialog"] article') ||
    document.querySelector('main article') ||
    document.querySelector('main') ||
    document
  const pick = (img) => {
    const best = (img.srcset || '')
      .split(',')
      .map((s) => s.trim().split(/\s+/))
      .filter((p) => p[0])
      .sort((a, b) => parseInt(b[1] || '0') - parseInt(a[1] || '0'))[0]
    return { src: best?.[0] || img.currentSrc || img.src, alt: img.alt, w: img.naturalWidth }
  }
  return {
    url: location.href,
    time: root.querySelector('time[datetime]')?.getAttribute('datetime') ?? null,
    caption: root.querySelector('h1')?.innerText ?? null,
    images: [...root.querySelectorAll('img')]
      .filter((i) => i.naturalWidth >= 300)
      .map(pick)
      .slice(0, 4),
  }
})()
```

| Bilgi           | Nereden                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| Gönderi adresi  | Adres çubuğu. `?igsh=…` gibi ekleri at: `https://www.instagram.com/p/<kod>/`           |
| Paylaşım tarihi | `time[datetime]` (UTC). Türkiye saatine göre gün: `YYYY-AA-GG`                         |
| Beğeni sayısı   | "… beğenme" yazısı görünüyorsa sayı; görünmüyorsa alanı hiç yazma                      |
| Açıklama metni  | Gönderi açıklaması (genelde başlık `h1`). "devamı" varsa açarak tamamını oku           |
| Kapak görseli   | Gönderinin ilk görseli (karuselde kapak genelde ilk kare); en büyük çözünürlüklü `src` |

## 3. Alanlar

**Önce bu skill'in yanındaki `taksonomi.md` dosyasını oku** — konu ve ilgi
alanı adresleri yalnızca oradan seçilir (liste sitenin veritabanından üretilir).

Kitap bilgisi önce **açıklama metninden**, yoksa **kapak görselinden** (kapakta
yazan ad, yazar, yayınevi) okunur. Emin olmadığın hiçbir şeyi uydurma: ISBN,
sayfa sayısı, basım yılı, yayınevi yalnızca açıkça görünüyorsa yazılır.

| Alan               | Kural                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`            | **Zorunlu.** Kitabın Türkçe adı, kapaktaki gibi (büyük/küçük harf düzgün, tırnaksız, emojisiz). İngilizce kitapsa özgün adı.                                                                                                                      |
| `authors`          | Yazar(lar), liste. "Yazan:", "Yazar:", kapak. Bilinmiyorsa boş liste.                                                                                                                                                                             |
| `illustrators`     | "Resimleyen:", "Çizen:", "Resimler:".                                                                                                                                                                                                             |
| `translators`      | "Çeviren:", "Çeviri:".                                                                                                                                                                                                                            |
| `publisher`        | Yayınevinin adı ("@xyzyayinlari" etiketi varsa adını yaz: "XYZ Yayınları"). Emin değilsen yazma.                                                                                                                                                  |
| `originalTitle`    | Çeviri kitapta özgün adı biliniyorsa.                                                                                                                                                                                                             |
| `summary`          | 1–2 cümle, 120–250 karakter, Türkçe, sıcak ve sade. Kitabın ne anlattığı ve çocuğa ne kattığı. Hashtag, emoji, "bu kitapta…" kalıbı, fiyat, indirim, çekiliş bilgisi yok. Açıklamayı kopyalama, özetle.                                           |
| `description`      | İsteğe bağlı. Açıklamada kitabı anlatan uzun bir paragraf varsa hashtag ve etiketlerden temizlenmiş hâli (en fazla ~1500 karakter). Yoksa yazma.                                                                                                  |
| `ageMin`, `ageMax` | Açıklamada yazıyorsa onu kullan ("3-6 yaş", "+4" → 4 ile 8 arası gibi). Yazmıyorsa kitabın türünden tahmin et: karton/dokun-hisset 0–3, resimli hikâye 3–7, uzun resimli hikâye 4–8, ilk okuma 6–9, bölümlü kitap 7–10. Tahminse `_notlar`'a yaz. |
| `language`         | Türkçe kitap `tr`, İngilizce kitap `en`.                                                                                                                                                                                                          |
| `topics`           | **Yalnızca `taksonomi.md` listesindeki adresler.** 1–3 konu: kitabın ana konusu önem 5 ya da 4, ikincil konular 2–3. Uygun konu yoksa boş bırak — uydurma adres ekleme.                                                                           |
| `interests`        | `taksonomi.md`'deki ilgi alanlarından 0–2 tane (ör. hayvanlar başroldeyse `hayvanlar`).                                                                                                                                                           |
| `instagram`        | `{ "url", "postedAt", "likeCount" }` — bkz. §2.                                                                                                                                                                                                   |
| `cover`            | Kapak görselinin adresi (bkz. §2). Görsel kitap kapağı değilse (ör. kitabı tutan el, iç sayfa) yine ver ama `_notlar`'a "kapak görseli kitabın içinden" yaz.                                                                                      |
| `_notlar`          | Tahmin ettiğin ve emin olmadığın her şey, kısa maddeler. Claude Code bunları kullanıcıya iletir.                                                                                                                                                  |

`slug`, `status`, `isbn13`, `pageCount`, `publishedYear`, `series` alanlarını
yalnızca açıkça biliyorsan yaz. `status` yazma (varsayılan: yayında).

Konu seçerken `taksonomi.md`'deki konu adına ve anahtar kelimelere bak:
"kardeşi doğan bir çocuk" → `kardes-iliskileri`; "okulun ilk günü" →
`okul-adaptasyonu`; "öfkesini tanıyan" → `duygu-yonetimi`.

## 4. Çıktı

Tek bir mesaj ver; kullanıcı mesajın tamamını kopyalayıp Claude Code'a
yapıştıracak. Biçim BİREBİR şöyle (tek kitap da olsa liste):

````
📚 Sesli Kütüphanem · Instagram aktarımı (1 kitap)
Claude Code: bu kitapları `npm run book:add` ile ekle (önce --deneme).

```json
[
  {
    "title": "Çaya Gelen Kaplan",
    "authors": ["Judith Kerr"],
    "summary": "Bir öğleden sonra kapıyı çalan aç bir kaplan… Misafirlik, paylaşmak ve sınırlar üzerine zamansız bir klasik.",
    "language": "tr",
    "ageMin": 3,
    "ageMax": 7,
    "topics": [
      { "slug": "sosyal-sinirlar", "relevance": 4 },
      { "slug": "paylasma", "relevance": 3 }
    ],
    "interests": ["hayvanlar"],
    "instagram": {
      "url": "https://www.instagram.com/p/DWRv15ojdg-/",
      "postedAt": "2026-04-14",
      "likeCount": 128
    },
    "cover": "https://scontent-…cdninstagram.com/v/…jpg?…",
    "_notlar": ["Yaş aralığı açıklamada yok, tahmin."]
  }
]
```

Kapak adresleri birkaç gün içinde geçersizleşir; bugün yapıştırın.
````

Sonra, bloğun DIŞINDA, tek cümleyle ne yaptığını söyle ("2 kitap hazır, 1
gönderi kitap olmadığı için atlandı"). Açıklama ekleme; kullanıcı yalnızca
bloğu kopyalayacak.

Geçerli JSON olmalı: çift tırnak, sonda virgül yok, yorum satırı yok.

## 5. Yapma

- Instagram'da beğenme, yorum yazma, takip, mesaj — hiçbiri.
- Uydurma bilgi (ISBN, yayınevi, sayfa sayısı). Bilinmeyen alan yazılmaz.
- `taksonomi.md`'de olmayan konu ya da ilgi adresi.
- Siteye kendin eklemeye çalışma; ekleme Claude Code tarafında yapılıyor.
