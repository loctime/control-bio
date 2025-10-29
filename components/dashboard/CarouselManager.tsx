'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CarouselDialog } from './CarouselDialog'
import { deleteCarousel, duplicateCarousel, loadCarouselImageUrls } from '@/lib/carousel-actions'
import { getCarouselTypeIcon, getCarouselTypeName } from '@/lib/carousel-utils'
import type { Carousel } from '@/types'
import { Plus, Pencil, Trash2, Copy, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'

interface CarouselManagerProps {
  carousels: Carousel[]
  userId: string
  onRefresh: () => void
}

export function CarouselManager({ carousels, userId, onRefresh }: CarouselManagerProps) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCarousel, setEditingCarousel] = useState<Carousel | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (carousel: Carousel) => {
    setEditingCarousel(carousel)
    setDialogOpen(true)
  }

  const handleDelete = async (carouselId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este carrusel?')) {
      return
    }

    setDeletingId(carouselId)
    try {
      await deleteCarousel(carouselId)
      toast({
        title: 'Carrusel eliminado',
        description: 'El carrusel se ha eliminado correctamente',
      })
      onRefresh()
    } catch (error) {
      console.error('Error eliminando carrusel:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el carrusel',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (carouselId: string) => {
    try {
      await duplicateCarousel(carouselId, userId)
      toast({
        title: 'Carrusel duplicado',
        description: 'El carrusel se ha duplicado correctamente',
      })
      onRefresh()
    } catch (error) {
      console.error('Error duplicando carrusel:', error)
      toast({
        title: 'Error',
        description: 'No se pudo duplicar el carrusel',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCarousel(null)
  }

  if (carousels.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No hay carruseles</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crea tu primer carrusel para mostrar imágenes en tu perfil
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Carrusel
        </Button>

        <CarouselDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          editingCarousel={editingCarousel}
          userId={userId}
          onSuccess={() => {
            onRefresh()
            handleDialogClose()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tus Carruseles</h3>
          <p className="text-sm text-muted-foreground">
            {carousels.length} {carousels.length === 1 ? 'carrusel' : 'carruseles'}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Carrusel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {carousels.map((carousel) => (
          <Card key={carousel.id} className="relative hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getCarouselTypeIcon(carousel.type)}</span>
                    <h4 className="font-semibold">{carousel.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getCarouselTypeName(carousel.type)}
                  </p>
                  {carousel.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {carousel.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(carousel)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicate(carousel.id)}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(carousel.id)}
                    disabled={deletingId === carousel.id}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    {deletingId === carousel.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {carousel.imageFileIds.slice(0, 8).map((fileId, index) => (
                  <div
                    key={fileId}
                    className="aspect-square bg-muted rounded-md flex items-center justify-center"
                  >
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {carousel.imageFileIds.length > 8 && (
                  <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                    +{carousel.imageFileIds.length - 8}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {carousel.imageFileIds.length} {carousel.imageFileIds.length === 1 ? 'imagen' : 'imágenes'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CarouselDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingCarousel={editingCarousel}
        userId={userId}
        onSuccess={() => {
          onRefresh()
          handleDialogClose()
        }}
      />
    </div>
  )
}


