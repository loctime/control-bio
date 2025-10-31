"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import NextLink from "next/link"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  writeBatch,
  deleteField,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { UserProfile, Link, Section, Carousel } from "@/types"
import { ExternalLink, GripVertical, Pencil, Plus, Trash2, Eye, Copy, FolderOpen, Upload, X } from "lucide-react"
import { ControlBioFileManager } from "@/components/ControlBioFileManager"
import { CarouselManager } from "@/components/dashboard/CarouselManager"
import { GalleryManager } from "@/components/dashboard/GalleryManager"
import { LinkDialog } from "./components/LinkDialog"
import { SectionDialog } from "./components/SectionDialog"
import { DashboardHeader } from "./components/DashboardHeader"
import { LinksTab } from "./components/LinksTab"
import { ThemeTab } from "./components/ThemeTab"
import { SecurityTab } from "./components/SecurityTab"
import { 
  getControlBioFolder, 
  uploadFile, 
  getDownloadUrl, 
  ensureFolderExists 
} from "@/lib/controlfile-client"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"
import { useLinks } from "@/hooks/useLinks"
import { useSections } from "@/hooks/useSections"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useProfile } from "@/hooks/useProfile"
import { useTheme } from "@/hooks/useTheme"

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Load dashboard data
  const { profile, links, sections, carousels, loading, setProfile, setLinks, setSections, setCarousels } = useDashboardData(user?.uid || "", user)

  // Profile management
  const {
    avatarFile, setAvatarFile, avatarPreview, setAvatarPreview, uploadingAvatar,
    bannerFile, setBannerFile, bannerPreview, setBannerPreview, uploadingBanner,
    editingDisplayName, setEditingDisplayName, editingUsername, setEditingUsername, editingBio, setEditingBio,
    displayName, setDisplayName, username, setUsername, bio, setBio, avatarUrl, setAvatarUrl, bannerUrl, setBannerUrl,
    saving: profileSaving, initializeForm, handleSaveField, handleCancelField, handleAvatarUpload, handleBannerUpload
  } = useProfile()
  
  // Theme management
  const {
    backgroundColor, setBackgroundColor, textColor, setTextColor, buttonColor, setButtonColor, buttonTextColor, setButtonTextColor,
    saving: themeSaving, initializeTheme, handleSaveTheme
  } = useTheme()
  
  // Links management  
  const {
    linkDialogOpen, setLinkDialogOpen, editingLink, linkTitle, setLinkTitle, linkUrl, setLinkUrl,
    linkDescription, setLinkDescription, linkType, setLinkType, linkActive, setLinkActive, linkSectionId, setLinkSectionId,
    openLinkDialog, handleSaveLink, handleDeleteLink, handleReorderLinks, handleMoveLinkToSection
  } = useLinks()
  
  // Sections management
  const {
    sectionDialogOpen, setSectionDialogOpen, editingSection, sectionTitle, setSectionTitle, sectionDescription, setSectionDescription,
    sectionType, setSectionType, sectionCarouselId, setSectionCarouselId, sectionActive, setSectionActive,
    openSectionDialog, handleSaveSection, handleDeleteSection
  } = useSections()
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])
  
  useEffect(() => {
    if (profile) {
      initializeForm(profile)
      if (profile.theme) {
        initializeTheme(profile.theme)
      }
    }
  }, [profile])
  
  // Configurar drag and drop with wrapper
  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(links, (items) => handleReorderLinks(items, setLinks, user?.uid || ""))
  
  // Wrapper functions for hooks that need additional params
  const handleSaveFieldWrapper = async (field: string) => {
    if (!user || !profile) return
    await handleSaveField(field, profile, setProfile, user.uid)
  }
  
  const handleCancelFieldWrapper = (field: string) => {
    handleCancelField(field, profile)
  }
  
  const handleAvatarUploadWrapper = (file: File) => {
    if (!user || !profile) return
    handleAvatarUpload(file, profile, setProfile, user)
  }
  
  const handleBannerUploadWrapper = (file: File) => {
    if (!user || !profile) return
    handleBannerUpload(file, profile, setProfile, user)
  }
  
  const handleSaveThemeWrapper = async () => {
    if (!user || !profile) return
    await handleSaveTheme(profile, setProfile, user.uid)
  }
  
  const handleSaveLinkWrapper = async () => {
    if (!user) return
    await handleSaveLink(links, setLinks, user.uid)
  }
  
  const handleDeleteLinkWrapper = async (linkId: string) => {
    await handleDeleteLink(linkId, links, setLinks)
  }
  
  const handleSaveSectionWrapper = async () => {
    if (!user) return
    await handleSaveSection(sections, setSections, user.uid)
  }
  
  const handleDeleteSectionWrapper = async (sectionId: string) => {
    if (!user) return
    await handleDeleteSection(sectionId, sections, setSections, links, setLinks, user.uid)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/${profile?.username}`
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copiada",
      description: "La URL de tu perfil se ha copiado al portapapeles",
    })
  }
  
  // Determine which saving state to show
  const saving = profileSaving || themeSaving

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader profile={profile} onSignOut={handleSignOut} />

      <main className="container mx-auto px-3 sm:px-4 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-0">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mt-3 sm:mt-4 text-xs sm:text-sm gap-1">
            <TabsTrigger value="profile" className="py-1.5 sm:py-2">Perfil</TabsTrigger>
            <TabsTrigger value="links" className="py-1.5 sm:py-2">Enlaces</TabsTrigger>
            <TabsTrigger value="gallery" className="py-1.5 sm:py-2">Galería</TabsTrigger>
            <TabsTrigger value="files" className="py-1.5 sm:py-2">Archivos</TabsTrigger>
            <TabsTrigger value="theme" className="py-1.5 sm:py-2">Tema</TabsTrigger>
            <TabsTrigger value="security" className="py-1.5 sm:py-2">Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Mi Perfil <span className="text-xs text-muted-foreground break-all">({profile?.email})</span></CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {/* Vista previa del perfil con controles integrados */}
                <div 
                  className="rounded-lg overflow-hidden relative"
                  style={{ 
                    backgroundColor: profile?.theme?.backgroundColor || "#1f1f1f",
                    color: profile?.theme?.textColor || "#f5f5f5"
                  }}
                >
                  {/* Banner */}
                  <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 group/banner">
                    {bannerPreview || bannerUrl ? (
                      <img 
                        src={bannerPreview || bannerUrl} 
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
                    )}
                    
                    {/* Botones para editar banner */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/banner:opacity-100 transition-opacity">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setBannerFile(file)
                              handleBannerUploadWrapper(file)
                            }
                          }}
                          className="hidden"
                          id="banner-upload"
                        />
                        <label
                          htmlFor="banner-upload"
                          className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer text-xs"
                          title="Subir banner"
                        >
                          {uploadingBanner ? (
                            <Spinner className="h-3 w-3" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </label>
                      </div>
                      
                      <button
                        onClick={() => {
                          const url = prompt("Pega la URL del banner:")
                          if (url) {
                            setBannerUrl(url)
                            setBannerPreview(url)
                            handleSaveFieldWrapper('banner')
                          }
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-xs"
                        title="URL del banner"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setBannerUrl("")
                          setBannerPreview("")
                          handleSaveFieldWrapper('banner')
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors text-xs"
                        title="Eliminar banner"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Contenido del perfil */}
                  <div className="p-4 sm:p-6 md:p-8 text-center space-y-4 sm:space-y-6 -mt-16 sm:-mt-20 md:-mt-24">
                  {/* Avatar con botones pequeños */}
                  <div className="flex justify-center">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 border-white shadow-lg">
                        <AvatarImage 
                          src={avatarPreview || profile?.avatarUrl} 
                          alt={profile?.displayName} 
                        />
                        <AvatarFallback className="text-2xl">
                          {profile?.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Botones pequeños junto al avatar */}
                      <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Botón Subir */}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setAvatarFile(file)
                                handleAvatarUploadWrapper(file)
                              }
                            }}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer text-xs"
                            title="Subir imagen"
                          >
                            {uploadingAvatar ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </label>
                        </div>
                        
                        {/* Botón URL */}
                        <button
                          onClick={() => {
                            const url = prompt("Pega la URL de la imagen:")
                            if (url) {
                              setAvatarUrl(url)
                              setAvatarPreview(url)
                              handleSaveFieldWrapper('avatar')
                            }
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-xs"
                          title="Usar URL"
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Nombre y usuario juntos */}
                  <div className="space-y-2">
                    {/* Nombre editable */}
                    <div className="relative group">
                      {editingDisplayName ? (
                        <div className="space-y-2">
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Tu nombre"
                            className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center bg-transparent border-2 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:ring-0"
                            autoFocus
                          />
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleSaveFieldWrapper('displayName')}
                              disabled={saving}
                              className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelFieldWrapper('displayName')}
                              disabled={saving}
                              className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{profile?.displayName || "Usuario"}</h1>
                            <p className="text-sm sm:text-base md:text-lg opacity-60">@{profile?.username || "usuario"}</p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingDisplayName(true)
                              setDisplayName(profile?.displayName || "")
                            }}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Username editable (ahora oculto ya que está junto al nombre) */}
                    <div className="relative group hidden">
                      {editingUsername ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="tunombre"
                              className="text-lg text-center bg-transparent border-2 border-white/20 text-white/80 placeholder-white/40 focus:border-white/40 focus:ring-0 pl-6"
                              autoFocus
                            />
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40">@</span>
                          </div>
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleSaveFieldWrapper('username')}
                              disabled={saving}
                              className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelFieldWrapper('username')}
                              disabled={saving}
                              className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <p className="text-lg opacity-80">@{profile?.username}</p>
                          <button
                            onClick={() => {
                              setEditingUsername(true)
                              setUsername(profile?.username || "")
                            }}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                          >
                            <Pencil className="h-3 w-3" />
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
                            onClick={() => handleSaveFieldWrapper('bio')}
                            disabled={saving}
                            className="bg-green-500 text-white rounded px-2 py-1 text-xs hover:bg-green-600 transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleCancelFieldWrapper('bio')}
                            disabled={saving}
                            className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
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
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Enlaces organizados por secciones */}
                  <div className="space-y-6 max-w-md mx-auto">
                    {(() => {
                      const activeSections = sections.filter(section => section.isActive).sort((a, b) => a.order - b.order)
                      const activeLinks = links.filter(link => link.isActive)
                      const linksWithoutSection = activeLinks.filter(link => !link.sectionId)
                      
                      return (
                        <>
                          {/* Enlaces sin sección */}
                          <div 
                            className="space-y-3"
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = "move"
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const linkData = e.dataTransfer.getData("text/plain")
                              console.log("Drop event (no section) - captured linkData:", linkData)
                              
                              let linkId = linkData
                              try {
                                // Si es un objeto JSON, extraer el ID
                                const parsed = JSON.parse(linkData)
                                linkId = parsed.id || linkData
                              } catch {
                                // Si no es JSON, usar el valor directamente
                                linkId = linkData
                              }
                              
                              console.log("Extracted linkId:", linkId)
                              if (linkId) {
                                handleMoveLinkToSection(linkId, undefined, links, sections, setLinks)
                              }
                            }}
                          >
                            {linksWithoutSection.length > 0 ? (
                              <div className="space-y-3">
                                {linksWithoutSection.map((link, index) => {
                                const isDragging = dragState.draggedItem?.id === link.id
                                const isDragOver = dragState.draggedOverItem?.id === link.id
                                
                                return (
                                  <div
                                    key={link.id}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("text/plain", link.id)
                                      handleDragStart(e, link, index)
                                    }}
                                    onDragOver={(e) => handleDragOver(e, link, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onDragEnd={handleDragEnd}
                                    className={`relative transition-all duration-200 cursor-move ${
                                      isDragging ? 'opacity-50 scale-95' : ''
                                    } ${
                                      isDragOver ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent' : ''
                                    }`}
                                  >
                                    <div className="relative group">
                                      <a
                                        href={link.url}
                                        target={link.type === "external" ? "_blank" : "_self"}
                                        rel={link.type === "external" ? "noopener noreferrer" : ""}
                                        className="block w-full px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                                        style={{ 
                                          backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
                                          color: profile?.theme?.buttonTextColor || "#ffffff"
                                        }}
                                        onClick={(e) => {
                                          if (isDragging) {
                                            e.preventDefault()
                                          }
                                        }}
                                      >
                                        <div className="flex items-center justify-center gap-2">
                                          <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                          <span className="text-lg font-semibold leading-tight">{link.title}</span>
                                          {link.type === "external" && <ExternalLink className="h-4 w-4" />}
                                        </div>
                                        {link.description && (
                                          <p className="text-xs opacity-80 leading-tight text-center mt-1">{link.description}</p>
                                        )}
                                      </a>
                                      
                                      {/* Botón de eliminar enlace */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleDeleteLinkWrapper(link.id)
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Eliminar enlace"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <div className="text-xs text-white/40 p-2 rounded-lg border-2 border-dashed border-white/20">
                                  Arrastra enlaces aquí para quitarles la sección
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Secciones con sus enlaces */}
                          {activeSections.map((section) => {
                            const sectionLinks = activeLinks.filter(link => link.sectionId === section.id)
                            
                            return (
                              <div
                                key={section.id}
                                className="space-y-3"
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.dataTransfer.dropEffect = "move"
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  const linkData = e.dataTransfer.getData("text/plain")
                                  console.log("Drop event - captured linkData:", linkData)

                                  let linkId = linkData
                                  try {
                                    // Si es un objeto JSON, extraer el ID
                                    const parsed = JSON.parse(linkData)
                                    linkId = parsed.id || linkData
                                  } catch {
                                    // Si no es JSON, usar el valor directamente
                                    linkId = linkData
                                  }

                                  console.log("Extracted linkId:", linkId)
                                  if (linkId) {
                                    handleMoveLinkToSection(linkId, section.id, links, sections, setLinks)
                                  }
                                }}
                              >
                                {/* Contenedor de la sección con recuadro */}
                                <div className="bg-white/5 border border-white/20 rounded-lg p-4 space-y-3">
                                  {/* Título de la sección con zona de drop */}
                                  <div className="relative group">
                                    <div 
                                      className="text-sm font-medium text-white/90 text-center p-3 rounded-lg border-2 border-dashed border-white/30 hover:border-white/50 transition-colors bg-white/5"
                                      title="Arrastra enlaces aquí para moverlos a esta sección"
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        <FolderOpen className="h-4 w-4" />
                                        <span>{section.title}</span>
                                        <span className="text-xs text-white/60">({sectionLinks.length})</span>
                                      </div>
                                      {sectionLinks.length === 0 && (
                                        <div className="text-xs text-white/40 mt-2">
                                          Arrastra enlaces aquí
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Botón de eliminar sección */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeleteSectionWrapper(section.id)
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                      title="Eliminar sección"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                
                                {/* Enlaces de la sección */}
                                {sectionLinks.map((link, index) => {
                                  const isDragging = dragState.draggedItem?.id === link.id
                                  const isDragOver = dragState.draggedOverItem?.id === link.id
                                  
                                  return (
                                    <div
                                      key={link.id}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData("text/plain", link.id)
                                        handleDragStart(e, link, index)
                                      }}
                                      onDragOver={(e) => handleDragOver(e, link, index)}
                                      onDragLeave={handleDragLeave}
                                      onDrop={handleDrop}
                                      onDragEnd={handleDragEnd}
                                      className={`relative transition-all duration-200 cursor-move ${
                                        isDragging ? 'opacity-50 scale-95' : ''
                                      } ${
                                        isDragOver ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent' : ''
                                      }`}
                                    >
                                      <div className="relative group">
                                        <a
                                          href={link.url}
                                          target={link.type === "external" ? "_blank" : "_self"}
                                          rel={link.type === "external" ? "noopener noreferrer" : ""}
                                          className="block w-full px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                                          style={{ 
                                            backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
                                            color: profile?.theme?.buttonTextColor || "#ffffff"
                                          }}
                                          onClick={(e) => {
                                            if (isDragging) {
                                              e.preventDefault()
                                            }
                                          }}
                                        >
                                          <div className="flex items-center justify-center gap-2">
                                            <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-lg font-semibold leading-tight">{link.title}</span>
                                            {link.type === "external" && <ExternalLink className="h-4 w-4" />}
                                          </div>
                                          {link.description && (
                                            <p className="text-xs opacity-80 leading-tight text-center mt-1">{link.description}</p>
                                          )}
                                        </a>
                                        
                                        {/* Botón de eliminar enlace */}
                                        <button
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              handleDeleteLinkWrapper(link.id)
                                            }}
                                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                          title="Eliminar enlace"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                                </div>
                              </div>
                            )
                          })}

                          {/* Mensaje si no hay enlaces */}
                          {activeLinks.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-white/60 text-sm mb-3">No tienes enlaces todavía</p>
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => openSectionDialog()}
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar sección
                            </Button>
                            <Button
                              onClick={() => openLinkDialog()}
                              size="sm"
                              style={{ 
                                backgroundColor: profile?.theme?.buttonColor || "#ff6b35",
                                color: profile?.theme?.buttonTextColor || "#ffffff"
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar enlace
                            </Button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
            <LinksTab
              links={links}
              sections={sections}
              dragState={dragState}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              openLinkDialog={openLinkDialog}
              openSectionDialog={openSectionDialog}
              handleDeleteLinkWrapper={handleDeleteLinkWrapper}
              handleDeleteSectionWrapper={handleDeleteSectionWrapper}
            />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6 mt-0">
            <GalleryManager 
              userId={user.uid}
              carousels={carousels}
              onRefresh={async () => {
                if (!user) return
                const carouselsQuery = query(collection(db, "apps/controlbio/carousels"), where("userId", "==", user.uid), orderBy("order", "asc"))
                const carouselsSnap = await getDocs(carouselsQuery)
                const carouselsData = carouselsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Carousel)
                setCarousels(carouselsData)
              }}
            />
          </TabsContent>

          <TabsContent value="files" className="space-y-6 mt-0">
            <ControlBioFileManager />
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
            <ThemeTab
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              textColor={textColor}
              setTextColor={setTextColor}
              buttonColor={buttonColor}
              setButtonColor={setButtonColor}
              buttonTextColor={buttonTextColor}
              setButtonTextColor={setButtonTextColor}
              saving={saving}
              onSave={handleSaveThemeWrapper}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-0">
            <SecurityTab userEmail={user.email || ""} />
          </TabsContent>
        </Tabs>
      </main>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        editingLink={editingLink}
        onSave={handleSaveLinkWrapper}
        linkTitle={linkTitle}
        setLinkTitle={setLinkTitle}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        linkDescription={linkDescription}
        setLinkDescription={setLinkDescription}
        linkType={linkType}
        setLinkType={setLinkType}
        linkActive={linkActive}
        setLinkActive={setLinkActive}
        linkSectionId={linkSectionId}
        setLinkSectionId={setLinkSectionId}
        sections={sections}
      />

      <SectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        editingSection={editingSection}
        onSave={handleSaveSectionWrapper}
        sectionTitle={sectionTitle}
        setSectionTitle={setSectionTitle}
        sectionDescription={sectionDescription}
        setSectionDescription={setSectionDescription}
        sectionType={sectionType}
        setSectionType={setSectionType}
        sectionCarouselId={sectionCarouselId}
        setSectionCarouselId={setSectionCarouselId}
        sectionActive={sectionActive}
        setSectionActive={setSectionActive}
        carousels={carousels}
      />

    </div>
  )
}
