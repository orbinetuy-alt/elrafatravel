import { notFound, redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import FechaReservaClient from './FechaReservaClient'

export const dynamic = 'force-dynamic'

export default async function FechaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/paseos/${id}/fecha`)

  const [
    { data: paseo },
    { data: diasBloqueados },
    { data: horarios },
    { data: duraciones },
    { data: preciosPersona },
  ] = await Promise.all([
    adminClient.from('paseos').select('id, nombre, tipo').eq('id', id).eq('activo', true).single(),
    adminClient.from('dias_bloqueados').select('fecha').eq('paseo_id', id),
    adminClient.from('horarios').select('id, hora').eq('paseo_id', id).order('hora'),
    adminClient.from('paseo_duraciones').select('id, etiqueta, duracion_minutos, precio').eq('paseo_id', id).order('created_at'),
    adminClient.from('paseo_precios_persona').select('id, min_personas, max_personas, precio').eq('paseo_id', id).order('min_personas'),
  ])

  if (!paseo) notFound()

  const fechasBloqueadas = (diasBloqueados ?? []).map(d => d.fecha as string)
  const userInfo = {
    email: user.email!,
    nombre: user.user_metadata?.nombre ?? '',
  }

  return (
    <div className="min-h-screen bg-beige">
      <Navbar
        user={userInfo}
        extraLinks={[{ href: `/paseos/${id}`, label: paseo.nombre }]}
      />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <FechaReservaClient
          paseoId={id}
          diasBloqueados={fechasBloqueadas}
          horarios={horarios ?? []}
          duraciones={duraciones ?? []}
          preciosPersona={preciosPersona ?? []}
          tipo={(paseo.tipo as 'tuk_tuk' | 'excursion') ?? 'tuk_tuk'}
          userNombre={userInfo.nombre}
          userEmail={userInfo.email}
        />
      </main>
    </div>
  )
}
