export interface UserProfile {
  uid: string
  username: string
  displayName: string
  email: string
  bio: string
  avatarUrl: string
  avatarSettings?: {
    size: number
    position: {
      x: number
      y: number
    }
    scale: number
  }
  theme?: {
    backgroundColor: string
    textColor: string
    buttonColor: string
    buttonTextColor: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Link {
  id: string
  userId: string
  title: string
  url: string
  description?: string
  icon?: string
  type: "external" | "internal"
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
