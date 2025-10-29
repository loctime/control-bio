'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, X, RotateCcw } from 'lucide-react'
import type { GalleryLayoutItem } from '@/types'

interface ResizableImageCardProps {
  item: GalleryLayoutItem
  imageUrl?: string
  imageName: string
  gridSize: number
  gap: number
  onUpdate: (updates: Partial<GalleryLayoutItem>) => void
  onRemove: () => void
  isSelected?: boolean
  onSelect?: () => void
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export function ResizableImageCard({
  item,
  imageUrl,
  imageName,
  gridSize,
  gap,
  onUpdate,
  onRemove,
  isSelected = false,
  onSelect
}: ResizableImageCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onSelect) {
      onSelect()
    }
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - (item.x * gridSize),
      y: e.clientY - (item.y * gridSize)
    })
  }, [item.x, item.y, gridSize, onSelect])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: item.width,
      height: item.height
    })
  }, [item.width, item.height])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.round((e.clientX - dragStart.x) / gridSize))
      const newY = Math.max(0, Math.round((e.clientY - dragStart.y) / gridSize))
      
      onUpdate({ x: newX, y: newY })
    }
    
    if (isResizing && resizeHandle) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      
      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = item.x
      let newY = item.y
      
      // Calcular nuevas dimensiones basado en el handle
      switch (resizeHandle) {
        case 'se': // Esquina inferior derecha
          newWidth = Math.max(1, Math.round((resizeStart.width + deltaX) / gridSize))
          newHeight = Math.max(1, Math.round((resizeStart.height + deltaY) / gridSize))
          break
        case 'sw': // Esquina inferior izquierda
          newWidth = Math.max(1, Math.round((resizeStart.width - deltaX) / gridSize))
          newHeight = Math.max(1, Math.round((resizeStart.height + deltaY) / gridSize))
          newX = Math.max(0, Math.round((resizeStart.x - deltaX) / gridSize))
          break
        case 'ne': // Esquina superior derecha
          newWidth = Math.max(1, Math.round((resizeStart.width + deltaX) / gridSize))
          newHeight = Math.max(1, Math.round((resizeStart.height - deltaY) / gridSize))
          newY = Math.max(0, Math.round((resizeStart.y - deltaY) / gridSize))
          break
        case 'nw': // Esquina superior izquierda
          newWidth = Math.max(1, Math.round((resizeStart.width - deltaX) / gridSize))
          newHeight = Math.max(1, Math.round((resizeStart.height - deltaY) / gridSize))
          newX = Math.max(0, Math.round((resizeStart.x - deltaX) / gridSize))
          newY = Math.max(0, Math.round((resizeStart.y - deltaY) / gridSize))
          break
      }
      
      // Mantener aspect ratio si es necesario
      const aspectRatio = parseAspectRatio(item.aspectRatio)
      if (aspectRatio) {
        const targetHeight = Math.round(newWidth / aspectRatio)
        const targetWidth = Math.round(newHeight * aspectRatio)
        
        // Usar la dimensión que mantenga mejor el aspect ratio
        if (Math.abs(targetHeight - newHeight) < Math.abs(targetWidth - newWidth)) {
          newHeight = targetHeight
        } else {
          newWidth = targetWidth
        }
      }
      
      onUpdate({ 
        x: newX, 
        y: newY, 
        width: newWidth, 
        height: newHeight 
      })
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, resizeStart, item, gridSize, onUpdate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  // Agregar event listeners globales
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const parseAspectRatio = (ratio: string): number | null => {
    const [w, h] = ratio.split(':').map(Number)
    return w && h ? w / h : null
  }

  const resetRotation = () => {
    onUpdate({ 
      effects: { 
        ...item.effects, 
        rotation: 0 
      } 
    })
  }

  const toggleShadow = () => {
    onUpdate({ 
      effects: { 
        ...item.effects, 
        shadow: !item.effects?.shadow 
      } 
    })
  }

  const style = {
    position: 'absolute' as const,
    left: `${item.x * gridSize + gap}px`,
    top: `${item.y * gridSize + gap}px`,
    width: `${item.width * gridSize - gap}px`,
    height: `${item.height * gridSize - gap}px`,
    zIndex: item.zIndex,
    transform: item.effects?.rotation ? `rotate(${item.effects.rotation}deg)` : undefined,
  }

  return (
    <Card
      ref={cardRef}
      className={`absolute transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isDragging || isResizing ? 'opacity-80' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <CardContent className="p-0 h-full relative group">
        {/* Imagen */}
        <div className="w-full h-full overflow-hidden rounded-lg">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageName}
              className="w-full h-full object-cover"
              style={{
                borderRadius: item.effects?.borderRadius ? `${item.effects.borderRadius}px` : undefined,
                boxShadow: item.effects?.shadow ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-300 rounded mb-2 mx-auto" />
                <p className="text-xs text-muted-foreground">{imageName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Overlay de controles */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
          {/* Handle de arrastre */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
          </div>

          {/* Botones de acción */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                resetRotation()
              }}
              title="Resetear rotación"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              title="Eliminar del layout"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Handles de redimensionamiento */}
          {isSelected && (
            <>
              {/* Esquina superior izquierda */}
              <div
                className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
              />
              {/* Esquina superior derecha */}
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
              />
              {/* Esquina inferior izquierda */}
              <div
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
              />
              {/* Esquina inferior derecha */}
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
