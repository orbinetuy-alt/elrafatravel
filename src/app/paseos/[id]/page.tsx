import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import CalendarioMes from '@/components/CalendarioMes'
import GaleriaFotos from '@/components/GaleriaFotos'
import { Clock, Euro, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PaseoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [
    { data: paseo },
    { data: imagenes },
    { data: diasBloqueados },
    { data: { user } },
    { data: duraciones },
  ] = await Promise.all([
    adminClient.from('paseos').select('*').eq('id', id).eq('activo', true).single(),
    adminClient.from('paseo_imagenes').select('url').eq('paseo_id', id).order('orden'),
    adminClient.from('dias_bloqueados').select('fecha').eq('paseo_id', id),
    supabase.auth.getUser(),
    adminClient.from('paseo_duraciones').select('id, etiqueta, duracion_minutos, precio').eq('paseo_id', id).order('created_at'),
  ])

  if (!paseo) notFound()

  // Galería: prioriza paseo_imagenes, fallback a imagen_url del paseo
  const gallery =
    imagenes && imagenes.length > 0
      ? imagenes.map(img => img.url)
      : paseo.imagen_url
      ? [paseo.imagen_url]
      : []

  const fechasBloqueadas = (diasBloqueados ?? []).map(d => d.fecha as string)
  const userInfo = user ? { email: user.email!, nombre: user.user_metadata?.nombre } : null

  return (
    <div className="min-h-screen bg-beige">
      <Navbar user={userInfo} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Título */}
        <h1 className="text-2xl font-bold text-primary uppercase tracking-widest mb-8">
          {paseo.nombre}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: galería + descripción + info */}
          <div className="flex flex-col gap-6">
            <GaleriaFotos imagenes={gallery} nombre={paseo.nombre} />

            {paseo.descripcion && (
              <div className="bg-white rounded-2xl border border-beige-dark p-6">
                <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-3">
                  Descripción
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">{paseo.descripcion}</p>
              </div>
            )}

            {duraciones && duraciones.length > 0 && (
              <div className="bg-white rounded-2xl border border-beige-dark p-6">
                <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-3">
                  Opciones de duración
                </h2>
                <div className="divide-y divide-beige-dark">
                  {duraciones.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-primary-light" />
                        {d.etiqueta}
                        <span className="text-xs text-gray-400">({d.duracion_minutos} min)</span>
                      </span>
                      <span className="flex items-center gap-1 text-secondary font-bold text-sm">
                        <Euro size={13} />
                        {Number(d.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: calendario */}
          <div className="flex flex-col gap-4">
            <h2 className="text-primary font-bold text-xs uppercase tracking-wider">
              Disponibilidad
            </h2>
            <CalendarioMes diasBloqueados={fechasBloqueadas} />
          </div>
        </div>

        {/* Botón reservar */}
        <div className="flex justify-center mt-10">
          <Link
            href={
              user
                ? `/paseos/${paseo.id}/fecha`
                : `/login?redirect=/paseos/${paseo.id}/fecha`
            }
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-12 py-4 rounded-xl hover:bg-primary-light transition uppercase tracking-wider text-sm"
          >
            Reservar
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    </div>
  )
}
