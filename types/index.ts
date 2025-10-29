export interface UserProfile {
  uid: string
  username: string
  displayName: string
  email: string
  bio: string
  avatarUrl: string
  bannerUrl?: string
  theme?: {
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Link {
  id: string
  userId: string
  title: string
  url: string
  description?: string
  icon?: string
  type: "external" | "internal"
  order: number
  isActive: boolean
  sectionId?: string
  createdAt: string
  updatedAt: string
}

export type CarouselType = 'horizontal' | 'grid' | 'masonry' | 'card'

export interface Carousel {
  id: string
  userId: string
  name: string
  description?: string
  type: CarouselType
  imageFileIds: string[] // IDs de ControlFile
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Section {
  id: string
  userId: string
  title: string
  description?: string
  type?: 'links' | 'carousel' // Nuevo campo
  carouselId?: string // Referencia al carrusel
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GalleryLayout {
  id: string
  userId: string
  items: GalleryLayoutItem[]
  settings: {
    gridSize: number // Tamaño base del grid (ej: 100px)
    gap: number // Espacio entre elementos
    columns: number // Número de columnas
  }
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface GalleryLayoutItem {
  fileId: string // ID del archivo en ControlFile
  x: number // Posición en el grid (columnas)
  y: number // Posición en el grid (filas)
  width: number // Ancho en unidades de grid
  height: number // Alto en unidades de grid
  zIndex: number // Orden de capas
  aspectRatio: string // '16:9', '9:16', '1:1', etc.
  effects?: {
    borderRadius?: number
    shadow?: boolean
    rotation?: number
  }
}
