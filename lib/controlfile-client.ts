import { auth, db } from './firebase'; // Tu auth central ya configurado
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


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
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  // 1. Subir archivo a Firebase Storage
  const storage = getStorage();
  const fileRef = ref(storage, `files/${user.uid}/${Date.now()}-${file.name}`);
  
  // Simular progreso
  if (onProgress) {
    onProgress(10);
  }
  
  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  if (onProgress) {
    onProgress(90);
  }

  // 2. Crear registro en Firestore
  const fileId = `file-${Date.now()}`;
  const fileData = {
    id: fileId,
    userId: user.uid,
    name: file.name,
    slug: file.name.toLowerCase().replace(/\s+/g, '-'),
    parentId: parentId,
    path: parentId ? [parentId] : [],
    type: 'file',
    mime: file.type,
    size: file.size,
    downloadURL: downloadURL,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    metadata: {
      icon: 'File',
      color: 'text-gray-600',
      isMainFolder: false,
      isDefault: false,
      description: '',
      tags: [],
      isPublic: false,
      viewCount: 0,
      lastAccessedAt: new Date(),
      source: 'navbar',
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true,
        canDownload: true
      },
      customFields: {}
    }
  };

  await setDoc(doc(db, 'files', fileId), fileData);
  
  if (onProgress) {
    onProgress(100);
  }
  
  console.log(`✅ Archivo ${file.name} subido`);
  return fileId;
}


// 📥 OBTENER URL DE DESCARGA
export async function getDownloadUrl(fileId: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  // Obtener el documento del archivo
  const fileRef = doc(db, 'files', fileId);
  const fileSnap = await getDoc(fileRef);
  
  if (!fileSnap.exists()) {
    throw new Error('Archivo no encontrado');
  }
  
  const fileData = fileSnap.data();
  
  // Verificar que el archivo pertenece al usuario
  if (fileData.userId !== user.uid) {
    throw new Error('No tienes permisos para acceder a este archivo');
  }
  
  // Retornar la URL de descarga (ya está en el documento)
  return fileData.downloadURL;
}

// 🔗 CREAR ENLACE COMPARTIDO
export async function createShareLink(fileId: string, expiresInHours: number = 24): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  // Crear enlace compartido simple (puedes implementar lógica más compleja si necesitas)
  const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  
  const shareData = {
    id: shareId,
    fileId: fileId,
    userId: user.uid,
    expiresAt: expiresAt,
    createdAt: new Date(),
    isActive: true
  };

  await setDoc(doc(db, 'shares', shareId), shareData);
  
  console.log(`✅ Enlace compartido creado: ${shareId}`);
  return shareId;
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
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  // Obtener el documento del archivo
  const fileRef = doc(db, 'files', fileId);
  const fileSnap = await getDoc(fileRef);
  
  if (!fileSnap.exists()) {
    throw new Error('Archivo no encontrado');
  }
  
  const fileData = fileSnap.data();
  
  // Verificar que el archivo pertenece al usuario
  if (fileData.userId !== user.uid) {
    throw new Error('No tienes permisos para eliminar este archivo');
  }
  
  // Marcar como eliminado (soft delete)
  await setDoc(fileRef, {
    ...fileData,
    deletedAt: new Date(),
    updatedAt: new Date()
  }, { merge: true });
  
  console.log(`✅ Archivo ${fileId} eliminado`);
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




