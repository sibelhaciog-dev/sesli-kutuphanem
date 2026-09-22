# ADR 0009 — Kitap kapakları: Supabase Storage, iki WebP varyantı

**Durum:** Kabul edildi · **Tarih:** 2026-09-22

## Bağlam

Katalogdaki kapakların hepsi kaybolmuştu: Instagram'ın görsel adresleri süreli
imzalıydı ve eski sürüm **adresi** saklıyordu (bkz. `docs/prd.md` §8). Kapak
yerine başlıktan üretilen tipografik bir tasarım gösteriliyordu.

İstek: kapaklar Supabase'in dosya deposunda (ücretsiz planda 1 GB) saklansın,
kaliteden taviz vermeden sıkıştırılsın ki alan uzun süre yetsin.

## Karar

- **Dosyanın kendisi saklanıyor, adresi değil.** Betik bir adres alırsa
  görseli o anda indirip işliyor; kaynağın sonradan geçersizleşmesi önemsiz.
- **Sunucuda `sharp` ile iki WebP varyantı:**

  | Varyant | En fazla | Kalite | Nerede                         |
  | ------- | -------- | ------ | ------------------------------ |
  | büyük   | 900×1350 | q90    | Kitap sayfası                  |
  | küçük   | 480×720  | q82    | Kartlar, listeler, önizlemeler |

  Küçük varyantın boyutu kart genişliğinden: telefonda kart ~173 CSS pikseli,
  3× ekranda ~520 fiziksel piksel.

- `smartSubsample` (renkli ince yazının bulanıklaşmaması), EXIF yönü
  uygulanıyor ve EXIF atılıyor (telefon fotoğraflarında konum olabilir).
- **Dosya adı içeriğin özeti:** `books/<slug>/<sha256[:12]>.webp` ve
  `…-k.webp`. Aynı kapak aynı adı alıyor, farklı kapak farklı adı; bu yüzden
  bir yıllık önbellek (`cache-control: max-age=31536000`) güvenli. Kapak
  değişince eski dosyalar siliniyor.
- **Özgün dosya saklanmıyor.** Arşiv Instagram; alanı iki kat harcamaya
  değmez.
- **Yükleme yolları:** yönetim arayüzü `/api/yonetim/kapak` ucuna gönderiyor
  (kullanıcının oturumuyla; depolama politikası editöre izin veriyor);
  betik gizli anahtarla (`SUPABASE_SECRET_KEY`, yalnızca yerelde). İkisi de
  `src/lib/data/covers.ts`'i kullanıyor.
- Tarayıcı 4 MB'ın altındaki dosyayı **olduğu gibi** gönderiyor (tek kayıplı
  sıkıştırma sunucuda). Üstündekini 2400 piksele, JPEG q0,92'ye indiriyor —
  Vercel istek gövdesi sınırı 4,5 MB.

## Ölçüm

Sentetik bir görsel yanıltıcıydı (küçük bir görsel büyütülünce her şey iyi
görünüyor). Ölçüm, iki gerçek ve ağır grenli kamu malı kapak taramasıyla
yapıldı. SSIM: algıya yakın benzerlik, ≥0,98 gözle ayırt edilemez kabul edildi.

|          | kapak 1 | kapak 2 | not                                 |
| -------- | ------- | ------- | ----------------------------------- |
| WebP q85 | 0,981   | 0,967 ✗ | ilk tercihti, sınırın altında kaldı |
| WebP q90 | 0,990   | 0,981 ✓ | seçildi                             |
| AVIF q70 | 0,983   | 0,971   | greni düzleştiriyor, 2–3× yavaş     |
| JPEG q92 | 0,966   | 0,975   |                                     |

Üretimde ölçülen gerçek boyutlar (aynı iki tarama): büyük 525 KB / 341 KB,
küçük 67 KB / 65 KB. Grenli tarama en kötü durum; düz baskılı kapaklar çok
daha küçük. En kötü durumla kitap başı ~600 KB → **1 GB ≈ 1.700 kitap**;
tipik kapaklarla bunun birkaç katı.

## Alternatifler

| Seçenek                    | Neden seçilmedi                                                           |
| -------------------------- | ------------------------------------------------------------------------- |
| Tek varyant                | Ana sayfa 196 kart; her kart büyük kapağı çekse bir ziyaret onlarca MB    |
| Supabase görsel dönüştürme | Ücretli plan özelliği                                                     |
| Vercel Blob / Cloudinary   | Ek servis; Supabase zaten var ve alan yeterli                             |
| AVIF                       | Bu kapaklarda WebP q90'dan kötü, üstelik yavaş                            |
| Tarayıcıda sıkıştırma      | Canvas JPEG/WebP kodlayıcısı sharp'tan belirgin kötü, sonucu cihaza bağlı |

## Sonuçlar

- Kapak eklemek yayın gerektirmiyor; yönetimden ya da betikle anında.
- Supabase'in ücretsiz planında trafik de sınırlı (5 GB/ay çıkış). Kartların
  küçük varyantı kullanması ve bir yıllık önbellek bu yüzden önemli.
- `sharp` yerel bir kütüphane; kapak ucu Node çalışma ortamında
  (`runtime = 'nodejs'`).
