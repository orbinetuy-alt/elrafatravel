'use client'

import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarDays, List,
  Plus, X, Clock, Users, MessageSquare, Phone, User,
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday, isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

type Reserva = {
  id: string
  num_personas: number
  notas: string | null
  estado: string
  created_at: string
  paseos: { id: string; nombre: string; precio: number } | null
  profiles: { nombre: string; email: string } | null
  disponibilidad: { fecha: string; hora_inicio: string } | null
}

type Paseo = {
  id: string
  nombre: string
  precio: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const FRANJAS = [
  { label: '08:00 - 10:00', value: '08:00' },
  { label: '10:00 - 12:00', value: '10:00' },
  { label: '12:00 - 14:00', value: '12:00' },
  { label: '14:00 - 16:00', value: '14:00' },
  { label: '16:00 - 18:00', value: '16:00' },
  { label: '18:00 - 20:00', value: '18:00' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgendaClient({
  reservas,
  paseos,
}: {
  reservas: Reserva[]
  paseos: Paseo[]
}) {
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario')
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [diaPreseleccionado, setDiaPreseleccionado] = useState<string>('')

  // Mapa fecha → reservas[]
  const reservasPorFecha = useMemo(() => {
    const map = new Map<string, Reserva[]>()
    for (const r of reservas) {
      const fecha = r.disponibilidad?.fecha
      if (fecha) {
        if (!map.has(fecha)) map.set(fecha, [])
        map.get(fecha)!.push(r)
      }
    }
    return map
  }, [reservas])

  // Días del mes actual
  const diasDelMes = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(mesActual),
      end:   endOfMonth(mesActual),
    })
  }, [mesActual])

  // Celdas vacías al inicio (semana empieza en Lunes)
  const leadingEmpties = useMemo(() => {
    return (getDay(startOfMonth(mesActual)) + 6) % 7
  }, [mesActual])

  // Celdas vacías al final
  const trailingEmpties = useMemo(() => {
    const last = (getDay(endOfMonth(mesActual)) + 6) % 7
    return last === 6 ? 0 : 6 - last
  }, [mesActual])

  // Días para la vista lista
  const diasParaLista = useMemo(() => {
    const result: { fecha: Date; reservasDia: Reserva[] }[] = []
    if (diaSeleccionado && vista === 'lista') {
      const key = dateKey(diaSeleccionado)
      result.push({ fecha: diaSeleccionado, reservasDia: reservasPorFecha.get(key) || [] })
    } else {
      for (const dia of diasDelMes) {
        const key = dateKey(dia)
        const resDelDia = reservasPorFecha.get(key)
        if (resDelDia && resDelDia.length > 0) {
          result.push({ fecha: dia, reservasDia: resDelDia })
        }
      }
    }
    return result
  }, [diaSeleccionado, vista, diasDelMes, reservasPorFecha])

  function handleClickDia(dia: Date) {
    setDiaSeleccionado(dia)
    setVista('lista')
  }

  function handleNuevaReserva(fechaStr?: string) {
    setDiaPreseleccionado(fechaStr || '')
    setModalAbierto(true)
  }

  function handleVolver() {
    setDiaSeleccionado(null)
    setVista('calendario')
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-primary font-bold text-2xl uppercase tracking-wider">Agenda</h1>
            <p className="text-gray-400 text-sm">
              {reservas.length} reservas activas
            </p>
          </div>
        </div>
        <button
          onClick={() => handleNuevaReserva()}
          className="flex items-center gap-2 bg-secondary text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-sm"
        >
          <Plus size={18} />
          Nueva reserva
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-beige-dark shadow-sm p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Toggle vista */}
          <div className="flex gap-1 bg-beige rounded-xl p-1">
            <button
              onClick={() => { setVista('calendario'); setDiaSeleccionado(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                vista === 'calendario'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              <CalendarDays size={15} />
              Calendario
            </button>
            <button
              onClick={() => { setVista('lista'); setDiaSeleccionado(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                vista === 'lista'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              <List size={15} />
              Lista
            </button>
          </div>

          {/* Navegación mes */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMesActual(m => subMonths(m, 1))}
              className="w-9 h-9 rounded-lg border border-beige-dark flex items-center justify-center hover:bg-beige transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-primary font-bold text-base min-w-40 text-center capitalize">
              {format(mesActual, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              onClick={() => setMesActual(m => addMonths(m, 1))}
              className="w-9 h-9 rounded-lg border border-beige-dark flex items-center justify-center hover:bg-beige transition"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => { setMesActual(new Date()); setDiaSeleccionado(null) }}
              className="px-3 py-1.5 text-sm font-semibold border border-beige-dark rounded-lg hover:bg-beige transition text-primary"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {vista === 'calendario' ? (
        <CalendarioView
          diasDelMes={diasDelMes}
          leadingEmpties={leadingEmpties}
          trailingEmpties={trailingEmpties}
          reservasPorFecha={reservasPorFecha}
          diaSeleccionado={diaSeleccionado}
          onClickDia={handleClickDia}
        />
      ) : (
        <ListView
          diasParaLista={diasParaLista}
          diaSeleccionado={diaSeleccionado}
          onVolver={diaSeleccionado ? handleVolver : undefined}
          onNuevaReserva={handleNuevaReserva}
        />
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalNuevaReserva
          paseos={paseos}
          fechaInicial={diaPreseleccionado}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}

// ─── CalendarioView ───────────────────────────────────────────────────────────

function CalendarioView({
  diasDelMes,
  leadingEmpties,
  trailingEmpties,
  reservasPorFecha,
  diaSeleccionado,
  onClickDia,
}: {
  diasDelMes: Date[]
  leadingEmpties: number
  trailingEmpties: number
  reservasPorFecha: Map<string, Reserva[]>
  diaSeleccionado: Date | null
  onClickDia: (dia: Date) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden">

      {/* Cabecera días semana */}
      <div className="grid grid-cols-7 border-b border-beige-dark">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid días */}
      <div className="grid grid-cols-7">

        {/* Celdas vacías inicio */}
        {Array.from({ length: leadingEmpties }).map((_, i) => (
          <div key={`pre-${i}`} className="h-20 md:h-24 border-b border-r border-beige-dark/50 bg-beige/20" />
        ))}

        {/* Días del mes */}
        {diasDelMes.map(dia => {
          const key = dateKey(dia)
          const resDelDia = reservasPorFecha.get(key) || []
          const tieneReservas = resDelDia.length > 0
          const esHoy = isToday(dia)
          const esSel = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false

          return (
            <button
              key={key}
              onClick={() => onClickDia(dia)}
              className={`h-20 md:h-24 border-b border-r border-beige-dark/50 p-2 flex flex-col items-start transition hover:bg-beige/40 cursor-pointer text-left ${
                esSel ? 'bg-primary/5 ring-2 ring-inset ring-primary' : ''
              }`}
            >
              {/* Número del día */}
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                esHoy
                  ? 'bg-secondary text-white'
                  : esSel
                  ? 'bg-primary text-white'
                  : 'text-primary'
              }`}>
                {format(dia, 'd')}
              </span>

              {/* Indicador de reservas */}
              {tieneReservas && (
                <div className="mt-1 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary-light" />
                  <span className="text-xs text-primary-light font-semibold hidden sm:block">
                    {resDelDia.length}
                  </span>
                </div>
              )}
            </button>
          )
        })}

        {/* Celdas vacías final */}
        {Array.from({ length: trailingEmpties }).map((_, i) => (
          <div key={`post-${i}`} className="h-20 md:h-24 border-b border-r border-beige-dark/50 bg-beige/20" />
        ))}
      </div>
    </div>
  )
}

// ─── ListView ─────────────────────────────────────────────────────────────────

function ListView({
  diasParaLista,
  diaSeleccionado,
  onVolver,
  onNuevaReserva,
}: {
  diasParaLista: { fecha: Date; reservasDia: Reserva[] }[]
  diaSeleccionado: Date | null
  onVolver?: () => void
  onNuevaReserva: (fechaStr?: string) => void
}) {
  if (diasParaLista.length === 0 || (diaSeleccionado && diasParaLista[0]?.reservasDia.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-beige-dark shadow-sm p-12 text-center">
        {onVolver && (
          <button
            onClick={onVolver}
            className="text-sm text-primary-light font-semibold hover:underline mb-6 flex items-center gap-1 mx-auto"
          >
            <ChevronLeft size={14} /> Volver al calendario
          </button>
        )}
        <CalendarDays size={48} className="mx-auto mb-4 text-gray-200" />
        <p className="text-primary font-bold text-lg">
          {diaSeleccionado
            ? `Sin reservas el ${format(diaSeleccionado, "d 'de' MMMM", { locale: es })}`
            : 'No hay reservas este mes'}
        </p>
        <p className="text-gray-400 text-sm mt-1">¿Querés agendar una?</p>
        <button
          onClick={() => onNuevaReserva(diaSeleccionado ? dateKey(diaSeleccionado) : undefined)}
          className="mt-5 inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary-light transition"
        >
          <Plus size={16} />
          Nueva reserva
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onVolver && (
        <button
          onClick={onVolver}
          className="text-sm text-primary-light font-semibold hover:underline flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Volver al calendario
        </button>
      )}

      {diasParaLista.map(({ fecha, reservasDia }) => (
        <div key={dateKey(fecha)}>
          {/* Cabecera del día */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-primary font-bold text-sm uppercase tracking-wider">
              {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            {isToday(fecha) && (
              <span className="bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">Hoy</span>
            )}
            <div className="flex-1 h-px bg-beige-dark" />
            <button
              onClick={() => onNuevaReserva(dateKey(fecha))}
              className="text-xs text-primary-light font-semibold hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {reservasDia.map(r => (
              <ReservaCard key={r.id} reserva={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ReservaCard ──────────────────────────────────────────────────────────────

function ReservaCard({ reserva }: { reserva: Reserva }) {
  const hora = reserva.disponibilidad?.hora_inicio
  const franjaLabel = hora
    ? FRANJAS.find(f => f.value === hora)?.label ?? hora
    : 'Sin horario'

  return (
    <div className="bg-white rounded-2xl border border-beige-dark shadow-sm p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {/* Franja horaria */}
        <div className="flex items-center gap-1.5 text-primary-light font-bold text-sm shrink-0">
          <Clock size={14} />
          {franjaLabel}
        </div>

        <div className="w-px h-8 bg-beige-dark shrink-0" />

        {/* Info reserva */}
        <div className="min-w-0">
          <p className="font-bold text-primary text-sm truncate">
            {reserva.paseos?.nombre ?? 'Paseo desconocido'}
          </p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <User size={11} />
              {reserva.profiles?.nombre ?? reserva.profiles?.email ?? 'Cliente desconocido'}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {reserva.num_personas} {reserva.num_personas === 1 ? 'persona' : 'personas'}
            </span>
          </div>
        </div>
      </div>

      {/* Badge estado */}
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${
        reserva.estado === 'aceptada'
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        {reserva.estado === 'aceptada' ? 'Confirmada' : 'Pendiente'}
      </span>
    </div>
  )
}

// ─── Modal Nueva Reserva ──────────────────────────────────────────────────────

function ModalNuevaReserva({
  paseos,
  fechaInicial,
  onClose,
}: {
  paseos: Paseo[]
  fechaInicial: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">

        {/* Header modal */}
        <div className="flex items-center justify-between">
          <h2 className="text-primary font-bold text-xl uppercase tracking-wider">Nueva Reserva</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-beige flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form className="space-y-4">

          {/* Paseo */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              Paseo
            </label>
            <select
              name="paseo_id"
              className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">Seleccionar paseo...</option>
              {paseos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha + Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                defaultValue={fechaInicial}
                className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Horario
              </label>
              <select
                name="hora_inicio"
                className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">Seleccionar...</option>
                {FRANJAS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre cliente */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1"><User size={11} /> Nombre del cliente</span>
            </label>
            <input
              type="text"
              name="nombre_cliente"
              placeholder="Nombre y apellido"
              className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Teléfono + Personas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1"><Phone size={11} /> Teléfono</span>
              </label>
              <input
                type="tel"
                name="telefono"
                placeholder="+598 99 123 456"
                className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1"><Users size={11} /> Personas</span>
              </label>
              <select
                name="num_personas"
                defaultValue="1"
                className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="1">1 persona</option>
                <option value="2">2 personas</option>
                <option value="3">3 personas</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1"><MessageSquare size={11} /> Notas</span>
            </label>
            <textarea
              name="notas"
              rows={2}
              placeholder="Observaciones, peticiones especiales..."
              className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-beige-dark text-primary font-bold py-2.5 rounded-xl hover:bg-beige transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary-light transition text-sm"
            >
              Guardar reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
