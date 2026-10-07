import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/Button'
import { Icon, IconLabel } from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Bize destek ol',
  description: 'Sesli Kütüphanem’i desteklemek isteyenler için.',
}

/**
 * "Bize destek ol" — şimdilik yalnızca yer tutucu. Destek yolları (kahve
 * ısmarla, sponsorluk) açılınca bağlantılar buraya eklenecek.
 */
export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-3xl">
        <IconLabel name="coffee">Bize destek ol</IconLabel>
      </h1>
      <p className="mb-6 text-sm leading-relaxed text-ink-soft">
        Sesli Kütüphanem, çocuklara doğru kitabı bulmak isteyen aileler için gönüllü emekle
        hazırlanıyor. Bu çalışmaya katkı vermek isteyenler için destek yollarını hazırlıyoruz.
      </p>

      <section className="mb-6 rounded-panel border border-line bg-white p-6 text-center">
        <p className="mb-3 text-accent-ink">
          <Icon name="coffee" className="size-12" />
        </p>
        <h2 className="mb-1 text-lg font-bold text-ink">Çok yakında</h2>
        <p className="text-sm leading-relaxed text-muted">
          Destek seçenekleri henüz açılmadı. Hazır olduğunda bu sayfadan bize bir kahve
          ısmarlayabilir ya da sponsor olabilirsiniz.
        </p>
      </section>

      <p className="mb-3 text-sm text-ink-soft">
        O zamana kadar bize destek olmanın başka yolları:
      </p>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/gorus" variant="secondary" size="sm">
          <IconLabel name="message">Görüşünü yaz</IconLabel>
        </ButtonLink>
        <ButtonLink href="/bagis" variant="secondary" size="sm">
          <IconLabel name="books">Kitap bağışla</IconLabel>
        </ButtonLink>
      </div>
    </div>
  )
}
