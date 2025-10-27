# 👨‍💻 Guía de Desarrollador - ControlBio + ControlFile

> Guía rápida para desarrolladores que trabajen con la integración de ControlFile en ControlBio.

## 🚀 Inicio Rápido

### 1. Configuración del Entorno

```bash
# Clonar repositorio
git clone [repo-url]
cd controlbio

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de ControlFile
```

### 2. Variables de Entorno Requeridas

```env
# Firebase Auth Central (ControlFile)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=controlstorage-eb796
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...

# Backend ControlFile
NEXT_PUBLIC_BACKEND_URL=https://controlfile.onrender.com
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
# Abrir http://localhost:3000
```

## 🏗️ Estructura del Código

### Archivos Principales

```
lib/
├── controlfile-client.ts    # Cliente de ControlFile
├── firebase.ts             # Configuración Firebase

hooks/
├── useControlBio.ts        # Hook para gestión de archivos

components/
├── ControlBioFileManager.tsx # UI de gestión de archivos

app/
├── dashboard/page.tsx      # Dashboard con pestaña Archivos
```

## 🔧 Desarrollo

### Agregar Nueva Funcionalidad

#### 1. Nueva Operación de Archivo

```typescript
// lib/controlfile-client.ts
export async function nuevaOperacion(parametros) {
  const token = await getToken();
  
  const response = await fetch(`${BACKEND_URL}/api/endpoint`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parametros),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Error HTTP ${response.status}`);
  }
  
  return await response.json();
}
```

#### 2. Agregar al Hook

```typescript
// hooks/useControlBio.ts
const handleNuevaOperacion = async (parametros) => {
  try {
    setError(null);
    const result = await nuevaOperacion(parametros);
    // Actualizar estado si es necesario
    return result;
  } catch (error) {
    setError(error.message);
    throw error;
  }
};

return {
  // ... otros métodos
  nuevaOperacion: handleNuevaOperacion,
};
```

#### 3. Agregar a la UI

```typescript
// components/ControlBioFileManager.tsx
const { nuevaOperacion } = useControlBio();

const handleNuevaOperacion = async () => {
  try {
    await nuevaOperacion(parametros);
    toast.success('Operación exitosa');
  } catch (error) {
    toast.error('Error en la operación');
  }
};
```

### Modificar la UI

#### Agregar Nuevo Botón

```typescript
<Button onClick={handleNuevaOperacion}>
  <Icon className="w-4 h-4 mr-2" />
  Nueva Operación
</Button>
```

#### Agregar Nueva Pestaña

```typescript
// app/dashboard/page.tsx
<TabsList className="grid w-full grid-cols-6">
  <TabsTrigger value="profile">Perfil</TabsTrigger>
  <TabsTrigger value="links">Enlaces</TabsTrigger>
  <TabsTrigger value="files">Archivos</TabsTrigger>
  <TabsTrigger value="nueva">Nueva</TabsTrigger> {/* ← Nueva pestaña */}
  <TabsTrigger value="theme">Personalización</TabsTrigger>
  <TabsTrigger value="security">Seguridad</TabsTrigger>
</TabsList>

<TabsContent value="nueva" className="space-y-6">
  <NuevoComponente />
</TabsContent>
```

## 🧪 Testing

### Testing de Componentes

```typescript
// __tests__/ControlBioFileManager.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlBioFileManager } from '@/components/ControlBioFileManager';

// Mock del hook
jest.mock('@/hooks/useControlBio', () => ({
  useControlBio: () => ({
    files: [],
    loading: false,
    uploadFile: jest.fn(),
    // ... otros mocks
  }),
}));

test('renders file manager', () => {
  render(<ControlBioFileManager />);
  expect(screen.getByText('ControlBio - Gestión de Archivos')).toBeInTheDocument();
});
```

### Testing de Hooks

```typescript
// __tests__/useControlBio.test.ts
import { renderHook, act } from '@testing-library/react';
import { useControlBio } from '@/hooks/useControlBio';

test('should upload file', async () => {
  const { result } = renderHook(() => useControlBio());
  
  const file = new File(['content'], 'test.txt', { type: 'text/plain' });
  
  await act(async () => {
    await result.current.uploadFile(file);
  });
  
  expect(result.current.uploading).toBe(false);
});
```

## 🐛 Debugging

### Herramientas de Debug

#### 1. React DevTools
- Inspeccionar estado del hook `useControlBio`
- Ver props del componente `ControlBioFileManager`

#### 2. Network Tab
- Verificar llamadas a ControlFile API
- Revisar headers de autenticación
- Monitorear errores CORS

#### 3. Console Logs

```typescript
// Habilitar logs detallados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('🔍 ControlFile Debug:', {
    folderId,
    files: files.length,
    loading,
    error
  });
}
```

### Errores Comunes

#### 1. CORS Error
```javascript
// Verificar en Network tab
// Debería ver: Access-Control-Allow-Origin header
```

#### 2. Auth Error
```javascript
// Verificar token en Headers
// Authorization: Bearer [token]
```

#### 3. File Upload Error
```javascript
// Verificar FormData en Network tab
// Debería incluir: file, sessionId
```

## 📦 Build y Deploy

### Build de Producción

```bash
npm run build
npm start
```

### Variables de Entorno de Producción

```env
# Producción
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=controlstorage-eb796
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
NEXT_PUBLIC_BACKEND_URL=https://controlfile.onrender.com
```

### Verificaciones Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] CORS configurado para dominio de producción
- [ ] Claims de usuarios configurados
- [ ] Tests pasando
- [ ] Build sin errores

## 🔄 Mantenimiento

### Actualizaciones de ControlFile

1. **Verificar cambios en API**
   - Revisar `controlfile/API_REFERENCE.md`
   - Probar endpoints en desarrollo

2. **Actualizar cliente**
   - Modificar `lib/controlfile-client.ts`
   - Actualizar tipos TypeScript

3. **Testing**
   - Ejecutar tests existentes
   - Probar funcionalidades manualmente

### Monitoreo en Producción

#### Métricas a Revisar
- Errores 401/403 (autenticación)
- Errores CORS
- Tiempo de respuesta de APIs
- Tasa de éxito de subidas

#### Logs Importantes
```bash
# Buscar en logs de aplicación
grep "ControlFile" logs/app.log
grep "CORS" logs/app.log
grep "401\|403" logs/app.log
```

## 📚 Recursos Adicionales

### Documentación
- [ControlFile API Reference](../controlfile/API_REFERENCE.md)
- [Guía de Integración](../controlfile/GUIA_INTEGRACION_APPS_EXTERNAS.md)
- [Integración Backend](../controlfile/GUIA_BACKEND.md)

### Herramientas
- [Firebase Console](https://console.firebase.google.com)
- [ControlFile Backend](https://controlfile.onrender.com)
- [Next.js Docs](https://nextjs.org/docs)

### Contacto
- **Equipo ControlBio**: [email]
- **ControlFile Admin**: [email]

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0
