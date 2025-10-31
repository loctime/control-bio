import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/types"

export function useTheme() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [textColor, setTextColor] = useState("#000000")
  const [buttonColor, setButtonColor] = useState("#000000")
  const [buttonTextColor, setButtonTextColor] = useState("#ffffff")

  const initializeTheme = (theme?: { backgroundColor: string; textColor: string; buttonColor: string; buttonTextColor: string }) => {
    const defaultTheme = {
      backgroundColor: "#0a0a0a",
      textColor: "#ffffff",
      buttonColor: "#ff6b35",
      buttonTextColor: "#ffffff",
    }
    
    const finalTheme = theme || defaultTheme
    setBackgroundColor(finalTheme.backgroundColor)
    setTextColor(finalTheme.textColor)
    setButtonColor(finalTheme.buttonColor)
    setButtonTextColor(finalTheme.buttonTextColor)
  }

  const handleSaveTheme = async (
    profile: UserProfile | null,
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    userId: string
  ) => {
    if (!userId || !profile) return

    setSaving(true)
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        theme: {
          backgroundColor,
          textColor,
          buttonColor,
          buttonTextColor,
        },
        updatedAt: new Date(),
      }

      const profileRef = doc(db, "apps/controlbio/users", userId)
      await setDoc(profileRef, updatedProfile)
      setProfile(updatedProfile)

      toast({
        title: "Tema actualizado",
        description: "Tu personalización se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error("Error saving theme:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el tema",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return {
    backgroundColor,
    setBackgroundColor,
    textColor,
    setTextColor,
    buttonColor,
    setButtonColor,
    buttonTextColor,
    setButtonTextColor,
    saving,
    initializeTheme,
    handleSaveTheme,
  }
}

