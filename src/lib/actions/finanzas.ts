'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearEgreso(prevState: unknown, formData: FormData) {
  const adminClient = createAdminClient()

  const descripcion = (formData.get('descripcion') as string)?.trim()
  const monto = parseFloat(formData.get('monto') as string)
  const fecha = formData.get('fecha') as string
  const categoria = formData.get('categoria') as string

  if (!descripcion || isNaN(monto) || monto <= 0 || !fecha || !categoria) {
    return { error: 'Todos los campos son requeridos.' }
  }

  const { error } = await adminClient.from('egresos').insert({
    descripcion,
    monto,
    fecha,
    categoria,
  })

  if (error) return { error: 'Error al guardar el egreso.' }

  revalidatePath('/admin/finanzas')
  return { ok: true }
}

export async function eliminarEgreso(id: string) {
  const adminClient = createAdminClient()
  await adminClient.from('egresos').delete().eq('id', id)
  revalidatePath('/admin/finanzas')
}
