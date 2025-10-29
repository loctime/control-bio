'use client'

import { HorizontalCarousel } from './HorizontalCarousel'
import { GridCarousel } from './GridCarousel'
import { MasonryCarousel } from './MasonryCarousel'
import { CardCarousel } from './CardCarousel'
import type { Carousel, UserProfile } from '@/types'

interface CarouselRendererProps {
  carousel: Carousel
  theme?: UserProfile['theme']
  imageUrls: Record<string, string>
}

export function CarouselRenderer({ carousel, theme, imageUrls }: CarouselRendererProps) {
  // Convertir el objeto de URLs a un array en el orden correcto
  const orderedUrls = carousel.imageFileIds
    .map(fileId => imageUrls[fileId])
    .filter(url => url) // Filtrar URLs que no estén disponibles

  if (orderedUrls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay imágenes disponibles para mostrar</p>
      </div>
    )
  }

  switch (carousel.type) {
    case 'horizontal':
      return <HorizontalCarousel imageUrls={orderedUrls} theme={theme} />
    case 'grid':
      return <GridCarousel imageUrls={orderedUrls} theme={theme} />
    case 'masonry':
      return <MasonryCarousel imageUrls={orderedUrls} theme={theme} />
    case 'card':
      return <CardCarousel imageUrls={orderedUrls} theme={theme} />
    default:
      return <HorizontalCarousel imageUrls={orderedUrls} theme={theme} />
  }
}


