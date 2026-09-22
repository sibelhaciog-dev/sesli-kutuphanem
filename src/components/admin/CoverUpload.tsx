'use client'

import { useRef, useState } from 'react'
import { BookCover } from '@/components/books/BookCover'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/Field'
import { prepareCoverUpload } from '@/lib/image'

export interface CoverState {
  url: string
  thumbUrl: string | null
  width: number | null
  height: number | null
}

interface UploadResult extends CoverState {
  bytes: number
  thumbBytes: number
  sourceBytes: number
}

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Kitap kapağı yükleme (ADR 0009). Dosya sunucuda WebP'ye çevrilip iki
 * boyutta saklanıyor; burada yalnızca seçim, önizleme ve sonuç var.
 */
export function CoverUpload({
  bookId,
  title,
  initial,
}: {
  bookId: string
  title: string
  initial: CoverState | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cover, setCover] = useState(initial)
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [dragging, setDragging] = useState(false)

  async function upload(file: File) {
    setError('')
    setInfo('')
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir görsel seçin.')
      return
    }

    setBusy('upload')
    try {
      // HEIC gibi biçimleri tarayıcı çoğu zaman çözemiyor; önce deneyip
      // başaramazsak anlaşılır bir mesaj veriyoruz.
      const blob = await prepareCoverUpload(file).catch(() => {
        throw new Error('Bu görsel biçimi okunamadı. JPEG, PNG ya da WebP bir dosya seçin.')
      })
      const body = new FormData()
      body.set('bookId', bookId)
      body.set('file', blob, file.name)
      const response = await fetch('/api/yonetim/kapak', { method: 'POST', body })
      const result = (await response.json().catch(() => null)) as {
        cover?: UploadResult
        hata?: string
      } | null

      if (!response.ok || !result?.cover) {
        setError(result?.hata ?? 'Kapak yüklenemedi. Biraz sonra tekrar deneyin.')
        return
      }
      const saved = result.cover
      setCover(saved)
      setInfo(
        `Kapak kaydedildi · ${saved.width}×${saved.height} · kitap sayfası ${kb(saved.bytes)}, ` +
          `kart ${kb(saved.thumbBytes)} (yüklenen dosya ${kb(saved.sourceBytes)})`,
      )
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.includes('biçimi')
          ? caught.message
          : 'Kapak yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.',
      )
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove() {
    setError('')
    setInfo('')
    setBusy('remove')
    try {
      const response = await fetch(`/api/yonetim/kapak?kitap=${encodeURIComponent(bookId)}`, {
        method: 'DELETE',
      })
      const result = (await response.json().catch(() => null)) as { hata?: string } | null
      if (!response.ok) {
        setError(result?.hata ?? 'Kapak kaldırılamadı. Biraz sonra tekrar deneyin.')
        return
      }
      setCover(null)
      setInfo('Kapak kaldırıldı; sitede başlıktan üretilen tasarım görünecek.')
    } catch {
      setError('Kapak kaldırılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          const file = event.dataTransfer.files[0]
          if (file) void upload(file)
        }}
        className={`aspect-2/3 w-36 shrink-0 overflow-hidden rounded-card border-[1.5px] ${
          dragging ? 'border-accent ring-4 ring-accent-soft' : 'border-line'
        }`}
      >
        {/* Önizleme küçük; kart boyutu (480 px) fazlasıyla yetiyor ve hızlı açılıyor. */}
        <BookCover title={title} src={cover?.thumbUrl ?? cover?.url} />
      </div>

      <div className="min-w-0 flex-1">
        <FormMessage tone="error">{error}</FormMessage>
        <FormMessage tone="success">{info}</FormMessage>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id={`kapak-${bookId}`}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => inputRef.current?.click()} disabled={busy !== null}>
            {busy === 'upload' ? 'Yükleniyor…' : cover ? 'Kapağı değiştir' : 'Kapak yükle'}
          </Button>
          {cover && (
            <Button variant="danger" onClick={() => void remove()} disabled={busy !== null}>
              {busy === 'remove' ? 'Kaldırılıyor…' : 'Kapağı kaldır'}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          JPEG, PNG ya da WebP. Görseli sürükleyip kapağın üzerine de bırakabilirsiniz. Kapak
          kaliteden taviz vermeden sıkıştırılıp iki boyutta saklanır: kitap sayfası için büyük,
          kitap kartları için küçük. En iyi sonuç için kapağın düz ve kırpılmış bir fotoğrafını ya
          da taramasını kullanın.
        </p>
      </div>
    </div>
  )
}
