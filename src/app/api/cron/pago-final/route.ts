import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { enviarEmailPagoFinal } from '@/lib/email'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export async function GET(req: NextRequest) {
  // Protección con CRON_SECRET para que nadie más pueda llamarlo
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const ahora = new Date()

  // Buscar reservas aceptadas cuya seña esté pagada y cuyo paseo ya terminó,
  // y que todavía no tengan un pago final creado
  const { data: reservas } = await adminClient
    .from('reservas')
    .select(`
      id,
      num_personas,
      profiles ( nombre, email ),
      paseos ( nombre ),
      disponibilidad ( fecha, hora_inicio ),
      paseo_duraciones ( etiqueta, duracion_minutos, precio ),
      pagos ( id, tipo, estado )
    `)
    .eq('estado', 'aceptada')

  if (!reservas) return NextResponse.json({ processed: 0 })

  let procesadas = 0

  for (const r of reservas) {
    const dispArr = r.disponibilidad as unknown as { fecha: string; hora_inicio: string }[]
    const durArr = r.paseo_duraciones as unknown as { etiqueta: string; duracion_minutos: number; precio: number }[]
    const perfilArr = r.profiles as unknown as { nombre: string; email: string }[]
    const paseoArr = r.paseos as unknown as { nombre: string }[]
    const pagos = r.pagos as unknown as { id: string; tipo: string; estado: string }[]

    const disp = dispArr?.[0] ?? null
    const dur = durArr?.[0] ?? null
    const perfil = perfilArr?.[0] ?? null
    const paseo = paseoArr?.[0] ?? null

    if (!disp || !dur || !perfil || !paseo) continue

    // Calcular fecha/hora de fin del paseo
    const [anio, mes, dia] = disp.fecha.split('-').map(Number)
    const [hh, mm] = disp.hora_inicio.split(':').map(Number)
    const inicio = new Date(anio, mes - 1, dia, hh, mm)
    const fin = new Date(inicio.getTime() + dur.duracion_minutos * 60 * 1000)

    // El paseo aún no terminó
    if (ahora < fin) continue

    // La seña no está pagada
    const seniaPagada = pagos?.some(p => p.tipo === 'senia' && p.estado === 'completado')
    if (!seniaPagada) continue

    // Ya existe un pago final
    const pagoFinalExiste = pagos?.some(p => p.tipo === 'final')
    if (pagoFinalExiste) continue

    // Crear Stripe Checkout para el 50% restante
    const precioFinal = dur.precio / 2
    const fechaFormateada = `${dia} de ${MESES[mes - 1]} de ${anio}`

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(precioFinal * 100),
            product_data: {
              name: `Pago final — ${paseo.nombre}`,
              description: `50% restante del paseo del ${fechaFormateada}`,
            },
          },
          quantity: 1,
        }],
        customer_email: perfil.email,
        success_url: `${APP_URL}/?pago=final_ok`,
        cancel_url: `${APP_URL}/?pago=final_cancel`,
        metadata: { reserva_id: r.id, tipo: 'final' },
      })

      // Guardar el pago final en la DB
      await adminClient.from('pagos').insert({
        reserva_id: r.id,
        stripe_checkout_session_id: session.id,
        monto: precioFinal,
        moneda: 'eur',
        estado: 'pendiente',
        tipo: 'final',
      })

      await enviarEmailPagoFinal({
        to: perfil.email,
        nombre: perfil.nombre,
        paseo: paseo.nombre,
        fecha: fechaFormateada,
        montoPendiente: precioFinal,
        stripeUrl: session.url!,
      })

      procesadas++
    } catch (e) {
      console.error(`[cron] error procesando reserva ${r.id}:`, e)
    }
  }

  return NextResponse.json({ processed: procesadas })
}
