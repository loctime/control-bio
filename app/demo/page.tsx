"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Loader2, Loader, RefreshCw, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DemoPage() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Galería de Loaders</h1>
          <p className="text-muted-foreground">
            Diferentes estilos de loaders y spinners para usar en tu aplicación
          </p>
        </div>

        {/* Loaders básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Loaders Básicos</CardTitle>
            <CardDescription>Íconos con animación de rotación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Spinner actual */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <Spinner className="h-8 w-8" />
                <p className="text-sm font-medium">Spinner (Loader2Icon)</p>
                <code className="text-xs text-muted-foreground">&lt;Spinner /&gt;</code>
              </div>

              {/* Loader2 */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">Loader2</p>
                <code className="text-xs text-muted-foreground">Loader2 + animate-spin</code>
              </div>

              {/* Loader */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <Loader className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">Loader</p>
                <code className="text-xs text-muted-foreground">Loader + animate-spin</code>
              </div>

              {/* Loader lento con delay */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg bg-primary/5">
                <Loader className="h-8 w-8 animate-spin-slow" />
                <p className="text-sm font-medium">Loader Lento</p>
                <code className="text-xs text-muted-foreground">animate-spin-slow</code>
              </div>

              {/* Loader con colores ControlBio */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg bg-gradient-to-br from-[#ff6b35]/10 via-[#ffa570]/10 to-white/10">
                <Loader className="h-8 w-8 animate-spin-colors" />
                <p className="text-sm font-medium">Naranja-Blanco</p>
                <code className="text-xs text-muted-foreground">animate-spin-colors</code>
              </div>

              {/* Loader con gradiente ControlBio */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg bg-black">
                <Loader className="h-8 w-8 spinner-gradient" />
                <p className="text-sm font-medium text-white">Gradiente ControlBio</p>
                <code className="text-xs text-muted-foreground">spinner-gradient</code>
              </div>

              {/* Loader naranja oscuro */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg bg-gradient-to-br from-[#e55a2b]/10 via-[#ff6b35]/10 to-white/10">
                <Loader className="h-8 w-8 animate-spin-colors-alt" />
                <p className="text-sm font-medium">Naranja Oscuro</p>
                <code className="text-xs text-muted-foreground">animate-spin-colors-alt</code>
              </div>

              {/* RefreshCw */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">RefreshCw</p>
                <code className="text-xs text-muted-foreground">RefreshCw + animate-spin</code>
              </div>

              {/* Circle con pulse */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <Circle className="h-8 w-8 animate-pulse fill-current" />
                <p className="text-sm font-medium">Circle Pulse</p>
                <code className="text-xs text-muted-foreground">Circle + animate-pulse</code>
              </div>

              {/* Loader con text */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Spinner className="h-5 w-5" />
                  <span className="text-sm">Cargando...</span>
                </div>
                <p className="text-sm font-medium">Con Texto</p>
                <code className="text-xs text-muted-foreground">Spinner + texto</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diferentes tamaños */}
        <Card>
          <CardHeader>
            <CardTitle>Tamaños</CardTitle>
            <CardDescription>Loaders en diferentes tamaños</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 flex-wrap p-6">
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-4 w-4" />
                <code className="text-xs text-muted-foreground">h-4 w-4</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-6 w-6" />
                <code className="text-xs text-muted-foreground">h-6 w-6</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8" />
                <code className="text-xs text-muted-foreground">h-8 w-8</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-12 w-12" />
                <code className="text-xs text-muted-foreground">h-12 w-12</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-16 w-16" />
                <code className="text-xs text-muted-foreground">h-16 w-16</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-20 w-20" />
                <code className="text-xs text-muted-foreground">h-20 w-20</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loaders con colores */}
        <Card>
          <CardHeader>
            <CardTitle>Colores</CardTitle>
            <CardDescription>Loaders en diferentes colores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-primary" />
                <code className="text-xs text-muted-foreground">text-primary</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-blue-500" />
                <code className="text-xs text-muted-foreground">text-blue-500</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-green-500" />
                <code className="text-xs text-muted-foreground">text-green-500</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-red-500" />
                <code className="text-xs text-muted-foreground">text-red-500</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-purple-500" />
                <code className="text-xs text-muted-foreground">text-purple-500</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-orange-500" />
                <code className="text-xs text-muted-foreground">text-orange-500</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-pink-500" />
                <code className="text-xs text-muted-foreground">text-pink-500</code>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Spinner className="h-8 w-8 text-white bg-gray-800 rounded-full p-2" />
                <code className="text-xs text-muted-foreground">text-white</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo de uso en botón */}
        <Card>
          <CardHeader>
            <CardTitle>Ejemplo de Uso en Botón</CardTitle>
            <CardDescription>Botones con estado de carga</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => setLoading(!loading)}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Spinner className="h-4 w-4" />}
                  {loading ? "Cargando..." : "Hacer click"}
                </button>

                <button
                  onClick={() => setLoading(!loading)}
                  disabled={loading}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Guardando..." : "Guardar"}
                </button>

                <button
                  onClick={() => setLoading(!loading)}
                  disabled={loading}
                  className="px-4 py-2 border border-border rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {loading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Click en cualquier botón para ver el estado de carga
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Full page loader */}
        <Card>
          <CardHeader>
            <CardTitle>Full Page Loader</CardTitle>
            <CardDescription>Loader de página completa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 border rounded-lg overflow-hidden bg-muted/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Spinner className="h-12 w-12 mx-auto" />
                  <p className="text-sm text-muted-foreground">Cargando contenido...</p>
                </div>
              </div>
            </div>
            <pre className="mt-4 p-4 bg-muted rounded-md text-xs overflow-x-auto">
{`<div className="min-h-screen flex items-center justify-center">
  <div className="text-center space-y-4">
    <Spinner className="h-12 w-12 mx-auto" />
    <p>Cargando contenido...</p>
  </div>
</div>`}
            </pre>
          </CardContent>
        </Card>

        {/* Loaders personalizados */}
        <Card>
          <CardHeader>
            <CardTitle>Loaders Personalizados</CardTitle>
            <CardDescription>Estilos personalizados con CSS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pulse loader */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <div className="flex gap-1">
                  <div className="h-3 w-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-3 w-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-3 w-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm font-medium">Bounce Loader</p>
                <code className="text-xs text-muted-foreground">animate-bounce</code>
              </div>

              {/* Progress bar loader */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-sm font-medium">Progress Bar</p>
                <code className="text-xs text-muted-foreground">animate-pulse</code>
              </div>

              {/* Skeleton loader */}
              <div className="flex flex-col space-y-3 p-6 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
                <p className="text-sm font-medium">Skeleton Loader</p>
                <code className="text-xs text-muted-foreground">animate-pulse</code>
              </div>

              {/* Spinner con múltiples círculos */}
              <div className="flex flex-col items-center justify-center space-y-3 p-6 border rounded-lg">
                <div className="relative">
                  <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
                <p className="text-sm font-medium">Custom Spinner</p>
                <code className="text-xs text-muted-foreground">border + animate-spin</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones de uso */}
        <Card>
          <CardHeader>
            <CardTitle>Cómo Usar</CardTitle>
            <CardDescription>Guía rápida de implementación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Importar el componente</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`import { Spinner } from "@/components/ui/spinner"`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Uso básico</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<Spinner />`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Con tamaño y color personalizado</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<Spinner className="h-8 w-8 text-blue-500" />`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. En un botón</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<button disabled={loading}>
  {loading && <Spinner className="h-4 w-4" />}
  {loading ? "Cargando..." : "Enviar"}
</button>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Loader lento con delay</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<Loader className="h-8 w-8 animate-spin-slow" />

/* Animación personalizada en globals.css */
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
  animation-delay: 0.5s;
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Loader con colores de ControlBio</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<Loader className="h-8 w-8 animate-spin-colors" />

/* Cambia de naranja → naranja claro → blanco
   Animación en globals.css:
   @keyframes spin-colors {
     from { color: #ff6b35; }  /* Naranja primario */
     50% { color: #ffa570; }   /* Naranja claro */
     to { color: #ffffff; }    /* Blanco */
   }
`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Loader con gradiente ControlBio</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<Loader className="h-8 w-8 spinner-gradient" />

/* Gradiente lineal: Naranja → Naranja claro → Blanco
   Usa los colores de la app (#ff6b35, #ffa570, #ffffff)
   clase .spinner-gradient en globals.css
`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">8. Loader naranja oscuro</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`<Loader className="h-8 w-8 animate-spin-colors-alt" />

/* Naranja oscuro → Naranja → Blanco
   Variante alternativa más oscura
`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">9. Full page loader</h3>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
{`if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

