'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useState, useTransition } from 'react'
import { logout } from '@/lib/actions/auth'
import { setLocale } from '@/lib/actions/locale'
import { useTranslations, useLocale } from 'next-intl'

interface NavbarProps {
  user?: { email: string; nombre?: string } | null
  extraLinks?: { href: string; label: string }[]
}

function LanguageSwitcher() {
  const locale = useLocale()
  const [, startTransition] = useTransition()

  function handleChange(newLocale: string) {
    startTransition(async () => {
      await setLocale(newLocale)
    })
  }

  return (
    <div className="flex items-center gap-1 border border-beige-dark rounded-lg overflow-hidden text-xs font-bold">
      <button
        onClick={() => handleChange('es')}
        className={`px-2.5 py-1.5 transition ${locale === 'es' ? 'bg-primary text-white' : 'text-primary-light hover:bg-beige'}`}
      >
        ES
      </button>
      <button
        onClick={() => handleChange('en')}
        className={`px-2.5 py-1.5 transition ${locale === 'en' ? 'bg-primary text-white' : 'text-primary-light hover:bg-beige'}`}
      >
        EN
      </button>
    </div>
  )
}

export default function Navbar({ user, extraLinks }: NavbarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const t = useTranslations('Nav')

  const baseLinks = [{ href: '/', label: t('home') }]
  const allLinks = extraLinks ? [...baseLinks, ...extraLinks] : baseLinks

  return (
    <header className="bg-white border-b border-beige-dark shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="El Rafa Travel" width={40} height={40} className="rounded-full object-cover" />
          <span className="text-primary font-bold text-base uppercase tracking-widest hidden sm:block">
            Elrafatravel
          </span>
        </Link>

        {/* Nav centro - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {allLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === href
                  ? 'bg-primary text-white'
                  : 'text-primary-light hover:bg-beige hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Acciones - desktop */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <span className="text-sm text-primary-light font-medium border border-beige-dark rounded-lg px-4 py-2 max-w-50 truncate">
                {user.email}
              </span>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                  title={t('logout')}
                >
                  <LogOut size={15} />
                  <span className="hidden lg:inline">{t('logout')}</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-primary px-4 py-2 rounded-lg hover:bg-beige transition"
              >
                {t('login')}
              </Link>
              <Link
                href="/registro"
                className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-light transition"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

        {/* Burger - mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-beige transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-primary" />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-beige-dark bg-white px-6 py-4 flex flex-col gap-2">
          {allLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-primary py-2"
            >
              {label}
            </Link>
          ))}
          <hr className="border-beige-dark my-1" />
          <div className="py-1"><LanguageSwitcher /></div>
          <hr className="border-beige-dark my-1" />
          {user ? (
            <>
              <span className="text-sm text-primary-light font-medium py-2 truncate">{user.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm font-semibold text-red-500 py-2"
                >
                  <LogOut size={15} /> {t('logout_mobile')}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-semibold text-primary py-2">
                {t('login')}
              </Link>
              <Link href="/registro" onClick={() => setOpen(false)} className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg text-center">
                {t('register')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}


interface NavbarProps {
  user?: { email: string; nombre?: string } | null
  extraLinks?: { href: string; label: string }[]
}

export default function Navbar({ user, extraLinks }: NavbarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const baseLinks = [{ href: '/', label: 'Inicio' }]
  const allLinks = extraLinks ? [...baseLinks, ...extraLinks] : baseLinks

  return (
    <header className="bg-white border-b border-beige-dark shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="El Rafa Travel" width={40} height={40} className="rounded-full object-cover" />
          <span className="text-primary font-bold text-base uppercase tracking-widest hidden sm:block">
            Elrafatravel
          </span>
        </Link>

        {/* Nav centro - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {allLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === href
                  ? 'bg-primary text-white'
                  : 'text-primary-light hover:bg-beige hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Acciones - desktop */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-primary-light font-medium border border-beige-dark rounded-lg px-4 py-2 max-w-50 truncate">
                {user.email}
              </span>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <LogOut size={15} />
                  <span className="hidden lg:inline">Salir</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-primary px-4 py-2 rounded-lg hover:bg-beige transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-light transition"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Burger - mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-beige transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-primary" />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-beige-dark bg-white px-6 py-4 flex flex-col gap-2">
          {allLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-primary py-2"
            >
              {label}
            </Link>
          ))}
          <hr className="border-beige-dark my-1" />
          {user ? (
            <>
              <span className="text-sm text-primary-light font-medium py-2 truncate">{user.email}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm font-semibold text-red-500 py-2"
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-semibold text-primary py-2">
                Iniciar sesión
              </Link>
              <Link href="/registro" onClick={() => setOpen(false)} className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg text-center">
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
