'use client'

import { useState, useTransition, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { crearEgreso, eliminarEgreso } from '@/lib/actions/finanzas'

// ─── Types ────────────────────────────────────────────────────────────────────

type Pago = {
  id: string
  monto: number
  tipo: string
  created_at: string
  reservas: {
    paseos: { nombre: string } | null
    profiles: { nombre: string; email: string } | null
  } | null
}

type Egreso = {
  id: string
  descripcion: string
  monto: number
  fecha: string
  categoria: string
}

type GraficoDato = {
  mes: string
  ingresos: number
  egresos: number
}

interface FinanzasClientProps {
  mes: number
  anio: number
  pagos: Pago[]
  egresos: Egreso[]
  totalIngresos: number
  totalEgresos: number
  grafico: GraficoDato[]
}

const CATEGORIAS: Record<string, string> = {
  combustible: 'Combustible',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros',
}

const CATEGORIA_COLORS: Record<string, string> = {
  combustible: 'bg-amber-100 text-amber-700',
  mantenimiento: 'bg-blue-100 text-blue-700',
  otros: 'bg-gray-100 text-gray-600',
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n: number) {
  return `€${Number(n).toFixed(2)}`
}

// ─── EgresoForm ───────────────────────────────────────────────────────────────

function EgresoForm({ onClose }: { onClose: () => void }) {
  const [estado, formAction, isPending] = useActionState(crearEgreso, null)

  if ((estado as any)?.ok) {
    onClose()
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-beige-dark shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-primary font-bold text-base uppercase tracking-wider">Nuevo egreso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Descripción <span className="text-red-400">*</span></label>
            <input
              name="descripcion"
              type="text"
              required
              placeholder="Ej: Gasolina semana 1"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">Monto (€) <span className="text-red-400">*</span></label>
              <input
                name="monto"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">Fecha <span className="text-red-400">*</span></label>
              <input
                name="fecha"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Categoría <span className="text-red-400">*</span></label>
            <select
              name="categoria"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="combustible">Combustible</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="otros">Otros</option>
            </select>
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition text-sm disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar egreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FinanzasClient({
  mes, anio, pagos, egresos, totalIngresos, totalEgresos, grafico,
}: FinanzasClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const ganancia = totalIngresos - totalEgresos

  function navMes(delta: number) {
    let nuevoMes = mes + delta
    let nuevoAnio = anio
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++ }
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio-- }
    router.push(`/admin/finanzas?mes=${nuevoMes}&anio=${nuevoAnio}`)
  }

  function handleEliminar(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await eliminarEgreso(id)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-8">

      {showForm && <EgresoForm onClose={() => setShowForm(false)} />}

      {/* Header con selector de mes */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary uppercase tracking-wider">Finanzas</h1>
          <p className="text-gray-400 text-sm mt-0.5">Ingresos y egresos del período seleccionado</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-beige-dark rounded-xl px-4 py-2 shadow-sm">
          <button onClick={() => navMes(-1)} className="text-primary hover:text-primary-light transition">
            <ChevronLeft size={18} />
          </button>
          <span className="text-primary font-bold text-sm w-36 text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <button onClick={() => navMes(1)} className="text-primary hover:text-primary-light transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-beige-dark p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ingresos</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{fmt(totalIngresos)}</p>
          <p className="text-xs text-gray-400 mt-1">{pagos.length} pago{pagos.length !== 1 ? 's' : ''} completado{pagos.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-2xl border border-beige-dark p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-100 text-red-500 w-10 h-10 rounded-xl flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Egresos</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{fmt(totalEgresos)}</p>
          <p className="text-xs text-gray-400 mt-1">{egresos.length} gasto{egresos.length !== 1 ? 's' : ''} registrado{egresos.length !== 1 ? 's' : ''}</p>
        </div>

        <div className={`rounded-2xl border p-6 shadow-sm ${ganancia >= 0 ? 'bg-primary text-white border-primary' : 'bg-white border-beige-dark'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ganancia >= 0 ? 'bg-white/20' : 'bg-gray-100'}`}>
              <Wallet size={20} className={ganancia >= 0 ? 'text-white' : 'text-gray-600'} />
            </div>
            <span className={`text-sm font-semibold uppercase tracking-wider ${ganancia >= 0 ? 'text-white/80' : 'text-gray-500'}`}>Ganancia neta</span>
          </div>
          <p className={`text-3xl font-bold ${ganancia >= 0 ? 'text-white' : 'text-red-500'}`}>{fmt(ganancia)}</p>
          <p className={`text-xs mt-1 ${ganancia >= 0 ? 'text-white/60' : 'text-gray-400'}`}>
            {ganancia >= 0 ? 'Balance positivo ✓' : 'Balance negativo'}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl border border-beige-dark p-6 shadow-sm">
        <h2 className="text-primary font-bold text-sm uppercase tracking-wider mb-5">Últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={grafico} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `€${v}`} />
            <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#1a3a2a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="egresos" name="Egresos" fill="#e07b39" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ingresos */}
      <div className="bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-beige-dark">
          <h2 className="text-primary font-bold text-sm uppercase tracking-wider">Ingresos del mes</h2>
          <span className="text-xs text-gray-400">{pagos.length} registros</span>
        </div>
        {pagos.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No hay ingresos en este período.</p>
        ) : (
          <div className="divide-y divide-beige-dark">
            {pagos.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">
                    {(p.reservas as any)?.paseos?.nombre ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(p.reservas as any)?.profiles?.nombre ?? '—'} · {p.tipo === 'senia' ? 'Seña' : 'Pago final'} · {new Date(p.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <span className="text-green-600 font-bold text-sm shrink-0">{fmt(p.monto)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Egresos */}
      <div className="bg-white rounded-2xl border border-beige-dark shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-beige-dark">
          <h2 className="text-primary font-bold text-sm uppercase tracking-wider">Egresos del mes</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          >
            <Plus size={14} /> Nuevo egreso
          </button>
        </div>
        {egresos.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No hay egresos en este período.</p>
        ) : (
          <div className="divide-y divide-beige-dark">
            {egresos.map((e) => (
              <div key={e.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{e.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIA_COLORS[e.categoria] ?? 'bg-gray-100 text-gray-500'}`}>
                      {CATEGORIAS[e.categoria] ?? e.categoria}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-red-500 font-bold text-sm">{fmt(e.monto)}</span>
                  <button
                    onClick={() => handleEliminar(e.id)}
                    disabled={deletingId === e.id || isPending}
                    className="text-gray-300 hover:text-red-400 transition disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
