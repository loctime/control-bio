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

export function GalleryEditor({ userId, onPreview }: GalleryEditorProps) {
  const [layout, setLayout] = useState<GalleryLayout | null>(null)
  const [files, setFiles] = useState<GalleryFile[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const hasLoadedRef = useRef<string | null>(null)
  const { toast } = useToast()

  // Cargar layout y archivos (solo una vez por userId)
  useEffect(() => {
    // Evitar carga doble en modo desarrollo (React 18+ StrictMode)
    if (hasLoadedRef.current === userId) {
      console.log('⏭️ Datos ya cargados para este usuario, omitiendo recarga')
      return
    }
    
    hasLoadedRef.current = userId
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Iniciando carga de datos de galería...')
      
      // Cargar layout existente o crear uno por defecto
      console.log('📋 Cargando layout...')
      const existingLayout = await loadGalleryLayout(userId)
      let currentLayout: GalleryLayout
      if (existingLayout) {
        console.log('✅ Layout existente cargado')
        currentLayout = existingLayout
        setLayout(currentLayout)
      } else {
        console.log('📝 Creando layout por defecto')
        currentLayout = {
          ...createDefaultLayout(userId),
          id: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as GalleryLayout
        setLayout(currentLayout)
      }

      // Cargar archivos de la galería (pasar el layout como parámetro)
      console.log('📁 Cargando archivos de galería...')
      await loadGalleryFiles(currentLayout)
      console.log('✅ Carga de datos completada')
    } catch (error) {
      console.error('❌ Error cargando datos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la galería',
        variant: 'destructive',
      })
    } finally {
      console.log('🏁 Finalizando carga (completado o con error)')
      setLoading(false)
    }
  }

  // Limitador de concurrencia simple
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

  const loadGalleryFiles = async (currentLayout?: GalleryLayout | null) => {
    try {
      console.log('📂 Resolviendo carpeta Galería...')
      // Resolver carpeta Galería dinámicamente
      const rootFolderId = await getControlBioFolder()
      console.log('📂 Root folder ID:', rootFolderId)
      const galleryFolderId = await ensureFolderExists('Galería', rootFolderId)
      console.log('📂 Gallery folder ID:', galleryFolderId)

      // Leer archivos desde la colección 'files' de Firestore
      const filesQuery = query(
        collection(db, 'files'),
        where('userId', '==', userId),
        where('deletedAt', '==', null),
        orderBy('createdAt', 'desc')
      )
      
      console.log('🔍 Buscando archivos en Firestore...')
      const filesSnap = await getDocs(filesQuery)
      const filesData = filesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      console.log(`📄 Total archivos encontrados: ${filesData.length}`)
      
      // Filtrar archivos de la galería (que están en la subcarpeta "Galería")
      const galleryFiles = filesData.filter(file => 
        file.ancestors && file.ancestors.includes(galleryFolderId) &&
        (file.mime?.startsWith('image/') || file.mime?.startsWith('video/'))
      )
      console.log(`🖼️ Archivos de galería filtrados: ${galleryFiles.length}`)
      
      // 1) Establecer metadatos sin bloquear por URLs
      setFiles(galleryFiles)

      // 2) Cargar URLs para TODAS las imágenes (las del layout Y las disponibles)
      // Usar el layout pasado como parámetro o el estado actual
      const layoutToUse = currentLayout || layout
      const layoutFileIds = new Set((layoutToUse?.items || []).map(i => i.fileId))
      
      // Primero cargar URLs de imágenes en el layout (prioridad alta)
      const filesInLayout = galleryFiles.filter(f => layoutFileIds.has(f.id))
      // Luego cargar URLs de imágenes disponibles (prioridad baja)
      const filesNotInLayout = galleryFiles.filter(f => !layoutFileIds.has(f.id) && f.mime?.startsWith('image/'))

      // Crear tareas para todas las imágenes
      const allFilesNeedingUrl = [...filesInLayout, ...filesNotInLayout]
      
      // Solo cargar URLs si hay archivos que necesitan URLs
      if (allFilesNeedingUrl.length > 0) {
        console.log(`🔗 Cargando URLs para ${allFilesNeedingUrl.length} archivos...`)
        const tasks = allFilesNeedingUrl.map((file) => async () => {
          try {
            const url = await getDownloadUrl(file.id)
            return { id: file.id, url }
          } catch (error) {
            console.error(`❌ Error cargando URL para ${file.id}:`, error)
            return { id: file.id, url: undefined, placeholder: true as const }
          }
        })

        // Cargar URLs con concurrencia limitada
        const urlResults = await withConcurrencyLimit(tasks, 5)
        console.log(`✅ URLs cargadas: ${urlResults.filter(r => r.url).length}/${urlResults.length}`)
        
        // 3) Mergear URLs en estado
        setFiles(prev => prev.map(f => {
          const match = urlResults.find(r => r.id === f.id)
          if (!match) return f
          return { ...f, url: match.url, placeholder: match.url ? undefined : true }
        }))
      } else {
        console.log('ℹ️ No hay archivos que necesiten URLs')
      }
    } catch (error) {
      console.error('❌ Error cargando archivos:', error)
      // No lanzar el error para que el loading se complete
      // Solo loguear para debugging
    }
  }

  const handleAddToLayout = (fileId: string) => {
    if (!layout) return

    const file = files.find(f => f.id === fileId)
    if (!file) return

    // Calcular aspect ratio
    const aspectRatio = file.mime?.startsWith('image/') ? '16:9' : '1:1' // Default
    
    // Encontrar posición disponible
    const position = findNextAvailablePosition(
      layout.items,
      2, // width por defecto
      2, // height por defecto
      layout.settings.columns
    )

    const newItem: GalleryLayoutItem = {
      fileId: file.id,
      x: position.x,
      y: position.y,
      width: 2,
      height: 2,
      zIndex: Math.max(0, ...layout.items.map(item => item.zIndex)) + 1,
      aspectRatio,
      effects: {
        borderRadius: 8,
        shadow: true,
        rotation: 0
      }
    }

    setLayout({
      ...layout,
      items: [...layout.items, newItem]
    })
  }

  const handleUpdateItem = (fileId: string, updates: Partial<GalleryLayoutItem>) => {
    if (!layout) return

    setLayout({
      ...layout,
      items: layout.items.map(item =>
        item.fileId === fileId ? { ...item, ...updates } : item
      )
    })
  }

  const handleRemoveItem = (fileId: string) => {
    if (!layout) return

    setLayout({
      ...layout,
      items: layout.items.filter(item => item.fileId !== fileId)
    })
    setSelectedItem(null)
  }

  const handleAutoLayout = () => {
    if (!layout) return

    // Agregar todas las imágenes disponibles con layout automático
    const availableFiles = files.filter(file => 
      !layout.items.some(item => item.fileId === file.id) &&
      file.mime?.startsWith('image/')
    )

    const newItems: GalleryLayoutItem[] = []
    let baseZ = Math.max(0, ...layout.items.map(item => item.zIndex))
    for (const file of availableFiles) {
      const position = findNextAvailablePosition(
        [...layout.items, ...newItems],
        2,
        2,
        layout.settings.columns
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

    setLayout({
      ...layout,
      items: [...layout.items, ...newItems]
    })
  }

  const handleSaveLayout = async () => {
    if (!layout) return

    setSaving(true)
    try {
      await saveGalleryLayout(userId, layout)
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
    if (!layout) return

    setLayout({
      ...layout,
      settings: { ...layout.settings, ...updates }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!layout) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error cargando el editor de galería</p>
      </div>
    )
  }

  const canvasStyle = {
    width: `${layout.settings.columns * layout.settings.gridSize}px`,
    height: '600px',
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${layout.settings.gridSize}px ${layout.settings.gridSize}px`,
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Editor de Galería</h3>
          <p className="text-sm text-muted-foreground">
            {layout.items.length} elementos en el layout
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
                  value={layout.settings.columns}
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
                  value={layout.settings.gridSize}
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
                  value={layout.settings.gap}
                  onChange={(e) => handleUpdateSettings({ 
                    gap: parseInt(e.target.value) || 10 
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header de nuevas imágenes (no visible en la vista pública) */}
      <ImageStagingArea
        files={files}
        layoutItems={layout.items}
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
              {layout.settings.columns} columnas × {Math.ceil(600 / layout.settings.gridSize)} filas
            </div>
          </div>

          <div className="relative overflow-auto border rounded-lg bg-white">
            <div
              ref={canvasRef}
              className="relative"
              style={canvasStyle}
            >
              {layout.items.map((item) => {
                const file = files.find(f => f.id === item.fileId)
                return (
                  <ResizableImageCard
                    key={item.fileId}
                    item={item}
                    imageUrl={file?.url}
                    imageName={file?.name || 'Imagen'}
                    gridSize={layout.settings.gridSize}
                    gap={layout.settings.gap}
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
