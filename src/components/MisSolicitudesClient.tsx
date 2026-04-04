'use client'

import { useState, useTransition, useActionState } from 'react'
import { Pencil, X, ClipboardList, Calendar, Users, Clock, CreditCard, ExternalLink } from 'lucide-react'
import { cancelarReserva, editarReserva, pagarSenia } from '@/lib/actions/reservas'
import { useTranslations, useLocale } from 'next-intl'

const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const ESTADO_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pendiente:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  aceptada:   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  rechazada:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
  cancelada:  { bg: 'bg-gray-100',  text: 'text-gray-500',   border: 'border-gray-200'  },
}

type Pago = { tipo: string; estado: string }

type Solicitud = {
  id: string
  num_personas: number
  notas: string | null
  telefono: string | null
  estado: string
  created_at: string
  paseos: { nombre: string } | null
  disponibilidad: { fecha: string; hora_inicio: string } | null
  paseo_duraciones: { etiqueta: string; precio: number } | null
  pagos: Pago[] | null
}

function formatearFecha(fecha: string, locale: string) {
  const [anio, mes, dia] = fecha.split('-')
  const meses = locale === 'en' ? MESES_EN : MESES_ES
  return `${dia} ${locale === 'en' ? 'of' : 'de'} ${meses[parseInt(mes) - 1]} ${locale === 'en' ? '' : 'de '}${anio}`.trim()
}

function PagoBadge({ pagos, estadoReserva, reservaId }: { pagos: Pago[] | null; estadoReserva: string; reservaId: string }) {
  const [cargando, setCargando] = useState(false)
  const t = useTranslations('Booking')

  if (estadoReserva !== 'aceptada') return null

  const senia = pagos?.find(p => p.tipo === 'senia')
  const final = pagos?.find(p => p.tipo === 'final')

  if (final?.estado === 'completado') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CreditCard size={11} /> {t('paid_full')}
      </span>
    )
  }
  if (final?.estado === 'pendiente') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <CreditCard size={11} /> {t('final_due')}
      </span>
    )
  }
  if (senia?.estado === 'completado') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
        <CreditCard size={11} /> {t('senia_paid')}
      </span>
    )
  }
  if (!senia || senia?.estado === 'pendiente') {
    return (
      <button
        onClick={async () => {
          setCargando(true)
          const result = await pagarSenia(reservaId)
          if (result?.url) {
            window.location.href = result.url
          } else {
            setCargando(false)
          }
        }}
        disabled={cargando}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-60"
      >
        <CreditCard size={11} />
        {cargando ? t('loading') : t('pay_now')}
        {!cargando && <ExternalLink size={10} />}
      </button>
    )
  }
  return null
}

// ─── Modal de edición ─────────────────────────────────────────────────────────

function EditModal({ solicitud, onClose }: { solicitud: Solicitud; onClose: () => void }) {
  const editarConId = editarReserva.bind(null, solicitud.id)
  const [estado, formAction, isPending] = useActionState(editarConId, null)
  const t = useTranslations('Booking')

  // Cerrar automáticamente al guardar correctamente
  if ((estado as any)?.ok) {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-beige-dark shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-primary font-bold text-base uppercase tracking-wider">
            {t('edit_title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 font-medium">{solicitud.paseos?.nombre}</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1">
              {t('persons')} <span className="text-red-400">*</span>
            </label>
            <select
              name="num_personas"
              defaultValue={solicitud.num_personas}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">
              {t('phone')} <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="telefono"
              defaultValue={solicitud.telefono ?? ''}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">
              {t('notes')}
            </label>
            <textarea
              name="notas"
              defaultValue={solicitud.notas ?? ''}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {(estado as any)?.error && (
            <p className="text-red-500 text-sm">{(estado as any).error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
            >
              {t('cancel_edit')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition text-sm disabled:opacity-50"
            >
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Fila individual ──────────────────────────────────────────────────────────

function SolicitudRow({ s }: { s: Solicitud }) {
  const [editando, setEditando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Booking')
  const locale = useLocale()

  const styles = ESTADO_STYLES[s.estado] ?? { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' }
  const estadoLabel = t(s.estado as any) ?? s.estado
  const fecha = s.disponibilidad?.fecha
  const hora = s.disponibilidad?.hora_inicio?.slice(0, 5) ?? '—'
  const fechaFormateada = fecha ? formatearFecha(fecha, locale) : '—'
  const esPendiente = s.estado === 'pendiente'

  function handleCancelar() {
    startTransition(async () => {
      await cancelarReserva(s.id)
      setConfirmando(false)
    })
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-beige-dark p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-bold text-primary text-base">{s.paseos?.nombre ?? 'Paseo'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {fechaFormateada}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {hora}
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {s.num_personas} {s.num_personas === 1 ? 'persona' : 'personas'}
            </span>
          </div>
          {s.notas && (
            <p className="text-xs text-gray-400 italic mt-1">"{s.notas}"</p>
          )}
          <div className="mt-2">
            <PagoBadge pagos={s.pagos ?? null} estadoReserva={s.estado} reservaId={s.id} />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border}`}>
            {estadoLabel}
          </span>

          {esPendiente && (
            <>
              <button
                onClick={() => setEditando(true)}
                className="text-gray-400 hover:text-primary transition p-1.5 rounded-lg hover:bg-beige"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setConfirmando(true)}
                className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
                title="Cancelar reserva"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmación cancelar */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-beige-dark shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-bold text-primary text-base mb-2">{t('cancel_title')}</p>
            <p className="text-sm text-gray-500 mb-6">
              {t('cancel_desc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmando(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
              >
                {t('back')}
              </button>
              <button
                onClick={handleCancelar}
                disabled={isPending}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition text-sm disabled:opacity-50"
              >
                {isPending ? t('cancelling') : t('confirm_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editando && (
        <EditModal solicitud={s} onClose={() => setEditando(false)} />
      )}
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MisSolicitudesClient({ solicitudes }: { solicitudes: Solicitud[] }) {
  const t = useTranslations('Home')
  const tb = useTranslations('Booking')
  if (solicitudes.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-6 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-secondary text-white w-10 h-10 rounded-xl flex items-center justify-center">
          <ClipboardList size={20} />
        </div>
        <div>
          <h2 className="text-primary font-bold text-2xl uppercase tracking-wider">{t('my_bookings')}</h2>
        </div>
      </div>

      <div className="space-y-4">
        {solicitudes.map((s) => (
          <SolicitudRow key={s.id} s={s} />
        ))}
      </div>
    </section>
  )
}
