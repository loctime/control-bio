import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface SecurityTabProps {
  userEmail: string
}

export function SecurityTab({ userEmail }: SecurityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
        <CardDescription>Información de tu cuenta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Proveedor de autenticación</Label>
            <p className="text-sm text-muted-foreground">
              Google
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Email de la cuenta</Label>
            <p className="text-sm text-muted-foreground">
              {userEmail}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Seguridad de la cuenta</Label>
            <p className="text-sm text-muted-foreground">
              Tu cuenta está protegida con autenticación de Google. Para cambiar tu contraseña, 
              hazlo desde tu cuenta de Google.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

