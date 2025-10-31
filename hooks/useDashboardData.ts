import { useEffect, useState } from "react"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile, Link, Section, Carousel } from "@/types"

interface UseDashboardDataReturn {
  profile: UserProfile | null
  links: Link[]
  sections: Section[]
  carousels: Carousel[]
  loading: boolean
  refetch: () => Promise<void>
}

export function useDashboardData(userId: string): UseDashboardDataReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [carousels, setCarousels] = useState<Carousel[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!userId) return

    try {
      console.log("Loading profile for user:", userId)
      
      const profileRef = doc(db, "apps/controlbio/users", userId)
      const profileSnap = await getDoc(profileRef)

      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile
        setProfile(data)
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          uid: userId,
          username: `user${userId.slice(0, 8)}`,
          displayName: "Usuario",
          email: "",
          bio: "",
          avatarUrl: "",
          theme: {
            backgroundColor: "#0a0a0a",
            textColor: "#ffffff",
            buttonColor: "#ff6b35",
            buttonTextColor: "#ffffff",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        console.log("Creating default profile:", defaultProfile)
        await setDoc(profileRef, defaultProfile)
        setProfile(defaultProfile)
      }

      // Load links
      console.log("Loading links for user:", userId)
      const linksQuery = query(
        collection(db, "apps/controlbio/links"),
        where("userId", "==", userId),
        orderBy("order", "asc")
      )
      const linksSnap = await getDocs(linksQuery)
      const linksData = linksSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Link)
      setLinks(linksData)
      console.log("Loaded links:", linksData)

      // Load sections
      console.log("Loading sections for user:", userId)
      const sectionsQuery = query(
        collection(db, "apps/controlbio/sections"),
        where("userId", "==", userId),
        orderBy("order", "asc")
      )
      const sectionsSnap = await getDocs(sectionsQuery)
      const sectionsData = sectionsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Section)
      setSections(sectionsData)
      console.log("Loaded sections:", sectionsData)

      // Load carousels
      console.log("Loading carousels for user:", userId)
      const carouselsQuery = query(
        collection(db, "apps/controlbio/carousels"),
        where("userId", "==", userId),
        orderBy("order", "asc")
      )
      const carouselsSnap = await getDocs(carouselsQuery)
      const carouselsData = carouselsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Carousel)
      setCarousels(carouselsData)
      console.log("Loaded carousels:", carouselsData)

      setLoading(false)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  return {
    profile,
    links,
    sections,
    carousels,
    loading,
    refetch: loadData,
  }
}

