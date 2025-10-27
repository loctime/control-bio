# 📁 Integración ControlFile - ControlBio

> Documentación técnica de la integración de ControlFile en ControlBio para gestión de archivos.

## 🎯 Resumen

ControlBio utiliza ControlFile como sistema de almacenamiento de archivos, permitiendo a los usuarios:
- Subir archivos a una carpeta dedicada "ControlBio" en el taskbar
- Organizar archivos en subcarpetas
- Compartir archivos con enlaces públicos
- Descargar archivos con URLs temporales

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ControlBio Frontend                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Dashboard     │  │  File Manager   │  │  Auth Hook   │ │
│  │   (Tabs)        │  │  Component      │  │  (Firebase)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Firebase ID Token
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                ControlFile Backend API                      │
│              https://controlfile.onrender.com               │
├─────────────────────────────────────────────────────────────┤
│  • Valida tokens Firebase Auth Central                     │
│  • Verifica claim allowedApps                              │
│  • Gestiona carpetas y archivos                           │
│  • Almacena en Backblaze B2                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Firestore + Backblaze B2                      │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Firestore     │  │  Backblaze B2   │                  │
│  │   (metadata)    │  │  (archivos)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Archivos

### Archivos de Integración

```
lib/
├── controlfile-client.ts     # Cliente principal de ControlFile
├── firebase.ts              # Configuración Firebase Auth Central

hooks/
├── useControlBio.ts         # Hook personalizado para gestión de archivos

components/
├── ControlBioFileManager.tsx # Componente de interfaz de archivos

docs/
├── CONTROLFILE_INTEGRATION.md # Esta documentación
```

## 🔧 Configuración

### Variables de Entorno

```env
# Firebase Auth Central (compartido con ControlFile)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=controlstorage-eb796
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...

# Backend ControlFile
NEXT_PUBLIC_BACKEND_URL=https://controlfile.onrender.com
```

### Configuración Firebase

```typescript
// lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

## 🚀 Funcionalidades Implementadas

### 1. Gestión de Carpetas

#### Carpeta Principal "ControlBio"
- Se crea automáticamente en el taskbar
- Metadata: `source: "taskbar"`
- Icono: `Briefcase`
- Color: `text-purple-600`

#### Subcarpetas
- Se pueden crear subcarpetas para organizar archivos
- Metadata: `source: "navbar"`
- Se crean bajo la carpeta principal

### 2. Subida de Archivos

#### Flujo de Subida
1. **Presign**: Crear sesión de subida
2. **Proxy Upload**: Subir archivo vía proxy (evita CORS)
3. **Confirm**: Confirmar subida y obtener fileId

#### Características
- ✅ Barra de progreso en tiempo real
- ✅ Soporte para subcarpetas opcionales
- ✅ Validación de tipos de archivo
- ✅ Manejo de errores

### 3. Gestión de Archivos

#### Operaciones Disponibles
- **Listar**: Obtener lista de archivos y carpetas
- **Descargar**: URLs temporales (5 minutos de validez)
- **Compartir**: Enlaces públicos (24 horas por defecto)
- **Eliminar**: Eliminar archivos permanentemente

#### Tipos de Archivo Soportados
- 📄 Documentos (PDF, Word, Excel, PowerPoint)
- 🖼️ Imágenes (JPG, PNG, GIF, etc.)
- 🎥 Videos (MP4, AVI, MOV, etc.)
- 🎵 Audio (MP3, WAV, etc.)
- 📦 Archivos comprimidos (ZIP, RAR, etc.)

## 🔌 API Reference

### Cliente ControlFile

```typescript
// lib/controlfile-client.ts

// Crear/obtener carpeta principal
getControlBioFolder(): Promise<string>

// Subir archivo
uploadFile(file: File, parentId?: string, onProgress?: (percent: number) => void): Promise<string>

// Obtener URL de descarga
getDownloadUrl(fileId: string): Promise<string>

// Crear enlace compartido
createShareLink(fileId: string, expiresInHours?: number): Promise<string>

// Listar archivos
listFiles(parentId?: string): Promise<ControlBioFile[]>

// Eliminar archivo
deleteFile(fileId: string): Promise<void>

// Crear subcarpeta
createSubFolder(name: string, parentId: string): Promise<string>
```

### Hook useControlBio

```typescript
// hooks/useControlBio.ts

