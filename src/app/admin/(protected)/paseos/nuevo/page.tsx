import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import PaseoForm from '@/components/admin/PaseoForm'

export default function NuevoPaseoPage() {
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
          <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center">
            <Plus size={20} />
          </div>
          <div>
            <h1 className="text-primary font-bold text-2xl uppercase tracking-wider">Nuevo paseo</h1>
            <p className="text-gray-400 text-sm">Añade un nuevo paseo al catálogo</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-beige-dark p-8">
        <PaseoForm />
      </div>

    </div>
  )
}
