import { useState, useEffect } from "react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { getControlBioFolder, uploadFile, ensureFolderExists } from "@/lib/controlfile-client"
import type { UserProfile } from "@/types"

export function useProfile() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  
  // Avatar/banner states
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>("")
  const [uploadingBanner, setUploadingBanner] = useState(false)
  
  // Editable fields states
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  
  // Initialize form from profile
  const initializeForm = (profile: UserProfile | null) => {
    if (profile) {
      setDisplayName(profile.displayName || "")
      setUsername(profile.username || "")
      setBio(profile.bio || "")
      setAvatarUrl(profile.avatarUrl || "")
      setBannerUrl(profile.bannerUrl || "")
    }
  }

  const handleProfileImageUpload = async (
    file: File,
    type: 'avatar' | 'banner',
    profile: UserProfile | null,
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    user: any
  ) => {
    if (!user) return

    const isLoading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner
    
    isLoading(true)
    try {
      const controlBioFolderId = await getControlBioFolder()
      const folderName = type === 'avatar' ? 'Fotos de perfil' : 'Banners'
      const imageFolderId = await ensureFolderExists(folderName, controlBioFolderId)
      
      const fileId = await uploadFile(file, imageFolderId, (progress) => {
        console.log(`Subiendo ${type}: ${progress}%`)
      })
      
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://controlfile.onrender.com'}/api/files/presign-get`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })
      
      if (!response.ok) {
        throw new Error('Error al obtener URL de vista previa')
      }
      
      const { downloadUrl } = await response.json()
      
      if (type === 'avatar') {
        setAvatarPreview(downloadUrl)
      } else {
        setBannerPreview(downloadUrl)
      }
      
      if (profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          uid: user.uid,
          ...(type === 'avatar' ? { avatarUrl: downloadUrl } : { bannerUrl: downloadUrl }),
          updatedAt: new Date(),
        }

        const profileRef = doc(db, "apps/controlbio/users", user.uid)
        await setDoc(profileRef, updatedProfile)
        setProfile(updatedProfile)
      }
      
      const typeLabel = type === 'avatar' ? 'Avatar' : 'Banner'
      toast({
        title: `${typeLabel} actualizado`,
        description: "La imagen se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error)
      const typeLabel = type === 'avatar' ? 'Avatar' : 'Banner'
      toast({
        title: "Error",
        description: `No se pudo subir el ${typeLabel.toLowerCase()} a ControlFile`,
        variant: "destructive",
      })
    } finally {
      isLoading(false)
    }
  }

  const handleAvatarUpload = (
    file: File,
    profile: UserProfile | null,
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    user: any
  ) => handleProfileImageUpload(file, 'avatar', profile, setProfile, user)

  const handleBannerUpload = (
    file: File,
    profile: UserProfile | null,
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    user: any
  ) => handleProfileImageUpload(file, 'banner', profile, setProfile, user)

  const handleSaveField = async (
    field: string,
    profile: UserProfile | null,
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    userId: string
  ) => {
    if (!userId || !profile) return

    setSaving(true)
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        uid: userId,
        displayName: field === 'displayName' ? displayName : profile.displayName,
        username: field === 'username' ? username : profile.username,
        bio: field === 'bio' ? bio : profile.bio,
        avatarUrl: field === 'avatar' ? (avatarPreview || avatarUrl) : profile.avatarUrl,
        bannerUrl: field === 'banner' ? (bannerPreview || bannerUrl) : profile.bannerUrl,
        updatedAt: new Date(),
      }

      const profileRef = doc(db, "apps/controlbio/users", userId)
      await setDoc(profileRef, updatedProfile)
      setProfile(updatedProfile)
      
      // Reset editing states
      setEditingDisplayName(false)
      setEditingUsername(false)
      setEditingBio(false)
      setAvatarPreview("")
      setAvatarFile(null)

      toast({
        title: "Campo actualizado",
        description: "El cambio se ha guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving field:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el cambio",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelField = (field: string, profile: UserProfile | null) => {
    if (profile) {
      if (field === 'displayName') {
        setDisplayName(profile.displayName)
        setEditingDisplayName(false)
      } else if (field === 'username') {
        setUsername(profile.username)
        setEditingUsername(false)
      } else if (field === 'bio') {
        setBio(profile.bio)
        setEditingBio(false)
      } else if (field === 'avatar') {
        setAvatarUrl(profile.avatarUrl)
        setAvatarPreview("")
        setAvatarFile(null)
      } else if (field === 'banner') {
        setBannerUrl(profile.bannerUrl || "")
        setBannerPreview("")
        setBannerFile(null)
      }
    }
  }

  return {
    // Avatar/Banner
    avatarFile,
    setAvatarFile,
    avatarPreview,
    setAvatarPreview,
    uploadingAvatar,
    bannerFile,
    setBannerFile,
    bannerPreview,
    setBannerPreview,
    uploadingBanner,
    handleAvatarUpload,
    handleBannerUpload,
    
    // Editable fields
    editingDisplayName,
    setEditingDisplayName,
    editingUsername,
    setEditingUsername,
    editingBio,
    setEditingBio,
    displayName,
    setDisplayName,
    username,
    setUsername,
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl,
    bannerUrl,
    setBannerUrl,
    
    // Actions
    saving,
    initializeForm,
    handleSaveField,
    handleCancelField,
  }
}

