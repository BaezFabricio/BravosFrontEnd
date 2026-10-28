import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import { Loader2, User, Mail, Phone, CreditCard, Lock, Eye, EyeOff, Check, RefreshCw } from "lucide-react"
import { toast } from '@/lib/notificar'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { crearUsuario, getUsuarios } from "@/api"
import { Cargando } from '@/components/Cargando'
import { TituloPagina } from "@/components/TituloPagina"

// Misma regla que exige el servidor para cualquier contraseña
const problemaContrasena = (p = "") =>
  p.length < 8 ? "Mínimo 8 caracteres"
    : !/[A-Z]/.test(p) ? "Tiene que tener al menos una mayúscula"
    : !/[a-z]/.test(p) ? "Tiene que tener al menos una minúscula"
    : !/[0-9]/.test(p) ? "Tiene que tener al menos un número"
    : null

// Contraseña temporal al azar (generador criptográfico del navegador). Sin letras que se confunden (l, I, O, 0).
function generarContrasena() {
  const may = "ABCDEFGHJKLMNPQRSTUVWXYZ", min = "abcdefghijkmnopqrstuvwxyz", num = "23456789"
  const todos = may + min + num
  const azar = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n }
  const letras = [may[azar(may.length)], min[azar(min.length)], num[azar(num.length)]]
  while (letras.length < 10) letras.push(todos[azar(todos.length)])
  for (let i = letras.length - 1; i > 0; i--) { const j = azar(i + 1); [letras[i], letras[j]] = [letras[j], letras[i]] }
  return letras.join("")
}

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
        const response = await fetch("/api/vv1/perfiles", {
          headers: {  }
        })
        const datos = await response.json()
        if (datos.success && Array.isArray(datos.data)) {
          setPerfiles(datos.data)
          // Por defecto, el perfil de alumno (el alta más común). Nunca uno con más poder:
          // antes quedaba elegido el primero de la lista, que era "Admin".
          const alumno = datos.data.find(p => String(p.nombrePerfil || "").toLowerCase().includes("alumno"))
          if (alumno) setFormData(prev => ({ ...prev, perfil: String(alumno.idPerfil) }))
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
    else if (problemaContrasena(formData.password)) newErrors.password = problemaContrasena(formData.password)
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
      await crearUsuario({
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        perfil: formData.perfil, // Ahora es idPerfil (número como string)
        password: formData.password,
        estado: "activo",
        membresia: "vencida",
      })

      // La cuenta la crea el administrador: nace con el correo verificado y una contraseña temporal, no hay enlace que enviar
      toast.success("Usuario creado", { guardar: false })

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

  const etiqueta = "text-[13px] font-semibold text-foreground/85"
  const error = (m) => m && <p className="text-xs text-red-700 dark:text-red-400">{m}</p>

  return (
    <div className="space-y-5">
      {/* Encabezado: volver, título y "Crear" a mano */}
      <BotonVolver a="/admin/usuarios" texto="Volver" />
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <TituloPagina descripcion={"Alta rápida de usuario"}>Nuevo usuario</TituloPagina>
        </div>
        <button type="submit" form="form-nuevo-usuario" disabled={isLoading}
          className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-lime-400 px-4 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-lime-500/20 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
          {isLoading ? "Creando..." : "Crear"}
        </button>
      </div>

      <form id="form-nuevo-usuario" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Datos personales */}
          <section className="rounded-2xl border border-border bg-card" aria-labelledby="titulo-datos">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="titulo-datos" className="text-[11px] font-black uppercase tracking-widest text-foreground/60">Datos personales</h2>
              <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold text-lime-700 dark:text-lime-400">Requeridos</span>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className={etiqueta}>Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="nombre" placeholder="Juan Pérez" autoComplete="off" className={`h-11 rounded-xl bg-background/60 pl-9 ${errors.nombre ? "border-destructive" : "border-border"}`}
                    value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                {error(errors.nombre)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="dni" className={etiqueta}>DNI</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="dni" inputMode="numeric" placeholder="12345678" className={`h-11 rounded-xl bg-background/60 pl-9 ${errors.dni ? "border-destructive" : "border-border"}`}
                      value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
                  </div>
                  {error(errors.dni)}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="telefono" className={etiqueta}>Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="telefono" type="tel" inputMode="tel" placeholder="3704 123456" className={`h-11 rounded-xl bg-background/60 pl-9 ${errors.telefono ? "border-destructive" : "border-border"}`}
                      value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                  </div>
                  {error(errors.telefono)}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className={etiqueta}>Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" inputMode="email" autoComplete="off" placeholder="correo@email.com" className={`h-11 rounded-xl bg-background/60 pl-9 ${errors.email ? "border-destructive" : "border-border"}`}
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                {error(errors.email)}
              </div>
            </div>
          </section>

          {/* Perfil y contraseña */}
          <section className="rounded-2xl border border-border bg-card" aria-labelledby="titulo-seguridad">
            <div className="border-b border-border px-4 py-3">
              <h2 id="titulo-seguridad" className="text-[11px] font-black uppercase tracking-widest text-foreground/60">Perfil y seguridad</h2>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <p className={etiqueta} id="etiqueta-perfil">Perfil asignado</p>
                {/* Los perfiles salen de la base (los crea el admin con sus permisos), no son fijos */}
                {loadingPerfiles ? (
                  <Cargando filas={2} className="py-2" />
                ) : perfiles.length === 0 ? (
                  <p className="text-sm text-red-700 dark:text-red-400">No hay perfiles creados. Creá uno en Perfiles.</p>
                ) : (
                  <div role="radiogroup" aria-labelledby="etiqueta-perfil" className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background/60 p-1">
                    {perfiles.map((p) => {
                      const activo = formData.perfil === String(p.idPerfil)
                      return (
                        <button key={p.idPerfil} type="button" role="radio" aria-checked={activo}
                          onClick={() => setFormData({ ...formData, perfil: String(p.idPerfil) })}
                          className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                            activo ? "bg-lime-400 text-black" : "text-foreground/65 hover:bg-foreground/5 hover:text-foreground"
                          }`}>
                          {activo && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                          {p.nombrePerfil}
                        </button>
                      )
                    })}
                  </div>
                )}
                {error(errors.perfil)}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className={etiqueta}>Contraseña temporal</Label>
                  <button type="button"
                    onClick={() => { setFormData({ ...formData, password: generarContrasena() }); setShowPassword(true) }}
                    className="flex items-center gap-1 rounded-md px-1 text-xs font-bold text-lime-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 dark:text-lime-400">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Auto-generar
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Contraseña temporal"
                    className={`${`h-11 rounded-xl bg-background/60 pl-9 ${errors.password ? "border-destructive" : "border-border"}`} pr-10 font-mono`}
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error(errors.password)}
                <p className="text-xs leading-snug text-foreground/55">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número. Pasásela al usuario: después puede cambiarla desde su perfil o con "¿Olvidaste tu contraseña?".
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