const {
  // Estado
  folderId,           // ID de la carpeta principal
  files,             // Lista de archivos
  loading,           // Estado de carga
  uploading,         // Estado de subida
  uploadProgress,    // Progreso de subida (0-100)
  error,             // Error actual
  
  // Acciones
  uploadFile,        // Subir archivo
  downloadFile,      // Descargar archivo
  shareFile,         // Compartir archivo
  deleteFile,        // Eliminar archivo
  createFolder,      // Crear carpeta
  refreshFiles,      // Actualizar lista
  
  // Utilidades
  formatFileSize,    // Formatear tamaño de archivo
  getFileIcon,       // Obtener icono según tipo
  clearError,        // Limpiar error
} = useControlBio();
```

## 🎨 Interfaz de Usuario

### Componente ControlBioFileManager

```typescript
// components/ControlBioFileManager.tsx

<ControlBioFileManager />
```

#### Características de la UI
- **Selección de archivos**: Input file con drag & drop
- **Progreso de subida**: Barra de progreso animada
- **Lista de archivos**: Vista de tarjetas con información detallada
- **Acciones por archivo**: Descargar, compartir, eliminar
- **Gestión de carpetas**: Crear subcarpetas
- **Manejo de errores**: Alertas informativas
- **Estados de carga**: Spinners y indicadores

## 🔒 Seguridad

### Autenticación
- **Firebase Auth Central**: Usuarios autenticados en proyecto compartido
- **Claims de acceso**: Verificación de `allowedApps` claim
- **Tokens JWT**: ID tokens de Firebase para autenticación

### Aislamiento de Datos
- **Por usuario**: Cada usuario solo ve sus propios archivos
- **Por aplicación**: Archivos separados por app (ControlBio)
- **Cuotas individuales**: Límites de almacenamiento por usuario

### URLs Temporales
- **Descarga**: URLs válidas por 5 minutos
- **Compartir**: Enlaces públicos con expiración configurable
- **Seguridad**: No se almacenan URLs en base de datos

## 🐛 Troubleshooting

### Errores Comunes

#### 1. Error CORS
```
Access to fetch blocked by CORS policy
```
**Solución**: Contactar administrador para agregar dominio a `ALLOWED_ORIGINS`

#### 2. Error 403 - App no permitida
```json
{ "error": "Acceso no permitido para esta app" }
```
**Solución**: Verificar que el usuario tenga claim `allowedApps` con "controlfile"

#### 3. Error 401 - Token inválido
```json
{ "error": "Token de autorización requerido" }
```
**Solución**: Verificar configuración de Firebase Auth Central

#### 4. Carpeta no aparece en taskbar
**Causa**: Falta `source: "taskbar"` en metadata
**Solución**: El código ya está corregido para incluir este campo

### Debugging

#### Logs de Consola
```typescript
// Habilitar logs detallados
console.log('✅ Carpeta ControlBio creada con source: taskbar');
console.log('✅ Archivo subido:', fileId);
console.warn('Error con endpoint root, intentando método alternativo:', error);
```

#### Verificar Estado
```typescript
// En el hook useControlBio
console.log('Folder ID:', folderId);
console.log('Files:', files);
console.log('Loading:', loading);
console.log('Error:', error);
```

## 📊 Monitoreo

### Métricas Importantes
- **Tasa de éxito de subida**: Archivos subidos exitosamente
- **Tiempo de respuesta**: Latencia de las APIs
- **Errores CORS**: Frecuencia de errores de CORS
- **Uso de almacenamiento**: Espacio utilizado por usuario

### Logs a Monitorear
- Errores de autenticación (401, 403)
- Errores de CORS
- Fallos en subida de archivos
- Errores de creación de carpetas

## 🔄 Mantenimiento

### Actualizaciones
- **ControlFile API**: Verificar cambios en endpoints
- **Firebase Auth**: Mantener compatibilidad con Auth Central
- **Dependencias**: Actualizar librerías de Firebase

### Backup
- **Archivos**: Almacenados en Backblaze B2 (ControlFile)
- **Metadata**: En Firestore de ControlFile
- **Configuración**: En variables de entorno

## 📞 Soporte

### Contactos
- **ControlFile Admin**: Para configuración CORS y claims
- **Desarrollo**: Para bugs y mejoras en la integración

### Recursos
- **Documentación ControlFile**: `controlfile/API_REFERENCE.md`
- **Guía de Integración**: `controlfile/GUIA_INTEGRACION_APPS_EXTERNAS.md`
- **Backend URL**: https://controlfile.onrender.com

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025  
**Mantenido por**: Equipo ControlBio
