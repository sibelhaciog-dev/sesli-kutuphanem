'use server'

import { revalidateTag } from 'next/cache'
import type { z } from 'zod'
import {
  areaInputSchema,
  fieldErrors,
  interestInputSchema,
  modeInputSchema,
  topicInputSchema,
} from '@/lib/admin/taxonomy-input'
import { bookInputSchema } from '@/lib/books/input'
import {
  AdminError,
  deleteDraftBook,
  deleteMode,
  deleteTaxonomyItem,
  getBookSlug,
  saveArea,
  saveBook,
  saveInterest,
  saveMode,
  saveTopic,
  type TaxonomyKind,
} from '@/lib/data/admin'
import { CATALOG_TAG } from '@/lib/data/catalog'
import { toFriendlyError } from '@/lib/errors'
import { createClient, getViewer } from '@/lib/supabase/server'

/**
 * Yönetim arayüzünün sunucu eylemleri.
 *
 * Her kayıttan sonra katalog önbelleği temizleniyor; değişiklik sitede
 * hemen görünüyor (`npm run book:add` için bu 5 dakika, çünkü betik
 * önbelleğe erişemiyor).
 *
 * Yetki iki katlı: burada personel kontrolü (anlaşılır mesaj için), asıl
 * kilit veritabanında (RLS ve `can_manage_content()`).
 */

export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> }

type Client = Awaited<ReturnType<typeof createClient>>

async function staffClient(): Promise<Client | null> {
  const { user, isStaff } = await getViewer()
  return user && isStaff ? createClient() : null
}

const FORBIDDEN = { ok: false, error: 'Bu işlem için editör yetkisi gerekiyor.' } as const

function invalid(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: 'Formda düzeltilmesi gereken alanlar var.',
    fieldErrors: fieldErrors(error),
  }
}

/** Veritabanı hatasını Türkçe mesaja; alan biliniyorsa alanın altına. */
function failed(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof AdminError) return { ok: false, error: error.message }
  const friendly = toFriendlyError(error, fallback)
  if (friendly.message === fallback) console.error(fallback, error)
  return {
    ok: false,
    error: friendly.message,
    fieldErrors: friendly.field ? { [friendly.field]: friendly.message } : undefined,
  }
}

// ─── Kitaplar ────────────────────────────────────────────────────────────────

export async function saveBookAction(
  bookId: string | null,
  raw: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN

  const parsed = bookInputSchema.safeParse(raw)
  if (!parsed.success) return invalid(parsed.error)
  const input = parsed.data

  try {
    if (bookId) {
      // Adres düzenlemede değişmez (bağlantılar kırılır). Formdan ne gelirse
      // gelsin veritabanındaki adres kullanılıyor; `upsert_book` adrese göre çalışıyor.
      const slug = await getBookSlug(supabase, bookId)
      if (!slug) return { ok: false, error: 'Kitap bulunamadı; silinmiş olabilir.' }
      const result = await saveBook(supabase, { ...input, slug }, true)
      revalidateTag(CATALOG_TAG)
      return { ok: true, data: { id: result.id, slug: result.slug } }
    }

    const result = await saveBook(supabase, input, false)
    if (result.status === 'skipped') {
      const message = `Bu adreste zaten bir kitap var (/kitap/${result.slug}). Adresi değiştirin.`
      return { ok: false, error: message, fieldErrors: { slug: message } }
    }
    revalidateTag(CATALOG_TAG)
    return { ok: true, data: { id: result.id, slug: result.slug } }
  } catch (error) {
    return failed(error, 'Kitap kaydedilemedi. Biraz sonra tekrar deneyin.')
  }
}

export async function deleteBookAction(bookId: string): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  try {
    await deleteDraftBook(supabase, bookId)
    revalidateTag(CATALOG_TAG)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'Kitap silinemedi. Biraz sonra tekrar deneyin.')
  }
}

// ─── Taksonomi ───────────────────────────────────────────────────────────────

export async function saveAreaAction(id: string | null, raw: unknown): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  const parsed = areaInputSchema.safeParse(raw)
  if (!parsed.success) return invalid(parsed.error)
  try {
    await saveArea(supabase, id, parsed.data)
    revalidateTag(CATALOG_TAG)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'Rehber kaydedilemedi. Biraz sonra tekrar deneyin.')
  }
}

export async function saveTopicAction(id: string | null, raw: unknown): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  const parsed = topicInputSchema.safeParse(raw)
  if (!parsed.success) return invalid(parsed.error)
  try {
    await saveTopic(supabase, id, parsed.data)
    revalidateTag(CATALOG_TAG)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'Konu kaydedilemedi. Biraz sonra tekrar deneyin.')
  }
}

export async function saveInterestAction(id: string | null, raw: unknown): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  const parsed = interestInputSchema.safeParse(raw)
  if (!parsed.success) return invalid(parsed.error)
  try {
    await saveInterest(supabase, id, parsed.data)
    revalidateTag(CATALOG_TAG)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'İlgi alanı kaydedilemedi. Biraz sonra tekrar deneyin.')
  }
}

export async function deleteTaxonomyAction(kind: TaxonomyKind, id: string): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  try {
    await deleteTaxonomyItem(supabase, kind, id)
    revalidateTag(CATALOG_TAG)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'Silinemedi. Biraz sonra tekrar deneyin.')
  }
}

// ─── Keşif modları ───────────────────────────────────────────────────────────

export async function saveModeAction(slug: string | null, raw: unknown): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  const parsed = modeInputSchema.safeParse(raw)
  if (!parsed.success) return invalid(parsed.error)
  try {
    await saveMode(supabase, slug, parsed.data)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'Mod kaydedilemedi. Biraz sonra tekrar deneyin.')
  }
}

export async function deleteModeAction(id: string): Promise<ActionResult> {
  const supabase = await staffClient()
  if (!supabase) return FORBIDDEN
  try {
    await deleteMode(supabase, id)
    return { ok: true, data: null }
  } catch (error) {
    return failed(error, 'Mod silinemedi. Biraz sonra tekrar deneyin.')
  }
}
