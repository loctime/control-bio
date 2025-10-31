"use client"

import { Button } from "@/components/ui/button"
import { GripVertical, Plus, ExternalLink, FolderOpen, X } from "lucide-react"
import type { Link, Section, UserProfile } from "@/types"

interface ProfilePreviewLinksProps {
  links: Link[]
  sections: Section[]
  profile: UserProfile | null
  dragState: {
    draggedItem: { id: string } | null
    draggedOverItem: { id: string } | null
  }
  handleDragStart: (e: React.DragEvent, link: Link, index: number) => void
  handleDragOver: (e: React.DragEvent, link: Link, index: number) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: (e: React.DragEvent) => void
  handleMoveLinkToSection: (linkId: string, sectionId: string | undefined, links: Link[], sections: Section[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>) => Promise<void>
  handleDeleteLink: (linkId: string) => void
  handleDeleteSection: (sectionId: string) => void
  openLinkDialog: () => void
  openSectionDialog: () => void
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>
}

export function ProfilePreviewLinks({
  links,
  sections,
  profile,
  dragState,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleMoveLinkToSection,
  handleDeleteLink,
  handleDeleteSection,
  openLinkDialog,
  openSectionDialog,
  setLinks,
}: ProfilePreviewLinksProps) {
  const activeSections = sections.filter(section => section.isActive).sort((a, b) => a.order - b.order)
  const activeLinks = links.filter(link => link.isActive)
  const linksWithoutSection = activeLinks.filter(link => !link.sectionId)

  const handleDropWrapper = (e: React.DragEvent, sectionId?: string) => {
    e.preventDefault()
    const linkData = e.dataTransfer.getData("text/plain")
    
    let linkId = linkData
    try {
      const parsed = JSON.parse(linkData)
      linkId = parsed.id || linkData
    } catch {
      linkId = linkData
    }
    
    if (linkId) {
      handleMoveLinkToSection(linkId, sectionId, links, sections, setLinks)
    }
  }

  const renderLink = (link: Link, index: number) => {
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
            className="block w-full px-3 sm:px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
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
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="text-base sm:text-lg font-semibold leading-tight">{link.title}</span>
              {link.type === "external" && <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />}
            </div>
            {link.description && (
              <p className="text-xs opacity-80 leading-tight text-center mt-1">{link.description}</p>
            )}
          </a>
          
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDeleteLink(link.id)
            }}
            className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Eliminar enlace"
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-md mx-auto">
      {/* Enlaces sin sección */}
      <div 
        className="space-y-2 sm:space-y-3"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = "move"
        }}
        onDrop={(e) => handleDropWrapper(e)}
      >
        {linksWithoutSection.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {linksWithoutSection.map((link, index) => renderLink(link, index))}
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
            className="space-y-2 sm:space-y-3"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => handleDropWrapper(e, section.id)}
          >
            {/* Contenedor de la sección */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
              {/* Título de la sección */}
              <div className="relative group">
                <div 
                  className="text-xs sm:text-sm font-medium text-white/90 text-center p-2 sm:p-3 rounded-lg border-2 border-dashed border-white/30 hover:border-white/50 transition-colors bg-white/5"
                  title="Arrastra enlaces aquí para moverlos a esta sección"
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{section.title}</span>
                    <span className="text-xs text-white/60">({sectionLinks.length})</span>
                  </div>
                  {sectionLinks.length === 0 && (
                    <div className="text-xs text-white/40 mt-1 sm:mt-2">
                      Arrastra enlaces aquí
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteSection(section.id)
                  }}
                  className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Eliminar sección"
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </div>
            
              {/* Enlaces de la sección */}
              {sectionLinks.map((link, index) => renderLink(link, index))}
            </div>
          </div>
        )
      })}

      {/* Mensaje si no hay enlaces */}
      {activeLinks.length === 0 && (
        <div className="text-center py-4">
          <p className="text-white/60 text-xs sm:text-sm mb-3">No tienes enlaces todavía</p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
        <Button
          onClick={() => openSectionDialog()}
          variant="outline"
          size="sm"
          className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Agregar sección</span>
          <span className="sm:hidden">Sección</span>
        </Button>
        <Button
          onClick={() => openLinkDialog()}
          size="sm"
          className="text-xs sm:text-sm"
          style={{ 
            backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
            color: profile?.theme?.buttonTextColor || "#ffffff"
          }}
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Agregar enlace</span>
          <span className="sm:hidden">Enlace</span>
        </Button>
      </div>
    </div>
  )
}
