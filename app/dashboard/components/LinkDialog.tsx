"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Link, Section } from "@/types"

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLink: Link | null
  onSave: () => void
  linkTitle: string
  setLinkTitle: (value: string) => void
  linkUrl: string
  setLinkUrl: (value: string) => void
  linkDescription: string
  setLinkDescription: (value: string) => void
  linkType: "external" | "internal"
  setLinkType: (value: "external" | "internal") => void
  linkActive: boolean
  setLinkActive: (value: boolean) => void
  linkSectionId: string
  setLinkSectionId: (value: string) => void
  sections: Section[]
}

export function LinkDialog({
  open,
  onOpenChange,
  editingLink,
  onSave,
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
  sections,
}: LinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <Select value={linkSectionId || "none"} onValueChange={(value) => setLinkSectionId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sin sección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin sección</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={!linkTitle || !linkUrl}>
            {editingLink ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

