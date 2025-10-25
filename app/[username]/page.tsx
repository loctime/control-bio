import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink } from "lucide-react"
import type { UserProfile, Link } from "@/types"
import type { Metadata } from "next"

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

async function getProfileByUsername(username: string) {
  try {
    const profilesQuery = query(collection(db, "apps/controlbio/users"), where("username", "==", username))
    const profilesSnap = await getDocs(profilesQuery)

    if (profilesSnap.empty) {
      return null
    }

    const profileData = profilesSnap.docs[0].data() as UserProfile
    const userId = profilesSnap.docs[0].id

    // Get user's links
    const linksQuery = query(
      collection(db, "apps/controlbio/links"),
      where("userId", "==", userId),
      where("isActive", "==", true),
      orderBy("order", "asc"),
    )
    const linksSnap = await getDocs(linksQuery)
    const links = linksSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Link)

    return { profile: profileData, links }
  } catch (error) {
    console.error("Error fetching profile:", error)
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

  const { profile, links } = data
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
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <Avatar className="h-24 w-24 mx-auto">
            <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} alt={profile.displayName} />
            <AvatarFallback
              className="text-2xl"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
            >
              {profile.displayName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold mb-2">{profile.displayName}</h1>
            <p className="opacity-80">@{profile.username}</p>
          </div>
          {profile.bio && <p className="text-lg opacity-90 max-w-md mx-auto whitespace-pre-wrap">{profile.bio}</p>}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <p>No hay enlaces disponibles</p>
            </div>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target={link.type === "external" ? "_blank" : "_self"}
                rel={link.type === "external" ? "noopener noreferrer" : undefined}
                className="block w-full p-4 rounded-lg transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg">{link.title}</h3>
                    {link.description && <p className="text-sm opacity-90 mt-1">{link.description}</p>}
                  </div>
                  {link.type === "external" && <ExternalLink className="h-5 w-5 ml-3 flex-shrink-0" />}
                </div>
              </a>
            ))
          )}
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
