import { createAdminClient } from '@/lib/supabase/server'
import FinanzasClient from '@/components/admin/FinanzasClient'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const params = await searchParams
  const adminClient = createAdminClient()

  const now = new Date()
  const mes = parseInt(params.mes ?? String(now.getMonth() + 1))
  const anio = parseInt(params.anio ?? String(now.getFullYear()))

  const mesStr = String(mes).padStart(2, '0')
  const fechaInicio = `${anio}-${mesStr}-01`
  const ultimoDia = new Date(anio, mes, 0).getDate()
  const fechaFin = `${anio}-${mesStr}-${ultimoDia}`

  // Ingresos del mes (pagos Stripe completados)
  const { data: pagos } = await adminClient
    .from('pagos')
    .select('id, monto, tipo, created_at, reservas(paseos(nombre), profiles(nombre, email))')
    .eq('estado', 'completado')
    .gte('created_at', `${fechaInicio}T00:00:00`)
    .lte('created_at', `${fechaFin}T23:59:59`)
    .order('created_at', { ascending: false })

  // Egresos del mes
  const { data: egresos } = await adminClient
    .from('egresos')
    .select('*')
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })

  // Datos de los últimos 6 meses para el gráfico
  const graficoDatos = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(anio, mes - 1 - i, 1)
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const a = d.getFullYear()
      const inicio = `${a}-${m}-01`
      const fin = `${a}-${m}-${new Date(a, d.getMonth() + 1, 0).getDate()}`
      return Promise.all([
        adminClient
          .from('pagos')
          .select('monto')
          .eq('estado', 'completado')
          .gte('created_at', `${inicio}T00:00:00`)
          .lte('created_at', `${fin}T23:59:59`),
        adminClient
          .from('egresos')
          .select('monto')
          .gte('fecha', inicio)
          .lte('fecha', fin),
      ]).then(([p, e]) => ({
        mes: `${m}/${a}`,
        ingresos: (p.data ?? []).reduce((s, r) => s + Number(r.monto), 0),
        egresos: (e.data ?? []).reduce((s, r) => s + Number(r.monto), 0),
      }))
    })
  )

  const totalIngresos = (pagos ?? []).reduce((s, p) => s + Number(p.monto), 0)
  const totalEgresos = (egresos ?? []).reduce((s, e) => s + Number(e.monto), 0)

  return (
    <FinanzasClient
      mes={mes}
      anio={anio}
      pagos={(pagos ?? []) as any}
      egresos={egresos ?? []}
      totalIngresos={totalIngresos}
      totalEgresos={totalEgresos}
      grafico={graficoDatos.reverse()}
    />
  )
}
