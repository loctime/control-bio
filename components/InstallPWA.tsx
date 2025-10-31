"use client"

import { useState } from "react"
import { useInstallPWA } from "@/hooks/use-install-pwa"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Download, Smartphone, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface InstallPWAProps {
  variant?: "banner" | "button" | "modal"
  className?: string
}

export function InstallPWA({ variant = "banner", className = "" }: InstallPWAProps) {
  const { isInstallable, isInstalled, installPWA } = useInstallPWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // No mostrar si ya está instalado o descartado
  if (isInstalled || isDismissed) return null
  // No mostrar si el navegador no ofrece prompt
  if (!isInstallable) return null

  const handleInstall = async () => {
    setIsInstalling(true)
    const ok = await installPWA()
    setIsInstalling(false)
    if (ok) setShowModal(false)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try { localStorage.setItem("controlbio-pwa-dismissed", Date.now().toString()) } catch {}
  }

  if (variant === "button") {
    return (
      <Button onClick={() => setShowModal(true)} variant="outline" className={className}>
        <Download className="mr-2 h-4 w-4" />
        Instalar App
      </Button>
    )
  }

  if (variant === "modal") {
    return (
      <>
        <Button onClick={() => setShowModal(true)} className={className}>
          <Download className="mr-2 h-4 w-4" />
          Instalar ControlBio
        </Button>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Instalar ControlBio
              </DialogTitle>
              <DialogDescription>
                Instala ControlBio para acceso rápido y uso sin conexión.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">ControlBio</h4>
                  <p className="text-sm text-muted-foreground">Tu página de enlaces personalizada</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Acceso desde inicio</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Funciona sin conexión</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Actualizaciones automáticas</div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleInstall} disabled={isInstalling} className="bg-gradient-to-r from-primary to-primary/80">
                {isInstalling ? (<><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>Instalando...</>) : (<><Download className="mr-2 h-4 w-4"/>Instalar</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Banner por defecto
  return (
    <Card className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 shadow-2xl border-2 py-2 ${className}`}>
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-2">Instalar ControlBio</h3>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" disabled={isInstalling} className="flex-1 bg-gradient-to-r from-primary to-primary/80">
                {isInstalling ? (<><div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"/>Instalando...</>) : (<><Download className="mr-1.5 h-3.5 w-3.5"/>Instalar</>)}
              </Button>
              <Button onClick={handleDismiss} size="sm" variant="ghost">Ahora no</Button>
            </div>
          </div>
          <Button onClick={handleDismiss} variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function InstallPWAButton({ className = "" }: { className?: string }) {
  return <InstallPWA variant="button" className={className} />
}

export function InstallPWAModal({ className = "" }: { className?: string }) {
  return <InstallPWA variant="modal" className={className} />
}

export function InstallPWABanner({ className = "" }: { className?: string }) {
  return <InstallPWA variant="banner" className={className} />
}
