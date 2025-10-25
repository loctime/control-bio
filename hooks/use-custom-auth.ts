"use client"

import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
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
      // Primero intentar Firebase Auth
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        })
        return { success: true, user: userCredential.user }
      } catch (firebaseError: any) {
        console.log("Firebase Auth falló, intentando sistema personalizado...")
      }

      // Sistema personalizado - buscar en Firestore
      const usersQuery = query(collection(db, "apps/controlbio/users"), where("email", "==", email))
      const usersSnap = await getDocs(usersQuery)
      
      if (usersSnap.empty) {
        throw new Error("Usuario no encontrado")
      }

      const userDoc = usersSnap.docs[0]
      const userData = userDoc.data()

      // Verificar contraseña
      const isValidPassword = await verifyPassword(password, userData.customPassword)
      
      if (!isValidPassword) {
        throw new Error("Contraseña incorrecta")
      }

      // Contraseña correcta - autenticar con Google para mantener sesión Firebase
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Verificar que sea el mismo usuario
      if (result.user.uid !== userData.uid) {
        throw new Error("El usuario autenticado no coincide")
      }

      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      })
      
      return { success: true, user: result.user }
      
    } catch (error: any) {
      console.error("Error en login:", error)
      
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
