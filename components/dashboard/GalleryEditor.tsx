'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ResizableImageCard } from './ResizableImageCard'
import { ImageStagingArea } from './ImageStagingArea'
import { 
  saveGalleryLayout, 
  loadGalleryLayout, 
  createDefaultLayout,
  calculateAspectRatio,
  findNextAvailablePosition
} from '@/lib/gallery-actions'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getDownloadUrl, getControlBioFolder, ensureFolderExists } from '@/lib/controlfile-client'
import { 
  Save, 
  Eye, 
  Settings, 
  Grid3X3, 
  Plus,
  Loader2
} from 'lucide-react'
import type { GalleryLayout, GalleryLayoutItem } from '@/types'

interface GalleryFile {
  id: string
  fileId: string
  name: string
  mime?: string
  url?: string
  placeholder?: boolean
}

interface GalleryEditorProps {
  userId: string
  onPreview: () => void
}

// Helper function para cargar layout o crear uno default
const loadGalleryLayoutData = async (userId: string): Promise<GalleryLayout> => {
  const existingLayout = await loadGalleryLayout(userId)
  if (existingLayout) {
    return existingLayout
  }
  
  // Crear layout por defecto
  return {
    ...createDefaultLayout(userId),
    id: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as GalleryLayout
}

// Helper para limitador de concurrencia
async function withConcurrencyLimit<T>(tasks: (() => Promise<T>)[], limit = 5): Promise<T[]> {
  const results: T[] = []
  let index = 0
  async function worker() {
    while (index < tasks.length) {
      const current = index++
      results[current] = await tasks[current]()
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// Helper para cargar archivos de galería
const loadGalleryFilesData = async (userId: string, layout: GalleryLayout | null): Promise<GalleryFile[]> => {
  if (!layout) return []
  
  try {
    console.log('📂 Resolviendo carpeta Galería...')
    const rootFolderId = await getControlBioFolder()
    const galleryFolderId = await ensureFolderExists('Galería', rootFolderId)

    // Leer archivos desde Firestore
    const filesQuery = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    )
    
    const filesSnap = await getDocs(filesQuery)
    const filesData = filesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    
    // Filtrar archivos de la galería
    const galleryFiles = filesData.filter(file => 
      file.ancestors && file.ancestors.includes(galleryFolderId) &&
      (file.mime?.startsWith('image/') || file.mime?.startsWith('video/'))
    )

    // Cargar URLs para TODAS las imágenes (las del layout Y las disponibles)
    const layoutFileIds = new Set((layout.items || []).map(i => i.fileId))
    const filesInLayout = galleryFiles.filter(f => layoutFileIds.has(f.id))
    const filesNotInLayout = galleryFiles.filter(f => !layoutFileIds.has(f.id) && f.mime?.startsWith('image/'))
    const allFilesNeedingUrl = [...filesInLayout, ...filesNotInLayout]

    // Cargar URLs con concurrencia limitada
    const tasks = allFilesNeedingUrl.map((file) => async () => {
      try {
        const url = await getDownloadUrl(file.id)
        return { id: file.id, url }
      } catch (error) {
        console.error(`❌ Error cargando URL para ${file.id}:`, error)
        return { id: file.id, url: undefined, placeholder: true as const }
      }
    })

    const urlResults = await withConcurrencyLimit(tasks, 5)
    
    // Mergear URLs
    return galleryFiles.map(f => {
      const match = urlResults.find(r => r.id === f.id)
      if (!match) return f as GalleryFile
      return { ...f, url: match.url, placeholder: match.url ? undefined : true } as GalleryFile
    })
  } catch (error) {
    console.error('❌ Error cargando archivos:', error)
    return []
  }
}

export function GalleryEditor({ userId, onPreview }: GalleryEditorProps) {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [localLayout, setLocalLayout] = useState<GalleryLayout | null>(null)
  const [localFiles, setLocalFiles] = useState<GalleryFile[]>([])
  const canvasRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Query para layout
  const { data: layout = null, isLoading: layoutLoading } = useQuery({
    queryKey: ['galleryLayout', userId],
    queryFn: () => loadGalleryLayoutData(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })

  // Query para archivos (depende del layout)
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['galleryFiles', userId],
    queryFn: () => loadGalleryFilesData(userId, layout),
    enabled: !!userId && !!layout,
    staleTime: 30 * 1000, // 30 segundos
  })

  // Sincronizar layout local con cache de TanStack Query
  useEffect(() => {
    if (layout) {
      setLocalLayout(layout)
    }
  }, [layout])

  // Sincronizar files local con cache
  useEffect(() => {
    if (files.length > 0) {
      setLocalFiles(files)
    }
  }, [files])

  const loading = layoutLoading || filesLoading
  const currentLayout = localLayout || layout
  const currentFiles = localFiles.length > 0 ? localFiles : files

  const handleAddToLayout = (fileId: string) => {
    if (!currentLayout) return

    const file = currentFiles.find(f => f.id === fileId)
    if (!file) return

    const aspectRatio = file.mime?.startsWith('image/') ? '16:9' : '1:1'
    const position = findNextAvailablePosition(
      currentLayout.items,
      2, 2,
      currentLayout.settings.columns
    )

    const newItem: GalleryLayoutItem = {
      fileId: file.id,
      x: position.x,
      y: position.y,
      width: 2,
      height: 2,
      zIndex: Math.max(0, ...currentLayout.items.map(item => item.zIndex)) + 1,
      aspectRatio,
      effects: {
        borderRadius: 8,
        shadow: true,
        rotation: 0
      }
    }

    const updatedLayout = {
      ...currentLayout,
      items: [...currentLayout.items, newItem]
    }
    setLocalLayout(updatedLayout)
  }

  const handleUpdateItem = (fileId: string, updates: Partial<GalleryLayoutItem>) => {
    if (!currentLayout) return

    setLocalLayout({
      ...currentLayout,
      items: currentLayout.items.map(item =>
        item.fileId === fileId ? { ...item, ...updates } : item
      )
    })
  }

  const handleRemoveItem = (fileId: string) => {
    if (!currentLayout) return

    setLocalLayout({
      ...currentLayout,
      items: currentLayout.items.filter(item => item.fileId !== fileId)
    })
    setSelectedItem(null)
  }

  const handleAutoLayout = () => {
    if (!currentLayout) return

    const availableFiles = currentFiles.filter(file => 
      !currentLayout.items.some(item => item.fileId === file.id) &&
      file.mime?.startsWith('image/')
    )

    const newItems: GalleryLayoutItem[] = []
    let baseZ = Math.max(0, ...currentLayout.items.map(item => item.zIndex))
    for (const file of availableFiles) {
      const position = findNextAvailablePosition(
        [...currentLayout.items, ...newItems],
        2, 2,
        currentLayout.settings.columns
      )
      newItems.push({
        fileId: file.id,
        x: position.x,
        y: position.y,
        width: 2,
        height: 2,
        zIndex: ++baseZ,
        aspectRatio: '16:9',
        effects: {
          borderRadius: 8,
          shadow: true,
          rotation: 0
        }
      })
    }

    setLocalLayout({
      ...currentLayout,
      items: [...currentLayout.items, ...newItems]
    })
  }

  const handleSaveLayout = async () => {
    if (!currentLayout) return

    setSaving(true)
    try {
      await saveGalleryLayout(userId, currentLayout)
      // Actualizar cache
      queryClient.setQueryData(['galleryLayout', userId], currentLayout)
      toast({
        title: 'Layout guardado',
        description: 'Tu galería se ha guardado correctamente',
      })
    } catch (error) {
      console.error('Error guardando layout:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar el layout',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSettings = (updates: Partial<GalleryLayout['settings']>) => {
    if (!currentLayout) return

    setLocalLayout({
      ...currentLayout,
      settings: { ...currentLayout.settings, ...updates }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!currentLayout) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error cargando el editor de galería</p>
      </div>
    )
  }

  const canvasStyle = {
    width: `${currentLayout.settings.columns * currentLayout.settings.gridSize}px`,
    height: '600px',
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${currentLayout.settings.gridSize}px ${currentLayout.settings.gridSize}px`,
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Editor de Galería</h3>
          <p className="text-sm text-muted-foreground">
            {currentLayout.items.length} elementos en el layout
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            onClick={handleSaveLayout}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Configuración del Grid</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="columns">Columnas</Label>
                <Input
                  id="columns"
                  type="number"
                  min="1"
                  max="20"
                  value={currentLayout.settings.columns}
                  onChange={(e) => handleUpdateSettings({ 
                    columns: parseInt(e.target.value) || 12 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="gridSize">Tamaño de Grid (px)</Label>
                <Input
                  id="gridSize"
                  type="number"
                  min="50"
                  max="200"
                  value={currentLayout.settings.gridSize}
                  onChange={(e) => handleUpdateSettings({ 
                    gridSize: parseInt(e.target.value) || 100 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="gap">Espacio (px)</Label>
                <Input
                  id="gap"
                  type="number"
                  min="0"
                  max="50"
                  value={currentLayout.settings.gap}
                  onChange={(e) => handleUpdateSettings({ 
                    gap: parseInt(e.target.value) || 10 
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header de nuevas imágenes */}
      <ImageStagingArea
        files={currentFiles}
        layoutItems={currentLayout.items}
        onAddToLayout={handleAddToLayout}
        onAutoLayout={handleAutoLayout}
        onUploadMore={() => {
          toast({
            title: 'Subida desde aquí en siguiente iteración',
            description: 'Por ahora, usa Archivos para subir y luego agrega al layout.',
          })
        }}
      />

      {/* Canvas de diseño */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Canvas de Diseño</h4>
            <div className="text-sm text-muted-foreground">
              {currentLayout.settings.columns} columnas × {Math.ceil(600 / currentLayout.settings.gridSize)} filas
            </div>
          </div>

          <div className="relative overflow-auto border rounded-lg bg-white">
            <div
              ref={canvasRef}
              className="relative"
              style={canvasStyle}
            >
              {currentLayout.items.map((item) => {
                const file = currentFiles.find(f => f.id === item.fileId)
                return (
                  <ResizableImageCard
                    key={item.fileId}
                    item={item}
                    imageUrl={file?.url}
                    imageName={file?.name || 'Imagen'}
                    gridSize={currentLayout.settings.gridSize}
                    gap={currentLayout.settings.gap}
                    onUpdate={(updates) => handleUpdateItem(item.fileId, updates)}
                    onRemove={() => handleRemoveItem(item.fileId)}
                    isSelected={selectedItem === item.fileId}
                    onSelect={() => setSelectedItem(item.fileId)}
                  />
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
