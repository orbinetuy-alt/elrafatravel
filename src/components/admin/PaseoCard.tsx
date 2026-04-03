'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toggleActivoPaseo, eliminarPaseo } from '@/lib/actions/paseos'
import { Pencil, Trash2, ToggleLeft, ToggleRight, Clock, Euro } from 'lucide-react'

interface Paseo {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  duracion_minutos: number
  imagen_url: string | null
  activo: boolean
}

export default function PaseoCard({ paseo }: { paseo: Paseo }) {
  const [, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleToggle() {
    startTransition(async () => {
      await toggleActivoPaseo(paseo.id, paseo.activo)
    })
  }

  function handleEliminar() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    startTransition(async () => {
      await eliminarPaseo(paseo.id)
    })
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all ${paseo.activo ? 'border-beige-dark' : 'border-gray-200 opacity-60'}`}>

      {/* Imagen */}
      <div className="relative h-44 w-full bg-beige">
        {paseo.imagen_url ? (
          <Image src={paseo.imagen_url} alt={paseo.nombre} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-4xl">🗺️</span>
          </div>
        )}
        {/* Badge activo/inactivo */}
        <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${paseo.activo ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
          {paseo.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-primary font-bold text-lg leading-tight">{paseo.nombre}</h3>

        {paseo.descripcion && (
          <p className="text-gray-500 text-sm line-clamp-2">{paseo.descripcion}</p>
        )}

        <div className="flex items-center gap-4 text-sm font-semibold mt-auto pt-2">
          <span className="flex items-center gap-1 text-secondary">
            <Euro size={14} />
            {Number(paseo.precio).toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-primary-light">
            <Clock size={14} />
            {paseo.duracion_minutos} min
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-2 border-t border-beige">
          <Link
            href={`/admin/paseos/${paseo.id}/editar`}
            className="flex items-center gap-1 text-sm font-semibold text-primary bg-beige hover:bg-beige-dark px-3 py-2 rounded-lg transition flex-1 justify-center"
          >
            <Pencil size={14} />
            Editar
          </Link>

          <button
            onClick={handleToggle}
            className="flex items-center gap-1 text-sm font-semibold text-primary-light bg-beige hover:bg-beige-dark px-3 py-2 rounded-lg transition"
            title={paseo.activo ? 'Desactivar' : 'Activar'}
          >
            {paseo.activo ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
          </button>

          <button
            onClick={handleEliminar}
            className={`flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg transition ${confirmDelete ? 'bg-red-600 text-white' : 'bg-beige text-red-500 hover:bg-red-50'}`}
            title="Eliminar"
          >
            <Trash2 size={14} />
            {confirmDelete ? '¿Seguro?' : ''}
          </button>
        </div>
      </div>

    </div>
  )
}
