import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Función para inicializar la carpeta ControlBio
const initializeControlBioFolder = async (): Promise<string> => {
  const id = await getControlBioFolder();
  return id;
};

export function useControlBio() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Query para obtener el folderId de ControlBio
  const { data: folderId } = useQuery({
    queryKey: ['controlBioFolder'],
    queryFn: initializeControlBioFolder,
    staleTime: Infinity, // Nunca expira porque es una carpeta raíz fija
  });

  // Query para cargar archivos
  const { 
    data: files = [], 
    isLoading: loading,
    error: filesError 
  } = useQuery({
    queryKey: ['controlBioFiles', folderId],
    queryFn: () => listFiles(folderId!),
    enabled: !!folderId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Manejar errores
  useEffect(() => {
    if (filesError) {
      setError(filesError instanceof Error ? filesError.message : 'Error cargando archivos');
    }
  }, [filesError]);

  // Mutación para subir archivos
  const uploadMutation = useMutation({
    mutationFn: async ({ file, subfolder }: { file: File; subfolder?: string }) => {
      if (!folderId) {
        throw new Error('Carpeta ControlBio no inicializada');
      }

      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      let targetFolderId = folderId;
      
      // Si se especifica subcarpeta, crearla o obtenerla
      if (subfolder) {
        targetFolderId = await ensureFolderExists(subfolder, folderId);
      }
      
      return await uploadFile(file, targetFolderId, setUploadProgress);
    },
    onSuccess: () => {
      // Invalidar y recargar lista de archivos
      queryClient.invalidateQueries({ queryKey: ['controlBioFiles', folderId] });
    },
    onError: (error) => {
      console.error('Error subiendo archivo:', error);
      setError(error instanceof Error ? error.message : 'Error subiendo archivo');
    },
    onSettled: () => {
      setUploading(false);
      setUploadProgress(0);
    },
  });

  // Mutación para eliminar archivos
  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlBioFiles', folderId] });
    },
    onError: (error) => {
      console.error('Error eliminando archivo:', error);
      setError(error instanceof Error ? error.message : 'Error eliminando archivo');
    },
  });

  // Mutación para crear carpetas
  const createFolderMutation = useMutation({
    mutationFn: async ({ folderName, parentId }: { folderName: string; parentId?: string }) => {
      const targetParentId = parentId || folderId;
      if (!targetParentId) {
        throw new Error('No hay carpeta padre especificada');
      }
      return await createSubFolder(folderName, targetParentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlBioFiles', folderId] });
    },
    onError: (error) => {
      console.error('Error creando carpeta:', error);
      setError(error instanceof Error ? error.message : 'Error creando carpeta');
    },
  });

  const handleUpload = async (file: File, subfolder?: string) => {
    try {
      const fileId = await uploadMutation.mutateAsync({ file, subfolder });
      return fileId;
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
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
      await deleteMutation.mutateAsync(fileId);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      throw error;
    }
  };

  const createFolder = async (folderName: string, parentId?: string) => {
    try {
      const newFolderId = await createFolderMutation.mutateAsync({ folderName, parentId });
      return newFolderId;
    } catch (error) {
      console.error('Error creando carpeta:', error);
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

  const refreshFiles = () => {
    queryClient.invalidateQueries({ queryKey: ['controlBioFiles', folderId] });
  };

  return {
    // Estado
    folderId: folderId ?? null,
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
    refreshFiles,
    
    // Utilidades
    formatFileSize,
    getFileIcon,
    clearError: () => setError(null),
  };
}
