"use client"

import { useState } from "react"
import { updatePassword, linkWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { generateSecurePassword, hashPassword } from "@/lib/password-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Copy, Eye, EyeOff } from "lucide-react"

interface PasswordManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  user: any
  existingPassword?: string
  hasExistingAuth: boolean
}

export function PasswordManagementModal({
  open,
  onOpenChange,
  onComplete,
  user,
  existingPassword,
  hasExistingAuth
}: PasswordManagementModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleContinue = () => {
    onComplete()
    onOpenChange(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Actualizar contraseña en Firebase Auth
      await updatePassword(user, newPassword)
      
      // Actualizar en Firestore
      const hashedPassword = await hashPassword(newPassword)
      await updateDoc(doc(db, "apps/controlbio/users", user.uid), {
        customPassword: hashedPassword,
        hasCustomPassword: true,
        updatedAt: new Date(),
      })

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      })

      onComplete()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNewPassword = async () => {
    setLoading(true)
    try {
      const autoPassword = generateSecurePassword()
      
      // Actualizar contraseña en Firebase Auth
      await updatePassword(user, autoPassword)
      
      // Actualizar en Firestore
      const hashedPassword = await hashPassword(autoPassword)
      await updateDoc(doc(db, "apps/controlbio/users", user.uid), {
        autoPassword: autoPassword,
        customPassword: hashedPassword,
        hasCustomPassword: false,
        updatedAt: new Date(),
      })

      toast({
        title: "Nueva contraseña generada",
        description: "Se ha generado una nueva contraseña automática",
      })

      onComplete()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error generating password:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la contraseña",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "Contraseña copiada al portapapeles",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestión de Contraseña</DialogTitle>
          <DialogDescription>
            {hasExistingAuth 
              ? "Ya tienes una cuenta con email/password. Puedes ver tu contraseña actual o cambiarla."
              : "Configura una contraseña para poder iniciar sesión con email/password."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {hasExistingAuth && existingPassword && (
            <div className="space-y-2">
              <Label>Contraseña actual</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={existingPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(existingPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Guarda esta contraseña en un lugar seguro. Puedes usarla para iniciar sesión con email/password.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña (opcional)</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nueva contraseña</Label>
              <Input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? "Actualizando..." : "Cambiar contraseña"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleGenerateNewPassword} 
              disabled={loading}
            >
              {loading ? "Generando..." : "Generar contraseña automática"}
            </Button>
            
            <Button variant="ghost" onClick={handleContinue}>
              Continuar sin cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
