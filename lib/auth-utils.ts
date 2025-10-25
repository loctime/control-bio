import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth"
import { auth } from "@/lib/firebase"

export async function checkExistingAuthUser(email: string): Promise<boolean> {
  try {
    // Intentar hacer login con una contraseña temporal
    // Si falla, significa que no existe la cuenta
    await signInWithEmailAndPassword(auth, email, "temp_password_check")
    return true
  } catch (error: any) {
    // Si el error es "user-not-found", no existe la cuenta
    if (error.code === "auth/user-not-found") {
      return false
    }
    // Si el error es "wrong-password", la cuenta existe pero la contraseña es incorrecta
    if (error.code === "auth/wrong-password") {
      return true
    }
    // Otros errores, asumir que no existe
    return false
  }
}

export async function createAuthAccount(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(`Error creating auth account: ${error.message}`)
  }
}

export async function linkGoogleWithEmailPassword(
  googleUser: User, 
  email: string, 
  password: string
): Promise<User> {
  try {
    // Crear cuenta temporal con email/password
    const tempCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Cerrar sesión de la cuenta temporal
    await signOut(auth)
    
    // Volver a autenticar con Google
    // Nota: Esto requeriría re-autenticación con Google
    // Por ahora, retornamos el usuario de Google
    return googleUser
  } catch (error: any) {
    throw new Error(`Error linking accounts: ${error.message}`)
  }
}
