'use client';

import { useState, useRef } from 'react';
import { useControlBio } from '@/hooks/useControlBio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Share2, 
  Trash2, 
  FolderPlus, 
  RefreshCw,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function ControlBioFileManager() {
  const {
    files,
    loading,
    uploading,
    uploadProgress,
    error,
    uploadFile,
    downloadFile,
    shareFile,
    deleteFile,
    createFolder,
    refreshFiles,
    formatFileSize,
    getFileIcon,
    clearError,
  } = useControlBio();

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subfolder, setSubfolder] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile, subfolder || undefined);
      toast.success('Archivo subido exitosamente');
      setSelectedFile(null);
      setSubfolder('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Error al subir archivo');
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadFile(fileId, fileName);
      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error('Error al descargar archivo');
    }
  };

  const handleShare = async (fileId: string, fileName: string) => {
    try {
      const shareUrl = await shareFile(fileId, 24);
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      toast.error('Error al crear enlace compartido');
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${fileName}"?`)) {
      return;
    }

    try {
      await deleteFile(fileId);
      toast.success('Archivo eliminado');
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      toast.success('Carpeta creada exitosamente');
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      toast.error('Error al crear carpeta');
    }
  };

  const getFileTypeIcon = (file: any) => {
    if (file.type === 'folder') return <FolderPlus className="w-5 h-5 text-blue-500" />;
    
    const mime = file.mime || '';
    if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mime.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (mime.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-500" />;
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mime.includes('zip') || mime.includes('rar')) return <Archive className="w-5 h-5 text-orange-500" />;
    
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Inicializando ControlBio...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="w-6 h-6" />
            ControlBio - Gestión de Archivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={clearError}
                >
                  Cerrar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="flex-1"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Seleccionar Archivo
              </Button>
            </div>

            {selectedFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Archivo seleccionado:</span>
                  <Badge variant="secondary">{selectedFile.name}</Badge>
                  <span className="text-sm text-gray-500">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Subcarpeta (opcional)"
                    value={subfolder}
                    onChange={(e) => setSubfolder(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Subir
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Subiendo archivo...</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Nueva Carpeta
            </Button>
            <Button
              variant="outline"
              onClick={refreshFiles}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>

          {/* Create Folder */}
          {showCreateFolder && (
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
              <Input
                placeholder="Nombre de la carpeta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="flex-1"
              />
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Crear
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos y Carpetas</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay archivos en ControlBio</p>
              <p className="text-sm">Sube tu primer archivo para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(file)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {file.type === 'file' && (
                          <>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{file.mime}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(file.createdAt?.toDate?.() || file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.type === 'file' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.name)}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(file.id, file.name)}
                          className="flex items-center gap-1"
                        >
                          <Share2 className="w-4 h-4" />
                          Compartir
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.name)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
