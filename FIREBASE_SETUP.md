# Configuración de Firebase para ControlBio

## 1. Configurar Autenticación con Google

### En Firebase Console:
1. Ve a **Authentication** → **Sign-in method**
2. Habilita **Google** como proveedor
3. Configura el **Project support email**
4. Guarda los cambios

## 2. Configurar Reglas de Firestore

### En Firebase Console:
1. Ve a **Firestore Database** → **Rules**
2. Reemplaza las reglas existentes con el contenido de `firestore.rules`
3. Publica las reglas

### Reglas incluidas:
- **Colección `users`**: Lectura pública, escritura solo del propietario
- **Colección `links`**: Solo el propietario puede leer/escribir
- **Validaciones**: Username (3-20 chars), displayName (1-50 chars), URLs válidas

## 3. Crear Índices de Firestore

### Índices necesarios:
1. **Colección**: `users`
   - **Campos**: `username` (Ascending)
   - **Tipo**: Single field

2. **Colección**: `links`
   - **Campos**: `userId` (Ascending), `isActive` (Ascending), `order` (Ascending)
   - **Tipo**: Composite

### Cómo crear:
1. Ve a **Firestore Database** → **Indexes**
2. Haz clic en **Create Index**
3. Configura los campos según arriba
4. Crea el índice

## 4. Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 5. Estructura de Datos

### Colección `users`:
```typescript
{
  uid: string,
  email: string,
  username: string,        // Único, para URLs
  displayName: string,
  bio: string,
  avatarUrl: string,
  theme: {
    backgroundColor: string,
    textColor: string,
    buttonColor: string,
    buttonTextColor: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Colección `links`:
```typescript
{
  id: string,
  userId: string,         // Referencia al usuario
  title: string,
  url: string,
  description?: string,
  type: "external" | "internal",
  order: number,          // Para ordenar
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 6. Probar la Aplicación

1. **Iniciar servidor**: `npm run dev`
2. **Registro**: Ve a `/registro` y prueba con Google
3. **Login**: Ve a `/login` y prueba con Google
4. **Dashboard**: Crea enlaces y personaliza tu perfil
5. **Página pública**: Ve a `/{username}` para ver el resultado

## 7. Funcionalidades Implementadas

✅ **Autenticación con Google**
✅ **Registro con email/password**
✅ **Login con email/password**
✅ **Dashboard completo con CRUD de enlaces**
✅ **Páginas públicas personalizables**
✅ **Sistema de temas dinámico**
✅ **Metadata SEO dinámica**
✅ **Reglas de seguridad de Firestore**
✅ **Validación de datos**

## 8. URLs de la Aplicación

- **Landing**: `http://localhost:3000/`
- **Registro**: `http://localhost:3000/registro`
- **Login**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Perfil público**: `http://localhost:3000/{username}`

## 9. Próximos Pasos Recomendados

1. **Configurar dominio personalizado** en Firebase Hosting
2. **Implementar analytics** con Firebase Analytics
3. **Agregar notificaciones push** con Firebase Cloud Messaging
4. **Implementar subida de imágenes** con Firebase Storage
5. **Agregar tests unitarios** con Jest/Testing Library
