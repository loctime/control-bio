import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react"
import type { UserProfile, Link, Section } from "@/types"
import type { Metadata } from "next"
import { ExpandableSections } from "./ExpandableSections"

interface ProfilePageProps {
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

    // Get user's links
    console.log("Buscando enlaces para userId:", userId)
    const linksQuery = query(
      collection(db, "apps/controlbio/links"),
      where("userId", "==", userId),
      where("isActive", "==", true)
    )
    const linksSnap = await getDocs(linksQuery)
    console.log("Documentos de enlaces encontrados:", linksSnap.docs.length)
    
    const links = linksSnap.docs.map((doc) => {
      const data = doc.data()
      console.log("Procesando enlace:", data.title, "ID:", doc.id)
      
      // Manejar fechas que pueden ser Date o string
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                       (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString())
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 
                       (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString())
      
      return {
        ...data,
        id: doc.id,
        createdAt,
        updatedAt,
      } as Link
    })
    
    // Ordenar manualmente por el campo order
    links.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    console.log("Enlaces procesados y ordenados:", links.length)

    // Get user's sections
    console.log("Buscando secciones para userId:", userId)
    let sections: Section[] = []
    
    try {
      // Consulta simplificada sin orderBy para evitar problemas de índices
      const sectionsQuery = query(
        collection(db, "apps/controlbio/sections"),
        where("userId", "==", userId)
      )
      const sectionsSnap = await getDocs(sectionsQuery)
      console.log("Documentos de secciones encontrados:", sectionsSnap.docs.length)
      
      // Debug: ver todos los documentos sin procesar
      sectionsSnap.docs.forEach((doc, index) => {
        const data = doc.data()
        console.log(`Sección ${index + 1}:`, {
          id: doc.id,
          title: data.title,
          isActive: data.isActive,
          userId: data.userId,
          order: data.order
        })
      })
      
      sections = sectionsSnap.docs.map((doc) => {
        const data = doc.data()
        console.log("Procesando sección:", data.title, "ID:", doc.id, "isActive:", data.isActive, "order:", data.order)
        
        // Manejar fechas que pueden ser Date o string
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                         (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString())
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : 
                         (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString())
        
        return {
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
        } as Section
      })
      
      // Filtrar secciones activas y ordenar manualmente
      sections = sections
        .filter(section => section.isActive)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      
      console.log("Secciones activas procesadas:", sections.length)
      console.log("Secciones activas data:", sections)
    } catch (error) {
      console.error("Error cargando secciones:", error)
      console.error("Detalles del error de secciones:", {
        message: error instanceof Error ? error.message : 'Error desconocido',
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      })
      console.log("Continuando sin secciones...")
      sections = []
    }

    return { profile: profileData, links, sections }
  } catch (error) {
    console.error("Error fetching profile:", error)
    console.error("Detalles del error:", {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const data = await getProfileByUsername(username)
  
  if (!data) {
    return {
      title: "Perfil no encontrado - ControlBio",
      description: "El perfil que buscas no existe",
    }
  }
  
  const { profile } = data
  
  return {
    title: `${profile.displayName} - ControlBio`,
    description: profile.bio || `Perfil de ${profile.displayName} en ControlBio`,
    openGraph: {
      title: profile.displayName,
      description: profile.bio || `Perfil de ${profile.displayName}`,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: profile.displayName,
      description: profile.bio || `Perfil de ${profile.displayName}`,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const data = await getProfileByUsername(username)

  if (!data) {
    notFound()
  }

  const { profile, links, sections } = data
  const theme = profile.theme

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Profile Card */}
        <div 
          className="rounded-lg overflow-hidden shadow-2xl mb-8"
          style={{ backgroundColor: `${theme.backgroundColor}dd` }}
        >
          {/* Banner */}
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
            {profile.bannerUrl ? (
              <img 
                src={profile.bannerUrl} 
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
            )}
          </div>
          
          {/* Profile Info */}
          <div className="text-center mb-8 space-y-4 px-8 pb-8">
            <div className="flex justify-center -mt-24">
              <Avatar className="h-32 w-32 border-4 shadow-lg" style={{ borderColor: theme.backgroundColor }}>
                <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} alt={profile.displayName} />
                <AvatarFallback
                  className="text-3xl"
                  style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
                >
                  {profile.displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h1 className="text-5xl font-bold">{profile.displayName}</h1>
                <p className="opacity-60 text-xl">@{profile.username}</p>
              </div>
            </div>
            {profile.bio && <p className="text-lg opacity-90 max-w-md mx-auto whitespace-pre-wrap">{profile.bio}</p>}
          </div>
        </div>

        {/* Links and Sections */}
        <div className="space-y-4 max-w-md mx-auto">
          <ExpandableSections 
            links={links} 
            sections={sections} 
            theme={theme}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 opacity-60">
          <p className="text-sm">
            Creado con <span className="font-bold">ControlBio</span>
          </p>
        </div>
      </div>
    </div>
  )
}
