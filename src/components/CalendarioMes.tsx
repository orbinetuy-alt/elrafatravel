'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarioMesProps {
  diasBloqueados: string[]             // array de 'YYYY-MM-DD'
  onSelectDate?: (fecha: string) => void
  fechaSeleccionada?: string
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarioMes({ diasBloqueados, onSelectDate, fechaSeleccionada }: CalendarioMesProps) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())

  const bloqueadosSet = new Set(diasBloqueados)

  // Offset para empezar la semana en Lunes (JS: 0=Dom)
  const primerDiaSemana = new Date(anio, mes, 1).getDay()
  const offsetLunes = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  const celdas: (number | null)[] = [
    ...Array(offsetLunes).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const irMesAnterior = () => {
    if (mes === 0) { setAnio(a => a - 1); setMes(11) }
    else setMes(m => m - 1)
  }

  const irMesSiguiente = () => {
    if (mes === 11) { setAnio(a => a + 1); setMes(0) }
    else setMes(m => m + 1)
  }

  return (
    <div className="bg-white rounded-2xl border border-beige-dark p-5 select-none">
      {/* Header mes */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={irMesAnterior}
          className="p-2 rounded-lg hover:bg-beige transition text-primary"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-primary uppercase tracking-wider text-sm">
          {MESES[mes]} {anio}
        </span>
        <button
          type="button"
          onClick={irMesSiguiente}
          className="p-2 rounded-lg hover:bg-beige transition text-primary"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Cabecera días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v-${i}`} />

          const fechaStr = toISODate(anio, mes, dia)
          const fecha = new Date(anio, mes, dia)
          const esPasado = fecha < hoy
          const estaBloqueado = bloqueadosSet.has(fechaStr)
          const disponible = !esPasado && !estaBloqueado
          const seleccionado = fechaSeleccionada === fechaStr
          const clickable = disponible && !!onSelectDate

          let cls = 'aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition '
          if (seleccionado) {
            cls += 'bg-primary text-white ring-2 ring-primary ring-offset-1'
          } else if (disponible) {
            cls += clickable
              ? 'border-2 border-green-500 text-primary cursor-pointer hover:bg-green-50'
              : 'border-2 border-green-500 text-primary'
          } else {
            cls += 'border-2 border-red-400 text-gray-400 cursor-not-allowed opacity-70'
          }

          return (
            <button
              key={fechaStr}
              type="button"
              className={cls}
              onClick={() => clickable && onSelectDate!(fechaStr)}
              disabled={!clickable}
            >
              {dia}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-beige-dark">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded border-2 border-green-500" />
          <span className="text-xs text-gray-500">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded border-2 border-red-400" />
          <span className="text-xs text-gray-500">No disponible</span>
        </div>
      </div>
    </div>
  )
}
