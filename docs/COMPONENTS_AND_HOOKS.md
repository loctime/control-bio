# Componentes y Hooks Reutilizables

## 📋 Tabla de Contenidos

- [Dashboard Components](#dashboard-components)
- [Custom Hooks](#custom-hooks)
- [Cómo Usar](#cómo-usar)

---

## 🎨 Dashboard Components

Componentes específicos del dashboard en `app/dashboard/components/`:

### 1. DashboardHeader

Header del dashboard con información del perfil y acciones.

**Ubicación:** `app/dashboard/components/DashboardHeader.tsx`

**Props:**
```typescript
interface DashboardHeaderProps {
  profile: UserProfile | null
  onSignOut: () => void
}
```

**Uso:**
```typescript
import { DashboardHeader } from "@/app/dashboard/components/DashboardHeader"

<DashboardHeader profile={profile} onSignOut={handleSignOut} />
```

---

### 2. LinkDialog

Diálogo modal para crear o editar enlaces.

**Ubicación:** `app/dashboard/components/LinkDialog.tsx`

**Props:**
```typescript
interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLink: Link | null
  onSave: () => void
  linkTitle: string
  setLinkTitle: (value: string) => void
  linkUrl: string
  setLinkUrl: (value: string) => void
  linkDescription: string
  setLinkDescription: (value: string) => void
  linkType: "internal" | "external"
  setLinkType: (value: "internal" | "external") => void
  linkActive: boolean
  setLinkActive: (value: boolean) => void
  linkSectionId: string
  setLinkSectionId: (value: string) => void
  sections: Section[]
}
```

**Uso:**
```typescript
import { LinkDialog } from "@/app/dashboard/components/LinkDialog"

<LinkDialog
  open={linkDialogOpen}
  onOpenChange={setLinkDialogOpen}
  editingLink={editingLink}
  onSave={handleSaveLink}
  // ... resto de props
/>
```

---

### 3. SectionDialog

Diálogo modal para crear o editar secciones.

**Ubicación:** `app/dashboard/components/SectionDialog.tsx`

**Props:**
```typescript
interface SectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSection: Section | null
  onSave: () => void
  sectionTitle: string
  setSectionTitle: (value: string) => void
  sectionDescription: string
  setSectionDescription: (value: string) => void
  sectionType: "folder" | "carousel"
  setSectionType: (value: "folder" | "carousel") => void
  sectionCarouselId: string
  setSectionCarouselId: (value: string) => void
  sectionActive: boolean
  setSectionActive: (value: boolean) => void
  carousels: Carousel[]
}
```

**Uso:**
```typescript
import { SectionDialog } from "@/app/dashboard/components/SectionDialog"

<SectionDialog
  open={sectionDialogOpen}
  onOpenChange={setSectionDialogOpen}
  editingSection={editingSection}
  onSave={handleSaveSection}
  // ... resto de props
/>
```

---

### 4. LinksTab

Tab para gestionar enlaces y secciones.

**Ubicación:** `app/dashboard/components/LinksTab.tsx`

**Props:**
```typescript
interface LinksTabProps {
  links: Link[]
  sections: Section[]
  dragState: {
    draggedItem: { id: string } | null
    draggedOverItem: { id: string } | null
  }
  handleDragStart: (e: React.DragEvent, link: Link, index: number) => void
  handleDragOver: (e: React.DragEvent, link: Link, index: number) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: (e: React.DragEvent) => void
  openLinkDialog: (link?: Link) => void
  openSectionDialog: (section?: Section) => void
  handleDeleteLinkWrapper: (linkId: string) => void
  handleDeleteSectionWrapper: (sectionId: string) => void
}
```

**Uso:**
```typescript
import { LinksTab } from "@/app/dashboard/components/LinksTab"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"

const { dragState, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragAndDrop(links, handleReorderLinks)

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
```

---

### 5. ThemeTab

Tab para personalizar colores del perfil.

**Ubicación:** `app/dashboard/components/ThemeTab.tsx`

**Props:**
```typescript
interface ThemeTabProps {
  backgroundColor: string
  setBackgroundColor: (value: string) => void
  textColor: string
  setTextColor: (value: string) => void
  buttonColor: string
  setButtonColor: (value: string) => void
  buttonTextColor: string
  setButtonTextColor: (value: string) => void
  saving: boolean
  onSave: () => void
}
```

**Uso:**
```typescript
import { ThemeTab } from "@/app/dashboard/components/ThemeTab"
import { useTheme } from "@/hooks/useTheme"

const { backgroundColor, textColor, buttonColor, buttonTextColor, handleSaveTheme } = useTheme(profile, setProfile)

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
  onSave={handleSaveTheme}
/>
```

---

### 6. SecurityTab

Tab para mostrar información de seguridad de la cuenta.

**Ubicación:** `app/dashboard/components/SecurityTab.tsx`

**Props:**
```typescript
interface SecurityTabProps {
  userEmail: string
}
```

**Uso:**
```typescript
import { SecurityTab } from "@/app/dashboard/components/SecurityTab"

<SecurityTab userEmail={user.email || ""} />
```

---

## 🪝 Custom Hooks

Hooks personalizados en `hooks/`:

### 1. useAuth

Hook para manejar autenticación.

**Ubicación:** `lib/auth-context.tsx`

**Retorno:**
```typescript
{
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}
```

**Uso:**
```typescript
import { useAuth } from "@/lib/auth-context"

const { user, loading, signOut } = useAuth()

if (loading) return <Spinner />
if (!user) return <Redirect to="/login" />
```

---

### 2. useDashboardData

Hook para cargar todos los datos del dashboard.

**Ubicación:** `hooks/useDashboardData.ts`

**Retorno:**
```typescript
{
  profile: UserProfile | null
  links: Link[]
  sections: Section[]
  carousels: Carousel[]
  loading: boolean
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
  setCarousels: React.Dispatch<React.SetStateAction<Carousel[]>>
}
```

**Uso:**
```typescript
import { useDashboardData } from "@/hooks/useDashboardData"

const { profile, links, sections, carousels, loading, setProfile, setLinks } = useDashboardData(userId, user)

if (loading) return <Spinner />
```

---

### 3. useProfile

Hook para gestionar perfil de usuario (avatar, banner, campos editables).

**Ubicación:** `hooks/useProfile.ts`

**Retorno:**
```typescript
{
  // Estados de archivos
  avatarFile: File | null
  avatarPreview: string | null
  uploadingAvatar: boolean
  bannerFile: File | null
  bannerPreview: string | null
  uploadingBanner: boolean

  // Estados de edición de campos
  editingDisplayName: boolean
  editingUsername: boolean
  editingBio: boolean
  displayName: string
  username: string
  bio: string

  // URLs
  avatarUrl: string
  bannerUrl: string

  // Funciones
  initializeForm: (profile: UserProfile) => void
  handleAvatarUpload: (file: File) => Promise<void>
  handleBannerUpload: (file: File) => Promise<void>
  handleSaveField: (field: 'displayName' | 'username' | 'bio' | 'avatar' | 'banner') => Promise<void>
  handleCancelField: (field: 'displayName' | 'username' | 'bio') => void
  setAvatarFile: React.Dispatch<React.SetStateAction<File | null>>
  setAvatarPreview: React.Dispatch<React.SetStateAction<string | null>>
  setBannerFile: React.Dispatch<React.SetStateAction<File | null>>
  setBannerPreview: React.Dispatch<React.SetStateAction<string | null>>
  setEditingDisplayName: React.Dispatch<React.SetStateAction<boolean>>
  setEditingUsername: React.Dispatch<React.SetStateAction<boolean>>
  setEditingBio: React.Dispatch<React.SetStateAction<boolean>>
  setDisplayName: React.Dispatch<React.SetStateAction<string>>
  setUsername: React.Dispatch<React.SetStateAction<string>>
  setBio: React.Dispatch<React.SetStateAction<string>>
  setAvatarUrl: React.Dispatch<React.SetStateAction<string>>
  setBannerUrl: React.Dispatch<React.SetStateAction<string>>
}
```

**Uso:**
```typescript
import { useProfile } from "@/hooks/useProfile"

const {
  avatarPreview,
  bannerPreview,
  uploadingAvatar,
  uploadingBanner,
  editingDisplayName,
  editingUsername,
  editingBio,
  displayName,
  username,
  bio,
  initializeForm,
  handleAvatarUpload,
  handleBannerUpload,
  handleSaveField,
  handleCancelField,
  setAvatarFile,
  setAvatarPreview,
  setBannerFile,
  setBannerPreview,
  setEditingDisplayName,
  setEditingUsername,
  setEditingBio,
  setDisplayName,
  setUsername,
  setBio,
  setAvatarUrl,
  setBannerUrl
} = useProfile(profile, setProfile, userId)

// Inicializar formulario cuando se carga el perfil
useEffect(() => {
  if (profile) {
    initializeForm(profile)
  }
}, [profile])
```

---

### 4. useTheme

Hook para gestionar colores del tema.

**Ubicación:** `hooks/useTheme.ts`

**Retorno:**
```typescript
{
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  handleSaveTheme: () => Promise<void>
  initializeTheme: (theme: any) => void
  setBackgroundColor: React.Dispatch<React.SetStateAction<string>>
  setTextColor: React.Dispatch<React.SetStateAction<string>>
  setButtonColor: React.Dispatch<React.SetStateAction<string>>
  setButtonTextColor: React.Dispatch<React.SetStateAction<string>>
}
```

**Uso:**
```typescript
import { useTheme } from "@/hooks/useTheme"

const { backgroundColor, textColor, buttonColor, buttonTextColor, handleSaveTheme, initializeTheme } = useTheme(profile, setProfile)

// Inicializar tema cuando se carga el perfil
useEffect(() => {
  if (profile?.theme) {
    initializeTheme(profile.theme)
  }
}, [profile])
```

---

### 5. useLinks

Hook para gestionar CRUD de enlaces.

**Ubicación:** `hooks/useLinks.ts`

**Retorno:**
```typescript
{
  linkDialogOpen: boolean
  editingLink: Link | null
  linkTitle: string
  linkUrl: string
  linkDescription: string
  linkType: "internal" | "external"
  linkActive: boolean
  linkSectionId: string
  
  setLinkDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setEditingLink: React.Dispatch<React.SetStateAction<Link | null>>
  setLinkTitle: React.Dispatch<React.SetStateAction<string>>
  setLinkUrl: React.Dispatch<React.SetStateAction<string>>
  setLinkDescription: React.Dispatch<React.SetStateAction<string>>
  setLinkType: React.Dispatch<React.SetStateAction<"internal" | "external">>
  setLinkActive: React.Dispatch<React.SetStateAction<boolean>>
  setLinkSectionId: React.Dispatch<React.SetStateAction<string>>
  
  openLinkDialog: (link?: Link) => void
  handleSaveLink: (links: Link[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>, userId: string) => Promise<void>
  handleDeleteLink: (linkId: string, links: Link[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>, userId: string) => Promise<void>
  handleReorderLinks: (reorderedLinks: Link[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>, userId: string) => Promise<void>
  handleMoveLinkToSection: (linkId: string, sectionId: string | undefined, links: Link[], sections: Section[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>) => Promise<void>
}
```

**Uso:**
```typescript
import { useLinks } from "@/hooks/useLinks"

const {
  linkDialogOpen,
  editingLink,
  linkTitle,
  linkUrl,
  linkDescription,
  linkType,
  linkActive,
  linkSectionId,
  setLinkDialogOpen,
  setEditingLink,
  setLinkTitle,
  setLinkUrl,
  setLinkDescription,
  setLinkType,
  setLinkActive,
  setLinkSectionId,
  openLinkDialog,
  handleSaveLink,
  handleDeleteLink,
  handleReorderLinks,
  handleMoveLinkToSection
} = useLinks()

// Wrapper para usar en el componente
const handleSaveLinkWrapper = () => handleSaveLink(links, setLinks, userId)
const handleDeleteLinkWrapper = (linkId: string) => handleDeleteLink(linkId, links, setLinks, userId)
```

---

### 6. useSections

Hook para gestionar CRUD de secciones.

**Ubicación:** `hooks/useSections.ts`

**Retorno:**
```typescript
{
  sectionDialogOpen: boolean
  editingSection: Section | null
  sectionTitle: string
  sectionDescription: string
  sectionType: "folder" | "carousel"
  sectionCarouselId: string
  sectionActive: boolean
  
  setSectionDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setEditingSection: React.Dispatch<React.SetStateAction<Section | null>>
  setSectionTitle: React.Dispatch<React.SetStateAction<string>>
  setSectionDescription: React.Dispatch<React.SetStateAction<string>>
  setSectionType: React.Dispatch<React.SetStateAction<"folder" | "carousel">>
  setSectionCarouselId: React.Dispatch<React.SetStateAction<string>>
  setSectionActive: React.Dispatch<React.SetStateAction<boolean>>
  
  openSectionDialog: (section?: Section) => void
  handleSaveSection: (sections: Section[], setSections: React.Dispatch<React.SetStateAction<Section[]>>, links: Link[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>, carousels: Carousel[], userId: string) => Promise<void>
  handleDeleteSection: (sectionId: string, sections: Section[], setSections: React.Dispatch<React.SetStateAction<Section[]>>, links: Link[], setLinks: React.Dispatch<React.SetStateAction<Link[]>>, userId: string) => Promise<void>
}
```

**Uso:**
```typescript
import { useSections } from "@/hooks/useSections"

const {
  sectionDialogOpen,
  editingSection,
  sectionTitle,
  sectionDescription,
  sectionType,
  sectionCarouselId,
  sectionActive,
  setSectionDialogOpen,
  setEditingSection,
  setSectionTitle,
  setSectionDescription,
  setSectionType,
  setSectionCarouselId,
  setSectionActive,
  openSectionDialog,
  handleSaveSection,
  handleDeleteSection
} = useSections()

// Wrapper para usar en el componente
const handleSaveSectionWrapper = () => handleSaveSection(sections, setSections, links, setLinks, carousels, userId)
const handleDeleteSectionWrapper = (sectionId: string) => handleDeleteSection(sectionId, sections, setSections, links, setLinks, userId)
```

---

### 7. useDragAndDrop

Hook para gestionar drag and drop de elementos.

**Ubicación:** `hooks/useDragAndDrop.ts`

**Retorno:**
```typescript
{
  dragState: {
    draggedItem: DragItem | null
    draggedOverItem: DragItem | null
    isDragging: boolean
  }
  handleDragStart: (e: React.DragEvent, item: T, index: number) => void
  handleDragOver: (e: React.DragEvent, item: T, index: number) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: (e: React.DragEvent) => void
}
```

**Uso:**
```typescript
import { useDragAndDrop } from "@/hooks/useDragAndDrop"

const handleReorderLinks = async (reorderedLinks: Link[]) => {
  // Lógica para reordenar enlaces en Firestore
}

const { dragState, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragAndDrop(links, handleReorderLinks)

<div
  draggable
  onDragStart={(e) => handleDragStart(e, link, index)}
  onDragOver={(e) => handleDragOver(e, link, index)}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onDragEnd={handleDragEnd}
>
  {/* Contenido */}
</div>
```

---

### 8. useToast

Hook para mostrar notificaciones toast.

**Ubicación:** `hooks/use-toast.ts`

**Retorno:**
```typescript
{
  toast: (options: {
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success"
  }) => void
}
```

**Uso:**
```typescript
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  title: "Éxito",
  description: "Enlace guardado correctamente",
  variant: "default"
})
```

---

## 💡 Cómo Usar

### Integración Completa

Ejemplo de cómo usar todos los componentes y hooks juntos:

```typescript
"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useProfile } from "@/hooks/useProfile"
import { useTheme } from "@/hooks/useTheme"
import { useLinks } from "@/hooks/useLinks"
import { useSections } from "@/hooks/useSections"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"
import { DashboardHeader } from "@/app/dashboard/components/DashboardHeader"
import { LinksTab } from "@/app/dashboard/components/LinksTab"
import { ThemeTab } from "@/app/dashboard/components/ThemeTab"
import { SecurityTab } from "@/app/dashboard/components/SecurityTab"
import { LinkDialog } from "@/app/dashboard/components/LinkDialog"
import { SectionDialog } from "@/app/dashboard/components/SectionDialog"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  const { profile, links, sections, carousels, loading, setProfile, setLinks, setSections } = useDashboardData(user?.uid, user)
  
  const profileHook = useProfile(profile, setProfile, user?.uid)
  const themeHook = useTheme(profile, setProfile)
  const linksHook = useLinks()
  const sectionsHook = useSections()
  
  const handleReorderLinks = async (reorderedLinks) => {
    // Lógica de reordenamiento
  }
  
  const { dragState, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragAndDrop(links, handleReorderLinks)
  
  // Wrappers para hooks
  const handleSaveLinkWrapper = () => linksHook.handleSaveLink(links, setLinks, user?.uid)
  const handleDeleteLinkWrapper = (linkId: string) => linksHook.handleDeleteLink(linkId, links, setLinks, user?.uid)
  const handleSaveSectionWrapper = () => sectionsHook.handleSaveSection(sections, setSections, links, setLinks, carousels, user?.uid)
  const handleDeleteSectionWrapper = (sectionId: string) => sectionsHook.handleDeleteSection(sectionId, sections, setSections, links, setLinks, user?.uid)
  
  const handleSignOut = async () => {
    await signOut()
  }
  
  useEffect(() => {
    if (profile) {
      profileHook.initializeForm(profile)
      if (profile.theme) {
        themeHook.initializeTheme(profile.theme)
      }
    }
  }, [profile])
  
  if (authLoading || loading) {
    return <Spinner />
  }
  
  return (
    <div>
      <DashboardHeader profile={profile} onSignOut={handleSignOut} />
      
      <Tabs>
        <TabsContent value="links">
          <LinksTab
            links={links}
            sections={sections}
            dragState={dragState}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            openLinkDialog={linksHook.openLinkDialog}
            openSectionDialog={sectionsHook.openSectionDialog}
            handleDeleteLinkWrapper={handleDeleteLinkWrapper}
            handleDeleteSectionWrapper={handleDeleteSectionWrapper}
          />
        </TabsContent>
        
        <TabsContent value="theme">
          <ThemeTab
            backgroundColor={themeHook.backgroundColor}
            setBackgroundColor={themeHook.setBackgroundColor}
            textColor={themeHook.textColor}
            setTextColor={themeHook.setTextColor}
            buttonColor={themeHook.buttonColor}
            setButtonColor={themeHook.setButtonColor}
            buttonTextColor={themeHook.buttonTextColor}
            setButtonTextColor={themeHook.setButtonTextColor}
            saving={false}
            onSave={themeHook.handleSaveTheme}
          />
        </TabsContent>
        
        <TabsContent value="security">
          <SecurityTab userEmail={user?.email || ""} />
        </TabsContent>
      </Tabs>
      
      <LinkDialog
        open={linksHook.linkDialogOpen}
        onOpenChange={linksHook.setLinkDialogOpen}
        editingLink={linksHook.editingLink}
        onSave={handleSaveLinkWrapper}
        linkTitle={linksHook.linkTitle}
        setLinkTitle={linksHook.setLinkTitle}
        linkUrl={linksHook.linkUrl}
        setLinkUrl={linksHook.setLinkUrl}
        linkDescription={linksHook.linkDescription}
        setLinkDescription={linksHook.setLinkDescription}
        linkType={linksHook.linkType}
        setLinkType={linksHook.setLinkType}
        linkActive={linksHook.linkActive}
        setLinkActive={linksHook.setLinkActive}
        linkSectionId={linksHook.linkSectionId}
        setLinkSectionId={linksHook.setLinkSectionId}
        sections={sections}
      />
      
      <SectionDialog
        open={sectionsHook.sectionDialogOpen}
        onOpenChange={sectionsHook.setSectionDialogOpen}
        editingSection={sectionsHook.editingSection}
        onSave={handleSaveSectionWrapper}
        sectionTitle={sectionsHook.sectionTitle}
        setSectionTitle={sectionsHook.setSectionTitle}
        sectionDescription={sectionsHook.sectionDescription}
        setSectionDescription={sectionsHook.setSectionDescription}
        sectionType={sectionsHook.sectionType}
        setSectionType={sectionsHook.setSectionType}
        sectionCarouselId={sectionsHook.sectionCarouselId}
        setSectionCarouselId={sectionsHook.setSectionCarouselId}
        sectionActive={sectionsHook.sectionActive}
        setSectionActive={sectionsHook.setSectionActive}
        carousels={carousels}
      />
    </div>
  )
}
```

---

## 📚 Más Recursos

- [README principal](../README.md)
- [Tipos de TypeScript](../types/index.ts)
- [Componentes UI](../components/ui/)

---

## 🤝 Contribuir

Si encuentras un bug o tienes una sugerencia de mejora, por favor:

1. Abre un issue en GitHub
2. Describe el problema o la mejora
3. Si es posible, agrega ejemplos de código

