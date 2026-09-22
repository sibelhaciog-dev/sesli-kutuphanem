import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { getBookSlug } from '@/lib/data/admin'
import { CATALOG_TAG, coverUrl } from '@/lib/data/catalog'
import { setBookCover, storeCover } from '@/lib/data/covers'
import { toFriendlyMessage } from '@/lib/errors'
import { CoverError } from '@/lib/images/cover'
import { createClient, getViewer } from '@/lib/supabase/server'

// sharp yerel bir kütüphane; Edge çalışma ortamında yok.
export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Vercel sunucu fonksiyonları 4,5 MB'tan büyük istek gövdesini reddediyor.
 * Tarayıcı bu sınırı aşan dosyayı göndermeden önce küçültüyor
 * (`src/components/admin/CoverUpload.tsx`); burası ikinci kontrol.
 */
const MAX_BYTES = 4 * 1024 * 1024

/**
 * Kitap kapağı yükleme ve kaldırma — yalnızca editör (ADR 0009).
 *
 * Yükleme kullanıcının OTURUMUYLA yapılıyor: depolama politikası
 * (`catalog_covers_staff_write`) ve kitap tablosunun RLS'i yetkiyi zaten
 * denetliyor. Gizli anahtar gerekmiyor.
 */
export async function POST(request: Request) {
  const { user, isStaff } = await getViewer()
  if (!user || !isStaff) {
    return NextResponse.json(
      { hata: 'Kapak yüklemek için editör yetkisi gerekiyor.' },
      { status: 403 },
    )
  }

  const form = await request.formData().catch(() => null)
  const bookId = form?.get('bookId')
  const file = form?.get('file')
  if (typeof bookId !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ hata: 'Kapak dosyası gelmedi. Tekrar seçin.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ hata: 'Dosya çok büyük (en fazla 4 MB).' }, { status: 413 })
  }

  const supabase = await createClient()
  try {
    const slug = await getBookSlug(supabase, bookId)
    if (!slug) return NextResponse.json({ hata: 'Kitap bulunamadı.' }, { status: 404 })

    const stored = await storeCover(supabase, slug, Buffer.from(await file.arrayBuffer()))
    await setBookCover(supabase, bookId, stored)
    revalidateTag(CATALOG_TAG)

    return NextResponse.json({
      cover: {
        url: coverUrl(stored.path),
        thumbUrl: coverUrl(stored.thumbPath),
        width: stored.width,
        height: stored.height,
        bytes: stored.bytes,
        thumbBytes: stored.thumbBytes,
        sourceBytes: stored.sourceBytes,
      },
    })
  } catch (error) {
    if (error instanceof CoverError) {
      return NextResponse.json({ hata: error.message }, { status: 422 })
    }
    console.error('Kapak kaydedilemedi:', error)
    return NextResponse.json(
      { hata: toFriendlyMessage(error, 'Kapak kaydedilemedi. Biraz sonra tekrar deneyin.') },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  const { user, isStaff } = await getViewer()
  if (!user || !isStaff) {
    return NextResponse.json(
      { hata: 'Kapak kaldırmak için editör yetkisi gerekiyor.' },
      { status: 403 },
    )
  }

  const bookId = new URL(request.url).searchParams.get('kitap')
  if (!bookId) return NextResponse.json({ hata: 'Kitap belirtilmedi.' }, { status: 400 })

  const supabase = await createClient()
  try {
    await setBookCover(supabase, bookId, null)
    revalidateTag(CATALOG_TAG)
    return NextResponse.json({ cover: null })
  } catch (error) {
    console.error('Kapak kaldırılamadı:', error)
    return NextResponse.json(
      { hata: toFriendlyMessage(error, 'Kapak kaldırılamadı. Biraz sonra tekrar deneyin.') },
      { status: 500 },
    )
  }
}
