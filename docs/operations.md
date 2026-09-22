# Kurulum ve İşletme

**Son güncelleme:** 2026-09-22

---

## 1. Yerel geliştirme

```bash
npm install
cp .env.example .env.local     # değerleri doldurun
npm run dev                    # http://localhost:3000
```

## 2. Ortam değişkenleri

| Değişken                        | Nereden                                             | Nerede kullanılır                       |
| ------------------------------- | --------------------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                   | istemci + sunucu                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | aynı sayfa                                          | istemci + sunucu                        |
| `NEXT_PUBLIC_SITE_URL`          | sitenin adresi                                      | e-posta yönlendirmeleri, sitemap        |
| `DATABASE_URL`                  | Supabase → Database → Connection string (URI)       | **yalnızca yerel betikler**             |
| `SUPABASE_SECRET_KEY`           | Supabase → Project Settings → API Keys → Secret key | **yalnızca yerel** `book:add` kapakları |
| `AI_*`                          | bkz. [ai.md](ai.md)                                 | yalnızca sunucu                         |

> `DATABASE_URL` ve `SUPABASE_SECRET_KEY` tüm veriye erişir ve RLS'i baypas
> eder. Vercel'e **eklemeyin**, depoya **yazmayın**; yalnızca yerel
> `.env.local` içinde dursunlar. Yönetim arayüzünün kapak yüklemesi bunlara
> ihtiyaç duymaz — editörün kendi oturumuyla çalışır.

Betikler (`book:add`, `db:seed`, `db:export`, `db:types`) `.env.local` ve
`.env` dosyalarını kendisi okur — ayrıca `export` etmeye gerek yok. Öncelik
sırası Next.js ile aynı: komut satırında verilen değişken > `.env.local` >
`.env`. Bu sıralama bilinçli: `npm run db:seed:local` bağlantıyı satır içinde
verdiği için `.env.local` üretime bakarken bile yerel veritabanına yazar.

## 3. Veritabanını kurma (yeni proje)

1. Supabase'de yeni proje aç.
2. **SQL Editor** → `supabase/migrations/` altındaki dosyaları **sırayla**
   (0001 → 0023) yapıştırıp çalıştır.
3. İçeriği yükle (`content/` → veritabanı):

   ```bash
   DATABASE_URL="postgresql://..." npm run db:seed
   ```

   Tohumlama yalnızca **eksik** kayıtları ekler, var olana dokunmaz
   (ADR 0008); tekrar çalıştırmak zarar vermez. `content/` dosyalarını
   üretimle eşitlemek için önce üretimde `npm run db:export`.

4. Yönetici olacak kişileri ön yetki listesine ekle. Bu kişiler kayıt olur
   olmaz yönetici olur; kayıt sırasını beklemek gerekmez:

   ```sql
   insert into public.pending_role_grants (email, role, note)
   values ('senin@eposta.com', 'admin', 'Kurucu');
   select public.apply_pending_role_grants();   -- zaten kayıtlıysa geriye dönük uygular
   ```

5. **Authentication → URL Configuration → Redirect URLs** listesine
   `https://<siteniz>/auth/callback` ekle.

## 4. Yerel Supabase (uçtan uca test)

Docker varsa tüm yığın yerelde çalışır — gerçek Postgres, PostgREST, Auth,
Storage:

```bash
npx supabase start          # ilk seferde birkaç yüz MB imaj iner
npm run db:seed:local       # kataloğu yükle
npm run db:types:local      # tipleri şemadan üret
npm run test:e2e            # 25 iddia: auth, RLS, tetikleyiciler, arama
npx supabase stop           # bitince
```

`supabase start` çıktısındaki `PUBLISHABLE_KEY` ve `API_URL` değerlerini
`.env.local` dosyasına yazarsanız uygulama yerel yığına bağlanır.

Yerel veritabanı eski bir yedekten açılıp migration'larda takılırsa
(`type "extensions.citext" does not exist` gibi) `npx supabase db reset
--local` ile sıfırdan kurun — yalnızca yerel veriyi siler.

