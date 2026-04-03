import { createAdminClient } from '@/lib/supabase/server'
import { CalendarDays } from 'lucide-react'
import AgendaClient from '@/components/admin/AgendaClient'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const adminClient = createAdminClient()

  const { data: reservas } = await adminClient
    .from('reservas')
    .select(`
      id, num_personas, notas, estado, created_at,
      paseos ( id, nombre, precio ),
      profiles ( nombre, email ),
      disponibilidad ( fecha, hora_inicio )
    `)
    .in('estado', ['aceptada', 'pendiente'])
    .order('created_at', { ascending: true })

  const { data: paseos } = await adminClient
    .from('paseos')
    .select('id, nombre, precio')
    .eq('activo', true)
    .order('nombre')

  return (
    <AgendaClient reservas={reservas ?? []} paseos={paseos ?? []} />
  )
}
