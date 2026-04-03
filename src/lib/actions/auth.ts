'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginCliente(formData: FormData) {
  const supabase = await createClient()

  const rawRedirect = formData.get('redirect_to') as string | null
  // Solo permitir rutas relativas internas (previene open redirect)
  const redirectTo =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/'

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  redirect(redirectTo)
}

export async function loginAdmin(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error || !data.user) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  // Verificar rol usando service_role (bypasea RLS)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('rol')
    .eq('id', data.user.id)
    .single()

  if (!profile || profile.rol !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'No tienes permisos de administrador.' }
  }

  redirect('/admin')
}

export async function registroCliente(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, rol: 'cliente' },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email ya está registrado.' }
    }
    return { error: 'Error al crear la cuenta. Inténtalo de nuevo.' }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function logoutAdmin() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
