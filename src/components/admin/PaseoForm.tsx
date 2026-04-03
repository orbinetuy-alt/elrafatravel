'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { crearPaseo, editarPaseo } from '@/lib/actions/paseos'
import { Upload, X, Plus, Trash2 } from 'lucide-react'

interface Duracion {
  id?: string        // presente si ya existe en DB
  etiqueta: string
  duracion_minutos: number | ''
  precio: number | ''
}

interface Paseo {
  id: string
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  paseo_duraciones?: Duracion[]
}

interface PaseoFormProps {
  paseo?: Paseo
}

export default function PaseoForm({ paseo }: PaseoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(paseo?.imagen_url ?? null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [duraciones, setDuraciones] = useState<Duracion[]>(
    paseo?.paseo_duraciones?.length
      ? paseo.paseo_duraciones
      : [{ etiqueta: '', duracion_minutos: '', precio: '' }]
  )

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImagenFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  function handleRemoveImage() {
    setImagenFile(null)
    setPreview(null)
  }

  function addDuracion() {
    setDuraciones(prev => [...prev, { etiqueta: '', duracion_minutos: '', precio: '' }])
  }

  function removeDuracion(index: number) {
    setDuraciones(prev => prev.filter((_, i) => i !== index))
  }

  function updateDuracion(index: number, field: keyof Duracion, value: string) {
    setDuraciones(prev => prev.map((d, i) => {
      if (i !== index) return d
      if (field === 'duracion_minutos') return { ...d, duracion_minutos: value === '' ? '' : parseInt(value) }
      if (field === 'precio') return { ...d, precio: value === '' ? '' : parseFloat(value) }
      return { ...d, [field]: value }
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validar duraciones
    for (const d of duraciones) {
      if (!d.etiqueta.trim()) { setError('Cada opción de duración debe tener una etiqueta.'); return }
      if (d.duracion_minutos === '' || Number(d.duracion_minutos) <= 0) { setError('Cada opción debe tener una duración en minutos válida.'); return }
      if (d.precio === '' || Number(d.precio) < 0) { setError('Cada opción debe tener un precio válido.'); return }
    }
    if (duraciones.length === 0) { setError('Debés agregar al menos una opción de duración.'); return }

    const formData = new FormData(e.currentTarget)
    if (imagenFile) formData.set('imagen', imagenFile)
    formData.set('duraciones', JSON.stringify(duraciones))

    startTransition(async () => {
      const result = paseo
        ? await editarPaseo(paseo.id, formData)
        : await crearPaseo(formData)

      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-primary mb-1">
          Nombre del paseo <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          type="text"
          required
          defaultValue={paseo?.nombre}
          placeholder="Ej: Paseo por Belém y Torre"
          className="w-full border border-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-primary mb-1">
          Descripción
        </label>
        <textarea
          name="descripcion"
          rows={4}
          defaultValue={paseo?.descripcion ?? ''}
          placeholder="Describe el recorrido, puntos de interés, duración estimada..."
          className="w-full border border-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
        />
      </div>

      {/* Opciones de duración y precio */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-primary">
            Opciones de duración y precio <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addDuracion}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-beige transition"
          >
            <Plus size={14} />
            Agregar opción
          </button>
        </div>

        <div className="space-y-3">
          {duraciones.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_100px_36px] gap-2 items-center">
              <input
                type="text"
                placeholder='Ej: "1 hora", "1h 30min"'
                value={d.etiqueta}
                onChange={e => updateDuracion(i, 'etiqueta', e.target.value)}
                className="border border-beige-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                placeholder="Minutos"
                min="1"
                value={d.duracion_minutos}
                onChange={e => updateDuracion(i, 'duracion_minutos', e.target.value)}
                className="border border-beige-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={d.precio}
                  onChange={e => updateDuracion(i, 'precio', e.target.value)}
                  className="w-full border border-beige-dark rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={() => removeDuracion(i)}
                disabled={duraciones.length === 1}
                className="flex items-center justify-center text-gray-400 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Agrega una fila por cada opción disponible, de menor a mayor duración.</p>
      </div>

      {/* Imagen */}
      <div>
        <label className="block text-sm font-semibold text-primary mb-1">
          Imagen del paseo
        </label>

        {preview ? (
          <div className="relative w-full h-52 rounded-xl overflow-hidden border border-beige-dark">
            <Image src={preview} alt="Preview" fill className="object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition"
            >
              <X size={16} className="text-red-500" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-beige-dark rounded-xl cursor-pointer hover:border-primary transition bg-beige/30">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-400">Haz clic para subir una imagen</span>
            <input
              name="imagen"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        )}

        {/* Campo oculto para mantener la imagen actual al editar */}
        {!imagenFile && preview && (
          <input type="hidden" name="imagen_actual" value={preview} />
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-light transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (paseo ? 'Guardando...' : 'Creando...') : (paseo ? 'Guardar cambios' : 'Crear paseo')}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => router.push('/admin/paseos')}
          className="bg-beige text-primary font-bold px-8 py-3 rounded-xl hover:bg-beige-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>

    </form>
  )
}
