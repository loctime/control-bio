import { auth, db } from './firebase'; // Tu auth central ya configurado
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://controlfile.onrender.com';

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');
  return user.getIdToken();
}


// 📁 CREAR/OBTENER CARPETA PRINCIPAL EN TASKBAR
export async function getControlBioFolder(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  // Usar un ID fijo para evitar duplicados
  const folderId = `controlbio-main-${user.uid}`;
  
  // Crear la carpeta directamente en Firestore (setDoc crea o actualiza)
  console.log('📁 Creando/obteniendo carpeta ControlBio...');
  
  const folderData = {
    id: folderId,
    userId: user.uid,
    name: 'ControlBio',
    slug: 'controlbio',
    parentId: null,
    path: [],
    type: 'folder',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    metadata: {
      icon: 'Taskbar',
      color: 'text-purple-600',
      isMainFolder: true,
      isDefault: false,
      description: '',
      tags: [],
      isPublic: false,
      viewCount: 0,
      lastAccessedAt: new Date(),
      source: 'taskbar', // ✅ CLAVE: Aparece en taskbar
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true,
        canDownload: true
      },
      customFields: {}
    }
  };

  const folderRef = doc(db, 'files', folderId);
  await setDoc(folderRef, folderData);
  console.log('✅ Carpeta ControlBio creada/actualizada en taskbar:', folderId);
  
  return folderId;
}

// 📤 SUBIR ARCHIVO
export async function uploadFile(
  file: File, 
  parentId: string | null = null,
  onProgress?: (percent: number) => void
): Promise<string> {
  const token = await getToken();
  
  // 1. Crear sesión de subida
  const presignResponse = await fetch(`${BACKEND_URL}/api/uploads/presign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
      parentId,
    }),
  });
  
  if (!presignResponse.ok) {
    const error = await presignResponse.json();
    throw new Error(error.error || 'Error al crear sesión de subida');
  }
  
  const { uploadSessionId } = await presignResponse.json();
  
  // 2. Subir archivo vía proxy
  await uploadThroughProxy(file, uploadSessionId, token, onProgress);
  
  // 3. Confirmar subida
  const confirmResponse = await fetch(`${BACKEND_URL}/api/uploads/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uploadSessionId }),
  });
  
  if (!confirmResponse.ok) {
    const error = await confirmResponse.json();
    throw new Error(error.error || 'Error al confirmar subida');
  }
  
  const { fileId } = await confirmResponse.json();
  return fileId;
}

// Subir usando proxy (evita CORS)
function uploadThroughProxy(
  file: File, 
  sessionId: string, 
  token: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Error HTTP ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Error de red al subir archivo'));
    });
    
    xhr.open('POST', `${BACKEND_URL}/api/uploads/proxy-upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    
    xhr.send(formData);
  });
}

// 📥 OBTENER URL DE DESCARGA
export async function getDownloadUrl(fileId: string): Promise<string> {
  const token = await getToken();
  
  const response = await fetch(`${BACKEND_URL}/api/files/presign-get`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener URL de descarga');
  }
  
  const { downloadUrl } = await response.json();
  return downloadUrl;
}

// 🔗 CREAR ENLACE COMPARTIDO
export async function createShareLink(fileId: string, expiresInHours: number = 24): Promise<string> {
  const token = await getToken();
  
  const response = await fetch(`${BACKEND_URL}/api/shares/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      fileId, 
      expiresIn: expiresInHours 
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear enlace de compartir');
  }
  
  const { shareUrl } = await response.json();
  return shareUrl;
}

// 📋 LISTAR ARCHIVOS
export async function listFiles(parentId: string | null = null) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const q = query(
    collection(db, 'files'),
    where('userId', '==', user.uid),
    where('parentId', '==', parentId),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const files = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return files;
}

// 🗑️ ELIMINAR ARCHIVO
export async function deleteFile(fileId: string): Promise<void> {
  const token = await getToken();
  
  const response = await fetch(`${BACKEND_URL}/api/files/delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar archivo');
  }
}

// 📁 CREAR SUBCARPETA
export async function createSubFolder(name: string, parentId: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const folderData = {
    id: folderId,
    userId: user.uid,
    name: name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    parentId: parentId,
    path: [parentId], // Path incluye la carpeta padre
    type: 'folder',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    metadata: {
      icon: 'Folder',
      color: 'text-blue-600',
      isMainFolder: false,
      isDefault: false,
      description: '',
      tags: [],
      isPublic: false,
      viewCount: 0,
      lastAccessedAt: new Date(),
      source: 'navbar', // Las subcarpetas van dentro de la carpeta principal, no al taskbar
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true,
        canDownload: true
      },
      customFields: {}
    }
  };

  await setDoc(doc(db, 'files', folderId), folderData);
  
  console.log(`✅ Subcarpeta "${name}" creada:`, folderId);
  return folderId;
}

// 🔍 VERIFICAR SI CARPETA EXISTE
export async function ensureFolderExists(folderName: string, parentId: string): Promise<string> {
  try {
    // 1. Listar contenido de la carpeta padre
    const items = await listFiles(parentId);
    
    // 2. Buscar carpeta existente
    const existingFolder = items?.find(
      (item: any) => item.type === 'folder' && item.name === folderName
    );
    
    if (existingFolder) {
      console.log(`✅ Carpeta "${folderName}" ya existe:`, existingFolder.id);
      return existingFolder.id;
    }
    
    // 3. Crear si no existe
    console.log(`📁 Creando carpeta "${folderName}"...`);
    return await createSubFolder(folderName, parentId);
    
  } catch (error) {
    console.error('Error verificando/creando carpeta:', error);
    throw error;
  }
}




