"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { UserProfile, Link } from "@/types"
import { ExternalLink, GripVertical, Pencil, Plus, Trash2, Eye, Copy, FolderOpen } from "lucide-react"
import { ControlBioFileManager } from "@/components/ControlBioFileManager"

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state for profile
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  // Form state for theme
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [textColor, setTextColor] = useState("#000000")
  const [buttonColor, setButtonColor] = useState("#000000")
  const [buttonTextColor, setButtonTextColor] = useState("#ffffff")

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [linkType, setLinkType] = useState<"external" | "internal">("external")
  const [linkActive, setLinkActive] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const profileRef = doc(db, "apps/controlbio/users", user.uid)
        const profileSnap = await getDoc(profileRef)

        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfile
          setProfile(data)
          setDisplayName(data.displayName || "")
          setUsername(data.username || "")
          setBio(data.bio || "")
          setAvatarUrl(data.avatarUrl || "")
          
          // Valores por defecto para el tema si no existe
          const defaultTheme = {
            backgroundColor: "#1f1f1f",
            textColor: "#f5f5f5",
            buttonColor: "#ff6b35",
            buttonTextColor: "#1f1f1f",
          }
          
          const theme = data.theme || defaultTheme
          setBackgroundColor(theme.backgroundColor || defaultTheme.backgroundColor)
          setTextColor(theme.textColor || defaultTheme.textColor)
          setButtonColor(theme.buttonColor || defaultTheme.buttonColor)
          setButtonTextColor(theme.buttonTextColor || defaultTheme.buttonTextColor)
        } else {
          // Create default profile
          const defaultProfile: UserProfile = {
            id: user.uid,
            username: user.email?.split("@")[0] || "",
            displayName: user.displayName || "",
            bio: "",
            avatarUrl: user.photoURL || "",
            theme: {
              backgroundColor: "#0a0a0a",
              textColor: "#ffffff",
              buttonColor: "#ff6b35",
              buttonTextColor: "#ffffff",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          await setDoc(profileRef, defaultProfile)
          setProfile(defaultProfile)
          setDisplayName(defaultProfile.displayName)
          setUsername(defaultProfile.username)
          setBio(defaultProfile.bio)
          setAvatarUrl(defaultProfile.avatarUrl)
          setBackgroundColor(defaultProfile.theme?.backgroundColor || "#0a0a0a")
          setTextColor(defaultProfile.theme?.textColor || "#ffffff")
          setButtonColor(defaultProfile.theme?.buttonColor || "#ff6b35")
          setButtonTextColor(defaultProfile.theme?.buttonTextColor || "#ffffff")
        }

        // Load links
        const linksQuery = query(collection(db, "apps/controlbio/links"), where("userId", "==", user.uid), orderBy("order", "asc"))
        const linksSnap = await getDocs(linksQuery)
        const linksData = linksSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Link)
        setLinks(linksData)
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, toast])

  const handleSaveProfile = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        displayName,
        username,
        bio,
        avatarUrl,
        updatedAt: new Date(),
      }

      const profileRef = doc(db, "users", user.uid)
      await setDoc(profileRef, updatedProfile)
      setProfile(updatedProfile)
      setEditing(false)

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTheme = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        theme: {
          backgroundColor,
          textColor,
          buttonColor,
          buttonTextColor,
        },
        updatedAt: new Date(),
      }

      const profileRef = doc(db, "users", user.uid)
      await setDoc(profileRef, updatedProfile)
      setProfile(updatedProfile)

      toast({
        title: "Tema actualizado",
        description: "Tu personalización se ha guardado correctamente",
      })
    } catch (error) {
      console.error("Error saving theme:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el tema",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.displayName)
      setUsername(profile.username)
      setBio(profile.bio)
      setAvatarUrl(profile.avatarUrl)
    }
    setEditing(false)
  }

  const openLinkDialog = (link?: Link) => {
    if (link) {
      setEditingLink(link)
      setLinkTitle(link.title)
      setLinkUrl(link.url)
      setLinkDescription(link.description || "")
      setLinkType(link.type)
      setLinkActive(link.isActive)
    } else {
      setEditingLink(null)
      setLinkTitle("")
      setLinkUrl("")
      setLinkDescription("")
      setLinkType("external")
      setLinkActive(true)
    }
    setLinkDialogOpen(true)
  }

  const handleSaveLink = async () => {
    if (!user) return

    try {
      if (editingLink) {
        // Update existing link
        const linkRef = doc(db, "apps/controlbio/links", editingLink.id)
        await updateDoc(linkRef, {
          title: linkTitle,
          url: linkUrl,
          description: linkDescription,
          type: linkType,
          isActive: linkActive,
          updatedAt: new Date(),
        })

        setLinks(
          links.map((l) =>
            l.id === editingLink.id
              ? {
                  ...l,
                  title: linkTitle,
                  url: linkUrl,
                  description: linkDescription,
                  type: linkType,
                  isActive: linkActive,
                  updatedAt: new Date(),
                }
              : l,
          ),
        )

        toast({
          title: "Enlace actualizado",
          description: "El enlace se ha actualizado correctamente",
        })
      } else {
        // Create new link
        const newLink = {
          userId: user.uid,
          title: linkTitle,
          url: linkUrl,
          description: linkDescription,
          type: linkType,
          isActive: linkActive,
          order: links.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const docRef = await addDoc(collection(db, "apps/controlbio/links"), newLink)
        setLinks([...links, { ...newLink, id: docRef.id } as Link])

        toast({
          title: "Enlace creado",
          description: "El enlace se ha creado correctamente",
        })
      }

      setLinkDialogOpen(false)
    } catch (error) {
      console.error("Error saving link:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el enlace",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteDoc(doc(db, "apps/controlbio/links", linkId))
      setLinks(links.filter((l) => l.id !== linkId))

      toast({
        title: "Enlace eliminado",
        description: "El enlace se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting link:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/${profile?.username}`
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copiada",
      description: "La URL de tu perfil se ha copiado al portapapeles",
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Control<span className="text-primary">Bio</span>
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/${profile.username}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver perfil
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="links">Enlaces</TabsTrigger>
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="theme">Personalización</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mi Perfil</CardTitle>
                    <CardDescription>Gestiona tu información personal</CardDescription>
                  </div>
                  {!editing && <Button onClick={() => setEditing(true)}>Editar perfil</Button>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={editing ? avatarUrl : profile.avatarUrl} alt={profile.displayName} />
                    <AvatarFallback className="text-2xl">
                      {profile.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl">URL de la imagen de perfil</Label>
                        <Input
                          id="avatarUrl"
                          type="url"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold">{profile.displayName}</h2>
                        <p className="text-muted-foreground">@{profile.username}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nombre para mostrar</Label>
                    {editing ? (
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Tu nombre"
                      />
                    ) : (
                      <p className="text-foreground">{profile.displayName || "No especificado"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    {editing ? (
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="tunombre"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-foreground">@{profile.username}</p>
                        <Button variant="ghost" size="sm" onClick={copyProfileUrl}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    {editing ? (
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Cuéntanos sobre ti..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{profile.bio || "No hay biografía"}</p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mis Enlaces</CardTitle>
                    <CardDescription>Gestiona los enlaces de tu perfil</CardDescription>
                  </div>
                  <Button onClick={() => openLinkDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar enlace
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {links.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No tienes enlaces todavía</p>
                    <Button onClick={() => openLinkDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear tu primer enlace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{link.title}</h3>
                            {link.type === "external" && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                            {!link.isActive && <span className="text-xs bg-muted px-2 py-1 rounded">Inactivo</span>}
                          </div>
                          {link.description && (
                            <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openLinkDialog(link)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <ControlBioFileManager />
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalización</CardTitle>
                <CardDescription>Personaliza los colores de tu perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Color de fondo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textColor">Color de texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buttonColor">Color de botones</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonColor"
                        type="color"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buttonTextColor">Color de texto de botones</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonTextColor"
                        type="color"
                        value={buttonTextColor}
                        onChange={(e) => setButtonTextColor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={buttonTextColor}
                        onChange={(e) => setButtonTextColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-6" style={{ backgroundColor }}>
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold" style={{ color: textColor }}>
                      Vista previa
                    </h3>
                    <p style={{ color: textColor }}>Así se verá tu perfil</p>
                    <button
                      className="px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                    >
                      Botón de ejemplo
                    </button>
                  </div>
                </div>

                <Button onClick={handleSaveTheme} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar tema"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Información de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Proveedor de autenticación</Label>
                    <p className="text-sm text-muted-foreground">
                      Google
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email de la cuenta</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seguridad de la cuenta</Label>
                    <p className="text-sm text-muted-foreground">
                      Tu cuenta está protegida con autenticación de Google. Para cambiar tu contraseña, 
                      hazlo desde tu cuenta de Google.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Editar enlace" : "Nuevo enlace"}</DialogTitle>
            <DialogDescription>
              {editingLink ? "Modifica los detalles del enlace" : "Agrega un nuevo enlace a tu perfil"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkTitle">Título</Label>
              <Input
                id="linkTitle"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Mi sitio web"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkDescription">Descripción (opcional)</Label>
              <Textarea
                id="linkDescription"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Descripción breve del enlace"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkType">Tipo</Label>
              <Select value={linkType} onValueChange={(value: "external" | "internal") => setLinkType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">Externo</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="linkActive">Enlace activo</Label>
              <Switch id="linkActive" checked={linkActive} onCheckedChange={setLinkActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLink} disabled={!linkTitle || !linkUrl}>
              {editingLink ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
