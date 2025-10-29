"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import NextLink from "next/link"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  writeBatch,
  deleteField,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { UserProfile, Link, Section, Carousel } from "@/types"
import { ExternalLink, GripVertical, Pencil, Plus, Trash2, Eye, Copy, FolderOpen, Upload, X } from "lucide-react"
import { ControlBioFileManager } from "@/components/ControlBioFileManager"
import { CarouselManager } from "@/components/dashboard/CarouselManager"
import { 
  getControlBioFolder, 
  uploadFile, 
  getDownloadUrl, 
  ensureFolderExists 
} from "@/lib/controlfile-client"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [carousels, setCarousels] = useState<Carousel[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Individual field editing states
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingBio, setEditingBio] = useState(false)

  // Form state for profile
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  // Form state for theme
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [textColor, setTextColor] = useState("#000000")
  const [buttonColor, setButtonColor] = useState("#000000")
  const [buttonTextColor, setButtonTextColor] = useState("#ffffff")

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [linkType, setLinkType] = useState<"external" | "internal">("external")
  const [linkActive, setLinkActive] = useState(true)
  const [linkSectionId, setLinkSectionId] = useState<string>("")

  // Section dialog state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [sectionTitle, setSectionTitle] = useState("")
  const [sectionDescription, setSectionDescription] = useState("")
  const [sectionType, setSectionType] = useState<'links' | 'carousel'>('links')
  const [sectionCarouselId, setSectionCarouselId] = useState<string>("")
  const [sectionActive, setSectionActive] = useState(true)

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        console.log("Loading profile for user:", user.uid)
        console.log("User auth token:", await user.getIdToken())
        
        const profileRef = doc(db, "apps/controlbio/users", user.uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfile
          setProfile(data)
          setDisplayName(data.displayName || "")
          setUsername(data.username || "")
          setBio(data.bio || "")
          setAvatarUrl(data.avatarUrl || "")
          
          // Valores por defecto para el tema si no existe
          const defaultTheme = {
            backgroundColor: "#1f1f1f",
            textColor: "#f5f5f5",
            buttonColor: "#ff6b35",
            buttonTextColor: "#1f1f1f",
          }
          
          const theme = data.theme || defaultTheme
          setBackgroundColor(theme.backgroundColor || defaultTheme.backgroundColor)
          setTextColor(theme.textColor || defaultTheme.textColor)
          setButtonColor(theme.buttonColor || defaultTheme.buttonColor)
          setButtonTextColor(theme.buttonTextColor || defaultTheme.buttonTextColor)
        } else {
          // Create default profile
          const username = user.email?.split("@")[0] || user.uid.slice(0, 8)
          const defaultProfile: UserProfile = {
            uid: user.uid,
            username: username,
            displayName: user.displayName || "Usuario",
            email: user.email || "",
            bio: "",
            avatarUrl: user.photoURL || "",
            theme: {
              backgroundColor: "#0a0a0a",
              textColor: "#ffffff",
              buttonColor: "#ff6b35",
              buttonTextColor: "#ffffff",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          console.log("Creando perfil por defecto:", defaultProfile)
          await setDoc(profileRef, defaultProfile)
          setProfile(defaultProfile)
          setDisplayName(defaultProfile.displayName)
          setUsername(defaultProfile.username)
          setBio(defaultProfile.bio)
          setAvatarUrl(defaultProfile.avatarUrl)
          setBackgroundColor(defaultProfile.theme?.backgroundColor || "#0a0a0a")
          setTextColor(defaultProfile.theme?.textColor || "#ffffff")
          setButtonColor(defaultProfile.theme?.buttonColor || "#ff6b35")
          setButtonTextColor(defaultProfile.theme?.buttonTextColor || "#ffffff")
        }

        // Load links
        console.log("Loading links for user:", user.uid)
        const linksQuery = query(collection(db, "apps/controlbio/links"), where("userId", "==", user.uid), orderBy("order", "asc"))
        const linksSnap = await getDocs(linksQuery)
        const linksData = linksSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Link)
        setLinks(linksData)
        console.log("Loaded links:", linksData)

        // Load sections
        console.log("Loading sections for user:", user.uid)
        const sectionsQuery = query(collection(db, "apps/controlbio/sections"), where("userId", "==", user.uid), orderBy("order", "asc"))
        const sectionsSnap = await getDocs(sectionsQuery)
        const sectionsData = sectionsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Section)
        setSections(sectionsData)
        console.log("Loaded sections:", sectionsData)

        // Load carousels
        console.log("Loading carousels for user:", user.uid)
        const carouselsQuery = query(collection(db, "apps/controlbio/carousels"), where("userId", "==", user.uid), orderBy("order", "asc"))
        const carouselsSnap = await getDocs(carouselsQuery)
        const carouselsData = carouselsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Carousel)
        setCarousels(carouselsData)
        console.log("Loaded carousels:", carouselsData)
      } catch (error) {
        console.error("Error loading profile:", error)
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : 'unknown'
        console.error("Error details:", {
          code: errorCode,
          message: errorMessage,
          user: user?.uid,
          authenticated: !!user
        })
        toast({
          title: "Error",
          description: `No se pudo cargar el perfil: ${errorMessage}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, toast])

  const handleAvatarUpload = async (file: File) => {
    if (!user) return

    setUploadingAvatar(true)
    try {
      // 1. Obtener o crear la carpeta ControlBio en Firestore
      const controlBioFolderId = await getControlBioFolder()
      
      // 2. Crear subcarpeta "Fotos de perfil" si no existe (Firestore)
      const fotosPerfilFolderId = await ensureFolderExists("Fotos de perfil", controlBioFolderId)
      
      // 3. Subir archivo a ControlFile usando la API (igual que tab Archivos)
      const fileId = await uploadFile(file, fotosPerfilFolderId, (progress) => {
        console.log(`Subiendo avatar: ${progress}%`)
      })
      
      // 4. Obtener URL presignada para vista previa (API de ControlFile)
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://controlfile.onrender.com'}/api/files/presign-get`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })
      
      if (!response.ok) {
        throw new Error('Error al obtener URL de vista previa')
      }
      
      const { downloadUrl } = await response.json()
      
      // 5. Actualizar estado local con la URL presignada
      setAvatarPreview(downloadUrl)
      setAvatarUrl(downloadUrl)
      
      // 6. Guardar automáticamente el avatar en el perfil del usuario
      if (profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          uid: user.uid,
          avatarUrl: downloadUrl,
          updatedAt: new Date(),
        }

        const profileRef = doc(db, "apps/controlbio/users", user.uid)
        await setDoc(profileRef, updatedProfile)
        setProfile(updatedProfile)
      }
      
      toast({
        title: "Avatar actualizado",
        description: "La imagen se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen a ControlFile",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveField = async (field: string) => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        uid: user.uid,
        displayName: field === 'displayName' ? displayName : profile.displayName,
        username: field === 'username' ? username : profile.username,
        bio: field === 'bio' ? bio : profile.bio,
        avatarUrl: field === 'avatar' ? (avatarPreview || avatarUrl) : profile.avatarUrl,
        updatedAt: new Date(),
      }

      const profileRef = doc(db, "apps/controlbio/users", user.uid)
      await setDoc(profileRef, updatedProfile)
      setProfile(updatedProfile)
      
      // Reset editing states
      setEditingDisplayName(false)
      setEditingUsername(false)
      setEditingBio(false)
      setAvatarPreview("")
      setAvatarFile(null)

      toast({
        title: "Campo actualizado",
        description: "El cambio se ha guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving field:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el cambio",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelField = (field: string) => {
    if (profile) {
      if (field === 'displayName') {
        setDisplayName(profile.displayName)
        setEditingDisplayName(false)
      } else if (field === 'username') {
        setUsername(profile.username)
        setEditingUsername(false)
      } else if (field === 'bio') {
        setBio(profile.bio)
        setEditingBio(false)
      } else if (field === 'avatar') {
        setAvatarUrl(profile.avatarUrl)
        setAvatarPreview("")
        setAvatarFile(null)
      }
    }
  }

  const handleSaveTheme = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        theme: {
          backgroundColor,
          textColor,
          buttonColor,
          buttonTextColor,
        },
        updatedAt: new Date(),
      }

      const profileRef = doc(db, "apps/controlbio/users", user.uid)
      await setDoc(profileRef, updatedProfile)
      setProfile(updatedProfile)

      toast({
        title: "Tema actualizado",
        description: "Tu personalización se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error("Error saving theme:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el tema",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }


  const openLinkDialog = (link?: Link) => {
    if (link) {
      setEditingLink(link)
      setLinkTitle(link.title)
      setLinkUrl(link.url)
      setLinkDescription(link.description || "")
      setLinkType(link.type)
      setLinkActive(link.isActive)
      setLinkSectionId(link.sectionId || "")
    } else {
      setEditingLink(null)
      setLinkTitle("")
      setLinkUrl("")
      setLinkDescription("")
      setLinkType("external")
      setLinkActive(true)
      setLinkSectionId("")
    }
    setLinkDialogOpen(true)
  }

  const openSectionDialog = (section?: Section) => {
    if (section) {
      setEditingSection(section)
      setSectionTitle(section.title)
      setSectionDescription(section.description || "")
      setSectionType(section.type || 'links')
      setSectionCarouselId(section.carouselId || "")
      setSectionActive(section.isActive)
    } else {
      setEditingSection(null)
      setSectionTitle("")
      setSectionDescription("")
      setSectionType('links')
      setSectionCarouselId("")
      setSectionActive(true)
    }
    setSectionDialogOpen(true)
  }

  const normalizeUrl = (url: string, type: "external" | "internal"): string => {
    if (type === "internal") {
      return url
    }
    
    // Para enlaces externos, asegurar que tengan protocolo
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`
    }
    
    return url
  }

  const handleSaveLink = async () => {
    if (!user) {
      console.error("No user authenticated")
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Saving link for user:", user.uid)
      console.log("User auth token:", await user.getIdToken())
      
      // Normalizar la URL antes de guardar
      const normalizedUrl = normalizeUrl(linkUrl, linkType)
      
      if (editingLink) {
        // Update existing link
        const linkRef = doc(db, "apps/controlbio/links", editingLink.id)
        await updateDoc(linkRef, {
          title: linkTitle,
          url: normalizedUrl,
          description: linkDescription,
          type: linkType,
          isActive: linkActive,
          sectionId: linkSectionId || undefined,
          updatedAt: new Date(),
        })

        setLinks(
          links.map((l) =>
            l.id === editingLink.id
              ? {
                  ...l,
                  title: linkTitle,
                  url: normalizedUrl,
                  description: linkDescription,
                  type: linkType,
                  isActive: linkActive,
                  sectionId: linkSectionId || undefined,
                  updatedAt: new Date().toISOString(),
                }
              : l,
          ),
        )

        toast({
          title: "Enlace actualizado",
          description: "El enlace se ha actualizado correctamente",
        })
      } else {
        // Create new link
        const newLink = {
          userId: user.uid,
          title: linkTitle,
          url: normalizedUrl,
          description: linkDescription,
          type: linkType,
          isActive: linkActive,
          sectionId: linkSectionId || undefined,
          order: links.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        console.log("Creating new link:", newLink)
        const docRef = await addDoc(collection(db, "apps/controlbio/links"), newLink)
        setLinks([...links, { ...newLink, id: docRef.id } as Link])

        toast({
          title: "Enlace creado",
          description: "El enlace se ha creado correctamente",
        })
      }

      setLinkDialogOpen(false)
    } catch (error) {
      console.error("Error saving link:", error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : 'unknown'
      console.error("Error details:", {
        code: errorCode,
        message: errorMessage,
        user: user?.uid,
        authenticated: !!user
      })
      toast({
        title: "Error",
        description: `No se pudo guardar el enlace: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteDoc(doc(db, "apps/controlbio/links", linkId))
      setLinks(links.filter((l) => l.id !== linkId))

      toast({
        title: "Enlace eliminado",
        description: "El enlace se ha eliminado correctamente",
      })
    } catch (error: any) {
      console.error("Error deleting link:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace",
        variant: "destructive",
      })
    }
  }

  const handleSaveSection = async () => {
    if (!user) {
      console.error("No user authenticated")
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingSection) {
        // Update existing section
        const sectionRef = doc(db, "apps/controlbio/sections", editingSection.id)
        const updateData: any = {
          title: sectionTitle,
          description: sectionDescription,
          isActive: sectionActive,
          updatedAt: new Date(),
        }

        if (sectionType === 'carousel') {
          updateData.type = 'carousel'
          updateData.carouselId = sectionCarouselId || undefined
        } else {
          updateData.type = 'links'
          updateData.carouselId = undefined
        }

        await updateDoc(sectionRef, updateData)

        setSections(
          sections.map((s) =>
            s.id === editingSection.id
              ? {
                  ...s,
                  title: sectionTitle,
                  description: sectionDescription,
                  type: sectionType,
                  carouselId: sectionType === 'carousel' ? sectionCarouselId : undefined,
                  isActive: sectionActive,
                  updatedAt: new Date().toISOString(),
                }
              : s,
          ),
        )

        toast({
          title: "Sección actualizada",
          description: "La sección se ha actualizado correctamente",
        })
      } else {
        // Create new section
        const newSection: any = {
          userId: user.uid,
          title: sectionTitle,
          description: sectionDescription,
          isActive: sectionActive,
          order: sections.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        if (sectionType === 'carousel') {
          newSection.type = 'carousel'
          newSection.carouselId = sectionCarouselId || undefined
        } else {
          newSection.type = 'links'
        }

        console.log("Creating new section:", newSection)
        const docRef = await addDoc(collection(db, "apps/controlbio/sections"), newSection)
        setSections([...sections, { ...newSection, id: docRef.id } as Section])

        toast({
          title: "Sección creada",
          description: "La sección se ha creado correctamente",
        })
      }

      setSectionDialogOpen(false)
    } catch (error) {
      console.error("Error saving section:", error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast({
        title: "Error",
        description: `No se pudo guardar la sección: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      // First, remove sectionId from all links in this section
      const linksInSection = links.filter(link => link.sectionId === sectionId)
      if (linksInSection.length > 0) {
        const batch = writeBatch(db)
        linksInSection.forEach(link => {
          const linkRef = doc(db, "apps/controlbio/links", link.id)
          batch.update(linkRef, { 
            sectionId: undefined,
            updatedAt: new Date()
          })
        })
        await batch.commit()
        
        // Update local state
        setLinks(links.map(link => 
          link.sectionId === sectionId 
            ? { ...link, sectionId: undefined, updatedAt: new Date().toISOString() }
            : link
        ))
      }

      // Then delete the section
      await deleteDoc(doc(db, "apps/controlbio/sections", sectionId))
      setSections(sections.filter((s) => s.id !== sectionId))

      toast({
        title: "Sección eliminada",
        description: "La sección se ha eliminado correctamente",
      })
    } catch (error: any) {
      console.error("Error deleting section:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la sección",
        variant: "destructive",
      })
    }
  }

  const handleReorderLinks = async (reorderedLinks: Link[]) => {
    if (!user) return

    try {
      // Actualizar el estado local primero
      setLinks(reorderedLinks)

      // Actualizar el orden en la base de datos usando batch
      const batch = writeBatch(db)
      
      reorderedLinks.forEach((link, index) => {
        const linkRef = doc(db, "apps/controlbio/links", link.id)
        batch.update(linkRef, { 
          order: index,
          updatedAt: new Date()
        })
      })

      await batch.commit()

      toast({
        title: "Orden actualizado",
        description: "Los enlaces se han reordenado correctamente",
      })
    } catch (error: any) {
      console.error("Error reordering links:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de los enlaces",
        variant: "destructive",
      })
    }
  }

  const handleMoveLinkToSection = async (linkId: string, sectionId: string | undefined) => {
    if (!user) return

    try {
      console.log("Moving link:", linkId, "to section:", sectionId)
      console.log("Available links:", links.map(l => ({ id: l.id, title: l.title })))
      
      // Obtener el enlace actual
      const currentLink = links.find(link => link.id === linkId)
      if (!currentLink) {
        console.error("Link not found in state:", linkId)
        console.error("Available link IDs:", links.map(l => l.id))
        throw new Error(`Enlace no encontrado: ${linkId}`)
      }

      console.log("Found link:", currentLink.title)

      // Usar updateDoc para actualizar solo el campo necesario
      const linkRef = doc(db, "apps/controlbio/links", linkId)
      
      if (sectionId) {
        // Si hay sección, asignarla
        await updateDoc(linkRef, {
          sectionId: sectionId,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Si no hay sección, eliminar el campo
        await updateDoc(linkRef, {
          sectionId: deleteField(),
          updatedAt: new Date().toISOString()
        })
      }

      // Crear el enlace actualizado para el estado local
      const updatedLink = {
        ...currentLink,
        sectionId: sectionId,
        updatedAt: new Date().toISOString()
      }

      // Actualizar el estado local
      setLinks(links.map(link => 
        link.id === linkId 
          ? updatedLink
          : link
      ))

      const sectionName = sectionId ? sections.find(s => s.id === sectionId)?.title || 'sección' : 'sin sección'
      toast({
        title: "Enlace movido",
        description: `El enlace se ha movido a ${sectionName}`,
      })
    } catch (error: any) {
      console.error("Error moving link to section:", error)
      toast({
        title: "Error",
        description: "No se pudo mover el enlace",
        variant: "destructive",
      })
    }
  }

  // Configurar drag and drop
  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(links, handleReorderLinks)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/${profile?.username}`
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copiada",
      description: "La URL de tu perfil se ha copiado al portapapeles",
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Control<span className="text-primary">Bio</span>
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <NextLink href={`/${profile.username}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver perfil
              </NextLink>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-0">
          <TabsList className="grid w-full grid-cols-6 mt-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="links">Enlaces</TabsTrigger>
            <TabsTrigger value="carousels">Carruseles</TabsTrigger>
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="theme">Personalización</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mi Perfil <span className="text-xs text-muted-foreground">({profile?.email})</span></CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Vista previa del perfil con controles integrados */}
                <div 
                  className="rounded-lg p-8 text-center space-y-6 min-h-[500px] flex flex-col justify-center relative"
                  style={{ 
                    backgroundColor: profile?.theme?.backgroundColor || "#1f1f1f",
                    color: profile?.theme?.textColor || "#f5f5f5"
                  }}
                >
                  {/* Avatar con botones pequeños */}
                  <div className="flex justify-center">
                    <div className="relative group">
                      <Avatar className="h-24 w-24">
                        <AvatarImage 
                          src={avatarPreview || profile?.avatarUrl} 
                          alt={profile?.displayName} 
                        />
                        <AvatarFallback className="text-2xl">
                          {profile?.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Botones pequeños junto al avatar */}
                      <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Botón Subir */}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setAvatarFile(file)
                                handleAvatarUpload(file)
                              }
                            }}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer text-xs"
                            title="Subir imagen"
                          >
                            {uploadingAvatar ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </label>
                        </div>
                        
                        {/* Botón URL */}
                        <button
                          onClick={() => {
                            const url = prompt("Pega la URL de la imagen:")
                            if (url) {
                              setAvatarUrl(url)
                              setAvatarPreview(url)
                              handleSaveField('avatar')
                            }
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-xs"
                          title="Usar URL"
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Nombre y usuario juntos */}
                  <div className="space-y-2">
                    {/* Nombre editable */}
                    <div className="relative group">
                      {editingDisplayName ? (
                        <div className="space-y-2">
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Tu nombre"
                            className="text-2xl font-bold text-center bg-transparent border-2 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:ring-0"
                            autoFocus
                          />
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleSaveField('displayName')}
                              disabled={saving}
                              className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelField('displayName')}
                              disabled={saving}
                              className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <h1 className="text-2xl font-bold mb-2">{profile?.displayName || "Usuario"}</h1>
                          <button
                            onClick={() => {
                              setEditingDisplayName(true)
                              setDisplayName(profile?.displayName || "")
                            }}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Username editable */}
                    <div className="relative group">
                      {editingUsername ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="tunombre"
                              className="text-lg text-center bg-transparent border-2 border-white/20 text-white/80 placeholder-white/40 focus:border-white/40 focus:ring-0 pl-6"
                              autoFocus
                            />
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40">@</span>
                          </div>
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleSaveField('username')}
                              disabled={saving}
                              className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelField('username')}
                              disabled={saving}
                              className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <p className="text-lg opacity-80">@{profile?.username}</p>
                          <button
                            onClick={() => {
                              setEditingUsername(true)
                              setUsername(profile?.username || "")
                            }}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Biografía editable */}
                  <div className="max-w-md mx-auto relative group">
                    {editingBio ? (
                      <div className="space-y-2">
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Cuéntanos sobre ti..."
                          rows={3}
                          className="text-sm bg-transparent border-2 border-white/20 text-white/90 placeholder-white/60 resize-none focus:border-white/40 focus:ring-0"
                          autoFocus
                        />
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleSaveField('bio')}
                            disabled={saving}
                            className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleCancelField('bio')}
                            disabled={saving}
                            className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <p className="text-sm opacity-90 whitespace-pre-wrap">
                          {profile?.bio || "No hay biografía"}
                        </p>
                        <button
                          onClick={() => {
                            setEditingBio(true)
                            setBio(profile?.bio || "")
                          }}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  
                  {/* Enlaces organizados por secciones */}
                  <div className="space-y-6 max-w-md mx-auto">
                    {(() => {
                      const activeSections = sections.filter(section => section.isActive).sort((a, b) => a.order - b.order)
                      const activeLinks = links.filter(link => link.isActive)
                      const linksWithoutSection = activeLinks.filter(link => !link.sectionId)
                      
                      return (
                        <>
                          {/* Enlaces sin sección */}
                          <div 
                            className="space-y-3"
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = "move"
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const linkData = e.dataTransfer.getData("text/plain")
                              console.log("Drop event (no section) - captured linkData:", linkData)
                              
                              let linkId = linkData
                              try {
                                // Si es un objeto JSON, extraer el ID
                                const parsed = JSON.parse(linkData)
                                linkId = parsed.id || linkData
                              } catch {
                                // Si no es JSON, usar el valor directamente
                                linkId = linkData
                              }
                              
                              console.log("Extracted linkId:", linkId)
                              if (linkId) {
                                handleMoveLinkToSection(linkId, undefined)
                              }
                            }}
                          >
                            {linksWithoutSection.length > 0 ? (
                              <div className="space-y-3">
                                {linksWithoutSection.map((link, index) => {
                                const isDragging = dragState.draggedItem?.id === link.id
                                const isDragOver = dragState.draggedOverItem?.id === link.id
                                
                                return (
                                  <div
                                    key={link.id}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("text/plain", link.id)
                                      handleDragStart(e, link, index)
                                    }}
                                    onDragOver={(e) => handleDragOver(e, link, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onDragEnd={handleDragEnd}
                                    className={`relative transition-all duration-200 cursor-move ${
                                      isDragging ? 'opacity-50 scale-95' : ''
                                    } ${
                                      isDragOver ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent' : ''
                                    }`}
                                  >
                                    <div className="relative group">
                                      <a
                                        href={link.url}
                                        target={link.type === "external" ? "_blank" : "_self"}
                                        rel={link.type === "external" ? "noopener noreferrer" : ""}
                                        className="block w-full px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                                        style={{ 
                                          backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
                                          color: profile?.theme?.buttonTextColor || "#ffffff"
                                        }}
                                        onClick={(e) => {
                                          if (isDragging) {
                                            e.preventDefault()
                                          }
                                        }}
                                      >
                                        <div className="flex items-center justify-center gap-2">
                                          <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                          <span className="text-lg font-semibold leading-tight">{link.title}</span>
                                          {link.type === "external" && <ExternalLink className="h-4 w-4" />}
                                        </div>
                                        {link.description && (
                                          <p className="text-xs opacity-80 leading-tight text-center mt-1">{link.description}</p>
                                        )}
                                      </a>
                                      
                                      {/* Botón de eliminar enlace */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleDeleteLink(link.id)
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Eliminar enlace"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <div className="text-xs text-white/40 p-2 rounded-lg border-2 border-dashed border-white/20">
                                  Arrastra enlaces aquí para quitarles la sección
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Secciones con sus enlaces */}
                          {activeSections.map((section) => {
                            const sectionLinks = activeLinks.filter(link => link.sectionId === section.id)
                            
                            return (
                              <div
                                key={section.id}
                                className="space-y-3"
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.dataTransfer.dropEffect = "move"
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  const linkData = e.dataTransfer.getData("text/plain")
                                  console.log("Drop event - captured linkData:", linkData)

                                  let linkId = linkData
                                  try {
                                    // Si es un objeto JSON, extraer el ID
                                    const parsed = JSON.parse(linkData)
                                    linkId = parsed.id || linkData
                                  } catch {
                                    // Si no es JSON, usar el valor directamente
                                    linkId = linkData
                                  }

                                  console.log("Extracted linkId:", linkId)
                                  if (linkId) {
                                    handleMoveLinkToSection(linkId, section.id)
                                  }
                                }}
                              >
                                {/* Contenedor de la sección con recuadro */}
                                <div className="bg-white/5 border border-white/20 rounded-lg p-4 space-y-3">
                                  {/* Título de la sección con zona de drop */}
                                  <div className="relative group">
                                    <div 
                                      className="text-sm font-medium text-white/90 text-center p-3 rounded-lg border-2 border-dashed border-white/30 hover:border-white/50 transition-colors bg-white/5"
                                      title="Arrastra enlaces aquí para moverlos a esta sección"
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        <FolderOpen className="h-4 w-4" />
                                        <span>{section.title}</span>
                                        <span className="text-xs text-white/60">({sectionLinks.length})</span>
                                      </div>
                                      {sectionLinks.length === 0 && (
                                        <div className="text-xs text-white/40 mt-2">
                                          Arrastra enlaces aquí
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Botón de eliminar sección */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeleteSection(section.id)
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                      title="Eliminar sección"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                
                                {/* Enlaces de la sección */}
                                {sectionLinks.map((link, index) => {
                                  const isDragging = dragState.draggedItem?.id === link.id
                                  const isDragOver = dragState.draggedOverItem?.id === link.id
                                  
                                  return (
                                    <div
                                      key={link.id}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData("text/plain", link.id)
                                        handleDragStart(e, link, index)
                                      }}
                                      onDragOver={(e) => handleDragOver(e, link, index)}
                                      onDragLeave={handleDragLeave}
                                      onDrop={handleDrop}
                                      onDragEnd={handleDragEnd}
                                      className={`relative transition-all duration-200 cursor-move ${
                                        isDragging ? 'opacity-50 scale-95' : ''
                                      } ${
                                        isDragOver ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent' : ''
                                      }`}
                                    >
                                      <div className="relative group">
                                        <a
                                          href={link.url}
                                          target={link.type === "external" ? "_blank" : "_self"}
                                          rel={link.type === "external" ? "noopener noreferrer" : ""}
                                          className="block w-full px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                                          style={{ 
                                            backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
                                            color: profile?.theme?.buttonTextColor || "#ffffff"
                                          }}
                                          onClick={(e) => {
                                            if (isDragging) {
                                              e.preventDefault()
                                            }
                                          }}
                                        >
                                          <div className="flex items-center justify-center gap-2">
                                            <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-lg font-semibold leading-tight">{link.title}</span>
                                            {link.type === "external" && <ExternalLink className="h-4 w-4" />}
                                          </div>
                                          {link.description && (
                                            <p className="text-xs opacity-80 leading-tight text-center mt-1">{link.description}</p>
                                          )}
                                        </a>
                                        
                                        {/* Botón de eliminar enlace */}
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleDeleteLink(link.id)
                                          }}
                                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                          title="Eliminar enlace"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                                </div>
                              </div>
                            )
                          })}

                          {/* Mensaje si no hay enlaces */}
                          {activeLinks.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-white/60 text-sm mb-3">No tienes enlaces todavía</p>
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => openSectionDialog()}
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar sección
                            </Button>
                            <Button
                              onClick={() => openLinkDialog()}
                              size="sm"
                              style={{ 
                                backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
                                color: profile?.theme?.buttonTextColor || "#ffffff"
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar enlace
                            </Button>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mis Enlaces</CardTitle>
                    <CardDescription>Gestiona los enlaces y secciones de tu perfil</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openSectionDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar sección
                    </Button>
                    <Button onClick={() => openLinkDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar enlace
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sections.length === 0 && links.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No tienes secciones ni enlaces todavía</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => openSectionDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear sección
                      </Button>
                      <Button onClick={() => openLinkDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear enlace
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Secciones */}
                    {sections.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Secciones</h3>
                        {sections.map((section) => (
                          <div
                            key={section.id}
                            className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-all duration-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{section.title}</h4>
                                {!section.isActive && <span className="text-xs bg-muted px-2 py-1 rounded">Inactiva</span>}
                              </div>
                              {section.description && (
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {links.filter(link => link.sectionId === section.id).length} enlaces
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openSectionDialog(section)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(section.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Enlaces */}
                    {links.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Enlaces</h3>
                        {links.map((link, index) => {
                          const isDragging = dragState.draggedItem?.id === link.id
                          const isDragOver = dragState.draggedOverItem?.id === link.id
                          const section = sections.find(s => s.id === link.sectionId)
                          
                          return (
                            <div
                              key={link.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, link, index)}
                              onDragOver={(e) => handleDragOver(e, link, index)}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-move ${
                                isDragging ? 'opacity-50 scale-95' : ''
                              } ${
                                isDragOver ? 'ring-2 ring-primary/50 ring-offset-2' : ''
                              }`}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium truncate">{link.title}</h3>
                                  {link.type === "external" && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                                  {!link.isActive && <span className="text-xs bg-muted px-2 py-1 rounded">Inactivo</span>}
                                  {section && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {section.title}
                                    </span>
                                  )}
                                </div>
                                {link.description && (
                                  <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openLinkDialog(link)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carousels" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Carruseles</CardTitle>
                <CardDescription>Gestiona tus carruseles de imágenes</CardDescription>
              </CardHeader>
              <CardContent>
                <CarouselManager 
                  carousels={carousels} 
                  userId={user.uid}
                  onRefresh={async () => {
                    if (!user) return
                    const carouselsQuery = query(collection(db, "apps/controlbio/carousels"), where("userId", "==", user.uid), orderBy("order", "asc"))
                    const carouselsSnap = await getDocs(carouselsQuery)
                    const carouselsData = carouselsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Carousel)
                    setCarousels(carouselsData)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6 mt-0">
            <ControlBioFileManager />
          </TabsContent>

          <TabsContent value="theme" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Personalización</CardTitle>
                <CardDescription>Personaliza los colores de tu perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Color de fondo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textColor">Color de texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buttonColor">Color de botones</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonColor"
                        type="color"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buttonTextColor">Color de texto de botones</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonTextColor"
                        type="color"
                        value={buttonTextColor}
                        onChange={(e) => setButtonTextColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={buttonTextColor}
                        onChange={(e) => setButtonTextColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-6" style={{ backgroundColor }}>
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold" style={{ color: textColor }}>
                      Vista previa
                    </h3>
                    <p style={{ color: textColor }}>Así se verá tu perfil</p>
                    <button
                      className="px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                      Botón de ejemplo
                    </button>
                  </div>
                </div>

                <Button onClick={handleSaveTheme} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar tema"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Información de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Proveedor de autenticación</Label>
                    <p className="text-sm text-muted-foreground">
                      Google
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email de la cuenta</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seguridad de la cuenta</Label>
                    <p className="text-sm text-muted-foreground">
                      Tu cuenta está protegida con autenticación de Google. Para cambiar tu contraseña, 
                      hazlo desde tu cuenta de Google.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Editar enlace" : "Nuevo enlace"}</DialogTitle>
            <DialogDescription>
              {editingLink ? "Modifica los detalles del enlace" : "Agrega un nuevo enlace a tu perfil"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkTitle">Título</Label>
              <Input
                id="linkTitle"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Mi sitio web"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkDescription">Descripción (opcional)</Label>
              <Textarea
                id="linkDescription"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Descripción breve del enlace"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkType">Tipo</Label>
              <Select value={linkType} onValueChange={(value: "external" | "internal") => setLinkType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">Externo</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkSection">Sección (opcional)</Label>
              <Select value={linkSectionId} onValueChange={setLinkSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin sección</SelectItem>
                  {sections.filter(s => s.isActive).map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="linkActive">Enlace activo</Label>
              <Switch id="linkActive" checked={linkActive} onCheckedChange={setLinkActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLink} disabled={!linkTitle || !linkUrl}>
              {editingLink ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de secciones */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? "Editar sección" : "Nueva sección"}</DialogTitle>
            <DialogDescription>
              {editingSection ? "Modifica los detalles de la sección" : "Crea una nueva sección para organizar tus enlaces"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionTitle">Título de la sección</Label>
              <Input
                id="sectionTitle"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Ej: Redes Sociales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionDescription">Descripción (opcional)</Label>
              <Textarea
                id="sectionDescription"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                placeholder="Descripción breve de la sección"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionType">Tipo de sección</Label>
              <Select value={sectionType} onValueChange={(value: 'links' | 'carousel') => setSectionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="links">Enlaces</SelectItem>
                  <SelectItem value="carousel">Carrusel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sectionType === 'carousel' && (
              <div className="space-y-2">
                <Label htmlFor="sectionCarousel">Seleccionar Carrusel</Label>
                <Select value={sectionCarouselId} onValueChange={setSectionCarouselId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un carrusel" />
                  </SelectTrigger>
                  <SelectContent>
                    {carousels.length === 0 ? (
                      <SelectItem value="" disabled>
                        No hay carruseles disponibles
                      </SelectItem>
                    ) : (
                      carousels.map((carousel) => (
                        <SelectItem key={carousel.id} value={carousel.id}>
                          {carousel.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="sectionActive">Sección activa</Label>
              <Switch id="sectionActive" checked={sectionActive} onCheckedChange={setSectionActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSection} disabled={!sectionTitle}>
              {editingSection ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
