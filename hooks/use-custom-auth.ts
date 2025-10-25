"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { verifyPassword } from "@/lib/password-utils"
import { useToast } from "@/hooks/use-toast"

export function useCustomAuth() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loginWithEmailPassword = async (email: string, password: string) => {
    setLoading(true)
    
    try {
      // Primero intentar login normal con Firebase Auth
      // Esto funcionará para usuarios que se registraron con email/password tradicional
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        })
        return { success: true, user: userCredential.user }
      } catch (firebaseError: any) {
        // Si falla Firebase Auth, intentar con nuestro sistema personalizado
        console.log("Firebase Auth falló, intentando sistema personalizado...")
      }

      // Buscar usuario en Firestore por email
      const usersQuery = query(collection(db, "users"), where("email", "==", email))
      const usersSnap = await getDocs(usersQuery)
      
      if (usersSnap.empty) {
        throw new Error("Usuario no encontrado")
      }

      const userDoc = usersSnap.docs[0]
      const userData = userDoc.data()

      // Verificar si tiene contraseña personalizada
      if (!userData.customPassword) {
        throw new Error("Este usuario no tiene contraseña configurada. Usa Google Auth para iniciar sesión.")
      }

      // Verificar contraseña
      const isValidPassword = await verifyPassword(password, userData.customPassword)
      
      if (!isValidPassword) {
        throw new Error("Contraseña incorrecta")
      }

      // Si llegamos aquí, la contraseña es correcta
      // Necesitamos autenticar al usuario con Firebase Auth usando Google
      // Pero primero verificamos que el usuario existe en Firebase Auth
      const currentUser = auth.currentUser
      
      if (!currentUser || currentUser.uid !== userData.uid) {
        throw new Error("Sesión no válida. Por favor, inicia sesión con Google primero.")
      }

      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      })
      
      return { success: true, user: currentUser }
      
    } catch (error: any) {
      console.error("Error en login personalizado:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar sesión",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loginWithEmailPassword,
    loading
  }
}
