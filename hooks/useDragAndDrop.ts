import { useState, useCallback } from 'react'

export interface DragItem {
  id: string
  index: number
}

export interface DragState {
  draggedItem: DragItem | null
  draggedOverItem: DragItem | null
  isDragging: boolean
}

export const useDragAndDrop = <T extends { id: string }>(
  items: T[],
  onReorder: (reorderedItems: T[]) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    draggedOverItem: null,
    isDragging: false,
  })

  const handleDragStart = useCallback((e: React.DragEvent, item: T, index: number) => {
    const dragItem: DragItem = { id: item.id, index }
    setDragState({
      draggedItem: dragItem,
      draggedOverItem: null,
      isDragging: true,
    })
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(dragItem))
    
    // Agregar clase para indicar que se está arrastrando
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('opacity-50', 'scale-95')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, item: T, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const dragOverItem: DragItem = { id: item.id, index }
    setDragState(prev => ({
      ...prev,
      draggedOverItem: dragOverItem,
    }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Solo limpiar si realmente salimos del elemento
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        draggedOverItem: null,
      }))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    const dragItemData = e.dataTransfer.getData('text/plain')
    if (!dragItemData) return
    
    const draggedItem: DragItem = JSON.parse(dragItemData)
    const { draggedOverItem } = dragState
    
    if (!draggedOverItem || draggedItem.id === draggedOverItem.id) {
      setDragState({
        draggedItem: null,
        draggedOverItem: null,
        isDragging: false,
      })
      return
    }
    
    // Reordenar los elementos
    const newItems = [...items]
    const draggedItemData = newItems[draggedItem.index]
    const draggedOverItemData = newItems[draggedOverItem.index]
    
    // Intercambiar posiciones
    newItems[draggedItem.index] = draggedOverItemData
    newItems[draggedOverItem.index] = draggedItemData
    
    // Actualizar el orden en la base de datos
    onReorder(newItems)
    
    setDragState({
      draggedItem: null,
      draggedOverItem: null,
      isDragging: false,
    })
  }, [items, dragState, onReorder])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Limpiar clases de arrastre
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('opacity-50', 'scale-95')
    }
    
    setDragState({
      draggedItem: null,
      draggedOverItem: null,
      isDragging: false,
    })
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}
