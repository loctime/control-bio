import { useState } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, deleteField } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Link } from "@/types"

export function useLinks() {
  const { toast } = useToast()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [linkType, setLinkType] = useState<"external" | "internal">("external")
  const [linkActive, setLinkActive] = useState(true)
  const [linkSectionId, setLinkSectionId] = useState<string>("")

  const normalizeUrl = (url: string, type: "external" | "internal"): string => {
    if (type === "internal") {
      return url
    }
    
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`
    }
    
    return url
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

  const resetLinkForm = () => {
    setEditingLink(null)
    setLinkTitle("")
    setLinkUrl("")
    setLinkDescription("")
    setLinkType("external")
    setLinkActive(true)
    setLinkSectionId("")
  }

  const handleSaveLink = async (
    links: Link[],
    setLinks: React.Dispatch<React.SetStateAction<Link[]>>,
    userId: string
  ) => {
    if (!userId) {
      console.error("No user authenticated")
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Saving link for user:", userId)
      
      const normalizedUrl = normalizeUrl(linkUrl, linkType)
      
      if (editingLink) {
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
        const newLink = {
          userId: userId,
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
      resetLinkForm()
    } catch (error) {
      console.error("Error saving link:", error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast({
        title: "Error",
        description: `No se pudo guardar el enlace: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteLink = async (
    linkId: string,
    links: Link[],
    setLinks: React.Dispatch<React.SetStateAction<Link[]>>
  ) => {
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

  const handleReorderLinks = async (
    reorderedLinks: Link[],
    setLinks: React.Dispatch<React.SetStateAction<Link[]>>,
    userId: string
  ) => {
    if (!userId) return

    try {
      setLinks(reorderedLinks)

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

  const handleMoveLinkToSection = async (
    linkId: string,
    sectionId: string | undefined,
    links: Link[],
    sections: any[],
    setLinks: React.Dispatch<React.SetStateAction<Link[]>>
  ) => {
    try {
      const currentLink = links.find(link => link.id === linkId)
      if (!currentLink) {
        console.error("Link not found in state:", linkId)
        throw new Error(`Enlace no encontrado: ${linkId}`)
      }

      const linkRef = doc(db, "apps/controlbio/links", linkId)
      
      const updateData: any = {
        updatedAt: new Date()
      }
      
      if (sectionId) {
        updateData.sectionId = sectionId
      } else {
        updateData.sectionId = deleteField()
      }
      
      await updateDoc(linkRef, updateData)

      const updatedLink = {
        ...currentLink,
        sectionId: sectionId,
        updatedAt: new Date().toISOString()
      }

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

  return {
    // State
    linkDialogOpen,
    setLinkDialogOpen,
    editingLink,
    linkTitle,
    setLinkTitle,
    linkUrl,
    setLinkUrl,
    linkDescription,
    setLinkDescription,
    linkType,
    setLinkType,
    linkActive,
    setLinkActive,
    linkSectionId,
    setLinkSectionId,
    
    // Functions
    openLinkDialog,
    handleSaveLink,
    handleDeleteLink,
    handleReorderLinks,
    handleMoveLinkToSection,
  }
}

