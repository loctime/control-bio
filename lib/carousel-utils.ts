import type { CarouselType } from '@/types'

export const CAROUSEL_TYPES = [
  {
    id: 'horizontal' as CarouselType,
    name: 'Carrusel Horizontal',
    description: 'Desliza horizontalmente',
    icon: '→',
  },
  {
    id: 'grid' as CarouselType,
    name: 'Grid 3x3',
    description: 'Muestra imágenes en grid',
    icon: '⊞',
  },
  {
    id: 'masonry' as CarouselType,
    name: 'Masonry',
    description: 'Layout tipo Pinterest',
    icon: '▤',
  },
  {
    id: 'card' as CarouselType,
    name: 'Cards',
    description: 'Tarjetas con navegación',
    icon: '☐',
  },
]

export function getCarouselTypeIcon(type: CarouselType): string {
  const carouselType = CAROUSEL_TYPES.find(t => t.id === type)
  return carouselType?.icon || '○'
}

export function getCarouselTypeDescription(type: CarouselType): string {
  const carouselType = CAROUSEL_TYPES.find(t => t.id === type)
  return carouselType?.description || ''
}

export function getCarouselTypeName(type: CarouselType): string {
  const carouselType = CAROUSEL_TYPES.find(t => t.id === type)
  return carouselType?.name || 'Carrusel'
}


