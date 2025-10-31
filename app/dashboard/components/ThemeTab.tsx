import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ThemeTabProps {
  backgroundColor: string
  setBackgroundColor: (value: string) => void
  textColor: string
  setTextColor: (value: string) => void
  buttonColor: string
  setButtonColor: (value: string) => void
  buttonTextColor: string
  setButtonTextColor: (value: string) => void
  saving: boolean
  onSave: () => void
}

export function ThemeTab({
  backgroundColor,
  setBackgroundColor,
  textColor,
  setTextColor,
  buttonColor,
  setButtonColor,
  buttonTextColor,
  setButtonTextColor,
  saving,
  onSave,
}: ThemeTabProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Personalización</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Personaliza los colores de tu perfil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

        <Button onClick={onSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar tema"}
        </Button>
      </CardContent>
    </Card>
  )
}

