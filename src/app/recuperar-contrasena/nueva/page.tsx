'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { actualizarContrasena } from '@/lib/actions/auth'
import { useTranslations } from 'next-intl'
import { CheckCircle } from 'lucide-react'

export default function NuevaContrasenaPage() {
  const t = useTranslations('NewPassword')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mismatch, setMismatch] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMismatch(false)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string

    if (password !== confirm) {
      setMismatch(true)
      return
    }

    setLoading(true)
    const result = await actualizarContrasena(formData)
    if ((result as any)?.error) {
      setError((result as any).error)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="El Rafa Travel" width={120} height={120} className="mb-4" />
          <h1 className="text-2xl font-bold text-primary uppercase tracking-widest">El Rafa Travel</h1>
          <p className="text-primary-light text-sm mt-1">{t('subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-primary font-bold text-lg mb-2">{t('success_title')}</h2>
              <p className="text-gray-500 text-sm">{t('success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-primary mb-1">
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-semibold text-primary mb-1">
                  {t('confirm_password')}
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              {mismatch && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{t('passwords_mismatch')}</p>
              )}
              {error && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-primary-light transition disabled:opacity-60"
              >
                {loading ? t('submitting') : t('submit')}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-primary">
                  {t('back_to_login')}
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
