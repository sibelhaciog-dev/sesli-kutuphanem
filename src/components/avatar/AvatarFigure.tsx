import { useId } from 'react'
import { ANIMAL_ART, ART_DEFS, ITEM_ART, SECRET_ART } from '@/lib/avatar-art'
import { getAnimal, resolveAnimalId, wornItems } from '@/lib/avatar'
import { cn } from '@/lib/cn'

interface AvatarFigureProps {
  /** Kayıtlı karakter (hayvan) kimliği; eski kimlikler de çizilir. */
  characterId: string
  /** Takılı eşyalar. */
  accessories?: readonly string[]
  /** Küçük, yuvarlak görünüm (başlık, listeler). */
  headOnly?: boolean
  size?: number
  className?: string
  title?: string
}

/**
 * Suluboya hayvan dostu + takılı eşyalar.
 *
 * Çizimler `src/lib/avatar-art.ts` içinde hazır SVG parçaları. Sayfada aynı
 * anda birçok avatar olduğundan filtre kimlikleri her örneğe özel yapılır;
 * yoksa bir avatarın filtresi ötekini bozar.
 */
export function AvatarFigure({
  characterId,
  accessories = [],
  headOnly = false,
  size = 160,
  className,
  title,
}: AvatarFigureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const animalId = resolveAnimalId(characterId)
  const body = ANIMAL_ART[animalId] ?? SECRET_ART[animalId] ?? ''
  const items = wornItems(accessories)
    .map((item) => ITEM_ART[item.id] ?? '')
    .join('')

  const markup = (ART_DEFS ? `<defs>${ART_DEFS}</defs>` : '') + body + items
  const html = markup
    .replace(/\bWC\b/g, `${uid}w`)
    .replace(/#pencil\b/g, `#${uid}p`)
    .replace(/id="pencil"/g, `id="${uid}p"`)
    .replace(/#soft\b/g, `#${uid}s`)
    .replace(/id="soft"/g, `id="${uid}s"`)
    .replace(/#paper\b/g, `#${uid}g`)
    .replace(/id="paper"/g, `id="${uid}g"`)

  const label = title ?? getAnimal(animalId).name

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn(headOnly ? 'rounded-full' : 'rounded-2xl', className)}
      role="img"
      aria-label={label}
      // Çizimler kendi ürettiğimiz sabit SVG parçaları; kullanıcı girdisi içermez.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
