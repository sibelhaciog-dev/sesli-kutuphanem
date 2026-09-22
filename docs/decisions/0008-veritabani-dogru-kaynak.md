# ADR 0008 — Katalogun doğru kaynağı veritabanı

**Durum:** Kabul edildi · **Tarih:** 2026-09-22 · **Yerini aldığı:** ADR 0002
(kitaplar, taksonomi ve keşif modları için)

## Bağlam

ADR 0002'de yazım kaynağı depodaki `content/*.json` dosyalarıydı; veritabanı
`npm run db:sync` ile bu dosyalardan dolduruluyordu. Pratikte:

- Kitap eklemek için dosyayı düzenlemek, senkronu çalıştırmak ve commit'lemek
  gerekiyordu. İçerik sahibi (öğretmen) bu zincirin hiçbir adımını kendisi
  yapamıyordu.
- Yönetim panelinden yapılan düzeltmeler bir sonraki senkronda **eziliyordu**.
  Nitekim üretimde bir kitabın özeti panelden düzeltilmişti ve dosyada eski
  hâli duruyordu.
- Rehberler ve keşif modları yönetimden düzenlenecekti (istek); bunlar da
  aynı ezilme sorununu taşırdı.

İstek açık: kitaplar doğrudan veritabanına eklensin; yönetimde elle ekleme
formu olsun; Claude tek kitap ya da liste ekleyebilsin.

## Karar

**Kitapların, rehberlerin (alan, konu, ilgi) ve keşif modlarının doğru
kaynağı veritabanı.** Üç yazma yolu, tek fonksiyon:

| Yol                | Kim                  | Nasıl                                          |
| ------------------ | -------------------- | ---------------------------------------------- |
| Yönetim → Kitaplar | Editör               | Sunucu eylemi → `upsert_book()` (oturumla)     |
| `npm run book:add` | Claude / geliştirici | `DATABASE_URL` → `upsert_book()`, tek işlemde  |
| `npm run db:seed`  | Yeni ortam kurulumu  | `content/` → `upsert_book(…, overwrite=false)` |

`upsert_book(payload jsonb, overwrite boolean)` (migration 0022):

- `security definer`; yetkiyi kendi denetliyor (`can_manage_content()`):
  editör/yönetici, `service_role` ya da doğrudan veritabanı bağlantısı.
- Yayınevi, seri ve kişileri adla alıyor, yoksa oluşturuyor.
- Konu ve ilgi adresleri (slug) bilinmiyorsa Türkçe mesajla düşüyor; hiçbir
  şey yazılmıyor.
- Otomatik etiketleme veritabanında (anahtar kelimeler de orada, yönetimden
  düzenleniyor).
- Doğrulama TypeScript'te de aynı şemayla (`src/lib/books/input.ts`) —
  form ile betik aynı kuralları görüyor.

Rehberler doğrudan tablolara yazılıyor (personel RLS'i var); keşif modları
eğilimleriyle birlikte tek işlemde `save_discovery_mode()` ile.

`content/` dosyaları **yedek ve tohum** olarak kalıyor:

- `npm run db:export` veritabanını dosyalara yazar (ara sıra çalıştırılıp
  commit'lenir → git geçmişinde katalogun izi).
- `npm run db:seed` yalnızca **eksik** kayıtları ekler, var olana dokunmaz.
  Yerel geliştirme ve yeni ortam içindir.

Başarımlar ve bağış kurumları yönetimden düzenlenmediği için onların kaynağı
hâlâ dosya; tohumlamada güncelleniyorlar.

## Alternatifler

| Seçenek                                 | Neden seçilmedi                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ADR 0002'yi sürdürmek                   | İçerik sahibi kendi başına kitap ekleyemiyor; panel düzeltmeleri eziliyor                           |
| Panel düzenlemesini dosyaya geri yazmak | Sunucusuz ortamda depoya yazmak commit/PR otomasyonu demek; kırılgan ve yetki açısından riskli      |
| Betik doğrudan `insert` yazsın          | Form ile betik farklı kurallar görürdü; otomatik etiketleme ve ilişki kurma iki yerde tekrarlanırdı |
| Harici CMS                              | ADR 0002'deki gerekçeler geçerli                                                                    |

## Sonuçlar

- Sürüm kontrolü artık otomatik değil: hatalı bir düzenleme `db:export`
  geçmişinden ya da Supabase yedeğinden geri alınıyor. Dışa aktarmayı
  düzenli çalıştırmak bu yüzden önemli.
- Kitap adresi (slug) oluşturulduktan sonra değişmiyor: `upsert_book` adrese
  göre çalışıyor ve adres dış bağlantılarda kullanılıyor.
- Betiğin eklediği kitaplar önbellek yüzünden en geç 5 dakikada görünüyor;
  yönetimden eklenenler hemen (`revalidateTag('catalog')`).
- Anahtar kelimeler düzenli ifade olarak kullanıldığı için tek bir bozuk
  ifade tüm kayıtları düşürebilirdi; 0023'teki tetikleyici bunu kayıt anında
  reddediyor. Aynı taşımada fark edilen bir hata: JavaScript'teki `\b`
  Postgres'te kelime sınırı DEĞİL (`\y`). Tetikleyici çeviriyor.
