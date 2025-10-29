import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { notFound } from "next/navigation"
import { GalleryGrid } from "@/components/GalleryGrid"
import { getDownloadUrl } from "@/lib/controlfile-client"
import { loadGalleryLayout } from "@/lib/gallery-actions"
import type { GalleryLayout, UserProfile } from "@/types"
import type { Metadata } from "next"

interface GalleryPageProps {
  params: Promise<{
    username: string
  }>
}

async function getProfileByUsername(username: string) {
  try {
    console.log("Buscando perfil para username:", username)
    
    const profilesQuery = query(collection(db, "apps/controlbio/users"), where("username", "==", username))
    const profilesSnap = await getDocs(profilesQuery)

    console.log("Resultados de la consulta de perfiles:", profilesSnap.docs.length)

    if (profilesSnap.empty) {
      console.log("No se encontró perfil para username:", username)
      return null
    }

    const profileData = profilesSnap.docs[0].data() as UserProfile
    const userId = profilesSnap.docs[0].id
    console.log("Perfil encontrado:", profileData.displayName, "ID:", userId)

    return { profile: profileData, userId }
  } catch (error) {
    console.error("Error obteniendo perfil:", error)
    return null
  }
}

async function getGalleryLayout(userId: string): Promise<GalleryLayout | null> {
  try {
    return await loadGalleryLayout(userId)
  } catch (error) {
    console.error("Error cargando layout de galería:", error)
    return null
  }
}

async function getGalleryFiles(userId: string) {
  try {
    // Leer archivos desde la colección 'files' de Firestore
    const filesQuery = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    )
    
    const filesSnap = await getDocs(filesQuery)
    const files = filesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    
    // Filtrar archivos de la galería (que están en la subcarpeta "Galería")
    const galleryFiles = files.filter(file => 
      file.ancestors && file.ancestors.includes('folder-1761714238477-gb2vxpi78') &&
      (file.mime?.startsWith('image/') || file.mime?.startsWith('video/'))
    )
    
    // Cargar URLs de descarga en paralelo
    const filesWithUrls = await Promise.all(
      galleryFiles.map(async (file) => {
        try {
          const url = await getDownloadUrl(file.id)
          return { 
            id: file.id,
            fileId: file.id,
            name: file.name,
            mime: file.mime,
            url 
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
  const data = await getProfileByUsername(username)

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
  const data = await getProfileByUsername(username)

  if (!data) {
    notFound()
  }

  const { profile, userId } = data

  // Cargar layout y archivos de la galería
  const [layout, files] = await Promise.all([
    getGalleryLayout(userId),
    getGalleryFiles(userId)
  ])

  if (!layout) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Galería no configurada</h1>
          <p className="text-muted-foreground">
            {profile.displayName} aún no ha configurado su galería pública.
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
