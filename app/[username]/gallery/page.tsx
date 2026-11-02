import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { notFound } from "next/navigation"
import { GalleryGrid } from "@/components/GalleryGrid"
import type { GalleryLayout, UserProfile } from "@/types"
import type { Metadata } from "next"

interface GalleryPageProps {
  params: Promise<{
    username: string
  }>
}

async function getProfileByUsername(username: string) {
  try {
    // Decodificar el username de la URL (por si viene con %20 o caracteres especiales)
    const decodedUsername = decodeURIComponent(username).trim()
    console.log("Buscando perfil para username (original):", username)
    console.log("Buscando perfil para username (decodificado):", decodedUsername)
    
    // Primero intentar búsqueda exacta por username
    let profilesQuery = query(collection(db, "apps/controlbio/users"), where("username", "==", decodedUsername))
    let profilesSnap = await getDocs(profilesQuery)

    console.log("Resultados de la consulta por username:", profilesSnap.docs.length)

    // Si no se encuentra por username, intentar por displayName
    if (profilesSnap.empty) {
      console.log("No se encontró por username, intentando por displayName...")
      profilesQuery = query(collection(db, "apps/controlbio/users"), where("displayName", "==", decodedUsername))
      profilesSnap = await getDocs(profilesQuery)
      console.log("Resultados de la consulta por displayName:", profilesSnap.docs.length)
    }

    if (profilesSnap.empty) {
      console.log("No se encontró perfil para username/displayName:", decodedUsername)
      
      // Intentar búsqueda normalizada (sin espacios, minúsculas)
      const normalizedSearch = decodedUsername.replace(/\s+/g, '').toLowerCase()
      console.log("Intentando búsqueda normalizada (sin espacios, minúsculas):", normalizedSearch)
      
      // Obtener todos los perfiles y filtrar en memoria (ya que no podemos hacer case-insensitive en Firestore)
      const allProfilesQuery = query(collection(db, "apps/controlbio/users"))
      const allProfilesSnap = await getDocs(allProfilesQuery)
      
      const matchingProfile = allProfilesSnap.docs.find(doc => {
        const data = doc.data() as UserProfile
        const profileUsername = (data.username || '').replace(/\s+/g, '').toLowerCase()
        const profileDisplayName = (data.displayName || '').replace(/\s+/g, '').toLowerCase()
        return profileUsername === normalizedSearch || profileDisplayName === normalizedSearch
      })
      
      if (matchingProfile) {
        console.log("✅ Perfil encontrado mediante búsqueda normalizada")
        const profileData = matchingProfile.data() as UserProfile
        const userId = matchingProfile.id
        console.log("✅ Perfil encontrado:", profileData.displayName, "Username:", profileData.username, "ID:", userId)
        return { profile: profileData, userId }
      }
    }

    if (profilesSnap.empty) {
      console.log("No se encontró perfil después de todos los intentos")
      return null
    }

    const profileData = profilesSnap.docs[0].data() as UserProfile
    const userId = profilesSnap.docs[0].id
    console.log("✅ Perfil encontrado:", profileData.displayName, "Username:", profileData.username, "ID:", userId)

    return { profile: profileData, userId }
  } catch (error) {
    console.error("Error obteniendo perfil:", error)
    return null
  }
}

async function getGalleryLayout(userId: string): Promise<GalleryLayout | null> {
  try {
    console.log('🔍 Buscando layout de galería para userId:', userId)
    // Versión servidor: cargar layout directamente desde Firestore
    const layoutRef = doc(db, 'apps/controlbio/galleryLayouts', userId)
    console.log('📄 Intentando leer documento:', layoutRef.path)
    
    const layoutSnap = await getDoc(layoutRef)
    console.log('📄 Resultado de getDoc - existe:', layoutSnap.exists())
    
    if (!layoutSnap.exists()) {
      console.log('📝 No existe layout de galería para el usuario:', userId)
      console.log('💡 El usuario necesita guardar el layout desde el editor de galería')
      return null
    }
    
    const layoutData = layoutSnap.data() as GalleryLayout
    console.log('✅ Layout de galería cargado:', {
      items: layoutData.items?.length || 0,
      settings: layoutData.settings,
      isPublic: layoutData.isPublic
    })
    return layoutData
  } catch (error) {
    console.error("❌ Error cargando layout de galería:", error)
    if (error instanceof Error) {
      console.error("❌ Error details:", error.message, error.stack)
    }
    return null
  }
}

