import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
  setCarousels: React.Dispatch<React.SetStateAction<Carousel[]>>
  refetch: () => Promise<void>
}

const loadProfile = async (userId: string, authUser?: any): Promise<UserProfile> => {
  console.log("Loading profile for user:", userId)
  
  const profileRef = doc(db, "apps/controlbio/users", userId)
  const profileSnap = await getDoc(profileRef)

  if (profileSnap.exists()) {
    const data = profileSnap.data() as UserProfile
    return data
  } else {
    // Create default profile
    const username = authUser?.email?.split("@")[0] || `user${userId.slice(0, 8)}`
    const defaultProfile: UserProfile = {
      uid: userId,
      username: username,
      displayName: authUser?.displayName || "Usuario",
      email: authUser?.email || "",
      bio: "",
      avatarUrl: authUser?.photoURL || "",
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
    return defaultProfile
  }
}

const loadLinks = async (userId: string): Promise<Link[]> => {
  console.log("Loading links for user:", userId)
  const linksQuery = query(
    collection(db, "apps/controlbio/links"),
    where("userId", "==", userId),
    orderBy("order", "asc")
  )
  const linksSnap = await getDocs(linksQuery)
  const linksData = linksSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Link)
  console.log("Loaded links:", linksData)
  return linksData
}

const loadSections = async (userId: string): Promise<Section[]> => {
  console.log("Loading sections for user:", userId)
  const sectionsQuery = query(
    collection(db, "apps/controlbio/sections"),
    where("userId", "==", userId),
    orderBy("order", "asc")
  )
  const sectionsSnap = await getDocs(sectionsQuery)
  const sectionsData = sectionsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Section)
  console.log("Loaded sections:", sectionsData)
  return sectionsData
}

const loadCarousels = async (userId: string): Promise<Carousel[]> => {
  console.log("Loading carousels for user:", userId)
  const carouselsQuery = query(
    collection(db, "apps/controlbio/carousels"),
    where("userId", "==", userId),
    orderBy("order", "asc")
  )
  const carouselsSnap = await getDocs(carouselsQuery)
  const carouselsData = carouselsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Carousel)
  console.log("Loaded carousels:", carouselsData)
  return carouselsData
}

export function useDashboardData(userId: string, authUser?: any): UseDashboardDataReturn {
  const queryClient = useQueryClient()

  // Query para perfil
  const { data: profile = null, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => loadProfile(userId, authUser),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })

  // Query para links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["links", userId],
    queryFn: () => loadLinks(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })

  // Query para sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["sections", userId],
    queryFn: () => loadSections(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })

  // Query para carousels
  const { data: carousels = [], isLoading: carouselsLoading } = useQuery({
    queryKey: ["carousels", userId],
    queryFn: () => loadCarousels(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })

  const loading = profileLoading || linksLoading || sectionsLoading || carouselsLoading

  // Mutaciones para actualizar cache
  const setProfile = (updater: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
    if (typeof updater === 'function') {
      queryClient.setQueryData(["profile", userId], updater)
    } else {
      queryClient.setQueryData(["profile", userId], updater)
    }
  }

  const setLinks = (updater: Link[] | ((prev: Link[]) => Link[])) => {
    if (typeof updater === 'function') {
      queryClient.setQueryData(["links", userId], updater)
    } else {
      queryClient.setQueryData(["links", userId], updater)
    }
  }

  const setSections = (updater: Section[] | ((prev: Section[]) => Section[])) => {
    if (typeof updater === 'function') {
      queryClient.setQueryData(["sections", userId], updater)
    } else {
      queryClient.setQueryData(["sections", userId], updater)
    }
  }

  const setCarousels = (updater: Carousel[] | ((prev: Carousel[]) => Carousel[])) => {
    if (typeof updater === 'function') {
      queryClient.setQueryData(["carousels", userId], updater)
    } else {
      queryClient.setQueryData(["carousels", userId], updater)
    }
  }

  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
      queryClient.invalidateQueries({ queryKey: ["links", userId] }),
      queryClient.invalidateQueries({ queryKey: ["sections", userId] }),
      queryClient.invalidateQueries({ queryKey: ["carousels", userId] }),
    ])
  }

  return {
    profile,
    links,
    sections,
    carousels,
    loading,
    setProfile,
    setLinks,
    setSections,
    setCarousels,
    refetch,
  }
}
