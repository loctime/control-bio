'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ImageSelector } from './ImageSelector'
import { CAROUSEL_TYPES } from '@/lib/carousel-utils'
import { uploadFile } from '@/lib/controlfile-client'
import { createCarousel, updateCarousel } from '@/lib/carousel-actions'
import type { Carousel, CarouselType } from '@/types'
import { GripVertical, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCarousel?: Carousel | null
  userId: string
  preselectedImages?: string[] // Imágenes preseleccionadas desde la galería
  onSuccess: () => void
}

type Step = 'details' | 'select' | 'order'

export function CarouselDialog({ open, onOpenChange, editingCarousel, userId, preselectedImages, onSuccess }: CarouselDialogProps) {
  const [step, setStep] = useState<Step>('details')
  const [saving, setSaving] = useState(false)
  
  // Step 1: Details
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CarouselType>('horizontal')
  
  // Step 2: Images
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  
  // Step 3: Order
  const [orderedImages, setOrderedImages] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (editingCarousel) {
      setName(editingCarousel.name)
      setDescription(editingCarousel.description || '')
      setType(editingCarousel.type)
      setSelectedImages(editingCarousel.imageFileIds)
      setOrderedImages(editingCarousel.imageFileIds)
    } else if (preselectedImages && preselectedImages.length > 0) {
      // Si hay imágenes preseleccionadas desde la galería, usar esas
      setSelectedImages(preselectedImages)
      setOrderedImages(preselectedImages)
      setStep('order') // Saltar directamente al paso de ordenar
    } else {
      resetForm()
    }
  }, [editingCarousel, preselectedImages, open])

  const resetForm = () => {
    setStep('details')
    setName('')
    setDescription('')
    setType('horizontal')
    setSelectedImages([])
    setOrderedImages([])
  }

  const handleNext = () => {
    if (step === 'details') {
      if (!name.trim()) {
        alert('Por favor ingresa un nombre para el carrusel')
        return
      }
      setStep('select')
    } else if (step === 'select') {
      if (selectedImages.length === 0) {
        alert('Por favor selecciona al menos una imagen')
        return
      }
      setOrderedImages([...selectedImages])
      setStep('order')
    }
  }

  const handleBack = () => {
    if (step === 'select') {
      setStep('details')
    } else if (step === 'order') {
      setStep('select')
    }
  }

  const handleSave = async () => {
    if (!name.trim() || orderedImages.length === 0) return

    setSaving(true)
    try {
      const carouselData = {
        userId,
        name,
        description,
        type,
        imageFileIds: orderedImages,
        order: 0,
        isActive: true,
      }

      if (editingCarousel) {
        await updateCarousel(editingCarousel.id, carouselData)
      } else {
        await createCarousel(carouselData)
      }

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error guardando carrusel:', error)
      alert('Error al guardar el carrusel')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadImages = async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        const fileId = await uploadFile(file, null)
        setSelectedImages(prev => [...prev, fileId])
      }
    } catch (error) {
      console.error('Error subiendo imágenes:', error)
      alert('Error al subir las imágenes')
    } finally {
      setUploading(false)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newOrder = [...orderedImages]
    const draggedItem = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, draggedItem)

    setOrderedImages(newOrder)
    setDraggedIndex(null)
  }

  const removeImage = (imageId: string) => {
    setOrderedImages(prev => prev.filter(id => id !== imageId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingCarousel ? 'Editar Carrusel' : 'Nuevo Carrusel'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' && 'Define el nombre y tipo de tu carrusel'}
            {step === 'select' && 'Selecciona las imágenes que quieres incluir'}
            {step === 'order' && 'Ordena las imágenes arrastrándolas'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del carrusel</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Mis Proyectos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del carrusel"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de carrusel</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CAROUSEL_TYPES.map((carouselType) => (
                    <Card
                      key={carouselType.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        type === carouselType.id ? 'border-primary border-2' : ''
                      }`}
                      onClick={() => setType(carouselType.id)}
                    >
                      <CardContent className="p-4">
                        <div className="text-3xl mb-2 text-center">{carouselType.icon}</div>
                        <h3 className="font-medium text-sm">{carouselType.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {carouselType.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Images */}
          {step === 'select' && (
            <ImageSelector
              selectedImages={selectedImages}
              onSelectionChange={setSelectedImages}
              onUpload={handleUploadImages}
            />
          )}

          {/* Step 3: Order Images */}
          {step === 'order' && (
            <div className="space-y-4">
              {/* Mostrar formulario si hay imágenes preseleccionadas (desde la galería) */}
              {preselectedImages && preselectedImages.length > 0 && !editingCarousel && (
                <div className="space-y-4 p-4 border rounded-lg mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del carrusel</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Mis Proyectos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descripción del carrusel"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de carrusel</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAROUSEL_TYPES.map((carouselType) => (
                        <Card
                          key={carouselType.id}
                          className={`cursor-pointer transition-all hover:border-primary ${
                            type === carouselType.id ? 'border-primary border-2' : ''
                          }`}
                          onClick={() => setType(carouselType.id)}
                        >
                          <CardContent className="p-4">
                            <div className="text-3xl mb-2 text-center">{carouselType.icon}</div>
                            <h3 className="font-medium text-sm">{carouselType.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {carouselType.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Arrastra las imágenes para reordenarlas
              </p>
              <div className="grid grid-cols-4 gap-3">
                {orderedImages.map((imageId, index) => (
                  <div
                    key={imageId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className="relative group cursor-move"
                  >
                    <Card className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <GripVertical className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-xs">Imagen {index + 1}</p>
                      </div>
                    </Card>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(imageId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {step !== 'details' && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step !== 'order' && (
              <Button onClick={handleNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === 'order' && (
              <Button 
                onClick={handleSave} 
                disabled={saving || orderedImages.length === 0 || !name.trim()}
              >
                {saving ? 'Guardando...' : editingCarousel ? 'Actualizar' : 'Crear'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

