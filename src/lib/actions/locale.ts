'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setLocale(locale: string) {
  const validLocale = ['es', 'en'].includes(locale) ? locale : 'es'
  const cookieStore = await cookies()
  cookieStore.set('locale', validLocale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
