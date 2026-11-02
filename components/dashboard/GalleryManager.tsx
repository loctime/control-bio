'use client'

import { GalleryEditor } from './GalleryEditor'
import type { UserProfile } from '@/types'

interface GalleryManagerProps {
  userId: string
  carousels: any[]
  onRefresh: () => void
  profile: UserProfile | null
}

export function GalleryManager({ userId, carousels, onRefresh, profile }: GalleryManagerProps) {
  const handlePreview = () => {
    if (profile?.username) {
      // Usar el username del perfil, codificarlo para la URL
      const encodedUsername = encodeURIComponent(profile.username)
      window.open(`/${encodedUsername}/gallery`, '_blank')
    }
  }

  return (
    <GalleryEditor 
      userId={userId} 
      onPreview={handlePreview}
    />
  )
}