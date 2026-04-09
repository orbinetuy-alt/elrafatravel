import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import ReservaToast from '@/components/ReservaToast'
import { Clock, Euro, MapPin, ArrowRight } from 'lucide-react'
import MisSolicitudesClient from '@/components/MisSolicitudesClient'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const t = await getTranslations('Home')

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
  const count = paseos?.length ?? 0

  return (
    <div className="min-h-screen bg-beige">
      <Navbar user={userInfo} />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/hero.jpg"
          alt="Lisboa"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-primary/80 via-primary/60 to-primary/90" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white py-24">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-1">
              <Image
                src="/logo.png"
                alt="El Rafa Travel"
                width={90}
                height={90}
                className="rounded-full object-cover"
              />
            </div>
          </div>

          {/* Eyebrow */}
          <p className="text-secondary font-bold text-xs uppercase tracking-[0.3em] mb-4">
            Lisboa, Portugal
          </p>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-widest mb-6 leading-none">
            El Rafa<br />
            <span className="text-secondary">Travel</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            {t('subtitle')}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#paseos"
              className="inline-flex items-center gap-2 bg-secondary text-white font-bold px-10 py-4 rounded-2xl hover:bg-secondary/90 transition-all duration-200 text-sm uppercase tracking-wider shadow-lg shadow-black/30 hover:scale-105"
            >
              {t('cta')}
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/70 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="text-secondary text-base">★★★★★</span>
              {t('trust_reviews')}
            </span>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-1.5">
              <span className="text-secondary">✓</span>
              {t('trust_private')}
            </span>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-1.5">
              <span className="text-secondary">✓</span>
              {t('trust_flexible')}
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-bounce">
          <div className="w-px h-10 bg-white/30" />
        </div>
      </section>

      {/* Paseos */}
      <section id="paseos" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-primary font-bold text-2xl uppercase tracking-wider">{t('tours_title')}</h2>
            <p className="text-gray-400 text-sm">{count === 1 ? t('tours_count_one', { count }) : t('tours_count_other', { count })}</p>
          </div>
        </div>

        {paseos && paseos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paseos.map((paseo) => (
              <Link
                key={paseo.id}
                href={`/paseos/${paseo.id}`}
                className="group bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-56 w-full bg-beige overflow-hidden">
                  {paseo.imagen_url ? (
                    <Image
                      src={paseo.imagen_url}
                      alt={paseo.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex flex-col items-center justify-center gap-2">
                      <MapPin size={36} className="text-primary/40" />
                      <span className="text-primary/40 text-xs font-semibold uppercase tracking-wider">Lisboa</span>
                    </div>
                  )}
                  {/* Bottom gradient fade */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/50 to-transparent" />
                  {/* Duration badge */}
                  {(paseo as any).duracion_minutos && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      <Clock size={11} />
                      {(paseo as any).duracion_minutos} min
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 gap-2">
                  <h3 className="text-primary font-bold text-lg leading-tight">{paseo.nombre}</h3>
                  {paseo.descripcion && (
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{paseo.descripcion}</p>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    {/* Price */}
                    <div>
                      <p className="text-gray-400 text-xs">{t('from')}</p>
                      <p className="text-secondary font-black text-xl flex items-center gap-0.5">
                        <Euro size={15} />
                        {(() => {
                          const precios = (paseo.paseo_duraciones as { precio: number }[] | null)?.map(d => d.precio) ?? []
                          if (precios.length === 0) return '—'
                          return Math.min(...precios).toFixed(2)
                        })()}
                      </p>
                    </div>
                    {/* CTA arrow */}
                    <div className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-secondary transition-colors duration-200">
                      {t('card_cta')}
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-beige-dark">
            <MapPin size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 text-sm mt-1">{t('no_tours')}</p>
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

