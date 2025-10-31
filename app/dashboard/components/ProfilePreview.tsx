"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Pencil, Upload, X } from "lucide-react"
import type { UserProfile, Link, Section } from "@/types"
import { ProfilePreviewLinks } from "./ProfilePreviewLinks"

interface ProfilePreviewProps {
  profile: UserProfile | null
  // Avatar
  avatarPreview: string | null
  uploadingAvatar: boolean
  editingDisplayName: boolean
  editingBio: boolean
  displayName: string
  bio: string
  // Banner
  bannerPreview: string | null
  uploadingBanner: boolean
  // Links & Sections
  links: Link[]
  sections: Section[]
  dragState: {
    draggedItem: { id: string } | null
    draggedOverItem: { id: string } | null
  }
  // Setters
  setDisplayName: (value: string) => void
  setBio: (value: string) => void
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>
  // Handlers
  handleDragStart: (e: React.DragEvent, link: Link, index: number) => void
  handleDragOver: (e: React.DragEvent, link: Link, index: number) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: (e: React.DragEvent) => void
  handleMoveLinkToSection: (linkId: string, sectionId: string | undefined, links: Link[], sections: Section[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>) => Promise<void>
  handleSaveField: (field: string) => Promise<void>
  handleCancelField: (field: string) => void
  setEditingDisplayName: (value: boolean) => void
  setEditingBio: (value: boolean) => void
  handleAvatarUpload: (file: File) => void
  handleBannerUpload: (file: File) => void
  handleDeleteLink: (linkId: string) => void
  handleDeleteSection: (sectionId: string) => void
  openLinkDialog: () => void
  openSectionDialog: () => void
  saving: boolean
}

export function ProfilePreview({
  profile,
  avatarPreview,
  uploadingAvatar,
  editingDisplayName,
  editingBio,
  displayName,
  bio,
  bannerPreview,
  uploadingBanner,
  links,
  sections,
  dragState,
  setDisplayName,
  setBio,
  setLinks,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleMoveLinkToSection,
  handleSaveField,
  handleCancelField,
  setEditingDisplayName,
  setEditingBio,
  handleAvatarUpload,
  handleBannerUpload,
  handleDeleteLink,
  handleDeleteSection,
  openLinkDialog,
  openSectionDialog,
  saving,
}: ProfilePreviewProps) {
  return (
    <div 
      className="rounded-lg overflow-hidden relative"
      style={{ 
        backgroundColor: profile?.theme?.backgroundColor || "#1f1f1f",
        color: profile?.theme?.textColor || "#f5f5f5"
      }}
    >
      {/* Banner */}
      <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 group/banner">
        {bannerPreview || profile?.bannerUrl ? (
          <img 
            src={bannerPreview || profile?.bannerUrl || ""} 
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
        )}
        
        {/* Botones para editar banner */}
        <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2 opacity-0 group-hover/banner:opacity-100 transition-opacity">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleBannerUpload(file)
                }
              }}
              className="hidden"
              id="banner-upload"
            />
            <label
              htmlFor="banner-upload"
              className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer text-xs"
              title="Subir banner"
            >
              {uploadingBanner ? (
                <Spinner className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                <Upload className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
            </label>
          </div>
          
              <button
                onClick={async () => {
                  const url = prompt("Pega la URL del banner:")
                  if (url) {
                    await handleSaveField('banner')
                  }
                }}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-xs"
                title="URL del banner"
              >
                <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
              
              <button
                onClick={async () => {
                  await handleSaveField('banner')
                }}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors text-xs"
                title="Eliminar banner"
              >
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
        </div>
      </div>
      
      {/* Contenido del perfil */}
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 text-center space-y-3 sm:space-y-4 md:space-y-6 -mt-14 sm:-mt-16 md:-mt-20 lg:-mt-24">
        {/* Avatar con botones */}
        <div className="flex justify-center">
          <div className="relative group">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 border-4 border-white shadow-lg">
              <AvatarImage 
                src={avatarPreview || profile?.avatarUrl || ""} 
                alt={profile?.displayName || "Usuario"} 
              />
              <AvatarFallback className="text-xl sm:text-2xl">
                {profile?.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            {/* Botones junto al avatar */}
            <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleAvatarUpload(file)
                    }
                  }}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer text-xs"
                  title="Subir imagen"
                >
                  {uploadingAvatar ? (
                    <Spinner className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  ) : (
                    <Upload className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  )}
                </label>
              </div>
              
              <button
                onClick={async () => {
                  const url = prompt("Pega la URL de la imagen:")
                  if (url) {
                    await handleSaveField('avatar')
                  }
                }}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-xs"
                title="Usar URL"
              >
                🔗
              </button>
            </div>
          </div>
        </div>
        
        {/* Nombre editable */}
        <div className="space-y-2">
          <div className="relative group">
            {editingDisplayName ? (
              <div className="space-y-2 max-w-xs mx-auto">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-center bg-transparent border-2 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:ring-0"
                  autoFocus
                />
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => handleSaveField('displayName')}
                    disabled={saving}
                    className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleCancelField('displayName')}
                    disabled={saving}
                    className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative inline-block">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap px-2">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{profile?.displayName || "Usuario"}</h1>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-60">@{profile?.username || "usuario"}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDisplayName(true)
                    setDisplayName(profile?.displayName || "")
                  }}
                  className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                  title="Editar nombre"
                >
                  <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Biografía editable */}
        <div className="max-w-md mx-auto relative group px-2">
          {editingBio ? (
            <div className="space-y-2">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntanos sobre ti..."
                rows={3}
                className="text-xs sm:text-sm bg-transparent border-2 border-white/20 text-white/90 placeholder-white/60 resize-none focus:border-white/40 focus:ring-0"
                autoFocus
              />
              <div className="flex justify-center gap-1">
                <button
                  onClick={() => handleSaveField('bio')}
                  disabled={saving}
                  className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  ✓
                </button>
                <button
                  onClick={() => handleCancelField('bio')}
                  disabled={saving}
                  className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p className="text-xs sm:text-sm opacity-90 whitespace-pre-wrap break-words">
                {profile?.bio || "No hay biografía"}
              </p>
              <button
                onClick={() => {
                  setEditingBio(true)
                  setBio(profile?.bio || "")
                }}
                className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                title="Editar biografía"
              >
                <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Enlaces organizados por secciones */}
        <ProfilePreviewLinks
          links={links}
          sections={sections}
          profile={profile}
          dragState={dragState}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleMoveLinkToSection={handleMoveLinkToSection}
          handleDeleteLink={handleDeleteLink}
          handleDeleteSection={handleDeleteSection}
          openLinkDialog={openLinkDialog}
          openSectionDialog={openSectionDialog}
          setLinks={setLinks}
        />
      </div>
    </div>
  )
}
