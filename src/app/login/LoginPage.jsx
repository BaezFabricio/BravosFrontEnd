import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HelpTooltip } from "@/components/ui/help-tooltip"

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validaciones básicas en el Frontend
    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresa un correo electrónico válido"
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
      // 1. Petición al Backend (usando la ruta vv1)
      const response = await fetch("http://localhost:3001/api/vv1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      // Si las credenciales están mal o falta verificar, frena acá
      if (!response.ok) {
        setErrors({ general: data.message || "Error al iniciar sesión" })
        setIsLoading(false)
        return
      }

      // 2. Guardamos el token JWT en el LocalStorage
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token)
      }

      const usuario = data.data?.usuario;
      const perfil = usuario?.perfil; 

      // 3. ✨ Redirección estricta según el flujo de Bravos Gym
      if (perfil === "admin") {
        window.location.href = "/admin"
      } 
      else if (perfil === "alumno") {
        window.location.href = "/alumno"
      } 
      // Si el perfil viene NULL (recién registrado, sin aprobación del admin todavía)
      // se queda en la página principal pública de la web.
      else if (!perfil) {
        window.location.href = "/" 
      } 
      else {
        window.location.href = `/${perfil}`
      }

    } catch (error) {
      console.error("Error en el login:", error)
      setErrors({ general: "Error de conexión. Asegúrate de que el backend esté encendido." })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-10"
        style={{
          backgroundImage: "url('/logo-box-bravos-final.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">BRAVOS GYM</h1>
            <h2 className="text-xl font-semibold text-foreground">Iniciar Sesión</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center font-medium">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Correo Electrónico</label>
                <HelpTooltip content="Ingresa el correo electrónico con el que te registraste en el gimnasio." />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className={`pl-10 h-12 bg-secondary border-border focus:border-primary ${errors.email ? "border-destructive" : ""}`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña</label>
                <HelpTooltip content="Tu contraseña de acceso." />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-12 bg-secondary border-border focus:border-primary ${errors.password ? "border-destructive" : ""}`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/recuperar-contrasena"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/registro"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}