import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Loader2, User, Mail, Phone, CreditCard, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from '@/lib/notificar'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [perfiles, setPerfiles] = useState([])
  const [loadingPerfiles, setLoadingPerfiles] = useState(true)
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    email: "",
    telefono: "",
    perfil: "",
    password: "",
  })
  const [errors, setErrors] = useState({})

  // Cargar perfiles al montar el componente
  useEffect(() => {
    const cargarPerfiles = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("http://localhost:3001/api/vv1/perfiles", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const datos = await response.json()
        if (datos.success && Array.isArray(datos.data)) {
          setPerfiles(datos.data)
          // Seleccionar automáticamente el primer perfil si existe
          if (datos.data.length > 0) {
            setFormData(prev => ({ ...prev, perfil: String(datos.data[0].idPerfil) }))
          }
        }
      } catch (error) {
        console.error("Error al cargar perfiles:", error)
      } finally {
        setLoadingPerfiles(false)
      }
    }
    cargarPerfiles()
  }, [])

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

        toast.error(`Ya existe un usuario con ese ${campoDuplicado}`, { description: "Usá otro dato o editá el usuario existente." })
        return
      }

      // Creamos el usuario en la tabla principal y luego pedimos el correo de verificación
      const response = await crearUsuario({
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        perfil: formData.perfil, // Ahora es idPerfil (número como string)
        password: formData.password,
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
          toast.success("Usuario creado y correo de verificación enviado")
        } catch (verificationError) {
          console.error("El usuario se creó, pero falló el envío de verificación:", verificationError)
          toast.success("Usuario creado", { description: "No se pudo enviar el correo de verificación." })
        }
      } else {
        toast.success("Usuario creado")
      }

      setErrors({})
      navigate("/admin/usuarios")
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

      toast.error("Error al crear el usuario", { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/usuarios">
          <button type="button" className="border border-border p-2 text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Nuevo Usuario</h1>
          <p className="text-sm text-foreground/40 mt-1">Crea un nuevo usuario en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Información Personal</p>
            </div>
            <div className="p-5 space-y-4">
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
                {errors.nombre && <p className="text-sm text-red-400">{errors.nombre}</p>}
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
                {errors.dni && <p className="text-sm text-red-400">{errors.dni}</p>}
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
                {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
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
                {errors.telefono && <p className="text-sm text-red-400">{errors.telefono}</p>}
              </div>
            </div>
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuración de Cuenta</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil</Label>
                <Select
                  value={formData.perfil}
                  onValueChange={(value) => setFormData({ ...formData, perfil: value })}
                  disabled={loadingPerfiles || perfiles.length === 0}
                >
                  <SelectTrigger className={`bg-secondary border-border ${errors.perfil ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={loadingPerfiles ? "Cargando perfiles..." : "Selecciona un perfil"} />
                  </SelectTrigger>
                  <SelectContent>
                    {perfiles.map((perfil) => (
                      <SelectItem key={perfil.idPerfil} value={String(perfil.idPerfil)}>
                        {perfil.nombrePerfil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.perfil && <p className="text-sm text-red-400">{errors.perfil}</p>}
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
                {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">
                  El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link to="/admin/usuarios">
            <button type="button" className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors">
              Cancelar
            </button>
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-4 py-2 hover:bg-lime-300 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Crear Usuario"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
