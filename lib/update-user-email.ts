// Función para actualizar el email del usuario existente
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function updateUserEmail(userId: string, email: string) {
  try {
    await updateDoc(doc(db, "apps/controlbio/users", userId), {
      email: email,
      updatedAt: new Date(),
    })
    console.log("Email actualizado correctamente")
  } catch (error) {
    console.error("Error actualizando email:", error)
  }
}
