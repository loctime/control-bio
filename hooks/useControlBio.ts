import { useState, useEffect } from 'react';
import { 
  getControlBioFolder, 
  uploadFile, 
  listFiles, 
  getDownloadUrl, 
  createShareLink,
  deleteFile,
  createSubFolder,
  ensureFolderExists
} from '@/lib/controlfile-client';

export interface ControlBioFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  userId: string;
  parentId: string | null;
  createdAt: any;
  modifiedAt: any;
  type: 'file' | 'folder';
}

export function useControlBio() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<ControlBioFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Inicializar carpeta ControlBio
  useEffect(() => {
    initializeFolder();
  }, []);

  const initializeFolder = async () => {
    try {
      setLoading(true);
      setError(null);
      const id = await getControlBioFolder();
      setFolderId(id);
      await loadFiles(id);
    } catch (error) {
      console.error('Error inicializando carpeta ControlBio:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (parentId?: string) => {
    try {
      setError(null);
      const items = await listFiles(parentId || folderId);
      setFiles(items || []);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      setError(error instanceof Error ? error.message : 'Error cargando archivos');
    }
  };

  const handleUpload = async (file: File, subfolder?: string) => {
    if (!folderId) {
      throw new Error('Carpeta ControlBio no inicializada');
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      let targetFolderId = folderId;
      
      // Si se especifica subcarpeta, crearla o obtenerla
      if (subfolder) {
        targetFolderId = await ensureFolderExists(subfolder, folderId);
      }
      
      const fileId = await uploadFile(file, targetFolderId, setUploadProgress);
      
      // Recargar lista de archivos
      await loadFiles();
      
      return fileId;
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setError(error instanceof Error ? error.message : 'Error subiendo archivo');
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setError(null);
      const url = await getDownloadUrl(fileId);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (error) {
      console.error('Error descargando archivo:', error);
      setError(error instanceof Error ? error.message : 'Error descargando archivo');
      throw error;
    }
  };

  const handleShare = async (fileId: string, hours: number = 24) => {
    try {
      setError(null);
      const shareUrl = await createShareLink(fileId, hours);
      return shareUrl;
    } catch (error) {
      console.error('Error creando enlace compartido:', error);
      setError(error instanceof Error ? error.message : 'Error creando enlace compartido');
      throw error;
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      setError(null);
      await deleteFile(fileId);
      await loadFiles();
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      setError(error instanceof Error ? error.message : 'Error eliminando archivo');
      throw error;
    }
  };

  const createFolder = async (folderName: string, parentId?: string) => {
    try {
      setError(null);
      const targetParentId = parentId || folderId;
      if (!targetParentId) {
        throw new Error('No hay carpeta padre especificada');
      }
      
      const newFolderId = await createSubFolder(folderName, targetParentId);
      await loadFiles();
      return newFolderId;
    } catch (error) {
      console.error('Error creando carpeta:', error);
      setError(error instanceof Error ? error.message : 'Error creando carpeta');
      throw error;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📄';
  };

  return {
    // Estado
    folderId,
    files,
    loading,
    uploading,
    uploadProgress,
    error,
    
    // Acciones
    uploadFile: handleUpload,
    downloadFile: handleDownload,
    shareFile: handleShare,
    deleteFile: handleDelete,
    createFolder,
    refreshFiles: () => loadFiles(),
    
    // Utilidades
    formatFileSize,
    getFileIcon,
    clearError: () => setError(null),
  };
}
