'use client'

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Image from 'next/image'
import type { UserProfile } from '@/types'

interface CardCarouselProps {
  imageUrls: string[]
  theme?: UserProfile['theme']
}

export function CardCarousel({ imageUrls, theme }: CardCarouselProps) {
  return (
    <div className="w-full">
      <Carousel className="w-full" opts={{ align: 'start' }}>
        <CarouselContent>
          {imageUrls.map((url, index) => (
            <CarouselItem key={index} className="basis-full">
              <div className="p-2">
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted shadow-lg">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm font-medium">
                      Imagen {index + 1} de {imageUrls.length}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}


