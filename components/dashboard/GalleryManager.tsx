'use client'

import { GalleryEditor } from './GalleryEditor'
import { useAuth } from '@/lib/auth-context'

interface GalleryManagerProps {
  userId: string
  carousels: any[]
  onRefresh: () => void
}

export function GalleryManager({ userId, carousels, onRefresh }: GalleryManagerProps) {
  const { user } = useAuth()

  const handlePreview = () => {
    if (user?.displayName) {
      window.open(`/${user.displayName}/gallery`, '_blank')
    }
  }

  return (
    <GalleryEditor 
      userId={userId} 
      onPreview={handlePreview}
    />
  )
}