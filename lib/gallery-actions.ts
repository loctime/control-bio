'use client'

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { GalleryLayout, GalleryLayoutItem } from '@/types'

const GALLERY_COLLECTION = 'apps/controlbio/galleryLayouts'

export async function saveGalleryLayout(
  userId: string, 
  layout: Omit<GalleryLayout, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    const layoutRef = doc(db, GALLERY_COLLECTION, userId)
    const now = new Date().toISOString()
    
    const layoutData: GalleryLayout = {
      ...layout,
      id: userId,
      createdAt: now,
      updatedAt: now,
    }
    
    await setDoc(layoutRef, layoutData)
    console.log('✅ Layout de galería guardado')
  } catch (error) {
    console.error('❌ Error guardando layout de galería:', error)
    throw error
  }
}

export async function loadGalleryLayout(userId: string): Promise<GalleryLayout | null> {
  try {
    const layoutRef = doc(db, GALLERY_COLLECTION, userId)
    const layoutSnap = await getDoc(layoutRef)
    
    if (!layoutSnap.exists()) {
      console.log('📝 No existe layout de galería para el usuario')
      return null
    }
    
    const layoutData = layoutSnap.data() as GalleryLayout
    console.log('✅ Layout de galería cargado')
    return layoutData
  } catch (error) {
    console.error('❌ Error cargando layout de galería:', error)
    throw error
  }
}

export async function updateGalleryLayout(
  userId: string, 
  updates: Partial<Omit<GalleryLayout, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  try {
    const layoutRef = doc(db, GALLERY_COLLECTION, userId)
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    await updateDoc(layoutRef, updateData)
    console.log('✅ Layout de galería actualizado')
  } catch (error) {
    console.error('❌ Error actualizando layout de galería:', error)
    throw error
  }
}

export function createDefaultLayout(userId: string): Omit<GalleryLayout, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    items: [],
    settings: {
      gridSize: 100, // 100px por unidad de grid
      gap: 10, // 10px entre elementos
      columns: 12, // 12 columnas por defecto
    },
    isPublic: true,
  }
}

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  const ratioW = width / divisor
  const ratioH = height / divisor
  
  // Redondear a ratios comunes
  if (Math.abs(ratioW - 16) < 0.1 && Math.abs(ratioH - 9) < 0.1) return '16:9'
  if (Math.abs(ratioW - 9) < 0.1 && Math.abs(ratioH - 16) < 0.1) return '9:16'
  if (Math.abs(ratioW - 1) < 0.1 && Math.abs(ratioH - 1) < 0.1) return '1:1'
  if (Math.abs(ratioW - 4) < 0.1 && Math.abs(ratioH - 3) < 0.1) return '4:3'
  if (Math.abs(ratioW - 3) < 0.1 && Math.abs(ratioH - 4) < 0.1) return '3:4'
  
  return `${ratioW}:${ratioH}`
}

export function snapToGrid(
  value: number, 
  gridSize: number, 
  minValue: number = 1
): number {
  return Math.max(minValue, Math.round(value / gridSize) * gridSize)
}

export function findNextAvailablePosition(
  items: GalleryLayoutItem[],
  width: number,
  height: number,
  columns: number
): { x: number; y: number } {
  // Buscar posición disponible de arriba a abajo, izquierda a derecha
  for (let y = 0; y < 100; y++) { // Máximo 100 filas
    for (let x = 0; x <= columns - width; x++) {
      const wouldOverlap = items.some(item => 
        !(x + width <= item.x || x >= item.x + item.width || 
          y + height <= item.y || y >= item.y + item.height)
      )
      
      if (!wouldOverlap) {
        return { x, y }
      }
    }
  }
  
  // Si no hay espacio, colocar al final
  return { x: 0, y: Math.max(0, ...items.map(item => item.y + item.height)) }
}
