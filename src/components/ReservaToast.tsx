'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function ReservaToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('reserva') === 'ok') {
      setVisible(true)
      router.replace('/', { scroll: false })
      const timer = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-2xl shadow-xl">
      <CheckCircle size={20} />
      <p className="font-semibold text-sm">¡Solicitud enviada correctamente!</p>
    </div>
  )
}
