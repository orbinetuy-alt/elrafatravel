'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { enviarEmailCliente, enviarEmailAdmin, enviarEmailConfirmacion, enviarEmailRechazo } from '@/lib/email'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export async function crearReserva(paseoId: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Debés iniciar sesión para hacer una reserva.' }

  const fecha = formData.get('fecha') as string
  const hora = formData.get('hora') as string
  const numPersonas = parseInt(formData.get('num_personas') as string)
  const telefono = formData.get('telefono') as string
  const notas = (formData.get('notas') as string) || null
  const duracionId = (formData.get('duracion_id') as string) || null

  if (!fecha || !hora || !numPersonas || !telefono) {
    return { error: 'Por favor completá todos los campos obligatorios.' }
  }

  const horaFormato = hora.length === 5 ? hora + ':00' : hora

  // Buscar o crear disponibilidad para este paseo/fecha/hora
  let disponibilidadId: string

  const { data: existing } = await adminClient
    .from('disponibilidad')
    .select('id')
    .eq('paseo_id', paseoId)
    .eq('fecha', fecha)
    .eq('hora_inicio', horaFormato)
    .maybeSingle()

  if (existing) {
    disponibilidadId = existing.id
  } else {
    const { data: nueva, error: errDisp } = await adminClient
      .from('disponibilidad')
      .insert({ paseo_id: paseoId, fecha, hora_inicio: horaFormato })
      .select('id')
      .single()

    if (errDisp || !nueva) return { error: 'Error al procesar la reserva. Intentá de nuevo.' }
    disponibilidadId = nueva.id
  }

  // Insertar la reserva
  const { error: errReserva } = await adminClient
    .from('reservas')
    .insert({
      cliente_id: user.id,
      paseo_id: paseoId,
      disponibilidad_id: disponibilidadId,
      num_personas: numPersonas,
      notas,
      telefono,
      duracion_id: duracionId,
    })

  if (errReserva) return { error: 'Error al guardar la reserva. Intentá de nuevo.' }

  // Obtener datos para los emails
  const [{ data: paseoData }, { data: profile }] = await Promise.all([
    adminClient.from('paseos').select('nombre').eq('id', paseoId).single(),
    adminClient.from('profiles').select('nombre, email').eq('id', user.id).single(),
  ])

  const [anio, mes, dia] = fecha.split('-')
  const fechaFormateada = `${dia} de ${MESES[parseInt(mes) - 1]} de ${anio}`

  try {
    await Promise.all([
      enviarEmailCliente({
        to: profile?.email ?? user.email!,
        nombre: profile?.nombre ?? 'Cliente',
        paseo: paseoData?.nombre ?? 'Paseo',
        fecha: fechaFormateada,
        hora: hora.slice(0, 5),
        personas: numPersonas,
      }),
      enviarEmailAdmin({
        clienteNombre: profile?.nombre ?? 'Cliente',
        clienteEmail: profile?.email ?? user.email!,
        clienteTelefono: telefono,
        paseo: paseoData?.nombre ?? 'Paseo',
        fecha: fechaFormateada,
        hora: hora.slice(0, 5),
        personas: numPersonas,
        notas: notas ?? undefined,
      }),
    ])
  } catch (e) {
    console.error('Error enviando emails:', e)
  }

  revalidatePath('/admin')
  redirect('/?reserva=ok')
}