Betiğin kapak yüklemesini yerelde denemek için anahtarı dosyaya yazmadan,
çalışma anında verin:

```bash
SK=$(npx supabase status -o json | node -pe 'JSON.parse(require("fs").readFileSync(0)).SECRET_KEY')
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY="$SK" \
npx tsx scripts/book-add.ts kitaplar.json
```

Bu, birim testlerinin ve SQL şema testlerinin göremediği katmanı doğrular:
PostgREST üzerinden RLS, gerçek JWT'li oturum, zincirleme silme.

## 5. Şema değişikliği

```bash
npm run db:test      # Docker'da sıfırdan kurulum + 40+ iddia
npm run db:local     # şemayı ayakta bırak
npm run db:types     # tipleri üret (DATABASE_URL yerel Docker'ı göstermeli)
```

`db:test` Docker ister. Supabase'in `auth` ve `storage` şemaları
`scripts/supabase-stub.sql` ile taklit edilir.

## 6. Kitap ve içerik ekleme (ADR 0008)

Kitapların, rehberlerin ve keşif modlarının doğru kaynağı **veritabanı**.
İçerik dosyası düzenleyip senkronlamak artık gerekmiyor.

**Yönetim arayüzü** (`/yonetim`): Kitaplar → “+ Yeni kitap” tüm alanları
içerir; kitap kaydedilince kapak yüklenir. Rehberler ve Keşif modları
sekmeleri taksonomiyi ve modları düzenler. Değişiklikler hemen görünür.

**Betik** (liste ya da tek kitap, Claude'un kullandığı yol):

```bash
npm run book:add -- kitaplar.json --deneme     # önce dene: hiçbir şey yazmaz
npm run book:add -- kitaplar.json              # yeni kitapları ekle
npm run book:add -- kitaplar.json --guncelle   # var olanları da güncelle
npm run book:add -- kapaklar.json --sadece-kapak
cat kitap.json | npm run book:add -- -         # standart girdiden
npm run book:add -- --konular                  # geçerli konu/ilgi adresleri
```

Girdi biçimi yönetim formuyla aynı şema (`src/lib/books/input.ts`); örnek:
[`docs/examples/kitap-ekleme.json`](examples/kitap-ekleme.json). Önce
hepsi doğrulanır (şema, konu adları, kapak görselleri), sonra kitaplar tek
işlemde yazılır — biri düşerse hiçbiri yazılmaz. `cover` bir adres ya da
yerel dosya olabilir; görsel o anda indirilip işlenir, adres saklanmaz.
Kapak için `SUPABASE_SECRET_KEY` gerekir; yoksa kitaplar eklenir, kapaklar
atlanır. Betiğin eklediği kitaplar önbellek yüzünden en geç 5 dakikada
görünür.

Çıkış kodları: `0` tamam · `1` girdi sorunu (hiçbir şey yazılmadı) · `2`
veritabanı hatası (hiçbir şey yazılmadı) · `3` kitaplar yazıldı, kapakların
bir kısmı eksik.

**Yedek:** ara sıra `npm run db:export` çalıştırıp `content/` değişikliklerini
commit'leyin; git geçmişi katalogun izini tutar ve yeni ortamlar bu
dosyalardan tohumlanır.

## 7. Yayına alma (Vercel)

1. Depoyu Vercel'e bağla. Framework algılaması `vercel.json` ile depodan
   geliyor (`"framework": "nextjs"`), panelden ayarlamaya gerek yok.
   Not: Vercel algılamayı **içe aktarma anında** ve o anki üretim dalına
   bakarak yapar; dal yanlışsa algılama boş kalır ve derleme çıktısını
   statik site sanır.
2. Ortam değişkenlerini gir (`DATABASE_URL` ve `SUPABASE_SECRET_KEY` hariç).
3. `NEXT_PUBLIC_SITE_URL` gerçek alan adı olsun.
4. Aynı adresi Supabase Redirect URLs listesine ekle.

### Üretim projesi

| Alan              | Değer                                               |
| ----------------- | --------------------------------------------------- |
| Supabase adı      | `sesli-kutuphane`                                   |
| Proje kimliği     | `xhjgyxlerccxopbjtbzl`                              |
| Bölge             | `eu-central-1` (Frankfurt)                          |
| API adresi        | `https://xhjgyxlerccxopbjtbzl.supabase.co`          |
| Vercel fonksiyonu | `fra1` (Frankfurt) — `vercel.json` içinde `regions` |

Fonksiyon bölgesi veritabanıyla **aynı şehirde** olmalı: bir sayfa sırayla
3–8 sorgu atıyor, her biri bölgeler arası gidiş-dönüş kadar gecikiyor. İlk
proje Singapur'daydı (`ygaxtmuzhnntzdcltmgn`, `ap-southeast-1`), fonksiyonlar
ABD'de (`iad1`); kitap kaydetmek ~8 saniye sürüyordu. 2026-09-22'de §10'daki
yolla taşındı; eski proje yedek olarak duruyor (silinmedi).

Vercel'e girilecek değişkenler: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (panelde Project Settings → API →
publishable key), `NEXT_PUBLIC_SITE_URL`, ve yapay zekâ kullanılacaksa
`AI_BASE_URL` / `AI_API_KEY` / `AI_TEXT_MODEL` / `AI_VISION_MODEL`.

