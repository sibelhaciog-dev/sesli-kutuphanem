# Sesli Kütüphanem

Çocuk kitapları rehberi. Ebeveynler çocukları için profil oluşturur; uygulama
yaşa, ilgi alanlarına ve öncelikli gelişim konularına göre kitap önerir,
okunanları takip eder ve ilerlemeyi rapora dönüştürür.

[`sesli.kutuphanem`](https://www.instagram.com/sesli.kutuphanem) Instagram
hesabındaki kitap tanıtımlarıyla eşleşen 196 kitaplık bir katalog içerir.

---

## Hızlı başlangıç

```bash
npm install
cp .env.example .env.local   # değerleri doldurun
npm run dev                  # http://localhost:3000
```

Veritabanı kurulumu, ortam değişkenleri ve yayına alma:
**[docs/operations.md](docs/operations.md)**

## Dokümantasyon

| Soru                          | Dosya                                        |
| ----------------------------- | -------------------------------------------- |
| Ürün ne yapıyor, kime, neden? | [docs/prd.md](docs/prd.md)                   |
| Sistem nasıl kurulu?          | [docs/architecture.md](docs/architecture.md) |
| Veritabanında ne var?         | [docs/data-model.md](docs/data-model.md)     |
| Şu karar neden böyle alındı?  | [docs/decisions/](docs/decisions/)           |
| Yapay zekâ nasıl bağlı?       | [docs/ai.md](docs/ai.md)                     |
| Sırada ne var?                | [docs/roadmap.md](docs/roadmap.md)           |

## Yığın

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — yapılandırma `globals.css` içindeki `@theme` bloğunda
- **Supabase** — kimlik doğrulama, Postgres, depolama; her tabloda RLS
- **OpenAI uyumlu yapay zekâ uç noktası** (varsayılan OpenRouter) — kapak
  tanıma ve rapor yorumu
- **Zod** — içerik dosyaları ve API girdileri
- **Vitest** — iş mantığı · **Docker + Postgres** — şema ve RLS testleri

## Komutlar

| Komut                         | Ne yapar                                  |
| ----------------------------- | ----------------------------------------- |
| `npm run dev`                 | Geliştirme sunucusu                       |
| `npm run build` / `npm start` | Üretim derlemesi / çalıştırma             |
| `npm run check`               | Tip kontrolü + lint + testler             |
| `npm test`                    | Birim testleri                            |
| `npm run db:test`             | Şema ve RLS testleri (Docker gerekir)     |
| `npm run db:local`            | Yerel şemayı kur ve konteyneri açık bırak |
| `npm run db:types`            | Veritabanı tiplerini şemadan üret         |
| `npm run book:add`            | Kitap ekle (tek ya da liste), kapak yükle |
| `npm run db:seed`             | Boş veritabanını `content/` ile tohumla   |
| `npm run db:export`           | Veritabanını `content/` altına yedekle    |
| `npm run content:validate`    | İçerik dosyalarını doğrula                |
| `npm run format`              | Kod biçimlendirme                         |

## Proje yapısı

```
content/            Katalogun yedeği ve tohumu (JSON, Zod ile doğrulanır)
src/app/            Sayfalar ve API uçları
src/components/     Arayüz bileşenleri
src/lib/data/       Tüm veritabanı sorguları
src/lib/ai/         Yapay zekâ istemcisi ve özellikleri
src/lib/            Saf iş mantığı: filtreleme, öneri, istatistik, arama
supabase/migrations Veritabanı şeması (0001 → 0023, sıralı)
supabase/tests/     Şema ve RLS testleri
docs/               PRD, mimari, veri modeli, kararlar, yol haritası
legacy/             Yeniden yazımdan önceki tek dosyalık sürüm (referans)
```

## Katalog verisi hakkında

Kitapların, rehberlerin ve keşif modlarının doğru kaynağı **veritabanı**:
yönetim panelinden ya da `npm run book:add` ile doğrudan oraya yazılır.
`content/` dosyaları yedek (`db:export`) ve yeni ortamlar için tohumdur
(`db:seed`). Gerekçe: [ADR 0008](docs/decisions/0008-veritabani-dogru-kaynak.md).

Kapaklar Supabase Storage'da iki WebP boyutunda saklanır
([ADR 0009](docs/decisions/0009-kapak-depolama.md)). Kapağı olmayan kitaplarda
başlıktan üretilen kararlı bir tipografik tasarım gösterilir.

## Lisans

Özel proje.
