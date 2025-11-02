'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon, Video, FileImage, LayoutGrid, Shuffle } from 'lucide-react'
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
      <CardContent className="p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Imágenes disponibles</h3>
            <p className="text-sm text-muted-foreground">
              {availableFiles.length} imágenes sin posicionar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoLayout}
              disabled={availableFiles.filter(f => f.mime?.startsWith('image/')).length === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Auto Layout
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onUploadMore}
            >
              Subir más
            </Button>
          </div>
        </div>

        <div className="h-48 w-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-2 pb-2" style={{ minWidth: 'min-content' }}>
            {availableFiles.map((file) => {
              const isImage = file.mime?.startsWith('image/')
              const isDragging = draggedFile === file.id
              
              return (
                <Card
                  key={file.id}
                  className={`cursor-move transition-all duration-200 shrink-0 ${
                    isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
                  } ${isImage ? 'hover:border-primary' : 'opacity-60'}`}
                  draggable={isImage}
                  onDragStart={() => handleDragStart(file.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => isImage && onAddToLayout(file.id)}
                  style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}
                >
                  <CardContent className="p-2">
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

                      {/* Overlay para imágenes */}
                      {isImage && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                              <LayoutGrid className="h-4 w-4 text-gray-700" />
                            </div>
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
                    
                    <p className="text-xs text-center mt-1 truncate" title={file.name}>
                      {file.name}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
