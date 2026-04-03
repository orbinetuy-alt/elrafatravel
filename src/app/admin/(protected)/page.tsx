import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, TrendingUp, MapPin, ClipboardList } from 'lucide-react'
import SolicitudesList from '@/components/admin/SolicitudesList'

const modulos = [
  {
    href: '/admin/agenda',
    icon: CalendarDays,
    label: 'Agenda',
    desc: 'Paseos programados',
    color: 'bg-primary',
  },
  {
    href: '/admin/finanzas',
    icon: TrendingUp,
    label: 'Finanzas',
    desc: 'Ingresos y egresos',
    color: 'bg-secondary',
  },
  {
    href: '/admin/paseos',
    icon: MapPin,
    label: 'Paseos',
    desc: 'Gestión del catálogo',
    color: 'bg-primary-light',
  },
]

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const { data: solicitudes } = await supabase
    .from('reservas')
    .select(`
      id, num_personas, notas, created_at, estado, telefono,
      paseos ( nombre ),
      profiles ( nombre, email ),
      disponibilidad ( fecha, hora_inicio ),
      paseo_duraciones ( etiqueta, duracion_minutos, precio )
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-10">

      {/* Módulos principales */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {modulos.map(({ href, icon: Icon, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white rounded-2xl border border-beige-dark p-7 flex flex-col items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className={`${color} text-white w-14 h-14 rounded-xl flex items-center justify-center shadow`}>
                <Icon size={28} />
              </div>
              <div className="text-center">
                <p className="text-primary font-bold text-xl uppercase tracking-wider">{label}</p>
                <p className="text-gray-400 text-sm mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sección solicitudes */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-secondary text-white w-8 h-8 rounded-lg flex items-center justify-center">
            <ClipboardList size={16} />
          </div>
          <h2 className="text-primary font-bold text-lg uppercase tracking-wider">Solicitudes pendientes</h2>
          {solicitudes && solicitudes.length > 0 && (
            <span className="bg-secondary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {solicitudes.length}
            </span>
          )}
        </div>

        <SolicitudesList solicitudes={(solicitudes as any) ?? []} />
      </section>

    </div>
  )
}
