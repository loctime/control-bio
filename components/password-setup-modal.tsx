"use client"

import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { hashPassword, generateSecurePassword } from "@/lib/password-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface PasswordSetupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  user: any
}

export function PasswordSetupModal({ open, onOpenChange, onComplete, user }: PasswordSetupModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()


  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Hashear la contraseña
      const hashedPassword = await hashPassword(password)
      
      // Actualizar perfil en Firestore con contraseña hasheada
      await updateDoc(doc(db, "apps/controlbio/users", user.uid), {
        customPassword: hashedPassword,
        hasCustomPassword: true,
        updatedAt: new Date(),
      })

      toast({
        title: "Contraseña configurada",
        description: "Tu contraseña ha sido establecida correctamente",
      })
      
      onComplete()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error setting password:", error)
      toast({
        title: "Error",
        description: "No se pudo establecer la contraseña",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseAutoPassword = async () => {
    setLoading(true)
    try {
      const autoPassword = generateSecurePassword()
      
      // Hashear la contraseña automática
      const hashedAutoPassword = await hashPassword(autoPassword)
      
      // Actualizar perfil en Firestore
      await updateDoc(doc(db, "apps/controlbio/users", user.uid), {
        autoPassword: autoPassword, // Guardar en texto plano para mostrar al usuario
        customPassword: hashedAutoPassword, // Guardar hasheada para verificación
        hasCustomPassword: false,
        updatedAt: new Date(),
      })

      toast({
        title: "Contraseña automática generada",
        description: "Se ha generado una contraseña automática. Puedes cambiarla en Configuración > Seguridad",
      })
      
      onComplete()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error setting auto password:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la contraseña automática",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar contraseña</DialogTitle>
          <DialogDescription>
            Para mayor seguridad, puedes establecer una contraseña personalizada o usar una automática.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña personalizada</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col space-y-2">
          <Button 
            onClick={handleSetPassword} 
            disabled={loading || !password || !confirmPassword}
            className="w-full"
          >
            {loading ? "Configurando..." : "Usar contraseña personalizada"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleUseAutoPassword}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generando..." : "Usar contraseña automática"}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
