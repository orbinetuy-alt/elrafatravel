import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'
import PaseoCard from '@/components/admin/PaseoCard'

export const dynamic = 'force-dynamic'

export default async function PaseosPage() {
  const adminClient = createAdminClient()

  const { data: paseos } = await adminClient
    .from('paseos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-light text-white w-10 h-10 rounded-xl flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="text-primary font-bold text-2xl uppercase tracking-wider">Paseos</h1>
            <p className="text-gray-400 text-sm">{paseos?.length ?? 0} paseos en el catálogo</p>
          </div>
        </div>

        <Link
          href="/admin/paseos/nuevo"
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary-light transition shadow-sm"
        >
          <Plus size={18} />
          Nuevo paseo
        </Link>
      </div>

      {/* Grid de paseos */}
      {paseos && paseos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paseos.map((paseo) => (
            <PaseoCard key={paseo.id} paseo={paseo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-beige-dark">
          <MapPin size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-primary font-bold text-lg">No hay paseos creados aún</p>
          <p className="text-gray-400 text-sm mt-1">Crea el primer paseo para que los clientes puedan reservar</p>
          <div className="flex justify-center mt-5">
            <Link
              href="/admin/paseos/nuevo"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-light transition"
            >
              <Plus size={16} />
              Crear primer paseo
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
