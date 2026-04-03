'use client'

import { useState, useActionState } from 'react'
import { CalendarDays, Clock, Euro } from 'lucide-react'
import CalendarioMes from '@/components/CalendarioMes'
import { crearReserva } from '@/lib/actions/reservas'

interface Duracion {
  id: string
  etiqueta: string
  duracion_minutos: number
  precio: number
}

interface FechaReservaClientProps {
  paseoId: string
  diasBloqueados: string[]
  horarios: { id: string; hora: string }[]
  duraciones: Duracion[]
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
  userNombre,
  userEmail,
}: FechaReservaClientProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [duracionId, setDuracionId] = useState<string>(duraciones[0]?.id ?? '')

  const crearReservaConId = crearReserva.bind(null, paseoId)
  const [estado, formAction, isPending] = useActionState(crearReservaConId, null)

  const duracionSeleccionada = duraciones.find(d => d.id === duracionId)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-primary uppercase tracking-widest mb-1">
          Seleccioná la fecha
        </h1>
        <p className="text-gray-400 text-sm">
          Elegí un día disponible para continuar con tu reserva
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
                Solicitud de reserva
              </h2>
              <p className="text-gray-400 text-xs">{formatearFecha(fechaSeleccionada)}</p>
            </div>
          </div>

          <form action={formAction} className="space-y-5">
            {/* Hidden: fecha seleccionada */}
            <input type="hidden" name="fecha" value={fechaSeleccionada} />
            {/* Hidden: duración seleccionada */}
            <input type="hidden" name="duracion_id" value={duracionId} />

            {/* Duración del paseo */}
            {duraciones.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Duración del paseo <span className="text-red-400">*</span>
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
                    Seleccionado: {duracionSeleccionada.etiqueta} · €{Number(duracionSeleccionada.precio).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Nombre (solo lectura) */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                Nombre completo
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
                Fecha seleccionada
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
                Horario
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
                Cantidad de personas
              </label>
              <input
                type="number"
                name="num_personas"
                min={1}
                max={3}
                defaultValue={1}
                required
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                Teléfono
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
                Comentario{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                name="notas"
                rows={3}
                placeholder="¿Algún detalle adicional?"
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
              {isPending ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
