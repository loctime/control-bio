import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import type { Link, Section } from "@/types"

interface LinksTabProps {
  links: Link[]
  sections: Section[]
  dragState: {
    draggedItem: { id: string } | null
    draggedOverItem: { id: string } | null
  }
  handleDragStart: (e: React.DragEvent, link: Link, index: number) => void
  handleDragOver: (e: React.DragEvent, link: Link, index: number) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: (e: React.DragEvent) => void
  openLinkDialog: (link?: Link) => void
  openSectionDialog: (section?: Section) => void
  handleDeleteLinkWrapper: (linkId: string) => void
  handleDeleteSectionWrapper: (sectionId: string) => void
}

export function LinksTab({
  links,
  sections,
  dragState,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  openLinkDialog,
  openSectionDialog,
  handleDeleteLinkWrapper,
  handleDeleteSectionWrapper,
}: LinksTabProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Mis Enlaces</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gestiona los enlaces y secciones de tu perfil</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => openSectionDialog()}>
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar sección</span>
              <span className="sm:hidden">Sección</span>
            </Button>
            <Button size="sm" className="text-xs sm:text-sm" onClick={() => openLinkDialog()}>
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar enlace</span>
              <span className="sm:hidden">Enlace</span>
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
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSectionWrapper(section.id)}>
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
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLinkWrapper(link.id)}>
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
  )
}

