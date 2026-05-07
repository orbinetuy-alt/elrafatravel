'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { crearPaseo, editarPaseo } from '@/lib/actions/paseos'
import { Upload, X, Plus, Trash2 } from 'lucide-react'

interface Duracion {
  id?: string
  etiqueta: string
  duracion_minutos: number | ''
  precio: number | ''
}

interface PrecioPersona {
  id?: string
  min_personas: number | ''
  max_personas: number | ''
  precio: number | ''
}

interface Paseo {
  id: string
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  ubicacion: string | null
  modalidad: string | null
  tipo?: string | null
  paseo_duraciones?: Duracion[]
  paseo_precios_persona?: PrecioPersona[]
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
  const [tipo, setTipo] = useState<'tuk_tuk' | 'excursion'>(
    (paseo?.tipo as 'tuk_tuk' | 'excursion') ?? 'tuk_tuk'
  )
  const [duraciones, setDuraciones] = useState<Duracion[]>(
    paseo?.paseo_duraciones?.length
      ? paseo.paseo_duraciones
      : [{ etiqueta: '', duracion_minutos: '', precio: '' }]
  )
  const [preciosPersona, setPreciosPersona] = useState<PrecioPersona[]>(
    paseo?.paseo_precios_persona?.length
      ? paseo.paseo_precios_persona
      : [{ min_personas: 1, max_personas: 4, precio: '' }]
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

  function addPrecioPersona() {
    const lastMax = (preciosPersona[preciosPersona.length - 1]?.max_personas as number ?? 0)
    setPreciosPersona(prev => [...prev, { min_personas: lastMax + 1, max_personas: lastMax + 4, precio: '' }])
  }

  function removePrecioPersona(index: number) {
    setPreciosPersona(prev => prev.filter((_, i) => i !== index))
  }

  function updatePrecioPersona(index: number, field: keyof PrecioPersona, value: string) {
    setPreciosPersona(prev => prev.map((p, i) => {
      if (i !== index) return p
      if (field === 'min_personas') return { ...p, min_personas: value === '' ? '' : parseInt(value) }
      if (field === 'max_personas') return { ...p, max_personas: value === '' ? '' : parseInt(value) }
      if (field === 'precio') return { ...p, precio: value === '' ? '' : parseFloat(value) }
      return p
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (tipo === 'tuk_tuk') {
      for (const d of duraciones) {
        if (!d.etiqueta.trim()) { setError('Cada opción de duración debe tener una etiqueta.'); return }
        if (d.duracion_minutos === '' || Number(d.duracion_minutos) <= 0) { setError('Cada opción debe tener una duración en minutos válida.'); return }
        if (d.precio === '' || Number(d.precio) < 0) { setError('Cada opción debe tener un precio válido.'); return }
      }
      if (duraciones.length === 0) { setError('Debés agregar al menos una opción de duración.'); return }
    } else {
      for (const p of preciosPersona) {
        if (p.min_personas === '' || Number(p.min_personas) < 1) { setError('Cada rango debe tener un mínimo de personas válido.'); return }
        if (p.max_personas === '' || Number(p.max_personas) < Number(p.min_personas)) { setError('El máximo debe ser mayor o igual al mínimo.'); return }
        if (p.precio === '' || Number(p.precio) < 0) { setError('Cada rango debe tener un precio válido.'); return }
      }
      if (preciosPersona.length === 0) { setError('Debés agregar al menos un rango de precios.'); return }
    }

    const formData = new FormData(e.currentTarget)
    if (imagenFile) formData.set('imagen', imagenFile)
    formData.set('tipo', tipo)
    formData.set('duraciones', JSON.stringify(tipo === 'tuk_tuk' ? duraciones : []))
    formData.set('precios_persona', JSON.stringify(tipo === 'excursion' ? preciosPersona : []))

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

      {/* Ubicación */}
      <div>
        <label className="block text-sm font-semibold text-primary mb-1">
          Ubicación
        </label>
        <input
          name="ubicacion"
          type="text"
          defaultValue={paseo?.ubicacion ?? 'Lisboa, Portugal'}
          placeholder="Ej: Lisboa, Portugal"
          className="w-full border border-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
      </div>

      {/* Tipo de paseo */}
      <div>
        <label className="block text-sm font-semibold text-primary mb-1">
          Tipo de paseo
        </label>
        <input
          name="modalidad"
          type="text"
          defaultValue={paseo?.modalidad ?? 'Paseo privado con guía'}
          placeholder="Ej: Paseo privado con guía"
          className="w-full border border-beige-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
      </div>

      {/* Categoría del paseo */}
      <div>
        <label className="block text-sm font-semibold text-primary mb-2">
          Categoría <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTipo('tuk_tuk')}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition ${
              tipo === 'tuk_tuk'
                ? 'border-primary bg-primary text-white'
                : 'border-beige-dark bg-white text-gray-600 hover:border-primary/40'
            }`}
          >
            Tuk-tuk
          </button>
          <button
            type="button"
            onClick={() => setTipo('excursion')}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition ${
              tipo === 'excursion'
                ? 'border-primary bg-primary text-white'
                : 'border-beige-dark bg-white text-gray-600 hover:border-primary/40'
            }`}
          >
            Excursión
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {tipo === 'tuk_tuk'
            ? 'El precio varía según la duración elegida por el cliente.'
            : 'Precio fijo por número de personas. Hora de salida fija.'}
        </p>
      </div>

      {/* Categoría del paseo */}
      {tipo === 'tuk_tuk' && (
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
      )}

      {/* Precios por rango de personas (excursión) */}
      {tipo === 'excursion' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-primary">
              Precio por rango de personas <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addPrecioPersona}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-beige transition"
            >
              <Plus size={14} />
              Agregar rango
            </button>
          </div>

          <div className="space-y-3">
            {preciosPersona.map((p, i) => (
              <div key={i} className="grid grid-cols-[90px_90px_110px_36px] gap-2 items-center">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Min personas</label>
                  <input
                    type="number"
                    placeholder="1"
                    min="1"
                    value={p.min_personas}
                    onChange={e => updatePrecioPersona(i, 'min_personas', e.target.value)}
                    className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max personas</label>
                  <input
                    type="number"
                    placeholder="4"
                    min="1"
                    value={p.max_personas}
                    onChange={e => updatePrecioPersona(i, 'max_personas', e.target.value)}
                    className="w-full border border-beige-dark rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Precio</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={p.precio}
                      onChange={e => updatePrecioPersona(i, 'precio', e.target.value)}
                      className="w-full border border-beige-dark rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => removePrecioPersona(i)}
                    disabled={preciosPersona.length === 1}
                    className="flex items-center justify-center text-gray-400 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Ej: 1–4 personas → €120 · 5–8 personas → €200
          </p>
        </div>
      )}

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
