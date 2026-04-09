import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import CalendarioMes from '@/components/CalendarioMes'
import GaleriaFotos from '@/components/GaleriaFotos'
import { Clock, Euro, ArrowRight, ChevronLeft, MapPin, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

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

  const t = await getTranslations('PaseoDetail')

  // Solo mostramos galería si hay imágenes extra (no la imagen principal del hero)
  const galleryImages = imagenes && imagenes.length > 0 ? imagenes.map(img => img.url) : []

  const fechasBloqueadas = (diasBloqueados ?? []).map(d => d.fecha as string)
  const userInfo = user ? { email: user.email!, nombre: user.user_metadata?.nombre } : null
  const precioMin = duraciones && duraciones.length > 0
    ? Math.min(...duraciones.map(d => Number(d.precio)))
    : Number(paseo.precio)

  return (
    <div className="min-h-screen bg-beige pb-24">
      <Navbar user={userInfo} />

      {/* Hero image */}
      <div className="relative h-72 sm:h-105 w-full overflow-hidden">
        {paseo.imagen_url ? (
          <Image
            src={paseo.imagen_url}
            alt={paseo.nombre}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <MapPin size={48} className="text-primary/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />

        {/* Back link */}
        <Link
          href="/"
          className="absolute top-5 left-5 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/50 transition"
        >
          <ChevronLeft size={14} />
          {t('back')}
        </Link>

        {/* Title + location */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 max-w-6xl mx-auto">
          <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <MapPin size={12} />
            Lisboa, Portugal
          </p>
          <h1 className="text-white font-black text-3xl sm:text-5xl uppercase tracking-wider leading-tight drop-shadow-lg">
            {paseo.nombre}
          </h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Columna izquierda: galería + descripción + duraciones */}
          <div className="flex flex-col gap-6">

            {/* Galería (solo si hay paseo_imagenes reales) */}
            {galleryImages.length > 0 && (
              <GaleriaFotos imagenes={galleryImages} nombre={paseo.nombre} />
            )}

            {/* Descripción */}
            {paseo.descripcion && (
              <div className="bg-white rounded-2xl border border-beige-dark p-6">
                <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-secondary inline-block" />
                  {t('description')}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">{paseo.descripcion}</p>
              </div>
            )}

            {/* Duraciones */}
            {duraciones && duraciones.length > 0 && (
              <div className="bg-white rounded-2xl border border-beige-dark p-6">
                <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-secondary inline-block" />
                  {t('duration_options')}
                </h2>
                <div className="flex flex-col gap-2">
                  {duraciones.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-beige rounded-xl px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Clock size={14} className="text-secondary" />
                        {d.etiqueta}
                        <span className="text-xs font-normal text-gray-400">· {d.duracion_minutos} {t('min')}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-secondary font-black text-base">
                        <Euro size={13} />
                        {Number(d.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info del tour */}
            <div className="bg-white rounded-2xl border border-beige-dark p-6">
              <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-secondary inline-block" />
                {t('tour_info')}
              </h2>
              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users size={15} className="text-primary" />
                  </span>
                  {t('private_tour')}
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={15} className="text-primary" />
                  </span>
                  Lisboa, Portugal
                </div>
                {duraciones && duraciones.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock size={15} className="text-primary" />
                    </span>
                    {duraciones.map(d => d.duracion_minutos).join(' / ')} {t('min')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: calendario de disponibilidad */}
          <div className="flex flex-col gap-4">
            <h2 className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="w-4 h-0.5 bg-secondary inline-block" />
              {t('availability')}
            </h2>
            <CalendarioMes diasBloqueados={fechasBloqueadas} />
          </div>
        </div>
      </main>

      {/* Barra fija inferior (siempre visible) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-beige-dark px-6 py-3 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <p className="text-gray-400 text-xs">{t('from')}</p>
          <p className="text-secondary font-black text-2xl flex items-center gap-0.5">
            <Euro size={16} />{precioMin.toFixed(2)}
          </p>
        </div>
        <Link
          href={user ? `/paseos/${paseo.id}/fecha` : `/login?redirect=/paseos/${paseo.id}/fecha`}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-secondary transition-colors duration-200 uppercase tracking-wider text-sm"
        >
          {user ? t('book') : t('login_to_book')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

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

  const t = await getTranslations('PaseoDetail')

  const gallery =
    imagenes && imagenes.length > 0
      ? imagenes.map(img => img.url)
      : paseo.imagen_url
      ? [paseo.imagen_url]
      : []

  const fechasBloqueadas = (diasBloqueados ?? []).map(d => d.fecha as string)
  const userInfo = user ? { email: user.email!, nombre: user.user_metadata?.nombre } : null
  const precioMin = duraciones && duraciones.length > 0
    ? Math.min(...duraciones.map(d => Number(d.precio)))
    : Number(paseo.precio)

  return (
    <div className="min-h-screen bg-beige">
      <Navbar user={userInfo} />

      {/* Hero image */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {paseo.imagen_url ? (
          <Image
            src={paseo.imagen_url}
            alt={paseo.nombre}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <MapPin size={48} className="text-primary/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back link */}
        <Link
          href="/"
          className="absolute top-5 left-5 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/50 transition"
        >
          <ChevronLeft size={14} />
          {t('back')}
        </Link>

        {/* Title + location at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <MapPin size={12} />
            Lisboa, Portugal
          </p>
          <h1 className="text-white font-black text-3xl sm:text-4xl uppercase tracking-wider leading-tight drop-shadow">
            {paseo.nombre}
          </h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Columna izquierda (3/5): galería + descripción + duraciones */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Galería */}
            {gallery.length > 0 && (
              <GaleriaFotos imagenes={gallery} nombre={paseo.nombre} />
            )}

            {/* Descripción */}
            {paseo.descripcion && (
              <div className="bg-white rounded-2xl border border-beige-dark p-6">
                <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-secondary inline-block" />
                  {t('description')}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">{paseo.descripcion}</p>
              </div>
            )}

            {/* Duraciones */}
            {duraciones && duraciones.length > 0 && (
              <div className="bg-white rounded-2xl border border-beige-dark p-6">
                <h2 className="text-primary font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-secondary inline-block" />
                  {t('duration_options')}
                </h2>
                <div className="flex flex-col gap-2">
                  {duraciones.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-beige rounded-xl px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Clock size={14} className="text-secondary" />
                        {d.etiqueta}
                        <span className="text-xs font-normal text-gray-400">· {d.duracion_minutos} {t('min')}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-secondary font-black text-base">
                        <Euro size={13} />
                        {Number(d.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendario (mobile) */}
            <div className="lg:hidden flex flex-col gap-4">
              <h2 className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-4 h-0.5 bg-secondary inline-block" />
                {t('availability')}
              </h2>
              <CalendarioMes diasBloqueados={fechasBloqueadas} />
            </div>
          </div>

          {/* Columna derecha (2/5): sticky booking card + calendario */}
          <div className="hidden lg:flex lg:col-span-2 flex-col gap-6">

            {/* Booking card */}
            <div className="bg-white rounded-2xl border border-beige-dark p-6 shadow-sm sticky top-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-gray-400 text-xs">{t('from')}</span>
              </div>
              <p className="text-secondary font-black text-3xl flex items-center gap-1 mb-5">
                <Euro size={20} />
                {precioMin.toFixed(2)}
              </p>

              <div className="flex flex-col gap-3 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users size={14} className="text-primary" />
                  </span>
                  {t('private_tour')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin size={14} className="text-primary" />
                  </span>
                  Lisboa, Portugal
                </div>
                {duraciones && duraciones.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock size={14} className="text-primary" />
                    </span>
                    {duraciones.map(d => d.duracion_minutos).join(' / ')} {t('min')}
                  </div>
                )}
              </div>

              <Link
                href={user ? `/paseos/${paseo.id}/fecha` : `/login?redirect=/paseos/${paseo.id}/fecha`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-xl hover:bg-secondary transition-colors duration-200 uppercase tracking-wider text-sm"
              >
                {user ? t('book') : t('login_to_book')}
                <ArrowRight size={16} />
              </Link>

              {!user && (
                <p className="text-center text-xs text-gray-400 mt-3">{t('no_account')} <Link href="/registro" className="text-secondary font-semibold hover:underline">{t('sign_up')}</Link></p>
              )}
            </div>

            {/* Calendario */}
            <div className="flex flex-col gap-4">
              <h2 className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-4 h-0.5 bg-secondary inline-block" />
                {t('availability')}
              </h2>
              <CalendarioMes diasBloqueados={fechasBloqueadas} />
            </div>
          </div>
        </div>

        {/* CTA mobile: fixed bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-beige-dark px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-xs">{t('from')}</p>
            <p className="text-secondary font-black text-xl flex items-center gap-0.5">
              <Euro size={15} />{precioMin.toFixed(2)}
            </p>
          </div>
          <Link
            href={user ? `/paseos/${paseo.id}/fecha` : `/login?redirect=/paseos/${paseo.id}/fecha`}
            className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-secondary transition-colors duration-200 uppercase tracking-wider text-sm"
          >
            {user ? t('book') : t('login_to_book')}
            <ArrowRight size={15} />
          </Link>
        </div>
        {/* Spacer for fixed mobile bar */}
        <div className="lg:hidden h-20" />
      </main>
    </div>
  )
}
