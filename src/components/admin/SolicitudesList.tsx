'use client'

import { useState, useTransition } from 'react'
import { gestionarSolicitud } from '@/lib/actions/reservas'
import { CheckCircle, XCircle, Clock, User, Calendar, Users, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Solicitud {
  id: string
  num_personas: number
  notas: string | null
  telefono: string | null
  created_at: string
  estado: string
  paseos: { nombre: string } | null
  profiles: { nombre: string; email: string } | null
  disponibilidad: { fecha: string; hora_inicio: string } | null
  paseo_duraciones: { etiqueta: string; duracion_minutos: number; precio: number } | null
}

interface SolicitudesListProps {
  solicitudes: Solicitud[]
}

// ─── Modal rechazo ────────────────────────────────────────────────────────────

function RechazoModal({
  solicitud,
  onClose,
  onConfirm,
  isPending,
}: {
  solicitud: Solicitud
  onClose: () => void
  onConfirm: (motivo: string) => void
  isPending: boolean
}) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-beige-dark shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-bold text-base uppercase tracking-wider">Rechazar solicitud</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Se enviará un email a <strong>{solicitud.profiles?.nombre}</strong> con el motivo del rechazo.
        </p>
        <div>
          <label className="block text-sm font-semibold text-primary mb-1">
            Motivo <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: No tenemos disponibilidad para esa fecha. Te invitamos a elegir otra..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo)}
            disabled={isPending || !motivo.trim()}
            className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition text-sm disabled:opacity-50"
          >
            {isPending ? 'Rechazando...' : 'Rechazar y notificar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SolicitudesList({ solicitudes }: SolicitudesListProps) {
  const [pending, startTransition] = useTransition()
  const [procesando, setProcesando] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<Solicitud | null>(null)

  function handleAceptar(reservaId: string) {
    setProcesando(reservaId + 'aceptada')
    startTransition(async () => {
      await gestionarSolicitud(reservaId, 'aceptada')
      setProcesando(null)
    })
  }

  function handleRechazar(motivo: string) {
    if (!rechazando) return
    setProcesando(rechazando.id + 'rechazada')
    startTransition(async () => {
      await gestionarSolicitud(rechazando.id, 'rechazada', motivo)
      setProcesando(null)
      setRechazando(null)
    })
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-12 text-primary-light">
        <Clock size={40} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No hay solicitudes pendientes</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {solicitudes.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-beige-dark p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            {/* Info principal */}
            <div className="flex-1 space-y-1">
              <p className="font-bold text-primary text-base">{s.paseos?.nombre ?? 'Paseo'}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User size={13} />
                  {s.profiles?.nombre} · {s.profiles?.email}
                  {s.telefono && ` · ${s.telefono}`}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {s.disponibilidad?.fecha
                    ? format(new Date(s.disponibilidad.fecha), "d 'de' MMMM yyyy", { locale: es })
                    : '—'}{' '}
                  a las {s.disponibilidad?.hora_inicio?.slice(0, 5) ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {s.num_personas} {s.num_personas === 1 ? 'persona' : 'personas'}
                </span>
              </div>
              {s.notas && (
                <p className="text-xs text-gray-400 italic">"{s.notas}"</p>
              )}
            </div>

            {/* Precio y duración */}
            <div className="text-right shrink-0">
              {s.paseo_duraciones ? (
                <>
                  <p className="text-secondary font-bold text-lg">€{Number(s.paseo_duraciones.precio).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                    <Clock size={11} />
                    {s.paseo_duraciones.etiqueta} · {s.paseo_duraciones.duracion_minutos} min
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm">—</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAceptar(s.id)}
                disabled={pending && procesando === s.id + 'aceptada'}
                className="flex items-center gap-1 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-light transition disabled:opacity-50"
              >
                <CheckCircle size={15} />
                Aceptar
              </button>
              <button
                onClick={() => setRechazando(s)}
                disabled={pending && procesando === s.id + 'rechazada'}
                className="flex items-center gap-1 bg-white border border-red-300 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
              >
                <XCircle size={15} />
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      {rechazando && (
        <RechazoModal
          solicitud={rechazando}
          onClose={() => setRechazando(null)}
          onConfirm={handleRechazar}
          isPending={pending}
        />
      )}
    </>
  )
}
