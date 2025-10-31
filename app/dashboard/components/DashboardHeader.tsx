"use client"

import { useRouter } from "next/navigation"
import NextLink from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { UserProfile } from "@/types"

interface DashboardHeaderProps {
  profile: UserProfile
  onSignOut: () => void
}

export function DashboardHeader({ profile, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
          Control<span className="text-primary">Bio</span>
        </h1>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3" asChild>
            <NextLink href={`/${profile.username}`}>
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver perfil</span>
            </NextLink>
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3" onClick={onSignOut}>
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

