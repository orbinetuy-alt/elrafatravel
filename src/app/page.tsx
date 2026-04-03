import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import ReservaToast from '@/components/ReservaToast'
import { Clock, Euro, MapPin, ArrowRight } from 'lucide-react'
import MisSolicitudesClient from '@/components/MisSolicitudesClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: paseos }, misSolicitudesResult] = await Promise.all([
    adminClient
      .from('paseos')
      .select('*, paseo_duraciones(precio)')
      .eq('activo', true)
      .order('created_at', { ascending: false }),
    user
      ? adminClient
          .from('reservas')
          .select('id, num_personas, notas, telefono, estado, created_at, paseos(nombre), disponibilidad(fecha, hora_inicio), paseo_duraciones(etiqueta, precio), pagos(tipo, estado)')
          .eq('cliente_id', user.id)
          .neq('estado', 'cancelada')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
  ])


  const misSolicitudes = misSolicitudesResult?.data
  const userInfo = user ? { email: user.email!, nombre: user.user_metadata?.nombre } : null

  return (
    <div className="min-h-screen bg-beige">
      <Navbar user={userInfo} />

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="El Rafa Travel" width={80} height={80} className="rounded-full object-cover ring-4 ring-white/20" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-widest mb-4">
            El Rafa Travel
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
            Descubrí Lisboa desde un tuk tuk. Elegí tu paseo, reservá tu lugar y viví una experiencia única.
          </p>
          <Link
            href="#paseos"
            className="inline-flex items-center gap-2 bg-secondary text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition text-sm uppercase tracking-wider"
          >
            Ver paseos disponibles
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Paseos */}
      <section id="paseos" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-primary font-bold text-2xl uppercase tracking-wider">Nuestros paseos</h2>
            <p className="text-gray-400 text-sm">{paseos?.length ?? 0} paseos disponibles</p>
          </div>
        </div>

        {paseos && paseos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paseos.map((paseo) => (
              <Link
                key={paseo.id}
                href={`/paseos/${paseo.id}`}
                className="bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="relative h-48 w-full bg-beige">
                  {paseo.imagen_url ? (
                    <Image src={paseo.imagen_url} alt={paseo.nombre} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🗺️</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <h3 className="text-primary font-bold text-lg leading-tight">{paseo.nombre}</h3>
                  {paseo.descripcion && (
                    <p className="text-gray-500 text-sm line-clamp-2">{paseo.descripcion}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm font-semibold mt-auto pt-2">
                    <span className="flex items-center gap-1 text-secondary">
                      <Euro size={14} />
                      {(() => {
                        const precios = (paseo.paseo_duraciones as { precio: number }[] | null)?.map(d => d.precio) ?? []
                        if (precios.length === 0) return '—'
                        const min = Math.min(...precios)
                        return `desde ${min.toFixed(2)}`
                      })()}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-primary text-white text-sm font-bold py-2.5 rounded-xl text-center hover:bg-primary-light transition">
                    Ver detalle
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-beige-dark">
            <MapPin size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-primary font-bold text-lg">Próximamente</p>
            <p className="text-gray-400 text-sm mt-1">Estamos preparando los paseos. ¡Volvé pronto!</p>
          </div>
        )}
      </section>

      {/* Mis solicitudes */}
      {userInfo && misSolicitudes && (
        <MisSolicitudesClient solicitudes={(misSolicitudes as any) ?? []} />
      )}

      {/* Footer */}
      <footer className="border-t border-beige-dark bg-white py-8 px-6 text-center">
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} El Rafa Travel · Lisboa, Portugal</p>
      </footer>

      {/* Toast de confirmación */}
      <Suspense fallback={null}>
        <ReservaToast />
      </Suspense>
    </div>
  )
}

