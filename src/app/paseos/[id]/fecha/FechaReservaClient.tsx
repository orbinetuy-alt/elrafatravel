'use client'

import { useState, useActionState } from 'react'
import { CalendarDays, Clock, Euro, Users } from 'lucide-react'
import CalendarioMes from '@/components/CalendarioMes'
import { crearReserva } from '@/lib/actions/reservas'
import { useTranslations } from 'next-intl'

interface Duracion {
  id: string
  etiqueta: string
  duracion_minutos: number
  precio: number
}

interface PrecioPersona {
  id: string
  min_personas: number
  max_personas: number
  precio: number
}

interface FechaReservaClientProps {
  paseoId: string
  diasBloqueados: string[]
  horarios: { id: string; hora: string }[]
  duraciones: Duracion[]
  preciosPersona: PrecioPersona[]
  tipo: 'tuk_tuk' | 'excursion'
  userNombre: string
  userEmail: string
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia} de ${MESES[parseInt(mes) - 1]} de ${anio}`
}

export default function FechaReservaClient({
  paseoId,
  diasBloqueados,
  duraciones,
  preciosPersona,
  tipo,
  userNombre,
  userEmail,
}: FechaReservaClientProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [duracionId, setDuracionId] = useState<string>(duraciones[0]?.id ?? '')
  const [tierSeleccionado, setTierSeleccionado] = useState<PrecioPersona | null>(preciosPersona[0] ?? null)
  const [numPersonas, setNumPersonas] = useState<number>(preciosPersona[0]?.min_personas ?? 1)
  const t = useTranslations('ReservaForm')

  const crearReservaConId = crearReserva.bind(null, paseoId)
  const [estado, formAction, isPending] = useActionState(crearReservaConId, null)

  const duracionSeleccionada = duraciones.find(d => d.id === duracionId)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-primary uppercase tracking-widest mb-1">
          {t('select_date')}
        </h1>
        <p className="text-gray-400 text-sm">
          {t('select_date_sub')}
        </p>
      </div>

      <CalendarioMes
        diasBloqueados={diasBloqueados}
        onSelectDate={setFechaSeleccionada}
        fechaSeleccionada={fechaSeleccionada ?? undefined}
      />

      {/* Formulario — aparece al seleccionar una fecha */}
      {fechaSeleccionada && (
        <div className="bg-white rounded-2xl border border-beige-dark p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary text-white w-9 h-9 rounded-xl flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-primary font-bold text-base uppercase tracking-wider">
                {t('booking_request')}
              </h2>
              <p className="text-gray-400 text-xs">{formatearFecha(fechaSeleccionada)}</p>
            </div>
          </div>

          <form action={formAction} className="space-y-5">
            {/* Hidden: fecha seleccionada */}
            <input type="hidden" name="fecha" value={fechaSeleccionada} />
            {/* Hidden: duración seleccionada (tuk-tuk) */}
            {tipo === 'tuk_tuk' && (
              <input type="hidden" name="duracion_id" value={duracionId} />
            )}
            {/* Hidden: tier de precio (excursión) */}
            {tipo === 'excursion' && tierSeleccionado && (
              <input type="hidden" name="precio_persona_id" value={tierSeleccionado.id} />
            )}

            {/* Duración del paseo (solo tuk-tuk) */}
            {tipo === 'tuk_tuk' && duraciones.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  {t('duration')} <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {duraciones.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDuracionId(d.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition ${
                        duracionId === d.id
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-beige-dark bg-white text-gray-600 hover:border-primary/40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={14} className={duracionId === d.id ? 'text-primary' : 'text-gray-400'} />
                        {d.etiqueta}
                        <span className="text-xs text-gray-400">({d.duracion_minutos} min)</span>
                      </span>
                      <span className={`flex items-center gap-0.5 font-bold ${duracionId === d.id ? 'text-secondary' : 'text-gray-500'}`}>
                        <Euro size={13} />
                        {Number(d.precio).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
                {duracionSeleccionada && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {t('selected_label')}: {duracionSeleccionada.etiqueta} · €{Number(duracionSeleccionada.precio).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Nombre (solo lectura) */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                {t('full_name')}
              </label>
              <input
                type="text"
                value={userNombre}
                readOnly
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm bg-beige text-primary cursor-default"
              />
            </div>

            {/* Email (solo lectura) */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                readOnly
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm bg-beige text-primary cursor-default"
              />
            </div>

            {/* Fecha (solo lectura) */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                {t('date_selected')}
              </label>
              <input
                type="text"
                value={formatearFecha(fechaSeleccionada)}
                readOnly
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm bg-beige text-primary font-semibold cursor-default"
              />
            </div>

            {/* Horario */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                {t('schedule')}
              </label>
              <input
                type="time"
                name="hora"
                required
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* Cantidad de personas */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                {t('persons')}
              </label>
              {tipo === 'excursion' && preciosPersona.length > 0 ? (
                <div className="space-y-3">
                  {/* Selección de rango */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {preciosPersona.map(pp => (
                      <button
                        key={pp.id}
                        type="button"
                        onClick={() => {
                          setTierSeleccionado(pp)
                          setNumPersonas(pp.min_personas)
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition ${
                          tierSeleccionado?.id === pp.id
                            ? 'border-primary bg-primary/5 text-primary font-semibold'
                            : 'border-beige-dark bg-white text-gray-600 hover:border-primary/40'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Users size={14} className={tierSeleccionado?.id === pp.id ? 'text-primary' : 'text-gray-400'} />
                          {pp.min_personas}–{pp.max_personas} personas
                        </span>
                        <span className={`flex items-center gap-0.5 font-bold ${
                          tierSeleccionado?.id === pp.id ? 'text-secondary' : 'text-gray-500'
                        }`}>
                          <Euro size={13} />
                          {Number(pp.precio).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Número exacto dentro del rango */}
                  {tierSeleccionado && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Número exacto de personas ({tierSeleccionado.min_personas}–{tierSeleccionado.max_personas})
                      </label>
                      <input
                        type="number"
                        name="num_personas"
                        min={tierSeleccionado.min_personas}
                        max={tierSeleccionado.max_personas}
                        value={numPersonas}
                        onChange={e => setNumPersonas(parseInt(e.target.value) || tierSeleccionado.min_personas)}
                        required
                        className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  name="num_personas"
                  min={1}
                  max={3}
                  defaultValue={1}
                  required
                  className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="telefono"
                placeholder="+351 912 345 678"
                required
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* Comentario */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                {t('notes')}{' '}
                <span className="text-gray-400 font-normal">{t('notes_optional')}</span>
              </label>
              <textarea
                name="notas"
                rows={3}
                placeholder={t('notes_placeholder')}
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
              />
            </div>

            {/* Error */}
            {estado?.error && (
              <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg py-2 px-4">
                {estado.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-primary-light transition disabled:opacity-60"
            >
              {isPending ? t('submitting') : t('submit')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
