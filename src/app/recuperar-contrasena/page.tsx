'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { solicitarRecuperacion } from '@/lib/actions/auth'
import { useTranslations } from 'next-intl'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function RecuperarContrasenaPage() {
  const t = useTranslations('Recovery')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await solicitarRecuperacion(formData)
    if ((result as any)?.error) {
      setError((result as any).error)
      setLoading(false)
    } else {
      setSent(true)
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
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-primary font-bold text-lg mb-2">{t('success_title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('success_desc')}</p>
              <Link
                href="/login"
                className="text-sm font-semibold text-secondary hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} />
                {t('back_to_login')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-primary mb-1">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tucorreo@email.com"
                    className="w-full border border-beige-dark rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                  />
                </div>
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

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-primary flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} />
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
