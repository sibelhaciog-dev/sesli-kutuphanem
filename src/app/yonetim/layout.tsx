import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AdminTabs } from '@/components/admin/AdminTabs'
import { getViewer } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Yönetim',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isStaff } = await getViewer()
  // Middleware giriş kontrolünü yapıyor; burada da yetki kontrolü var ki
  // rolü olmayan bir kullanıcı adresi elle yazarak giremesin.
  if (!user) redirect('/giris?devam=/yonetim')
  if (!isStaff) redirect('/')

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl">🛠️ Yönetim</h1>
        <p className="mt-1 text-sm text-muted">
          Kitaplar, rehberler, keşif modları ve geri bildirimler
        </p>
      </header>

      <AdminTabs />

      {children}
    </div>
  )
}
