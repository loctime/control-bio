"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut as firebaseSignOut, setPersistence, browserLocalPersistence } from "firebase/auth"
import { auth } from "./firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  clearError: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Configurar persistencia de autenticación
    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
        console.log("Persistencia de autenticación configurada")
      } catch (error) {
        console.error("Error configurando persistencia:", error)
      }
    }

    setupAuth()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Estado de autenticación cambiado:", user ? "Usuario autenticado" : "Usuario no autenticado")
      setUser(user)
      setLoading(false)
      setError(null) // Limpiar errores cuando el estado cambia
    }, (error) => {
      console.error("Error de autenticación:", error)
      setError(error.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setError(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      setError("Error al cerrar sesión")
    }
  }

  const clearError = () => {
    setError(null)
  }

  return <AuthContext.Provider value={{ user, loading, error, signOut, clearError }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
