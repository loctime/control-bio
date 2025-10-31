import { useState } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Section } from "@/types"

export function useSections() {
  const { toast } = useToast()
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [sectionTitle, setSectionTitle] = useState("")
  const [sectionDescription, setSectionDescription] = useState("")
  const [sectionType, setSectionType] = useState<'links' | 'carousel'>('links')
  const [sectionCarouselId, setSectionCarouselId] = useState<string>("")
  const [sectionActive, setSectionActive] = useState(true)

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

  const resetSectionForm = () => {
    setEditingSection(null)
    setSectionTitle("")
    setSectionDescription("")
    setSectionType('links')
    setSectionCarouselId("")
    setSectionActive(true)
  }

  const handleSaveSection = async (
    sections: Section[],
    setSections: React.Dispatch<React.SetStateAction<Section[]>>,
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
      if (editingSection) {
        const sectionRef = doc(db, "apps/controlbio/sections", editingSection.id)
        await updateDoc(sectionRef, {
          title: sectionTitle,
          description: sectionDescription,
          type: sectionType,
          carouselId: sectionType === 'carousel' ? sectionCarouselId : undefined,
          isActive: sectionActive,
          updatedAt: new Date(),
        })

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
        const newSection = {
          userId: userId,
          title: sectionTitle,
          description: sectionDescription,
          type: sectionType,
          carouselId: sectionType === 'carousel' ? sectionCarouselId : undefined,
          isActive: sectionActive,
          order: sections.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const docRef = await addDoc(collection(db, "apps/controlbio/sections"), newSection)
        setSections([...sections, { ...newSection, id: docRef.id } as Section])

        toast({
          title: "Sección creada",
          description: "La sección se ha creado correctamente",
        })
      }

      setSectionDialogOpen(false)
      resetSectionForm()
    } catch (error: any) {
      console.error("Error saving section:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la sección",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSection = async (
    sectionId: string,
    sections: Section[],
    setSections: React.Dispatch<React.SetStateAction<Section[]>>,
    links: any[],
    setLinks: React.Dispatch<React.SetStateAction<any[]>>,
    userId: string
  ) => {
    if (!userId) return

    try {
      // Remove sectionId from all links in this section
      const linksInSection = links.filter(link => link.sectionId === sectionId)
      if (linksInSection.length > 0) {
        const batch = linksInSection.map(link => {
          const linkRef = doc(db, "apps/controlbio/links", link.id)
          return updateDoc(linkRef, {
            sectionId: null,
            updatedAt: new Date(),
          })
        })
        await Promise.all(batch)

        setLinks(
          links.map(link =>
            link.sectionId === sectionId
              ? { ...link, sectionId: undefined, updatedAt: new Date().toISOString() }
              : link
          )
        )
      }

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

  return {
    // State
    sectionDialogOpen,
    setSectionDialogOpen,
    editingSection,
    sectionTitle,
    setSectionTitle,
    sectionDescription,
    setSectionDescription,
    sectionType,
    setSectionType,
    sectionCarouselId,
    setSectionCarouselId,
    sectionActive,
    setSectionActive,
    
    // Functions
    openSectionDialog,
    handleSaveSection,
    handleDeleteSection,
  }
}

