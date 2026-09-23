import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft, Zap, Shield, Users, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from '@/lib/notificar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/vv1"

const FEATURES = [
  { icon: Zap, text: "Reservá tu clase en segundos" },
  { icon: Shield, text: "Control total de tus créditos" },
  { icon: Users, text: "Seguí tu progreso y asistencia" },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [cuentaDesactivada, setCuentaDesactivada] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "El correo es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido"
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: formData.email, password: formData.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'CUENTA_INACTIVA') {
          setCuentaDesactivada(true)
          setIsLoading(false)
          return
        }
        toast.error(data.message || "Error al iniciar sesión")
        setIsLoading(false)
        return
      }

      if (data.data?.token) localStorage.setItem("token", data.data.token)
      localStorage.setItem("usuario", JSON.stringify(data.data.usuario))
      const listadoPermisos = data.data?.permisos || []
      localStorage.setItem("permisos", JSON.stringify(listadoPermisos))
      if (data.data?.usuario?.avatarUrl) localStorage.setItem("avatarUrl", data.data.usuario.avatarUrl)

      const tieneAdmin = listadoPermisos.some(p =>
        p.startsWith("usuarios:") || p.startsWith("dashboard:") ||
        p.startsWith("perfiles:") || p.startsWith("membresias:") ||
        p.startsWith("clases:") || p.startsWith("configuracion:")
      )
      const tieneAlumno = listadoPermisos.some(p => p.startsWith("alumno"))
      const tieneProfesor = listadoPermisos.some(p => p.startsWith("profesor"))

      const modulos = [tieneAdmin, tieneAlumno, tieneProfesor].filter(Boolean).length

      if (modulos > 1) navigate("/seleccionar-panel", { replace: true })
      else if (tieneAdmin) navigate("/admin", { replace: true })
      else if (tieneAlumno) navigate("/alumno", { replace: true })
      else if (tieneProfesor) navigate("/profesor", { replace: true })
      else navigate("/inicio", { replace: true })

    } catch (error) {
      toast.error("Error de conexión", { description: "Asegúrate de que el backend esté encendido." })
      setIsLoading(false)
    }
  }

  if (cuentaDesactivada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0d09] p-6">
        <div className="w-full max-w-md border border-border bg-card p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full">
              <UserX className="h-10 w-10 text-red-700 dark:text-red-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Cuenta desactivada</h2>
            <p className="text-sm text-foreground/50 mt-2 leading-relaxed">
              Tu cuenta fue desactivada. Para volver a acceder al sistema, contactá al administrador del gimnasio para que la reactive.
            </p>
          </div>
          <button
            onClick={() => { setCuentaDesactivada(false); setFormData({ email: "", password: "" }) }}
            className="w-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0c0d09]">

      {/* ── Panel izquierdo — branding ── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden anim-from-left">
        {/* Fondo con logo */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url('/logo-box-bravos-final.png')",
            backgroundSize: "60%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Gradiente sobre el fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-lime-400/10 via-transparent to-transparent" />
        {/* Línea decorativa */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-lime-400/40 to-transparent" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <img src="/logo.jpg" alt="Bravos Gym" className="h-12 w-12 rounded-xl" />
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-lime-700 dark:text-lime-400 uppercase">Bravos</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Box & Gym</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-5xl font-black text-white leading-none tracking-tight">
              ENTRENÁ<br />
              <span className="text-lime-700 dark:text-lime-400">SIN LÍMITES</span>
            </h1>
            <p className="mt-4 text-white/50 text-base leading-relaxed max-w-xs">
              Tu plataforma de gestión para el Box. Reservas, créditos y progreso en un solo lugar.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-lime-700 dark:text-lime-400" />
                </div>
                <span className="text-sm text-white/60 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer branding */}
        <div className="relative z-10">
          <p className="text-[11px] text-white/20 tracking-widest uppercase">© 2026 Bravos Box</p>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-background anim-from-right">
        {/* Header mobile */}
        <div className="flex items-center justify-between p-5 lg:hidden border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Bravos" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-black tracking-widest text-foreground">BRAVOS</span>
          </div>
          <div className="w-16" />
        </div>

        {/* Formulario centrado */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm anim-fade-up anim-delay-100">

            {/* Volver — solo desktop */}
            <button
              onClick={() => navigate(-1)}
              className="hidden lg:flex mb-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al sitio
            </button>

            {/* Cabecera */}
            <div className="mb-8 anim-fade-up anim-delay-150">
              <h2 className="text-3xl font-black text-foreground tracking-tight">Bienvenido</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Ingresá con tu cuenta para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className={`pl-10 h-12 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-600 dark:focus-visible:border-lime-400 transition-colors ${errors.email ? "border-destructive" : ""}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Contraseña
                  </label>
                  <Link
                    to="/recuperar-contrasena"
                    className="text-xs text-lime-700 dark:text-lime-500 hover:text-lime-700 dark:hover:text-lime-400 transition-colors font-medium"
                  >
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`pl-10 pr-10 h-12 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-600 dark:focus-visible:border-lime-400 transition-colors ${errors.password ? "border-destructive" : ""}`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 mt-2 bg-lime-400 hover:bg-lime-300 text-black font-black tracking-wider uppercase text-sm transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">¿Primera vez?</span>
              </div>
            </div>

            {/* Registro */}
            <Link
              to="/registro"
              className="flex items-center justify-center w-full h-11 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Crear una cuenta nueva
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
