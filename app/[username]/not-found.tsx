import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Perfil no encontrado</CardTitle>
            <CardDescription>
              El perfil que buscas no existe o no está disponible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Posibles razones:</p>
              <ul className="mt-2 space-y-1 text-left">
                <li>• El nombre de usuario no existe</li>
                <li>• El perfil ha sido eliminado</li>
                <li>• Hay un error en la URL</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Mi Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
