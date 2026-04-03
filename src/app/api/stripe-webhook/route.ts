import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] firma inválida:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const reservaId = session.metadata?.reserva_id
    const tipo = session.metadata?.tipo as 'senia' | 'final' | undefined

    if (!reservaId || !tipo) {
      return NextResponse.json({ received: true })
    }

    const adminClient = createAdminClient()

    // Marcar el pago como completado
    await adminClient
      .from('pagos')
      .update({ estado: 'completado' })
      .eq('stripe_checkout_session_id', session.id)

    // Si es el pago final, marcar la reserva como completada
    if (tipo === 'final') {
      await adminClient
        .from('reservas')
        .update({ estado: 'completada' } as any)
        .eq('id', reservaId)
    }
  }

  return NextResponse.json({ received: true })
}
