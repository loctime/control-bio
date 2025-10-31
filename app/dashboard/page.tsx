"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Carousel } from "@/types"
import { ControlBioFileManager } from "@/components/ControlBioFileManager"
import { GalleryManager } from "@/components/dashboard/GalleryManager"
import { LinkDialog } from "./components/LinkDialog"
import { SectionDialog } from "./components/SectionDialog"
import { DashboardHeader } from "./components/DashboardHeader"
import { LinksTab } from "./components/LinksTab"
import { ThemeTab } from "./components/ThemeTab"
import { SecurityTab } from "./components/SecurityTab"
import { ProfilePreview } from "./components/ProfilePreview"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"
import { useLinks } from "@/hooks/useLinks"
import { useSections } from "@/hooks/useSections"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useProfile } from "@/hooks/useProfile"
import { useTheme } from "@/hooks/useTheme"

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  // Load dashboard data
  const { profile, links, sections, carousels, loading, setProfile, setLinks, setSections, setCarousels } = useDashboardData(user?.uid || "", user)

  // Profile management
  const {
    avatarPreview,
    uploadingAvatar,
    bannerPreview,
    uploadingBanner,
    editingDisplayName,
    setEditingDisplayName,
    editingBio,
    setEditingBio,
    displayName,
    setDisplayName,
    bio,
    setBio,
    saving: profileSaving,
    initializeForm,
    handleSaveField,
    handleCancelField,
    handleAvatarUpload,
    handleBannerUpload,
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
  
  const handleMoveLinkToSectionWrapper = async (linkId: string, sectionId: string | undefined) => {
    await handleMoveLinkToSection(linkId, sectionId, links, sections, setLinks)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
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
                    <CardTitle className="text-base sm:text-lg">
                      Mi Perfil <span className="text-xs text-muted-foreground break-all">({profile?.email})</span>
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <ProfilePreview
                  profile={profile}
                  avatarPreview={avatarPreview}
                  uploadingAvatar={uploadingAvatar}
                  editingDisplayName={editingDisplayName}
                  editingBio={editingBio}
                  displayName={displayName}
                  bio={bio}
                  bannerPreview={bannerPreview}
                  uploadingBanner={uploadingBanner}
                  links={links}
                  sections={sections}
                  dragState={dragState}
                  setDisplayName={setDisplayName}
                  setBio={setBio}
                  setLinks={setLinks}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleDragEnd={handleDragEnd}
                  handleMoveLinkToSection={handleMoveLinkToSectionWrapper}
                  handleSaveField={handleSaveFieldWrapper}
                  handleCancelField={handleCancelFieldWrapper}
                  setEditingDisplayName={setEditingDisplayName}
                  setEditingBio={setEditingBio}
                  handleAvatarUpload={handleAvatarUploadWrapper}
                  handleBannerUpload={handleBannerUploadWrapper}
                  handleDeleteLink={handleDeleteLinkWrapper}
                  handleDeleteSection={handleDeleteSectionWrapper}
                  openLinkDialog={openLinkDialog}
                  openSectionDialog={openSectionDialog}
                  saving={saving}
                />
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
