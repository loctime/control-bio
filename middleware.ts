import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard']
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/[username]']
  
  // Si es una ruta protegida, permitir que el cliente maneje la autenticación
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // El AuthProvider en el cliente se encargará de redirigir si no está autenticado
    return NextResponse.next()
  }
  
  // Si es una ruta pública, permitir acceso
  if (publicRoutes.some(route => pathname === '/' || pathname.match(/^\/[^\/]+$/))) {
    return NextResponse.next()
  }
  
  // Para otras rutas, permitir acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
