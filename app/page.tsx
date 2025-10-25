"use client"

import { useState } from "react"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { generateSecurePassword, hashPassword } from "@/lib/password-utils"
import { useCustomAuth } from "@/hooks/use-custom-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { loginWithEmailPassword } = useCustomAuth()

  const handleGoogleLogin = async () => {
    setLoading(true)
    
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      // Verificar si el usuario ya existe en Firestore
      const userDoc = await getDoc(doc(db, "apps/controlbio/users", user.uid))
      
      if (!userDoc.exists()) {
        // Generar contraseña automática
        const autoPassword = generateSecurePassword()
        const hashedAutoPassword = await hashPassword(autoPassword)
        
        // Crear perfil para nuevo usuario de Google
        await setDoc(doc(db, "apps/controlbio/users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.photoURL,
          username: user.email?.split('@')[0] || user.uid.slice(0, 8),
          bio: "",
          autoPassword: autoPassword,
          customPassword: hashedAutoPassword,
          hasCustomPassword: false,
          theme: {
            backgroundColor: "#1f1f1f",
            textColor: "#f5f5f5",
            buttonColor: "#ff6b35",
            buttonTextColor: "#1f1f1f",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada con Google exitosamente",
        })
      } else {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        })
      }
      
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error con Google Auth:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con Google",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await loginWithEmailPassword(email, password)
      if (result.success) {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar sesión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Control<span className="text-primary">Bio</span>
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-8 mb-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              Control<span className="text-primary">Bio</span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Tu página de enlaces personalizada. Comparte todo lo que haces en un solo lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">Personalizable</h3>
              <p className="text-sm text-muted-foreground">
                Personaliza colores, temas y estilos para que coincida con tu marca
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">Fácil de usar</h3>
              <p className="text-sm text-muted-foreground">Gestiona tus enlaces con una interfaz intuitiva y sencilla</p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">Rápido</h3>
              <p className="text-sm text-muted-foreground">Páginas optimizadas que cargan instantáneamente</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Iniciar sesión</CardTitle>
                  <CardDescription>Accede a tu cuenta de ControlBio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O con email</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crear cuenta</CardTitle>
                  <CardDescription>Regístrate fácilmente con Google</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Regístrate fácilmente con tu cuenta de Google
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Podrás configurar una contraseña después del registro
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
