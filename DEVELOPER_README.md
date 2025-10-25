# ControlBio - Documentación Técnica para Desarrolladores

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Modelos de Datos](#modelos-de-datos)
5. [Componentes y Páginas](#componentes-y-páginas)
6. [Autenticación y Contexto](#autenticación-y-contexto)
7. [Integración con Firebase](#integración-con-firebase)
8. [Patrones de Diseño](#patrones-de-diseño)
9. [Flujos Principales](#flujos-principales)
10. [Cómo Extender la App](#cómo-extender-la-app)

---

## Arquitectura General

ControlBio es una aplicación tipo "link-in-bio" (similar a Linktree) construida con Next.js 15 y Firebase. La arquitectura sigue el patrón de App Router de Next.js con las siguientes características:

- **Frontend**: React 19 con TypeScript
- **Backend**: Firebase (Firestore + Authentication)
- **Routing**: Next.js App Router con rutas dinámicas
- **Estado Global**: React Context API para autenticación
- **UI**: shadcn/ui + Tailwind CSS v4
- **Validación**: Validación manual en cliente y servidor

### Flujo de Datos

\`\`\`
Usuario → Autenticación (Firebase Auth) → Firestore Database
                                              ↓
                                    UserProfile Collection
                                              ↓
                                    {profile, links, theme}
                                              ↓
                            Página Pública (/[username])
                            Dashboard Admin (/dashboard)
\`\`\`

---

## Stack Tecnológico

### Core
- **Next.js 15**: Framework React con App Router
- **React 19**: Biblioteca UI con Server Components
- **TypeScript**: Tipado estático
- **Tailwind CSS v4**: Estilos utility-first

### Backend & Database
- **Firebase Authentication**: Gestión de usuarios (email/password)
- **Cloud Firestore**: Base de datos NoSQL en tiempo real
- **Firebase SDK v11**: Cliente JavaScript para Firebase

### UI Components
- **shadcn/ui**: Componentes accesibles y personalizables
- **Radix UI**: Primitivos de UI sin estilos
- **Lucide React**: Iconos SVG
- **next-themes**: Gestión de tema claro/oscuro

### Utilidades
- **clsx + tailwind-merge**: Composición de clases CSS
- **react-hook-form**: Gestión de formularios (si se implementa)
- **sonner**: Notificaciones toast

---

## Estructura del Proyecto

\`\`\`
controlbio/
├── app/                          # App Router de Next.js
│   ├── layout.tsx               # Layout raíz con providers
│   ├── page.tsx                 # Página de inicio/landing
│   ├── login/
│   │   └── page.tsx            # Página de inicio de sesión
│   ├── registro/
│   │   └── page.tsx            # Página de registro
│   ├── dashboard/
│   │   └── page.tsx            # Panel de administración (protegido)
│   ├── [username]/
│   │   └── page.tsx            # Página pública de perfil (dinámica)
│   └── globals.css             # Estilos globales + tokens de diseño
│
├── components/
│   └── ui/                      # Componentes de shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       └── ...                  # Otros componentes de UI
│
├── lib/
│   ├── firebase.ts             # Configuración de Firebase
│   ├── auth-context.tsx        # Context de autenticación
│   └── utils.ts                # Utilidades (cn function)
│
├── types/
│   └── index.ts                # Definiciones de tipos TypeScript
│
├── hooks/                       # Custom hooks
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── .env.local                   # Variables de entorno (no en git)
├── .env.local.example          # Ejemplo de variables de entorno
├── README.md                    # Documentación de usuario
└── DEVELOPER_README.md         # Este archivo
\`\`\`

---

## Modelos de Datos

### UserProfile (Firestore Collection: `users`)

\`\`\`typescript
interface UserProfile {
  uid: string                    // ID del usuario (Firebase Auth UID)
  email: string                  // Email del usuario
  username: string               // Username único (usado en URL)
  displayName: string            // Nombre para mostrar
  bio?: string                   // Biografía/descripción
  avatarUrl?: string             // URL de la imagen de perfil
  links: Link[]                  // Array de enlaces
  theme: {
    primaryColor: string         // Color primario (hex)
    backgroundColor: string      // Color de fondo (hex)
    textColor: string           // Color de texto (hex)
    buttonStyle: 'rounded' | 'square' | 'pill'  // Estilo de botones
    font: 'sans' | 'serif' | 'mono'             // Familia de fuente
  }
  createdAt: Date                // Fecha de creación
  updatedAt: Date                // Última actualización
}
\`\`\`

**Documento en Firestore:**
- **Collection**: `users`
- **Document ID**: `{uid}` (mismo que Firebase Auth)
- **Índices necesarios**: 
  - `username` (único, para búsqueda)
  - `createdAt` (para ordenar)

### Link

\`\`\`typescript
interface Link {
  id: string                     // ID único del enlace
  title: string                  // Título del enlace
  url: string                    // URL de destino
  description?: string           // Descripción opcional
  icon?: string                  // Nombre del icono (Lucide)
  isActive: boolean             // Si el enlace está visible
  order: number                 // Orden de visualización (0, 1, 2...)
  clicks?: number               // Contador de clics (opcional)
}
\`\`\`

**Notas:**
- Los links se almacenan como array dentro del documento de UserProfile
- El campo `order` determina la posición visual (menor = arriba)
- `isActive` permite ocultar enlaces sin eliminarlos

---

## Componentes y Páginas

### Páginas Principales

#### 1. `/` - Landing Page (`app/page.tsx`)
**Propósito**: Página de inicio pública con información de la app

**Características:**
- Presentación de ControlBio
- Enlaces a Login y Registro
- No requiere autenticación

**Componentes usados:**
- `Button` (shadcn/ui)
- `Card` (shadcn/ui)

---

#### 2. `/login` - Página de Login (`app/login/page.tsx`)
**Propósito**: Autenticación de usuarios existentes

**Características:**
- Formulario de email/password
- Validación de campos
- Redirección a `/dashboard` tras login exitoso
- Manejo de errores de Firebase

**Flujo:**
\`\`\`typescript
1. Usuario ingresa email y password
2. Llamada a signInWithEmailAndPassword(auth, email, password)
3. Si éxito → Redirect a /dashboard
4. Si error → Mostrar toast con mensaje de error
\`\`\`

**Componentes usados:**
- `Card`, `Input`, `Button` (shadcn/ui)
- `useToast` (hook personalizado)
- `useAuth` (context)

---

#### 3. `/registro` - Página de Registro (`app/registro/page.tsx`)
**Propósito**: Creación de nuevas cuentas

**Características:**
- Formulario de registro (email, password, username, displayName)
- Validación de username único
- Creación de documento en Firestore
- Configuración de tema por defecto

**Flujo:**
\`\`\`typescript
1. Usuario completa formulario
2. Validar que username no exista en Firestore
3. Crear usuario con createUserWithEmailAndPassword()
4. Crear documento en Firestore con perfil inicial
5. Redirect a /dashboard
\`\`\`

**Documento inicial creado:**
\`\`\`typescript
{
  uid: user.uid,
  email: user.email,
  username: username,
  displayName: displayName,
  bio: "",
  avatarUrl: "",
  links: [],
  theme: {
    primaryColor: "#f97316",
    backgroundColor: "#0a0a0a",
    textColor: "#ffffff",
    buttonStyle: "rounded",
    font: "sans"
  },
  createdAt: new Date(),
  updatedAt: new Date()
}
\`\`\`

**Componentes usados:**
- `Card`, `Input`, `Button` (shadcn/ui)
- `useToast`, `useAuth`

---

#### 4. `/dashboard` - Panel de Administración (`app/dashboard/page.tsx`)
**Propósito**: Gestión completa del perfil y enlaces (CRUD)

**Características:**
- **Protegido**: Requiere autenticación
- **Edición de perfil**: Nombre, username, bio, avatar
- **Gestión de enlaces**: Crear, editar, eliminar, reordenar
- **Personalización de tema**: Colores, fuentes, estilos
- **Vista previa**: Link a página pública
- **Logout**: Cerrar sesión

**Secciones del Dashboard:**

##### A. Header
- Muestra nombre de usuario
- Botón de logout
- Link a página pública (`/[username]`)

##### B. Edición de Perfil
\`\`\`typescript
// Estados para edición
const [isEditingProfile, setIsEditingProfile] = useState(false)
const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})

// Función de guardado
const handleSaveProfile = async () => {
  await updateDoc(doc(db, "users", user.uid), {
    displayName: editedProfile.displayName,
    username: editedProfile.username,
    bio: editedProfile.bio,
    avatarUrl: editedProfile.avatarUrl,
    updatedAt: new Date()
  })
}
\`\`\`

##### C. Gestión de Enlaces
**Crear nuevo enlace:**
\`\`\`typescript
const handleAddLink = async () => {
  const newLink: Link = {
    id: Date.now().toString(),
    title: newLinkTitle,
    url: newLinkUrl,
    description: newLinkDescription,
    icon: "Link",
    isActive: true,
    order: profile.links.length,
    clicks: 0
  }
  
  await updateDoc(doc(db, "users", user.uid), {
    links: [...profile.links, newLink],
    updatedAt: new Date()
  })
}
\`\`\`

**Editar enlace:**
\`\`\`typescript
const handleEditLink = async (linkId: string) => {
  const updatedLinks = profile.links.map(link =>
    link.id === linkId ? { ...link, ...editedLink } : link
  )
  
  await updateDoc(doc(db, "users", user.uid), {
    links: updatedLinks,
    updatedAt: new Date()
  })
}
\`\`\`

**Eliminar enlace:**
\`\`\`typescript
const handleDeleteLink = async (linkId: string) => {
  const updatedLinks = profile.links.filter(link => link.id !== linkId)
  
  await updateDoc(doc(db, "users", user.uid), {
    links: updatedLinks,
    updatedAt: new Date()
  })
}
\`\`\`

**Reordenar enlaces:**
\`\`\`typescript
const handleMoveLink = async (linkId: string, direction: 'up' | 'down') => {
  const currentIndex = profile.links.findIndex(l => l.id === linkId)
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  
  // Intercambiar posiciones
  const updatedLinks = [...profile.links]
  [updatedLinks[currentIndex], updatedLinks[newIndex]] = 
  [updatedLinks[newIndex], updatedLinks[currentIndex]]
  
  // Actualizar order
  updatedLinks.forEach((link, index) => {
    link.order = index
  })
  
  await updateDoc(doc(db, "users", user.uid), {
    links: updatedLinks,
    updatedAt: new Date()
  })
}
\`\`\`

##### D. Personalización de Tema
\`\`\`typescript
const handleSaveTheme = async () => {
  await updateDoc(doc(db, "users", user.uid), {
    theme: {
      primaryColor: selectedTheme.primaryColor,
      backgroundColor: selectedTheme.backgroundColor,
      textColor: selectedTheme.textColor,
      buttonStyle: selectedTheme.buttonStyle,
      font: selectedTheme.font
    },
    updatedAt: new Date()
  })
}
\`\`\`

**Componentes usados:**
- `Card`, `Input`, `Button`, `Dialog`, `Select` (shadcn/ui)
- `ArrowUp`, `ArrowDown`, `Trash2`, `Edit`, `Plus` (lucide-react)

---

#### 5. `/[username]` - Página Pública de Perfil (`app/[username]/page.tsx`)
**Propósito**: Vista pública del perfil con enlaces (como Linktree)

**Características:**
- **Ruta dinámica**: Accesible por username único
- **Pública**: No requiere autenticación
- **Personalizable**: Aplica tema del usuario
- **Responsive**: Mobile-first design
- **Contador de clics**: Incrementa clicks al hacer clic en enlaces

**Flujo de carga:**
\`\`\`typescript
1. Extraer username de params
2. Query a Firestore: where("username", "==", username)
3. Si no existe → Mostrar 404
4. Si existe → Renderizar perfil con tema personalizado
\`\`\`

**Estructura visual:**
\`\`\`
┌─────────────────────────┐
│      Avatar (imagen)    │
│                         │
│    Nombre de Usuario    │
│      @username          │
│                         │
│    Biografía (texto)    │
│                         │
├─────────────────────────┤
│  [Enlace 1 - Título]   │
│   Descripción opcional  │
├─────────────────────────┤
│  [Enlace 2 - Título]   │
│   Descripción opcional  │
├─────────────────────────┤
│         ...             │
└─────────────────────────┘
\`\`\`

**Aplicación de tema:**
\`\`\`typescript
// Estilos dinámicos aplicados al contenedor principal
<div style={{
  backgroundColor: profile.theme.backgroundColor,
  color: profile.theme.textColor,
  fontFamily: `var(--font-${profile.theme.font})`
}}>
  {/* Contenido */}
</div>

// Botones de enlaces con color primario
<Button style={{
  backgroundColor: profile.theme.primaryColor,
  borderRadius: profile.theme.buttonStyle === 'pill' ? '9999px' : 
                profile.theme.buttonStyle === 'rounded' ? '0.5rem' : '0'
}}>
  {link.title}
</Button>
\`\`\`

**Contador de clics:**
\`\`\`typescript
const handleLinkClick = async (linkId: string) => {
  // Incrementar contador en Firestore
  const linkIndex = profile.links.findIndex(l => l.id === linkId)
  const updatedLinks = [...profile.links]
  updatedLinks[linkIndex].clicks = (updatedLinks[linkIndex].clicks || 0) + 1
  
  await updateDoc(doc(db, "users", profile.uid), {
    links: updatedLinks
  })
  
  // Abrir enlace
  window.open(link.url, '_blank')
}
\`\`\`

**Componentes usados:**
- `Button`, `Card`, `Avatar` (shadcn/ui)
- `ExternalLink` (lucide-react)

---

### Componentes Reutilizables

#### shadcn/ui Components
Todos los componentes de `components/ui/` son reutilizables:

- **Button**: Botones con variantes (default, outline, ghost, etc.)
- **Card**: Contenedores con header, content, footer
- **Input**: Campos de texto con validación
- **Dialog**: Modales para confirmaciones
- **Select**: Dropdowns personalizados
- **Avatar**: Imágenes de perfil con fallback
- **Toast**: Notificaciones temporales

**Ejemplo de uso:**
\`\`\`tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default">Acción</Button>
  </CardContent>
</Card>
\`\`\`

---

## Autenticación y Contexto

### AuthContext (`lib/auth-context.tsx`)

**Propósito**: Proveer estado de autenticación global

**Exports:**
- `AuthProvider`: Componente provider
- `useAuth`: Hook para acceder al contexto

**Estructura:**
\`\`\`typescript
interface AuthContextType {
  user: User | null        // Usuario de Firebase Auth
  loading: boolean         // Estado de carga inicial
  signOut: () => Promise<void>  // Función de logout
}
\`\`\`

**Implementación:**
\`\`\`typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listener de cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
\`\`\`

**Uso en componentes:**
\`\`\`typescript
import { useAuth } from "@/lib/auth-context"

function MyComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Cargando...</div>
  if (!user) return <div>No autenticado</div>
  
  return (
    <div>
      <p>Hola {user.email}</p>
      <button onClick={signOut}>Cerrar sesión</button>
    </div>
  )
}
\`\`\`

---

## Integración con Firebase

### Configuración (`lib/firebase.ts`)

\`\`\`typescript
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
\`\`\`

### Operaciones Comunes

#### Autenticación
\`\`\`typescript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

// Login
await signInWithEmailAndPassword(auth, email, password)

// Registro
await createUserWithEmailAndPassword(auth, email, password)

// Logout
await signOut(auth)
\`\`\`

#### Firestore - Lectura
\`\`\`typescript
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Obtener documento por ID
const docRef = doc(db, "users", userId)
const docSnap = await getDoc(docRef)
if (docSnap.exists()) {
  const data = docSnap.data()
}

// Query por campo
const q = query(collection(db, "users"), where("username", "==", "johndoe"))
const querySnapshot = await getDocs(q)
querySnapshot.forEach((doc) => {
  console.log(doc.data())
})
\`\`\`

#### Firestore - Escritura
\`\`\`typescript
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Crear/Sobrescribir documento
await setDoc(doc(db, "users", userId), {
  username: "johndoe",
  email: "john@example.com"
})

// Actualizar campos específicos
await updateDoc(doc(db, "users", userId), {
  bio: "Nueva biografía",
  updatedAt: new Date()
})

// Eliminar documento
await deleteDoc(doc(db, "users", userId))
\`\`\`

#### Firestore - Listeners en Tiempo Real
\`\`\`typescript
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Escuchar cambios en un documento
const unsubscribe = onSnapshot(doc(db, "users", userId), (doc) => {
  console.log("Datos actualizados:", doc.data())
})

// Limpiar listener
unsubscribe()
\`\`\`

### Reglas de Seguridad de Firestore

**Ubicación**: Firebase Console → Firestore Database → Rules

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección de usuarios
    match /users/{userId} {
      // Lectura: Cualquiera puede leer perfiles públicos
      allow read: if true;
      
      // Escritura: Solo el dueño puede modificar su perfil
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Validación de datos
      allow create: if request.auth != null 
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.email == request.auth.token.email;
    }
  }
}
\`\`\`

**Explicación:**
- `allow read: if true` → Perfiles públicos (necesario para `/[username]`)
- `allow write: if request.auth.uid == userId` → Solo el dueño edita
- Validación en `create` → Asegura que uid y email coincidan con el usuario autenticado

---

## Patrones de Diseño

### 1. Server Components vs Client Components

**Server Components** (por defecto en App Router):
- No tienen interactividad
- Se renderizan en el servidor
- Pueden acceder directamente a bases de datos
- Mejor para SEO

**Client Components** (con `"use client"`):
- Tienen estado y efectos
- Usan hooks de React
- Necesarios para interactividad

**Ejemplo en ControlBio:**
\`\`\`typescript
// app/[username]/page.tsx - Server Component
export default async function ProfilePage({ params }) {
  // Puede hacer fetch directo a Firestore
  const profile = await getProfileByUsername(params.username)
  return <ProfileView profile={profile} />
}

// app/dashboard/page.tsx - Client Component
"use client"
export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  // Usa hooks y estado
}
\`\`\`

### 2. Composición de Componentes

**Patrón usado**: Compound Components (shadcn/ui)

\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
  <CardFooter>
    {/* Acciones */}
  </CardFooter>
</Card>
\`\`\`

### 3. Estado Local vs Global

**Estado Local** (useState):
- Formularios
- UI temporal (modales, dropdowns)
- Datos específicos de un componente

**Estado Global** (Context):
- Autenticación (AuthContext)
- Tema (ThemeProvider)
- Datos compartidos entre múltiples componentes

### 4. Manejo de Errores

**Patrón try-catch con toast:**
\`\`\`typescript
try {
  await updateDoc(doc(db, "users", userId), data)
  toast.success("Guardado exitosamente")
} catch (error) {
  console.error(error)
  toast.error("Error al guardar")
}
\`\`\`

### 5. Validación de Datos

**Cliente (UI):**
\`\`\`typescript
if (!email || !password) {
  toast.error("Completa todos los campos")
  return
}

if (password.length < 6) {
  toast.error("La contraseña debe tener al menos 6 caracteres")
  return
}
\`\`\`

**Servidor (Firestore Rules):**
\`\`\`javascript
allow create: if request.resource.data.username.size() >= 3
              && request.resource.data.username.size() <= 20;
\`\`\`

---

## Flujos Principales

### Flujo de Registro

\`\`\`
1. Usuario accede a /registro
2. Completa formulario (email, password, username, displayName)
3. Click en "Crear cuenta"
   ↓
4. Validación en cliente:
   - Campos no vacíos
   - Password >= 6 caracteres
   - Username válido (sin espacios, caracteres especiales)
   ↓
5. Verificar username único en Firestore:
   query(collection(db, "users"), where("username", "==", username))
   ↓
6. Si username existe → Error "Username ya existe"
   Si username disponible → Continuar
   ↓
7. Crear usuario en Firebase Auth:
   createUserWithEmailAndPassword(auth, email, password)
   ↓
8. Crear documento en Firestore:
   setDoc(doc(db, "users", user.uid), {
     uid, email, username, displayName,
     bio: "", avatarUrl: "", links: [],
     theme: { /* valores por defecto */ },
     createdAt, updatedAt
   })
   ↓
9. Redirect a /dashboard
\`\`\`

### Flujo de Login

\`\`\`
1. Usuario accede a /login
2. Ingresa email y password
3. Click en "Iniciar sesión"
   ↓
4. Validación en cliente (campos no vacíos)
   ↓
5. Autenticación con Firebase:
   signInWithEmailAndPassword(auth, email, password)
   ↓
6. Si error → Mostrar mensaje de error
   Si éxito → onAuthStateChanged detecta cambio
   ↓
7. AuthContext actualiza user state
   ↓
8. Redirect a /dashboard
\`\`\`

### Flujo de Gestión de Enlaces

\`\`\`
CREAR ENLACE:
1. Usuario en /dashboard
2. Click en "Agregar enlace"
3. Completa formulario (título, URL, descripción)
4. Click en "Guardar"
   ↓
5. Crear objeto Link con ID único (Date.now())
6. Agregar a array de links con order = links.length
7. updateDoc en Firestore
8. Actualizar estado local
9. Toast de confirmación

EDITAR ENLACE:
1. Click en icono de editar
2. Abrir Dialog con formulario pre-llenado
3. Modificar campos
4. Click en "Guardar cambios"
   ↓
5. Actualizar link en array (map)
6. updateDoc en Firestore
7. Actualizar estado local
8. Toast de confirmación

ELIMINAR ENLACE:
1. Click en icono de eliminar
2. Confirmar acción (opcional: agregar Dialog de confirmación)
   ↓
3. Filtrar link del array
4. updateDoc en Firestore
5. Actualizar estado local
6. Toast de confirmación

REORDENAR ENLACES:
1. Click en flecha arriba/abajo
   ↓
2. Intercambiar posiciones en array
3. Actualizar campo order de cada link
4. updateDoc en Firestore
5. Actualizar estado local
\`\`\`

### Flujo de Personalización de Tema

\`\`\`
1. Usuario en /dashboard
2. Sección "Personalización de Tema"
3. Modificar colores (inputs de color)
4. Seleccionar estilo de botón (Select)
5. Seleccionar fuente (Select)
6. Click en "Guardar tema"
   ↓
7. updateDoc en Firestore (campo theme)
8. Actualizar estado local
9. Toast de confirmación
   ↓
10. Cambios visibles inmediatamente en /[username]
\`\`\`

### Flujo de Vista Pública

\`\`\`
1. Usuario/Visitante accede a /[username]
   ↓
2. Next.js extrae username de params
   ↓
3. Query a Firestore:
   query(collection(db, "users"), where("username", "==", username))
   ↓
4. Si no existe → Renderizar 404
   Si existe → Obtener profile
   ↓
5. Aplicar tema personalizado (estilos inline)
6. Renderizar avatar, nombre, bio
7. Renderizar lista de enlaces (solo isActive: true)
8. Ordenar por campo order
   ↓
9. Click en enlace:
   - Incrementar contador de clicks en Firestore
   - Abrir URL en nueva pestaña
\`\`\`

---

## Cómo Extender la App

### Agregar un Nuevo Campo al Perfil

**1. Actualizar tipos:**
\`\`\`typescript
// types/index.ts
export interface UserProfile {
  // ... campos existentes
  phoneNumber?: string  // Nuevo campo
}
\`\`\`

**2. Actualizar formulario de registro:**
\`\`\`typescript
// app/registro/page.tsx
const [phoneNumber, setPhoneNumber] = useState("")

await setDoc(doc(db, "users", user.uid), {
  // ... campos existentes
  phoneNumber: phoneNumber,
})
\`\`\`

**3. Actualizar dashboard:**
\`\`\`typescript
// app/dashboard/page.tsx
<Input
  placeholder="Número de teléfono"
  value={editedProfile.phoneNumber || ""}
  onChange={(e) => setEditedProfile({
    ...editedProfile,
    phoneNumber: e.target.value
  })}
/>
\`\`\`

### Agregar Analytics de Enlaces

**1. Actualizar tipo Link:**
\`\`\`typescript
export interface Link {
  // ... campos existentes
  clicks: number
  lastClickedAt?: Date
}
\`\`\`

**2. Implementar tracking:**
\`\`\`typescript
// app/[username]/page.tsx
const handleLinkClick = async (linkId: string, url: string) => {
  const linkIndex = profile.links.findIndex(l => l.id === linkId)
  const updatedLinks = [...profile.links]
  
  updatedLinks[linkIndex] = {
    ...updatedLinks[linkIndex],
    clicks: (updatedLinks[linkIndex].clicks || 0) + 1,
    lastClickedAt: new Date()
  }
  
  await updateDoc(doc(db, "users", profile.uid), {
    links: updatedLinks
  })
  
  window.open(url, '_blank')
}
\`\`\`

**3. Mostrar estadísticas en dashboard:**
\`\`\`typescript
// app/dashboard/page.tsx
<div>
  <p>Clicks totales: {link.clicks || 0}</p>
  <p>Último click: {link.lastClickedAt?.toLocaleDateString()}</p>
</div>
\`\`\`

### Agregar Categorías de Enlaces

**1. Actualizar tipos:**
\`\`\`typescript
export interface Link {
  // ... campos existentes
  category?: 'social' | 'work' | 'personal' | 'other'
}
\`\`\`

**2. Agregar selector en formulario:**
\`\`\`typescript
<Select
  value={newLinkCategory}
  onValueChange={setNewLinkCategory}
>
  <SelectTrigger>
    <SelectValue placeholder="Categoría" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="social">Social</SelectItem>
    <SelectItem value="work">Trabajo</SelectItem>
    <SelectItem value="personal">Personal</SelectItem>
    <SelectItem value="other">Otro</SelectItem>
  </SelectContent>
</Select>
\`\`\`

**3. Agrupar enlaces por categoría:**
\`\`\`typescript
const linksByCategory = profile.links.reduce((acc, link) => {
  const category = link.category || 'other'
  if (!acc[category]) acc[category] = []
  acc[category].push(link)
  return acc
}, {} as Record<string, Link[]>)

// Renderizar
{Object.entries(linksByCategory).map(([category, links]) => (
  <div key={category}>
    <h3>{category}</h3>
    {links.map(link => <LinkCard link={link} />)}
  </div>
))}
\`\`\`

### Agregar Autenticación con Google

**1. Habilitar en Firebase Console:**
- Authentication → Sign-in method → Google → Enable

**2. Implementar en login:**
\`\`\`typescript
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"

const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    
    // Verificar si el usuario ya existe en Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))
    
    if (!userDoc.exists()) {
      // Crear perfil para nuevo usuario de Google
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.photoURL,
        username: user.email?.split('@')[0], // Generar username temporal
        // ... resto de campos por defecto
      })
    }
    
    router.push('/dashboard')
  } catch (error) {
    console.error(error)
    toast.error("Error al iniciar sesión con Google")
  }
}
\`\`\`

**3. Agregar botón en UI:**
\`\`\`tsx
<Button onClick={handleGoogleLogin} variant="outline">
  <svg>...</svg> {/* Icono de Google */}
  Continuar con Google
</Button>
\`\`\`

### Agregar Subida de Imágenes (Avatar)

**1. Configurar Firebase Storage:**
\`\`\`typescript
// lib/firebase.ts
import { getStorage } from "firebase/storage"
export const storage = getStorage(app)
\`\`\`

**2. Implementar función de subida:**
\`\`\`typescript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"

const handleAvatarUpload = async (file: File) => {
  if (!user) return
  
  try {
    // Crear referencia única
    const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`)
    
    // Subir archivo
    await uploadBytes(storageRef, file)
    
    // Obtener URL pública
    const downloadURL = await getDownloadURL(storageRef)
    
    // Actualizar perfil
    await updateDoc(doc(db, "users", user.uid), {
      avatarUrl: downloadURL,
      updatedAt: new Date()
    })
    
    toast.success("Avatar actualizado")
  } catch (error) {
    console.error(error)
    toast.error("Error al subir imagen")
  }
}
\`\`\`

**3. Agregar input de archivo:**
\`\`\`tsx
<Input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) handleAvatarUpload(file)
  }}
/>
\`\`\`

### Agregar Modo Oscuro/Claro Toggle

**Ya implementado con next-themes**, pero para personalizarlo:

\`\`\`typescript
// components/theme-toggle.tsx
"use client"

import { Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
\`\`\`

### Agregar Middleware para Proteger Rutas

**Crear middleware:**
\`\`\`typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar si hay sesión (cookie de Firebase)
  const session = request.cookies.get('session')
  
  // Rutas protegidas
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
\`\`\`

**Nota**: Para usar cookies de sesión con Firebase, necesitas implementar Firebase Admin SDK en el servidor.

---

## Mejores Prácticas

### 1. Seguridad

- **Nunca exponer claves privadas**: Solo usa `NEXT_PUBLIC_*` para claves de cliente
- **Validar en servidor**: No confíes solo en validación de cliente
- **Reglas de Firestore**: Siempre configura reglas de seguridad estrictas
- **Sanitizar inputs**: Valida y limpia datos de usuario antes de guardar

### 2. Performance

- **Lazy loading**: Usa `dynamic()` de Next.js para componentes pesados
- **Optimizar imágenes**: Usa `next/image` para imágenes
- **Caché de Firestore**: Usa listeners (`onSnapshot`) para datos en tiempo real
- **Índices de Firestore**: Crea índices para queries frecuentes

### 3. UX

- **Loading states**: Siempre muestra feedback durante operaciones async
- **Error handling**: Mensajes de error claros y útiles
- **Validación en tiempo real**: Feedback inmediato en formularios
- **Confirmaciones**: Pide confirmación para acciones destructivas

### 4. Código

- **TypeScript**: Usa tipos estrictos, evita `any`
- **Componentes pequeños**: Divide componentes grandes en piezas reutilizables
- **Nombres descriptivos**: Variables y funciones con nombres claros
- **Comentarios**: Documenta lógica compleja

---

## Troubleshooting

### Error: "Firebase not initialized"
**Causa**: Variables de entorno no configuradas
**Solución**: Verifica que `.env.local` tenga todas las variables de Firebase

### Error: "Permission denied" en Firestore
**Causa**: Reglas de seguridad incorrectas
**Solución**: Revisa las reglas en Firebase Console

### Error: "Username already exists"
**Causa**: Username duplicado en Firestore
**Solución**: Implementa validación única con índice en Firestore

### Página pública no carga
**Causa**: Username no existe o query incorrecta
**Solución**: Verifica que el username esté guardado correctamente en Firestore

### Tema no se aplica
**Causa**: Estilos inline no se están aplicando
**Solución**: Verifica que `profile.theme` tenga todos los campos necesarios

---

## Recursos Adicionales

### Documentación Oficial
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

### Herramientas Útiles
- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Lucide Icons](https://lucide.dev/)

---

## Contacto y Soporte

Para preguntas o problemas, contacta al equipo de desarrollo o revisa la documentación oficial de las tecnologías utilizadas.

---

**Última actualización**: 2025
**Versión de la app**: 1.0.0
