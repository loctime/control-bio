"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { updateUserEmail } from "@/lib/update-user-email"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function UpdateEmailPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpdateEmail = async () => {
    if (!user || !email) return
    
    setLoading(true)
    try {
      await updateUserEmail(user.uid, email)
      toast({
        title: "Email actualizado",
        description: "El email se ha actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Debes estar autenticado</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Actualizar Email</CardTitle>
          <CardDescription>
            Agrega tu email al perfil para poder usar login con email/password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleUpdateEmail}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Actualizando..." : "Actualizar Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
