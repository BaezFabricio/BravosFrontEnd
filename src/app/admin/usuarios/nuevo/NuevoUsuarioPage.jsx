import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Loader2, User, Mail, Phone, CreditCard, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
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
import { crearUsuario, getUsuarios, reenviarVerificacionCuenta } from "@/api"

export default function NuevoUsuarioPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("Usuario creado exitosamente. Redirigiendo...")
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    email: "",
    telefono: "",
    perfil: "alumno",
    password: "",
    creditos: "12",
  })
  const [errors, setErrors] = useState({})

  const normalizarTelefono = (telefono = "") => telefono.replace(/\D/g, "")

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
    try {
      const usuarios = await getUsuarios()
      const emailNormalizado = formData.email.trim().toLowerCase()
      const dniNormalizado = formData.dni.trim()
      const telefonoNormalizado = normalizarTelefono(formData.telefono)
      const usuarioDuplicado = usuarios.find((usuario) => {
        const emailUsuario = (usuario.email || "").trim().toLowerCase()
        const dniUsuario = (usuario.dni || "").trim()
        const telefonoUsuario = normalizarTelefono(usuario.telefono || "")
        return (
          emailUsuario === emailNormalizado ||
          dniUsuario === dniNormalizado ||
          (telefonoNormalizado && telefonoUsuario === telefonoNormalizado)
        )
      })

      if (usuarioDuplicado) {
        const emailUsuario = (usuarioDuplicado.email || "").trim().toLowerCase()
        const dniUsuario = (usuarioDuplicado.dni || "").trim()
        const telefonoUsuario = normalizarTelefono(usuarioDuplicado.telefono || "")
        const campoDuplicado =
          emailUsuario === emailNormalizado
            ? "correo"
            : dniUsuario === dniNormalizado
              ? "DNI"
              : "teléfono"

        setErrors({
          general: `Ya existe un usuario con ese ${campoDuplicado}. Usá otro dato o editá el usuario existente.`,
        })
        return
      }

      // Creamos el usuario en la tabla principal y luego pedimos el correo de verificación
      const response = await crearUsuario({
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        perfil: formData.perfil,
        password: formData.password,
        creditos: parseInt(formData.creditos),
        estado: "activo",
        membresia: "vencida",
      })

      const usuarioCreado = response?.data?.data?.usuario || response?.data?.usuario || response?.usuario || response
      const idUsuarioCreado =
        usuarioCreado?.idUsuario ||
        usuarioCreado?.id ||
        response?.data?.data?.idUsuario ||
        response?.data?.idUsuario ||
        response?.idUsuario

      if (idUsuarioCreado) {
        try {
          await reenviarVerificacionCuenta({
            idUsuario: idUsuarioCreado,
            nuevoCorreo: formData.email,
          })
          setSuccessMessage("Usuario creado y correo de verificación enviado. Redirigiendo...")
        } catch (verificationError) {
          console.error("El usuario se creó, pero falló el envío de verificación:", verificationError)
          setSuccessMessage("Usuario creado, pero no se pudo enviar el correo de verificación. Redirigiendo...")
        }
      } else {
        setSuccessMessage("Usuario creado. No se pudo determinar el ID para enviar verificación. Redirigiendo...")
      }

      setIsSuccess(true)
      setErrors({})

      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate("/admin/usuarios")
      }, 1500)
    } catch (err) {
      const statusCode = err.response?.status
      const backendMessage = err.response?.data?.message
      const backendDetalle = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.details

      let errorMessage = backendMessage || "Error al crear el usuario. Intenta nuevamente."

      if (statusCode === 409) {
        const detalleTexto =
          typeof backendDetalle === "string"
            ? backendDetalle
            : backendDetalle
              ? JSON.stringify(backendDetalle)
              : ""
        const pista = detalleTexto.toLowerCase()

        if (pista.includes("telefono") || pista.includes("phone")) {
          errorMessage = "El teléfono ya está registrado. Probá con otro número."
        } else if (pista.includes("dni") || pista.includes("documento")) {
          errorMessage = "El DNI ya está registrado."
        } else if (pista.includes("correo") || pista.includes("email") || pista.includes("mail")) {
          errorMessage = "El correo electrónico ya está registrado."
        } else {
          errorMessage = backendMessage || "Ya existe un registro con esos datos (correo, DNI o teléfono)."
        }
      } else {
        console.error("Error al crear usuario:", err)
      }

      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {isSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {errors.general && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{errors.general}</p>
        </div>
      )}

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