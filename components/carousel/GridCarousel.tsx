'use client'

import Image from 'next/image'
import type { UserProfile } from '@/types'

interface GridCarouselProps {
  imageUrls: string[]
  theme?: UserProfile['theme']
}

export function GridCarousel({ imageUrls, theme }: GridCarouselProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2">
        {imageUrls.slice(0, 9).map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 300px"
            />
          </div>
        ))}
      </div>
      {imageUrls.length > 9 && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Mostrando 9 de {imageUrls.length} imágenes
        </p>
      )}
    </div>
  )
}


