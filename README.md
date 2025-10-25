# ControlBio

Una aplicación moderna de enlaces en bio (similar a Linktree) construida con Next.js, Firebase y Tailwind CSS.

## Características

- 🔐 Autenticación de usuarios con Firebase Auth
- 🎨 Personalización avanzada de temas (colores personalizados)
- 🔗 Gestión completa de enlaces (crear, editar, eliminar, reordenar)
- 👤 Páginas de perfil públicas personalizadas
- 📱 Diseño mobile-first y responsive
- 🌙 Soporte para modo oscuro
- ⚡ Optimizado con Next.js 15 y React 19

## Configuración de Firebase

### 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Sigue los pasos para crear tu proyecto

### 2. Habilitar Authentication

1. En la consola de Firebase, ve a **Authentication**
2. Haz clic en "Comenzar"
3. En la pestaña "Sign-in method", habilita **Email/Password**

### 3. Crear Firestore Database

1. En la consola de Firebase, ve a **Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (o configura reglas personalizadas)
4. Elige una ubicación para tu base de datos

### 4. Configurar reglas de seguridad de Firestore

En la pestaña "Reglas" de Firestore, agrega las siguientes reglas:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles collection
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Links collection
    match /links/{linkId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
\`\`\`

### 5. Obtener las credenciales de Firebase

1. En la consola de Firebase, ve a **Configuración del proyecto** (ícono de engranaje)
2. En la sección "Tus apps", haz clic en el ícono web `</>`
3. Registra tu app y copia las credenciales

### 6. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
\`\`\`

## Instalación

\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
\`\`\`

## Estructura del proyecto

\`\`\`
controlbio/
├── app/
│   ├── [username]/          # Páginas públicas de perfil
│   ├── dashboard/           # Panel de administración
│   ├── login/              # Página de inicio de sesión
│   ├── registro/           # Página de registro
│   └── page.tsx            # Página de inicio
├── components/
│   └── ui/                 # Componentes de UI (shadcn)
├── lib/
│   ├── firebase.ts         # Configuración de Firebase
│   └── auth-context.tsx    # Contexto de autenticación
└── types/
    └── index.ts            # Tipos TypeScript
\`\`\`

## Uso

### Para usuarios

1. **Registro**: Crea una cuenta con tu email y contraseña
2. **Configurar perfil**: Agrega tu nombre, username, biografía y foto
3. **Agregar enlaces**: Crea enlaces a tus redes sociales, sitios web, etc.
4. **Personalizar tema**: Elige los colores de tu página
5. **Compartir**: Comparte tu URL personalizada: `tudominio.com/tunombre`

### Para desarrolladores

La aplicación usa:
- **Next.js 15** con App Router
- **Firebase** para autenticación y base de datos
- **Tailwind CSS v4** para estilos
- **shadcn/ui** para componentes
- **TypeScript** para tipado estático

## Colecciones de Firestore

### `profiles`
\`\`\`typescript
{
  id: string              // UID del usuario
  username: string        // Nombre de usuario único
  displayName: string     // Nombre para mostrar
  bio: string            // Biografía
  avatarUrl: string      // URL de la imagen de perfil
  theme: {
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
  }
  createdAt: Date
  updatedAt: Date
}
\`\`\`

### `links`
\`\`\`typescript
{
  id: string
  userId: string          // UID del propietario
  title: string          // Título del enlace
  url: string            // URL del enlace
  description?: string   // Descripción opcional
  type: "external" | "internal"
  order: number          // Orden de visualización
  isActive: boolean      // Si está activo o no
  createdAt: Date
  updatedAt: Date
}
\`\`\`

## Despliegue

### GitHub + Vercel (Recomendado)

#### 1. Subir a GitHub

```bash
# Inicializar repositorio Git
git init
git add .
git commit -m "Initial commit: ControlBio app"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/controlbio.git
git branch -M main
git push -u origin main
```

#### 2. Deploy en Vercel

1. **Conectar repositorio**:
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en "New Project"
   - Conecta tu repositorio de GitHub

2. **Configurar variables de entorno**:
   - En la configuración del proyecto, ve a "Environment Variables"
   - Agrega todas las variables de `env.example`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
     NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
     ```

3. **Deploy automático**:
   - Vercel detectará automáticamente que es un proyecto Next.js
   - El archivo `vercel.json` ya está configurado
   - Haz clic en "Deploy"

#### 3. Configurar Firebase para producción

1. **Agregar dominio autorizado**:
   - En Firebase Console > Authentication > Settings
   - Agrega tu dominio de Vercel (ej: `tu-app.vercel.app`)

2. **Configurar Firestore**:
   - Las reglas ya están en `firestore.rules`
   - Cópialas a Firebase Console > Firestore > Rules

### Otros proveedores

Asegúrate de:
- Configurar las variables de entorno
- Usar Node.js 18 o superior
- Ejecutar `npm run build` antes de desplegar
- Configurar Firebase con el dominio de producción

## Licencia

MIT

## Soporte

Para problemas o preguntas, abre un issue en el repositorio.
