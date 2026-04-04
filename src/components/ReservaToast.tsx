'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ReservaToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('Toast')
  const [toast, setToast] = useState<{ message: string; icon: React.ReactNode; bg: string } | null>(null)

  useEffect(() => {
    const reserva = searchParams.get('reserva')
    const pago = searchParams.get('pago')

    type ToastKey = 'booking_ok' | 'senia_ok' | 'final_ok' | 'senia_cancel' | 'final_cancel'

    const CONFIGS: Record<string, { key: ToastKey; bg: string; success: boolean }> = {
      'reserva=ok':       { key: 'booking_ok',    bg: 'bg-primary',     success: true  },
      'pago=senia_ok':    { key: 'senia_ok',      bg: 'bg-green-600',   success: true  },
      'pago=final_ok':    { key: 'final_ok',      bg: 'bg-emerald-600', success: true  },
      'pago=senia_cancel':{ key: 'senia_cancel',  bg: 'bg-amber-500',   success: false },
      'pago=final_cancel':{ key: 'final_cancel',  bg: 'bg-amber-500',   success: false },
    }

    let key: string | null = null
    if (reserva) key = `reserva=${reserva}`
    else if (pago) key = `pago=${pago}`

    if (key && CONFIGS[key]) {
      const cfg = CONFIGS[key]
      setToast({
        message: t(cfg.key),
        icon: cfg.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />,
        bg: cfg.bg,
      })
      router.replace('/', { scroll: false })
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router, t])

  if (!toast) return null

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 ${toast.bg} text-white px-6 py-4 rounded-2xl shadow-xl`}>
      {toast.icon}
      <p className="font-semibold text-sm">{toast.message}</p>
    </div>
  )
}
