import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Loader2, User, Mail, Phone, CreditCard, Lock, Eye, EyeOff } from "lucide-react"
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

export default function NuevoUsuarioPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    email: "",
    telefono: "",
    perfil: "",
    password: "",
    creditos: "12",
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.dni.trim()) newErrors.dni = "El DNI es requerido"
    if (!formData.email.trim()) newErrors.email = "El email es requerido"
    if (!formData.telefono.trim()) newErrors.telefono = "El teléfono es requerido"
    if (!formData.perfil) newErrors.perfil = "El perfil es requerido"
    if (!formData.password) newErrors.password = "La contraseña es requerida"
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    navigate("/admin/usuarios")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/usuarios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Usuario</h1>
          <p className="text-muted-foreground">Crea un nuevo usuario en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nombre"
                    placeholder="Juan Pérez"
                    className={`pl-9 bg-secondary border-border ${errors.nombre ? "border-destructive" : ""}`}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dni"
                    placeholder="12345678"
                    className={`pl-9 bg-secondary border-border ${errors.dni ? "border-destructive" : ""}`}
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  />
                </div>
                {errors.dni && <p className="text-sm text-destructive">{errors.dni}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@email.com"
                    className={`pl-9 bg-secondary border-border ${errors.email ? "border-destructive" : ""}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefono"
                    placeholder="+54 11 1234 5678"
                    className={`pl-9 bg-secondary border-border ${errors.telefono ? "border-destructive" : ""}`}
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                {errors.telefono && <p className="text-sm text-destructive">{errors.telefono}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil</Label>
                <Select
                  value={formData.perfil}
                  onValueChange={(value) => setFormData({ ...formData, perfil: value })}
                >
                  <SelectTrigger className={`bg-secondary border-border ${errors.perfil ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecciona un perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alumno">Alumno</SelectItem>
                    <SelectItem value="profesor">Profesor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {errors.perfil && <p className="text-sm text-destructive">{errors.perfil}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditos">Créditos Iniciales</Label>
                <Input
                  id="creditos"
                  type="number"
                  min="0"
                  className="bg-secondary border-border"
                  value={formData.creditos}
                  onChange={(e) => setFormData({ ...formData, creditos: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña Temporal</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña temporal"
                    className={`pl-9 pr-9 bg-secondary border-border ${errors.password ? "border-destructive" : ""}`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">
                  El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link to="/admin/usuarios">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Crear Usuario"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