export async function gestionarSolicitud(reservaId: string, accion: 'aceptada' | 'rechazada', motivo?: string) {
  const adminClient = createAdminClient()

  // Obtener todos los datos necesarios de la reserva
  const { data: reserva } = await adminClient
    .from('reservas')
    .select(`
      id, num_personas, notas, telefono,
      paseos ( nombre ),
      profiles ( nombre, email ),
      disponibilidad ( fecha, hora_inicio ),
      paseo_duraciones ( etiqueta, duracion_minutos, precio )
    `)
    .eq('id', reservaId)
    .single()

  if (!reserva) return { error: 'Reserva no encontrada.' }

  const { error } = await adminClient
    .from('reservas')
    .update({ estado: accion })
    .eq('id', reservaId)

  if (error) return { error: 'Error al actualizar la solicitud.' }

  const perfil = reserva.profiles as { nombre: string; email: string } | null
  const paseo = reserva.paseos as { nombre: string } | null
  const disp = reserva.disponibilidad as { fecha: string; hora_inicio: string } | null
  const dur = reserva.paseo_duraciones as { etiqueta: string; duracion_minutos: number; precio: number } | null

  if (!perfil || !disp) {
    revalidatePath('/admin')
    return { ok: true }
  }

  const [anio, mes, dia] = disp.fecha.split('-')
  const fechaFormateada = `${dia} de ${MESES[parseInt(mes) - 1]} de ${anio}`
  const hora = disp.hora_inicio.slice(0, 5)

  try {
    if (accion === 'aceptada' && dur) {
      const precioTotal = dur.precio
      const precioSenia = precioTotal / 2

      // Crear Stripe Checkout Session para la seña
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(precioSenia * 100),
            product_data: {
              name: `Seña — ${paseo?.nombre ?? 'Paseo'}`,
              description: `50% del paseo del ${fechaFormateada} a las ${hora} (${dur.etiqueta})`,
            },
          },
          quantity: 1,
        }],
        customer_email: perfil.email,
        success_url: `${APP_URL}/?pago=senia_ok`,
        cancel_url: `${APP_URL}/?pago=senia_cancel`,
        metadata: { reserva_id: reservaId, tipo: 'senia' },
      })

      // Guardar el pago en la DB
      await adminClient.from('pagos').insert({
        reserva_id: reservaId,
        stripe_checkout_session_id: session.id,
        monto: precioSenia,
        moneda: 'eur',
        estado: 'pendiente',
        tipo: 'senia',
      })

      await enviarEmailConfirmacion({
        to: perfil.email,
        nombre: perfil.nombre,
        paseo: paseo?.nombre ?? 'Paseo',
        fecha: fechaFormateada,
        hora,
        personas: reserva.num_personas,
        duracion: dur.etiqueta,
        precioTotal,
        precioSenia,
        stripeUrl: session.url!,
      })
    } else if (accion === 'rechazada') {
      await enviarEmailRechazo({
        to: perfil.email,
        nombre: perfil.nombre,
        paseo: paseo?.nombre ?? 'Paseo',
        fecha: fechaFormateada,
        motivo: motivo ?? 'No hay disponibilidad para esa fecha.',
      })
    }
  } catch (e) {
    console.error('[gestionarSolicitud] email/stripe error:', e)
  }

  revalidatePath('/admin')
  return { ok: true }
}

export async function cancelarReserva(reservaId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  // Verificar que la reserva pertenece al usuario y está pendiente
  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, estado, cliente_id')
    .eq('id', reservaId)
    .eq('cliente_id', user.id)
    .single()

  if (!reserva) return { error: 'Reserva no encontrada.' }
  if (reserva.estado !== 'pendiente') return { error: 'Solo se pueden cancelar reservas pendientes.' }

  const { error } = await supabase
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', reservaId)
    .eq('cliente_id', user.id)

  if (error) return { error: 'Error al cancelar la reserva.' }

  revalidatePath('/')
  return { ok: true }
}

export async function editarReserva(reservaId: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const numPersonas = parseInt(formData.get('num_personas') as string)
  const telefono = formData.get('telefono') as string
  const notas = (formData.get('notas') as string) || null

  if (!numPersonas || numPersonas < 1 || numPersonas > 3) {
    return { error: 'El número de personas debe ser entre 1 y 3.' }
  }
  if (!telefono) return { error: 'El teléfono es obligatorio.' }

  // Verificar que la reserva pertenece al usuario y está pendiente
  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, estado, cliente_id')
    .eq('id', reservaId)
    .eq('cliente_id', user.id)
    .single()

  if (!reserva) return { error: 'Reserva no encontrada.' }
  if (reserva.estado !== 'pendiente') return { error: 'Solo se pueden editar reservas pendientes.' }

  const { error } = await supabase
    .from('reservas')
    .update({ num_personas: numPersonas, telefono, notas })
    .eq('id', reservaId)
    .eq('cliente_id', user.id)

  if (error) return { error: 'Error al actualizar la reserva.' }

  revalidatePath('/')
  return { ok: true }
}
