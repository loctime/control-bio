'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, Eye, Video, FileImage } from 'lucide-react'
import type { GalleryLayout, GalleryLayoutItem } from '@/types'

interface GalleryFile {
  id: string
  fileId: string
  name: string
  mime?: string
  url?: string
}

interface GalleryGridProps {
  layout: GalleryLayout
  files: GalleryFile[]
  isEditable?: boolean
  onItemClick?: (item: GalleryLayoutItem) => void
}

export function GalleryGrid({ layout, files, isEditable = false, onItemClick }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<{ item: GalleryLayoutItem; file: GalleryFile } | null>(null)

  const getFileForItem = (item: GalleryLayoutItem): GalleryFile | undefined => {
    return files.find(file => file.id === item.fileId)
  }

  const getFileIcon = (mime?: string) => {
    if (mime?.startsWith('image/')) return <Eye className="h-4 w-4" />
    if (mime?.startsWith('video/')) return <Video className="h-4 w-4" />
    return <FileImage className="h-4 w-4" />
  }

  const handleItemClick = (item: GalleryLayoutItem) => {
    const file = getFileForItem(item)
    if (file?.url && file.mime?.startsWith('image/')) {
      setSelectedImage({ item, file })
    }
    if (onItemClick) {
      onItemClick(item)
    }
  }

  const handleDownload = (file: GalleryFile) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.click()
    }
  }

  const containerStyle = {
    position: 'relative' as const,
    width: `${layout.settings.columns * layout.settings.gridSize}px`,
    height: '600px', // Altura fija para el canvas
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${layout.settings.gridSize}px ${layout.settings.gridSize}px`,
  }

  return (
    <>
      <div className="relative overflow-auto border rounded-lg bg-white">
        <div style={containerStyle}>
          {layout.items.map((item) => {
            const file = getFileForItem(item)
            const isImage = file?.mime?.startsWith('image/')
            const isVideo = file?.mime?.startsWith('video/')
            
            const itemStyle = {
              position: 'absolute' as const,
              left: `${item.x * layout.settings.gridSize + layout.settings.gap}px`,
              top: `${item.y * layout.settings.gridSize + layout.settings.gap}px`,
              width: `${item.width * layout.settings.gridSize - layout.settings.gap}px`,
              height: `${item.height * layout.settings.gridSize - layout.settings.gap}px`,
              zIndex: item.zIndex,
              transform: item.effects?.rotation ? `rotate(${item.effects.rotation}deg)` : undefined,
            }

            return (
              <Card
                key={item.fileId}
                className={`transition-all duration-200 ${
                  isEditable ? 'cursor-pointer hover:shadow-lg' : 'cursor-pointer'
                }`}
                style={itemStyle}
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-0 h-full relative group">
                  <div className="w-full h-full overflow-hidden rounded-lg">
                    {file?.url ? (
                      isImage ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          style={{
                            borderRadius: item.effects?.borderRadius ? `${item.effects.borderRadius}px` : undefined,
                            boxShadow: item.effects?.shadow ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
                          }}
                        />
                      ) : isVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                          <Video className="h-12 w-12 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Video</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                          <FileImage className="h-12 w-12 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Archivo</span>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-300 rounded mb-2 mx-auto" />
                          <p className="text-xs text-muted-foreground">{file?.name || 'Cargando...'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlay de hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                    {/* Botón de acción al hover */}
                    {file?.url && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-2">
                          {isImage && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage({ item, file })
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(file)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Información del archivo */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-xs truncate" title={file?.name}>
                        {file?.name}
                      </p>
                    </div>
                  </div>
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
              <span className="truncate">{selectedImage?.file.name}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (selectedImage?.file.url) {
                      handleDownload(selectedImage.file)
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedImage?.file.url && (
              <div className="flex justify-center">
                <img
                  src={selectedImage.file.url}
                  alt={selectedImage.file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
