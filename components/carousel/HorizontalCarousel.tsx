'use client'

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Image from 'next/image'
import type { UserProfile } from '@/types'

interface HorizontalCarouselProps {
  imageUrls: string[]
  theme?: UserProfile['theme']
}

export function HorizontalCarousel({ imageUrls, theme }: HorizontalCarouselProps) {
  return (
    <div className="w-full">
      <Carousel className="w-full">
        <CarouselContent>
          {imageUrls.map((url, index) => (
            <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
              <div className="p-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
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


