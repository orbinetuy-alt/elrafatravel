'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GaleriaFotosProps {
  imagenes: string[]
  nombre: string
}

export default function GaleriaFotos({ imagenes, nombre }: GaleriaFotosProps) {
  const [idx, setIdx] = useState(0)

  if (imagenes.length === 0) {
    return (
      <div className="w-full h-72 bg-beige rounded-2xl flex items-center justify-center text-6xl">
        🗺️
      </div>
    )
  }

  const prev = () => setIdx(i => (i - 1 + imagenes.length) % imagenes.length)
  const next = () => setIdx(i => (i + 1) % imagenes.length)

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-beige">
        <Image
          src={imagenes[idx]}
          alt={`${nombre} - foto ${idx + 1}`}
          fill
          className="object-cover"
        />
        {imagenes.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition"
            >
              <ChevronLeft size={18} className="text-primary" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition"
            >
              <ChevronRight size={18} className="text-primary" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {idx + 1} / {imagenes.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imagenes.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === idx ? 'border-primary' : 'border-transparent hover:border-beige-dark'
              }`}
            >
              <Image src={url} alt={`Miniatura ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
