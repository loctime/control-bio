"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Section, Carousel } from "@/types"

interface SectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSection: Section | null
  onSave: () => void
  sectionTitle: string
  setSectionTitle: (value: string) => void
  sectionDescription: string
  setSectionDescription: (value: string) => void
  sectionType: 'links' | 'carousel'
  setSectionType: (value: 'links' | 'carousel') => void
  sectionCarouselId: string
  setSectionCarouselId: (value: string) => void
  sectionActive: boolean
  setSectionActive: (value: boolean) => void
  carousels: Carousel[]
}

export function SectionDialog({
  open,
  onOpenChange,
  editingSection,
  onSave,
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
  carousels,
}: SectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSection ? "Editar sección" : "Nueva sección"}</DialogTitle>
          <DialogDescription>
            {editingSection ? "Modifica los detalles de la sección" : "Agrega una nueva sección a tu perfil"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sectionTitle">Título</Label>
            <Input
              id="sectionTitle"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="Mi sección"
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
              <Label htmlFor="sectionCarousel">Carrusel</Label>
              <Select value={sectionCarouselId} onValueChange={setSectionCarouselId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un carrusel" />
                </SelectTrigger>
                <SelectContent>
                {carousels.map((carousel) => (
                  <SelectItem key={carousel.id} value={carousel.id}>
                    {carousel.name}
                  </SelectItem>
                ))}
                {carousels.length === 0 && (
                  <SelectItem value="" disabled>
                    No hay carruseles disponibles
                  </SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={!sectionTitle}>
            {editingSection ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

