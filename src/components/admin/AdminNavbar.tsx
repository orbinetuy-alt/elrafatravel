'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAdmin } from '@/lib/actions/auth'
import { LogOut } from 'lucide-react'

interface AdminNavbarProps {
  profile: {
    nombre: string
    email: string
    rol: string
    avatar_url: string | null
  }
}

export default function AdminNavbar({ profile }: AdminNavbarProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/admin', label: 'Inicio' },
    { href: '/admin/agenda', label: 'Agenda' },
    { href: '/admin/finanzas', label: 'Finanzas' },
    { href: '/admin/paseos', label: 'Paseos' },
  ]

  return (
    <header className="bg-white border-b border-beige-dark shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Izquierda: logo + nombre empresa */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="El Rafa Travel" width={44} height={44} className="rounded-full object-cover" />
          <span className="text-primary font-bold text-lg uppercase tracking-widest hidden sm:block">
            Elrafatravel
          </span>
        </div>

        {/* Centro: navegación */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-primary-light hover:bg-beige hover:text-primary'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-primary">{profile.email}</p>
            <p className="text-xs text-secondary font-bold uppercase tracking-wider">{profile.rol} · {profile.nombre}</p>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm uppercase">
            {profile.nombre?.charAt(0) ?? 'A'}
          </div>

          {/* Logout */}
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="ml-2 p-2 rounded-lg hover:bg-beige transition text-primary-light hover:text-primary"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>

      </div>
    </header>
  )
}