async function getGalleryFiles(userId: string) {
  try {
    // Obtener la carpeta principal de ControlBio para este usuario
    const rootFolderId = `controlbio-main-${userId}`
    
    // Buscar la carpeta "Galería" en Firestore
    // Primero buscar todas las carpetas del usuario
    const foldersQuery = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      where('type', '==', 'folder'),
      where('name', '==', 'Galería'),
      where('deletedAt', '==', null)
    )
    
    const foldersSnap = await getDocs(foldersQuery)
    let galleryFolderId: string | null = null
    
    // Buscar la carpeta que tenga como ancestro la carpeta principal
    foldersSnap.docs.forEach(doc => {
      const folder = doc.data()
      if (folder.ancestors && folder.ancestors.includes(rootFolderId)) {
        galleryFolderId = doc.id
      }
    })
    
    // Si no se encuentra la carpeta, intentar buscar por el patrón de ID conocido
    if (!galleryFolderId) {
      console.log('⚠️ No se encontró carpeta Galería, buscando archivos por patrón alternativo...')
      // Buscar archivos que tengan "Galería" en el path o en el nombre del padre
      galleryFolderId = rootFolderId // Usar la carpeta principal como fallback
    }
    
    console.log('📂 Gallery folder ID encontrado:', galleryFolderId)
    
    // Leer archivos desde la colección 'files' de Firestore
    const filesQuery = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    )
    
    const filesSnap = await getDocs(filesQuery)
    const files = filesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    
    // Filtrar archivos de la galería (que están en la subcarpeta "Galería" o en cualquier subcarpeta de ControlBio)
    const galleryFiles = files.filter(file => {
      if (!file.ancestors) return false
      
      // Verificar si está en la carpeta Galería específica
      if (galleryFolderId && file.ancestors.includes(galleryFolderId)) {
        return file.mime?.startsWith('image/') || file.mime?.startsWith('video/')
      }
      
      // Verificar si está en alguna subcarpeta de ControlBio que se llame "Galería"
      const isInControlBio = file.ancestors.includes(rootFolderId)
      if (isInControlBio) {
        // Buscar si hay una carpeta "Galería" en los ancestros
        const hasGalleryFolder = foldersSnap.docs.some(folderDoc => 
          file.ancestors.includes(folderDoc.id) && folderDoc.data().name === 'Galería'
        )
        if (hasGalleryFolder) {
          return file.mime?.startsWith('image/') || file.mime?.startsWith('video/')
        }
      }
      
      return false
    })
    
    // Cargar URLs de descarga (versión pública, sin autenticación del usuario actual)
    const filesWithUrls = await Promise.all(
      galleryFiles.map(async (file) => {
        try {
          // Si el archivo ya tiene downloadURL guardado, usarlo
          if (file.downloadURL) {
            return { 
              id: file.id,
              fileId: file.id,
              name: file.name,
              mime: file.mime,
              url: file.downloadURL
            }
          }
          
          // Si no, intentar obtenerlo del backend (solo para archivos del usuario de la galería)
          // Nota: En producción, esto debería ser una API route que genere URLs públicas firmadas
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://controlfile.onrender.com'
          
          // Por ahora, solo retornar undefined si no hay URL guardada
          // En el futuro, podrías crear un endpoint público que genere URLs firmadas
          console.warn(`Archivo ${file.id} no tiene downloadURL guardado`)
          return { 
            id: file.id,
            fileId: file.id,
            name: file.name,
            mime: file.mime,
            url: undefined
          }
        } catch (error) {
          console.error(`Error cargando URL para ${file.id}:`, error)
          return { 
            id: file.id,
            fileId: file.id,
            name: file.name,
            mime: file.mime,
            url: undefined
          }
        }
      })
    )
    
    return filesWithUrls
  } catch (error) {
    console.error("Error cargando archivos de galería:", error)
    return []
  }
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username).trim()
  const data = await getProfileByUsername(decodedUsername)

  if (!data) {
    return {
      title: "Galería no encontrada",
      description: "La galería que buscas no existe o no está disponible.",
    }
  }

  const { profile } = data

  return {
    title: `Galería de ${profile.displayName} (@${profile.username})`,
    description: `Explora la galería personal de ${profile.displayName} en ControlBio.`,
    openGraph: {
      title: `Galería de ${profile.displayName}`,
      description: `Explora la galería personal de ${profile.displayName} en ControlBio.`,
      type: "website",
      url: `https://controlbio.vercel.app/${username}/gallery`,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  }
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { username } = await params
  // Decodificar el username de la URL
  const decodedUsername = decodeURIComponent(username).trim()
  const data = await getProfileByUsername(decodedUsername)

  if (!data) {
    notFound()
  }

  const { profile, userId } = data

  console.log('🎨 Cargando datos de galería para:', profile.displayName, 'userId:', userId)

  // Cargar layout y archivos de la galería
  const [layout, files] = await Promise.all([
    getGalleryLayout(userId),
    getGalleryFiles(userId)
  ])

  console.log('📊 Resultados:', {
    layout: layout ? `Existe (${layout.items?.length || 0} items)` : 'No existe',
    files: `${files.length} archivos encontrados`
  })

  if (!layout) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Galería no configurada</h1>
          <p className="text-muted-foreground mb-4">
            {profile.displayName} aún no ha configurado su galería pública.
          </p>
          <p className="text-sm text-muted-foreground">
            Para configurar tu galería, ve a tu Dashboard y guarda el layout desde el editor de galería.
          </p>
        </div>
      </div>
    )
  }

  const theme = profile.theme || {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff'
  }

  return (
    <div
      className="min-h-screen py-6 sm:py-12 px-3 sm:px-4"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header de la galería */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Galería de {profile.displayName}
          </h1>
          <p className="text-muted-foreground">
            @{profile.username}
          </p>
        </div>

        {/* Grid de la galería */}
        <div className="flex justify-center">
          <GalleryGrid
            layout={layout}
            files={files}
            isEditable={false}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Galería creada con ControlBio</p>
        </div>
      </div>
    </div>
  )
}
