import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const mockUser = {
  id: "1",
  nombre: "María García",
  dni: "32456789",
  email: "maria@email.com",
  telefono: "+54 11 1234 5678",
  perfil: "alumno",
  estado: "activo",
}

export default function EditarUsuarioPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: mockUser.nombre,
    dni: mockUser.dni,
    email: mockUser.email,
    telefono: mockUser.telefono,
    perfil: mockUser.perfil,
    estado: mockUser.estado,
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido"
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = "DNI inválido (7-8 dígitos)"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/usuarios/${mockUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          dni: formData.dni,
          email: formData.email,
          telefono: formData.telefono,
          perfil: formData.perfil,
          estado: formData.estado,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar usuario")
      }

      navigate(`/admin/usuarios/${mockUser.id}`)
    } catch {
      setErrors({ general: "Error al guardar los cambios. Intenta de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/usuarios/${mockUser.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
          <p className="text-muted-foreground">Modifica los datos del usuario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Datos del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.general && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Juan Pérez"
                  className={`bg-secondary border-border ${errors.nombre ? "border-destructive" : ""}`}
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                />
                {errors.nombre && <p className="text-destructive text-sm">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  placeholder="Ej: 32456789"
                  className={`bg-secondary border-border ${errors.dni ? "border-destructive" : ""}`}
                  value={formData.dni}
                  onChange={(e) => handleChange("dni", e.target.value)}
                />
                {errors.dni && <p className="text-destructive text-sm">{errors.dni}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: usuario@email.com"
                  className={`bg-secondary border-border ${errors.email ? "border-destructive" : ""}`}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="Ej: +54 11 1234 5678"
                  className={`bg-secondary border-border ${errors.telefono ? "border-destructive" : ""}`}
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                />
                {errors.telefono && <p className="text-destructive text-sm">{errors.telefono}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil *</Label>
                <Select value={formData.perfil} onValueChange={(value) => handleChange("perfil", value)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecciona un perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alumno">Alumno</SelectItem>
                    <SelectItem value="profesor">Profesor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select value={formData.estado} onValueChange={(value) => handleChange("estado", value)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Link to={`/admin/usuarios/${mockUser.id}`}>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
