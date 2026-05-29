import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Save } from "lucide-react"
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
import { actualizarUsuario, getUsuarioById, normalizarUsuario } from "@/api"

const emptyForm = {
  nombre: "",
  dni: "",
  email: "",
  telefono: "",
  perfil: "alumno",
  estado: "activo",
}

export default function EditarUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setIsLoading(true)
        const data = await getUsuarioById(id)
        const normalized = normalizarUsuario(data)
        setUser(normalized)
        setFormData({
          nombre: normalized.nombre,
          dni: normalized.dni,
          email: normalized.email,
          telefono: normalized.telefono,
          perfil: normalized.perfil,
          estado: normalized.estado,
        })
      } catch (error) {
        console.error("Error al cargar usuario:", error)
        setErrors({ general: "No se pudo cargar la información del usuario." })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarUsuario()
    }
  }, [id])

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
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido"
    }

    if (!formData.perfil) {
      newErrors.perfil = "El perfil es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSaving(true)

    try {
      await actualizarUsuario(id, {
        nombre: formData.nombre,
        dni: formData.dni,
        email: formData.email,
        telefono: formData.telefono,
        perfil: formData.perfil,
        estado: formData.estado,
      })

      navigate(`/admin/usuarios/${id}`)
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      setErrors({ general: error.response?.data?.message || "Error al guardar los cambios. Intenta de nuevo." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Cargando usuario...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/usuarios/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
          <p className="text-muted-foreground">Modifica los datos y el perfil asignado</p>
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
                  className={`bg-secondary border-border ${errors.telefono ? "border-destructive" : ""}`}
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                />
                {errors.telefono && <p className="text-destructive text-sm">{errors.telefono}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil *</Label>
                <Select value={formData.perfil} onValueChange={(value) => handleChange("perfil", value)}>
                  <SelectTrigger className={`bg-secondary border-border ${errors.perfil ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecciona un perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alumno">Alumno</SelectItem>
                    <SelectItem value="profesor">Profesor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.perfil && <p className="text-destructive text-sm">{errors.perfil}</p>}
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
              <Link to={`/admin/usuarios/${id}`}>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? (
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