`DATABASE_URL` ve `SUPABASE_SECRET_KEY` **Vercel'e girilmez** — yalnızca yerel
betikler için.

## 8. Komut özeti

| Komut                      | Ne yapar                                           |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Geliştirme sunucusu                                |
| `npm run build` / `start`  | Üretim derlemesi / çalıştırma                      |
| `npm run check`            | Tip kontrolü + lint + testler                      |
| `npm test`                 | Birim testleri                                     |
| `npm run db:test`          | Şema + RLS testleri (Docker)                       |
| `npm run db:local`         | Yerel şemayı kur ve açık bırak                     |
| `npm run db:types`         | Veritabanı tiplerini üret                          |
| `npm run book:add`         | Kitap (tek ya da liste) ekle/güncelle, kapak yükle |
| `npm run db:seed`          | Boş veritabanını `content/` ile tohumla            |
| `npm run db:export`        | Veritabanını `content/` altına yedekle             |
| `npm run content:validate` | İçerik dosyalarını doğrula                         |
| `npm run format`           | Kod biçimlendirme                                  |

## 9. Sorun giderme

| Belirti                                         | Olası sebep                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Tüm sayfalar 500                                | `NEXT_PUBLIC_SUPABASE_*` eksik veya hatalı                                                             |
| Katalog boş, rehber menüsü yok                  | Migration çalıştırılmamış veya `db:seed` yapılmamış                                                    |
| Rehber menüsü boş ama site açılıyor             | Veritabanına erişilemiyor (taksonomi hatası yutuluyor)                                                 |
| Kapak tarama 503                                | `AI_API_KEY` tanımlı değil                                                                             |
| Kapak tarama 429                                | Günlük kota doldu                                                                                      |
| Yönetim sayfası ana sayfaya atıyor              | Kullanıcının `user_roles` kaydı yok                                                                    |
| `db:seed` "relation does not exist"             | Migration'lar eksik veya sırasız çalıştırılmış                                                         |
| `book:add` kitabı ekledi ama sitede yok         | Katalog önbelleği; en geç 5 dakika. Durumu `draft` ise sitede zaten görünmez                           |
| `book:add` "bilinmeyen gelişim konusu"          | Konu adresi yanlış yazılmış; mesajın altında geçerli adresler listelenir                               |
| Kapak yüklemesi "Dosya çok büyük"               | 4 MB üstü dosyayı tarayıcı küçültür; tarayıcı çözemediyse (HEIC) JPEG olarak kaydedip tekrar deneyin   |
| Anahtar kelime kaydı "okunamadı"                | Parantez, köşeli parantez, yıldız gibi düzenli ifade işaretleri; kaldırın ya da `\y` kullanın          |
| Sayfada eski/yanlış veri, veritabanı doğru      | Next.js disk önbelleği. Veritabanı değiştirdiyseniz `rm -rf .next` ve yeniden derleyin                 |
| Migration yerelde geçip Supabase'de patlıyor    | Uzantı nesnesi nitelenmemiş — `extensions.unaccent` gibi yazılmalı                                     |
| `permission denied for function ...`            | Fonksiyon `0013`'te REST yüzeyinden çıkarıldı; uygulamadan çağrılıyorsa `grant execute` ekleyin        |
| Yönetim sayfası açılmıyor, kullanıcı yeni       | `pending_role_grants` listesinde adres yok; ekleyip `apply_pending_role_grants()` çalıştırın           |
| Vercel derlemesi "Invalid URL" ile düşüyor      | `NEXT_PUBLIC_SITE_URL` şemasız yazılmış. Kod artık `https://` ekliyor ama değeri tam yazmak daha doğru |
| Vercel "No Output Directory named public" diyor | Framework algılaması boş kalmış. `vercel.json` içindeki `"framework": "nextjs"` bunu çözer             |

