'use client'

import { useState, useEffect } from 'react'
import { getCarousel, loadCarouselImageUrls } from '@/lib/carousel-actions'
import { CarouselRenderer } from './carousel/CarouselRenderer'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/types'

interface CarouselSectionProps {
  carouselId: string
  theme?: UserProfile['theme']
}

export function CarouselSection({ carouselId, theme }: CarouselSectionProps) {
  const [carousel, setCarousel] = useState<any>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCarousel()
  }, [carouselId])

  const loadCarousel = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Cargar el carrusel
      const carouselData = await getCarousel(carouselId)
      
      if (!carouselData) {
        setError('Carrusel no encontrado')
        return
      }

      setCarousel(carouselData)

      // Cargar URLs de las imágenes
      const urls = await loadCarouselImageUrls(carouselData.imageFileIds)
      setImageUrls(urls)
    } catch (err) {
      console.error('Error cargando carrusel:', err)
      setError('Error al cargar el carrusel')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !carousel) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Carrusel no encontrado'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full">
      {carousel.description && (
        <p className="text-sm text-muted-foreground mb-4">{carousel.description}</p>
      )}
      <CarouselRenderer carousel={carousel} theme={theme} imageUrls={imageUrls} />
    </div>
  )
}


