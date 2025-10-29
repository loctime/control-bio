'use client'

import Image from 'next/image'
import type { UserProfile } from '@/types'

interface MasonryCarouselProps {
  imageUrls: string[]
  theme?: UserProfile['theme']
}

export function MasonryCarousel({ imageUrls, theme }: MasonryCarouselProps) {
  // Dividir las imágenes en columnas (3 columnas)
  const columns = 3
  const columnHeights = Array(columns).fill(0)
  const imageColumns = imageUrls.map((url, index) => {
    // Asignar cada imagen a la columna con menor altura
    const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
    columnHeights[shortestColumn] += 1
    return { url, column: shortestColumn, index }
  })

  return (
    <div className="w-full">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
        {imageUrls.map((url, index) => (
          <div key={index} className="mb-4 break-inside-avoid">
            <div className="relative w-full rounded-lg overflow-hidden bg-muted">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


