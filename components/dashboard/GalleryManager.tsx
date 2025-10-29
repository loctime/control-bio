'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CarouselDialog } from './CarouselDialog'
import { listFiles, uploadFile, getDownloadUrl, ensureFolderExists, getControlBioFolder } from '@/lib/controlfile-client'
import { createCarousel } from '@/lib/carousel-actions'
import { GripVertical, Upload, Trash2, Image as ImageIcon, Plus, X, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'
import type { Carousel } from '@/types'
import { useAuth } from '@/lib/auth-context'

interface GalleryItem {
  id: string
  fileId: string
  name: string
  mime?: string
  url?: string
}

interface GalleryManagerProps {
  userId: string
  carousels: Carousel[]
  onRefresh: () => void
}

export function GalleryManager({ userId, carousels, onRefresh }: GalleryManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showCarouselDialog, setShowCarouselDialog] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadGallery()
  }, [])

  const loadGallery = async () => {
    setLoading(true)
    try {
      const folderId = await getControlBioFolder()
      const galleryFolderId = await ensureFolderExists('Galería', folderId)
      const files = await listFiles(galleryFolderId)
      
      // Filtrar solo imágenes y videos
      const mediaFiles = files
        .filter(file => file.type === 'file' && 
          (file.mime?.startsWith('image/') || file.mime?.startsWith('video/')))
        .map(file => ({
          id: file.id || file.fileId,
          fileId: file.id || file.fileId,
          name: file.name,
          mime: file.mime,
        } as GalleryItem))
      
      // Cargar URLs de vista previa en paralelo
      const itemsWithUrls = await Promise.all(
        mediaFiles.map(async (item) => {
          try {
            const url = await getDownloadUrl(item.fileId)
            return { ...item, url }
          } catch (error) {
            console.error(`Error cargando URL para ${item.fileId}:`, error)
            return item
          }
        })
      )
      
      setItems(itemsWithUrls)
    } catch (error) {
      console.error('Error cargando galería:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar la galería',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    
    try {
      const folderId = await getControlBioFolder()
      const galleryFolderId = await ensureFolderExists('Galería', folderId)

      const totalFiles = files.length
      let uploadedFiles = 0

      for (const file of Array.from(files)) {
        try {
          const fileId = await uploadFile(file, galleryFolderId, (progress) => {
            // Calcular progreso total
            const individualProgress = progress / totalFiles
            setUploadProgress(Math.round(uploadedFiles * 100 / totalFiles + individualProgress))
          })
          uploadedFiles++
          
          // Agregar el item inmediatamente a la lista con loading state
          const newItem: GalleryItem = {
            id: fileId,
            fileId,
            name: file.name,
            mime: file.type,
          }
          
          // Intentar cargar la URL de inmediato
          try {
            const url = await getDownloadUrl(fileId)
            newItem.url = url
          } catch {
            // Si falla, intentar después
          }
          
          setItems(prev => [newItem, ...prev])
        } catch (error) {
          console.error(`Error subiendo ${file.name}:`, error)
          toast({
            title: 'Error',
            description: `No se pudo subir ${file.name}`,
            variant: 'destructive',
          })
        }
      }

      toast({
        title: 'Archivos subidos',
        description: `${uploadedFiles} de ${totalFiles} archivos subidos correctamente`,
      })

      // Recargar para asegurarnos de tener todos los datos
      await loadGallery()
    } catch (error) {
      console.error('Error subiendo archivos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron subir los archivos',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleToggleSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const handleCreateCarousel = () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'Sin selección',
        description: 'Selecciona al menos una imagen o video para crear un carrusel',
        variant: 'destructive',
      })
      return
    }
    setShowCarouselDialog(true)
  }

  const handleDragStart = (index: number) => {
    if (isSelectionMode) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isSelectionMode) return
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (isSelectionMode) return
    e.preventDefault()
    if (draggedIndex === null) return

    const newOrder = [...items]
    const draggedItem = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, draggedItem)

    setItems(newOrder)
    setDraggedIndex(null)
    
    // TODO: Guardar el nuevo orden en la base de datos
    toast({
      title: 'Orden actualizado',
      description: 'Los elementos se han reordenado',
    })
  }

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${itemName}" de la galería?`)) return

    try {
      // TODO: Implementar eliminación de archivo desde ControlFile
      setItems(items.filter(item => item.id !== itemId))
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      
      toast({
        title: 'Elemento eliminado',
        description: 'Se ha eliminado de la galería',
      })
    } catch (error) {
      console.error('Error eliminando:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el elemento',
        variant: 'destructive',
      })
    }
  }

  const handleCarouselCreated = async () => {
    // Este callback se ejecuta cuando el carrusel se crea exitosamente
    setShowCarouselDialog(false)
    setSelectedItems([])
    setIsSelectionMode(false)
    await onRefresh()
    
    toast({
      title: 'Carrusel creado',
      description: 'Se ha creado un nuevo carrusel desde la galería',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Mi Galería</h3>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
            {selectedItems.length > 0 && ` • ${selectedItems.length} seleccionados`}
          </p>
        </div>
        <div className="flex gap-2">
          {!isSelectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {items.length > 0 && (
                <Button onClick={() => setIsSelectionMode(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Carrusel
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleSelectAll}
              >
                {selectedItems.length === items.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedItems([])
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCarousel}
                disabled={selectedItems.length === 0}
              >
                Crear con {selectedItems.length} elementos
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Barra de progreso de subida */}
      {uploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Subiendo archivos...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid de imágenes */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">Tu galería está vacía</p>
          <p className="text-sm mb-4">Sube imágenes y videos para empezar</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {items.map((item, index) => {
            const isSelected = selectedItems.includes(item.id)
            const isDragging = draggedIndex === index
            
            return (
              <Card
                key={item.id}
                className={`relative transition-all ${
                  isSelectionMode ? 'cursor-pointer' : 'cursor-move'
                } hover:border-primary ${
                  isSelected ? 'border-primary border-2 ring-2 ring-primary/20' : ''
                } ${isDragging ? 'opacity-50' : ''}`}
                draggable={!isSelectionMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => isSelectionMode && handleToggleSelection(item.id)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative bg-muted overflow-hidden group">
                    {item.url ? (
                      item.mime?.startsWith('image/') ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Video</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                      </div>
                    )}

                    {/* Checkbox de selección */}
                    {isSelectionMode && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                          isSelected ? 'bg-primary' : 'bg-white/90'
                        }`}>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    )}

                    {/* Botón de grip para drag and drop */}
                    {!isSelectionMode && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <GripVertical className="h-4 w-4 text-white drop-shadow-lg bg-black/50 rounded" />
                      </div>
                    )}

                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(item.id, item.name)
                      }}
                      className="absolute bottom-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                      title="Eliminar"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    {/* Overlay cuando se está arrastrando */}
                    {!isSelectionMode && (
                      <div className="absolute top-0 left-0 right-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20" />
                    )}
                  </div>
                  
                  {/* Nombre del archivo */}
                  <div className="p-2">
                    <p className="text-xs truncate" title={item.name}>
                      {item.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog para crear carrusel desde selección */}
      {showCarouselDialog && (
        <CarouselDialog
          open={showCarouselDialog}
          onOpenChange={setShowCarouselDialog}
          editingCarousel={null}
          userId={userId}
          preselectedImages={selectedItems}
          onSuccess={handleCarouselCreated}
        />
      )}
    </div>
  )
}
