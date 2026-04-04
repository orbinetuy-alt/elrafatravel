'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { registroCliente } from '@/lib/actions/auth'
import { useTranslations } from 'next-intl'

export default function RegistroPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const t = useTranslations('Register')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError(t('passwords_mismatch'))
      setLoading(false)
      return
    }

    const result = await registroCliente(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="El Rafa Travel" width={120} height={120} className="mb-4" />
          <h1 className="text-2xl font-bold text-primary uppercase tracking-widest">El Rafa Travel</h1>
          <p className="text-primary-light text-sm mt-1">{t('subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-primary mb-1">
                {t('full_name')}
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Tu nombre"
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-primary mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tucorreo@email.com"
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-primary mb-1">
                {t('confirm_password')}
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                placeholder="Repite tu contraseña"
                className="w-full border border-beige-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

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
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('have_account')}{' '}
            <Link href="/login" className="text-secondary font-semibold hover:underline">
              {t('login_link')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
