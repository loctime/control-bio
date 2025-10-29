import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Carousel } from '@/types'
import { getDownloadUrl } from './controlfile-client'

// Crear nuevo carrusel
export async function createCarousel(data: Omit<Carousel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const carouselData = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  const docRef = await addDoc(collection(db, 'apps/controlbio/carousels'), carouselData)
  return docRef.id
}

// Obtener un carrusel por ID
export async function getCarousel(carouselId: string): Promise<Carousel | null> {
  const carouselRef = doc(db, 'apps/controlbio/carousels', carouselId)
  const carouselSnap = await getDoc(carouselRef)
  
  if (!carouselSnap.exists()) {
    return null
  }
  
  return { id: carouselSnap.id, ...carouselSnap.data() } as Carousel
}

// Obtener todos los carruseles de un usuario
export async function getUserCarousels(userId: string): Promise<Carousel[]> {
  const carouselsQuery = query(
    collection(db, 'apps/controlbio/carousels'),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  )
  
  const carouselsSnap = await getDocs(carouselsQuery)
  return carouselsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Carousel))
}

// Actualizar un carrusel
export async function updateCarousel(carouselId: string, data: Partial<Carousel>): Promise<void> {
  const carouselRef = doc(db, 'apps/controlbio/carousels', carouselId)
  await updateDoc(carouselRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

// Eliminar un carrusel
export async function deleteCarousel(carouselId: string): Promise<void> {
  const carouselRef = doc(db, 'apps/controlbio/carousels', carouselId)
  await deleteDoc(carouselRef)
}

// Duplicar un carrusel
export async function duplicateCarousel(carouselId: string, userId: string): Promise<string> {
  const original = await getCarousel(carouselId)
  if (!original) {
    throw new Error('Carrusel no encontrado')
  }
  
  const duplicated = await createCarousel({
    userId,
    name: `${original.name} (Copia)`,
    description: original.description,
    type: original.type,
    imageFileIds: [...original.imageFileIds],
    order: original.order,
    isActive: false,
  })
  
  return duplicated
}

// Cargar URLs presignadas de imágenes
export async function loadCarouselImageUrls(fileIds: string[]): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  
  // Intentar cargar todas las URLs en paralelo
  const loadPromises = fileIds.map(async (fileId) => {
    try {
      const url = await getDownloadUrl(fileId)
      urls[fileId] = url
    } catch (error) {
      console.error(`Error cargando imagen ${fileId}:`, error)
    }
  })
  
  await Promise.all(loadPromises)
  return urls
}

// Validar que los fileIds sean imágenes
export async function validateCarouselImages(fileIds: string[]): Promise<boolean> {
  // Esta validación se puede implementar consultando Firestore
  // Por ahora retornamos true
  return true
}


