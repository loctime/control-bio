'use client'

import { useState, useEffect, useRef } from 'react'
import { listFiles } from '@/lib/controlfile-client'
import { Image, Upload, Check, Loader2 as SpinnerIcon, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImageFile {
  id: string
  name: string
  mime?: string
  fileId: string
}

interface ImageSelectorProps {
  selectedImages: string[]
  onSelectionChange: (selected: string[]) => void
  onUpload?: (files: File[]) => Promise<void>
}

export function ImageSelector({ selectedImages, onSelectionChange, onUpload }: ImageSelectorProps) {
  const [availableImages, setAvailableImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const files = await listFiles(null)
      // Filtrar solo imágenes
      const images = files
        .filter(file => file.type === 'file' && file.mime?.startsWith('image/'))
        .map(file => ({
          id: file.id || file.fileId,
          name: file.name,
          mime: file.mime,
          fileId: file.id || file.fileId,
        } as ImageFile))
      
      setAvailableImages(images)
    } catch (err) {
      console.error('Error cargando imágenes:', err)
      setError('No se pudieron cargar las imágenes')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleImage = (imageId: string) => {
    const newSelection = selectedImages.includes(imageId)
      ? selectedImages.filter(id => id !== imageId)
      : [...selectedImages, imageId]
    
    onSelectionChange(newSelection)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    try {
      if (onUpload) {
        await onUpload(Array.from(files))
      }
      // Recargar imágenes después de subir
      await loadImages()
    } catch (err) {
      console.error('Error subiendo imágenes:', err)
      setError('Error al subir las imágenes')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botón para subir nuevas imágenes */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <SpinnerIcon className="h-8 w-8 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Subiendo imágenes...' : 'Haz click para subir imágenes'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                o arrastra las imágenes aquí
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Grid de imágenes disponibles */}
      {availableImages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay imágenes disponibles</p>
          <p className="text-sm">Sube algunas imágenes para usarlas en tu carrusel</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedImages.length} {selectedImages.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}
            </p>
            <Button variant="ghost" size="sm" onClick={loadImages}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-2">
            {availableImages.map((image) => {
              const isSelected = selectedImages.includes(image.fileId)
              
              return (
                <Card
                  key={image.fileId}
                  className={`relative cursor-pointer overflow-hidden hover:border-primary transition-colors ${
                    isSelected ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => handleToggleImage(image.fileId)}
                >
                  <div className="aspect-square relative bg-muted">
                    {/* Placeholder - las imágenes se cargarán cuando se usen */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                    {/* Check indicador */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs truncate" title={image.name}>
                      {image.name}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
