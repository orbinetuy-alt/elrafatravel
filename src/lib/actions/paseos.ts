'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type DuracionInput = {
  id?: string
  etiqueta: string
  duracion_minutos: number
  precio: number
}

type PrecioPersonaInput = {
  id?: string
  min_personas: number
  max_personas: number
  precio: number
}

async function uploadImagen(adminClient: ReturnType<typeof createAdminClient>, file: File): Promise<string | null> {
  await adminClient.storage.createBucket('paseos-imagenes', { public: true }).catch(() => {})
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}.${ext}`
  const { error: uploadError, data: uploadData } = await adminClient.storage
    .from('paseos-imagenes')
    .upload(fileName, file, { contentType: file.type })
  if (uploadError || !uploadData) { console.error('[uploadImagen]', uploadError); return null }
  const { data: urlData } = adminClient.storage.from('paseos-imagenes').getPublicUrl(fileName)
  return urlData.publicUrl
}

export async function crearPaseo(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.rol !== 'admin') return { error: 'No autorizado.' }

  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const ubicacion = formData.get('ubicacion') as string
  const modalidad = formData.get('modalidad') as string
  const tipo = (formData.get('tipo') as string) || 'tuk_tuk'
  const hora_salida = (formData.get('hora_salida') as string) || null
  const imagenFile = formData.get('imagen') as File | null
  const duracionesRaw = formData.get('duraciones') as string
  const preciosPersonaRaw = formData.get('precios_persona') as string

  let duraciones: DuracionInput[] = []
  try { duraciones = JSON.parse(duracionesRaw) } catch { return { error: 'Error en las opciones de duración.' } }

  let preciosPersona: PrecioPersonaInput[] = []
  try { preciosPersona = JSON.parse(preciosPersonaRaw) } catch { return { error: 'Error en los precios por persona.' } }

  let imagen_url: string | null = null
  if (imagenFile && imagenFile.size > 0) {
    imagen_url = await uploadImagen(adminClient, imagenFile)
  }

  const { data: paseo, error } = await adminClient.from('paseos').insert({
    nombre,
    descripcion,
    imagen_url,
    ubicacion,
    modalidad,
    tipo,
    activo: true,
  }).select('id').single()

  if (error || !paseo) {
    console.error('[crearPaseo]', error)
    return { error: `Error al crear el paseo: ${error?.message}` }
  }

  if (tipo === 'tuk_tuk' && duraciones.length > 0) {
    const { error: errDur } = await adminClient.from('paseo_duraciones').insert(
      duraciones.map(d => ({
        paseo_id: paseo.id,
        etiqueta: d.etiqueta,
        duracion_minutos: d.duracion_minutos,
        precio: d.precio,
      }))
    )
    if (errDur) {
      console.error('[crearPaseo] duraciones:', errDur)
      return { error: `Error al guardar las duraciones: ${errDur.message}` }
    }
  }

  if (tipo === 'excursion' && preciosPersona.length > 0) {
    const { error: errPP } = await adminClient.from('paseo_precios_persona').insert(
      preciosPersona.map(p => ({
        paseo_id: paseo.id,
        min_personas: p.min_personas,
        max_personas: p.max_personas,
        precio: p.precio,
      }))
    )
    if (errPP) {
      console.error('[crearPaseo] precios_persona:', errPP)
      return { error: `Error al guardar los precios por persona: ${errPP.message}` }
    }
  }

  revalidatePath('/admin/paseos')
  redirect('/admin/paseos')
}

export async function editarPaseo(id: string, formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.rol !== 'admin') return { error: 'No autorizado.' }

  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const ubicacion = formData.get('ubicacion') as string
  const modalidad = formData.get('modalidad') as string
  const tipo = (formData.get('tipo') as string) || 'tuk_tuk'
  const imagenFile = formData.get('imagen') as File | null
  const imagenActual = formData.get('imagen_actual') as string | null
  const duracionesRaw = formData.get('duraciones') as string
  const preciosPersonaRaw = formData.get('precios_persona') as string

  let duraciones: DuracionInput[] = []
  try { duraciones = JSON.parse(duracionesRaw) } catch { return { error: 'Error en las opciones de duración.' } }

  let preciosPersona: PrecioPersonaInput[] = []
  try { preciosPersona = JSON.parse(preciosPersonaRaw) } catch { return { error: 'Error en los precios por persona.' } }

  let imagen_url: string | null = imagenActual
  if (imagenFile && imagenFile.size > 0) {
    imagen_url = await uploadImagen(adminClient, imagenFile)
  }

  const { error } = await adminClient
    .from('paseos')
    .update({ nombre, descripcion, imagen_url, ubicacion, modalidad, tipo })
    .eq('id', id)

  if (error) {
    console.error('[editarPaseo]', error)
    return { error: `Error al actualizar el paseo: ${error.message}` }
  }

  if (tipo === 'tuk_tuk') {
    // Estrategia: borrar las que ya no están (por id), insertar las nuevas, actualizar las existentes
    const existentes = duraciones.filter(d => d.id)
    const nuevas = duraciones.filter(d => !d.id)
    const idsExistentes = existentes.map(d => d.id!)

    await adminClient
      .from('paseo_duraciones')
      .delete()
      .eq('paseo_id', id)
      .not('id', 'in', `(${idsExistentes.length > 0 ? idsExistentes.join(',') : '00000000-0000-0000-0000-000000000000'})`)

    for (const d of existentes) {
      await adminClient.from('paseo_duraciones').update({
        etiqueta: d.etiqueta,
        duracion_minutos: d.duracion_minutos,
        precio: d.precio,
      }).eq('id', d.id!)
    }

    if (nuevas.length > 0) {
      await adminClient.from('paseo_duraciones').insert(
        nuevas.map(d => ({
          paseo_id: id,
          etiqueta: d.etiqueta,
          duracion_minutos: d.duracion_minutos,
          precio: d.precio,
        }))
      )
    }

    // Limpiar precios persona si el tipo cambió
    await adminClient.from('paseo_precios_persona').delete().eq('paseo_id', id)
  }

  if (tipo === 'excursion') {
    const existentesPP = preciosPersona.filter(p => p.id)
    const nuevasPP = preciosPersona.filter(p => !p.id)
    const idsExistentesPP = existentesPP.map(p => p.id!)

    await adminClient
      .from('paseo_precios_persona')
      .delete()
      .eq('paseo_id', id)
      .not('id', 'in', `(${idsExistentesPP.length > 0 ? idsExistentesPP.join(',') : '00000000-0000-0000-0000-000000000000'})`)

    for (const p of existentesPP) {
      await adminClient.from('paseo_precios_persona').update({
        min_personas: p.min_personas,
        max_personas: p.max_personas,
        precio: p.precio,
      }).eq('id', p.id!)
    }

    if (nuevasPP.length > 0) {
      await adminClient.from('paseo_precios_persona').insert(
        nuevasPP.map(p => ({
          paseo_id: id,
          min_personas: p.min_personas,
          max_personas: p.max_personas,
          precio: p.precio,
        }))
      )
    }

    // Limpiar duraciones si el tipo cambió
    await adminClient.from('paseo_duraciones').delete().eq('paseo_id', id)
  }

  revalidatePath('/admin/paseos')
  redirect('/admin/paseos')
}

export async function toggleActivoPaseo(id: string, activo: boolean) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('paseos')
    .update({ activo: !activo })
    .eq('id', id)

  if (error) return { error: 'Error al actualizar el estado.' }

  revalidatePath('/admin/paseos')
  return { ok: true }
}

export async function eliminarPaseo(id: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('paseos').delete().eq('id', id)

  if (error) return { error: 'Error al eliminar el paseo.' }

  revalidatePath('/admin/paseos')
  return { ok: true }
}