## 10. Projeyi başka bir Supabase projesine taşıma

Bölge değişikliği gibi durumlarda (bkz. §7). Eski projeye yalnızca **okuma**
yapılır; hiçbir şey silinmez.

1. **Şema:** yeni projeye `supabase/migrations/` dosyalarını sırayla uygula.
   Şemayı `pg_dump` ile taşıma — Supabase'in şema dökümü `auth.users`
   üzerindeki kayıt tetikleyicisini ve `storage.objects` politikalarını
   almıyor, migration'lar alıyor.
2. **Veri:** eski projeden yalnızca veri dökümü (Postgres 17 istemcisi; Supabase
   imajı `public.ecr.aws/supabase/postgres:17.x` içinde var):

   ```bash
   pg_dump "$ESKI" --data-only --no-owner --no-privileges \
     -t 'public.*' -t auth.users -t auth.identities \
     -t supabase_migrations.schema_migrations -f data.sql
   ```

   Yeniye TEK İŞLEMDE yükle: `set session_replication_role = replica`
   (tetikleyici ve yabancı anahtar denetimi kapalı — kayıt tetikleyicisi ikinci
   profil üretmesin), migration'ların eklediği tohum satırları için public
   tablolarını `truncate … cascade`, `supabase_migrations.schema_migrations`
   tablosunu eskisiyle aynı sütunlarla oluştur, `\i data.sql`, `commit`.
   Oturumlar (`auth.sessions`, `refresh_tokens`) taşınmaz — yeni projenin
   imza anahtarları farklı; kullanıcılar bir kez yeniden giriş yapar, şifreleri
   aynı kalır.

3. **Dosyalar:** `storage.objects` satırlarını döküme katma; dosyaları
   Storage API ile kopyala (eski herkese açık adresten indir, yeniye gizli
   anahtarla aynı yola yükle — satırı yükleme oluşturur).
4. **Doğrula:** iki veritabanında tablo tablo satır sayısı ve içerik özeti
   (`md5(string_agg(satır::text order by satır::text))`), fonksiyon /
   politika / tetikleyici / yetki imzaları, yeni projede şifreyle giriş ve RLS
   denemesi.
5. **Panelden elle:** Auth ayarları veriyle gelmez — Authentication → URL
   Configuration (Site URL, Redirect URLs), SMTP, e-posta şablonları.
   Supabase'in hazır e-posta servisi yalnızca ekip üyelerine gönderiyor;
   özel SMTP yoksa yeni kayıtlar doğrulama e-postası alamaz.
6. **Geçiş:** 2. ve 3. adımı geçişten hemen önce tekrarla (arada yazılan veri
   kaybolmasın), Vercel'deki `NEXT_PUBLIC_SUPABASE_URL` ve
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini değiştir, `vercel.json`
   bölgesini güncelle, yayına al. Yerel `.env.local`'i de yeni projeye çevir.
