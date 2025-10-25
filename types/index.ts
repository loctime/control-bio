export interface UserProfile {
  id: string
  username: string
  displayName: string
  bio: string
  avatarUrl: string
  autoPassword?: string
  customPassword?: string
  hasCustomPassword?: boolean
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
