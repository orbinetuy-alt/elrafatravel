import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNavbar from '@/components/admin/AdminNavbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const rol = user.user_metadata?.rol as string | undefined
  if (rol !== 'admin') redirect('/admin/login')

  const profile = {
    nombre: user.user_metadata?.nombre ?? 'Admin',
    email: user.email ?? '',
    rol: 'admin',
    avatar_url: null as string | null,
  }

  return (
    <div className="min-h-screen bg-beige">
      <AdminNavbar profile={profile} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
