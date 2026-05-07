import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'
import PaseoForm from '@/components/admin/PaseoForm'

export const dynamic = 'force-dynamic'

export default async function EditarPaseoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminClient = createAdminClient()

  const [{ data: paseo }, { data: duraciones }, { data: preciosPersona }] = await Promise.all([
    adminClient.from('paseos').select('id, nombre, descripcion, imagen_url, ubicacion, modalidad, tipo, hora_salida').eq('id', id).single(),
    adminClient.from('paseo_duraciones').select('id, etiqueta, duracion_minutos, precio').eq('paseo_id', id).order('created_at'),
    adminClient.from('paseo_precios_persona').select('id, min_personas, max_personas, precio').eq('paseo_id', id).order('min_personas'),
  ])

  if (!paseo) notFound()

  const paseoConDatos = { ...paseo, paseo_duraciones: duraciones ?? [], paseo_precios_persona: preciosPersona ?? [] }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/paseos"
          className="p-2 rounded-lg bg-white border border-beige-dark hover:bg-beige transition"
        >
          <ChevronLeft size={18} className="text-primary" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-secondary text-white w-10 h-10 rounded-xl flex items-center justify-center">
            <Pencil size={18} />
          </div>
          <div>
            <h1 className="text-primary font-bold text-2xl uppercase tracking-wider">Editar paseo</h1>
            <p className="text-gray-400 text-sm">{paseo.nombre}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-beige-dark p-8">
        <PaseoForm paseo={paseoConDatos} />
      </div>

    </div>
  )
}
