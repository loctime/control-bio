'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageIcon, Video, FileImage, LayoutGrid, Shuffle, Eye, X } from 'lucide-react'
import type { GalleryLayoutItem } from '@/types'

interface GalleryFile {
  id: string
  fileId: string
  name: string
  mime?: string
  url?: string
  placeholder?: boolean
}

interface ImageStagingAreaProps {
  files: GalleryFile[]
  layoutItems: GalleryLayoutItem[]
  onAddToLayout: (fileId: string) => void
  onAutoLayout: () => void
  onUploadMore: () => void
}

export function ImageStagingArea({
  files,
  layoutItems,
  onAddToLayout,
  onAutoLayout,
  onUploadMore
}: ImageStagingAreaProps) {
  const [draggedFile, setDraggedFile] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryFile | null>(null)

  // Filtrar archivos que no están en el layout
  const availableFiles = files.filter(file => 
    !layoutItems.some(item => item.fileId === file.id)
  )

  const getFileIcon = (file: GalleryFile) => {
    if (file.mime?.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (file.mime?.startsWith('video/')) return <Video className="h-4 w-4" />
    return <FileImage className="h-4 w-4" />
  }

  const handleDragStart = (fileId: string) => {
    setDraggedFile(fileId)
  }

  const handleDragEnd = () => {
    setDraggedFile(null)
  }

  const handleAutoLayout = () => {
    // Agregar todas las imágenes disponibles al layout
    availableFiles.forEach(file => {
      if (file.mime?.startsWith('image/')) {
        onAddToLayout(file.id)
      }
    })
    onAutoLayout()
  }

  if (availableFiles.length === 0) {
    return (
      <Card className="h-64">
        <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
          <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Todas las imágenes están en el layout</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sube más imágenes para continuar diseñando tu galería
          </p>
          <Button onClick={onUploadMore}>
            Subir más imágenes
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-64">
      <CardContent className="px-2 pt-0 pb-2 h-full flex flex-col">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-sm">Imágenes disponibles</h3>
            <p className="text-xs text-muted-foreground">
              {availableFiles.length} imágenes sin posicionar
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2"
              onClick={handleAutoLayout}
              disabled={availableFiles.filter(f => f.mime?.startsWith('image/')).length === 0}
            >
              <Shuffle className="h-3 w-3 mr-1" />
              Auto Layout
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2"
              onClick={onUploadMore}
            >
              Subir más
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-6 gap-1.5 pr-1">
            {availableFiles.map((file) => {
              const isImage = file.mime?.startsWith('image/')
              const isDragging = draggedFile === file.id
              
              return (
                <Card
                  key={file.id}
                  className={`cursor-move transition-all duration-200 ${
                    isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
                  } ${isImage ? 'hover:border-primary' : 'opacity-60'}`}
                  draggable={isImage}
                  onDragStart={() => handleDragStart(file.id)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="p-1">
                    <div className="aspect-square relative bg-muted rounded overflow-hidden group w-full">
                      {file.url ? (
                        isImage ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            {getFileIcon(file)}
                            <span className="text-xs text-muted-foreground mt-1">
                              {file.mime?.startsWith('video/') ? 'Video' : 'Archivo'}
                            </span>
                          </div>
                        )
                      ) : file.placeholder ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Cargando...</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
                        </div>
                      )}

                      {/* Overlay con botones de acción */}
                      {isImage && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-2">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            {file.url && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImage(file)
                                }}
                                title="Ver imagen"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddToLayout(file.id)
                              }}
                              title="Agregar al layout"
                            >
                              <LayoutGrid className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Indicador de que no es arrastrable */}
                      {!isImage && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="text-xs text-white font-medium">Solo imágenes</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-center mt-0.5 truncate leading-tight" title={file.name}>
                      {file.name}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Modal para ver imagen ampliada */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center justify-between">
                <span className="truncate">{selectedImage?.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {selectedImage?.url && (
                <div className="flex justify-center">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
