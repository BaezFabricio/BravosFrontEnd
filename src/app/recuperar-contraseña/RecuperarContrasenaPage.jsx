import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound, Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RecuperarContrasenaPage() {
  const [step, setStep] = useState("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setErrors({ email: "El correo electrónico es requerido" })
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Ingresa un correo electrónico válido" })
      return
    }
    
    setErrors({})
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          action: "send_code",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ email: data.message || "Error al enviar código" })
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setStep("code")
    } catch {
      setErrors({ email: "Error de conexión. Intenta de nuevo." })
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!code || code.length !== 6) {
      setErrors({ code: "Ingresa el código de 6 dígitos" })
      return
    }
    
    setErrors({})
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          action: "verify_code",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ code: data.message || "Código inválido" })
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setStep("newPassword")
    } catch {
      setErrors({ code: "Error de conexión. Intenta de nuevo." })
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    
    if (!password) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          password,
          action: "reset_password",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ password: data.message || "Error al cambiar contraseña" })
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setStep("success")
    } catch {
      setErrors({ password: "Error de conexión. Intenta de nuevo." })
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/logo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
          {step === "email" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-primary mb-2">BRAVOS GYM</h1>
                <h2 className="text-xl font-semibold text-foreground">
                  Recuperar Contraseña
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Ingresa tu correo electrónico para recibir un código de verificación
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className={`pl-10 h-12 bg-secondary border-border focus:border-primary ${errors.email ? "border-destructive" : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Código"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

          {step === "code" && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Ingresa el Código
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Enviamos un código de 6 dígitos a{" "}
                  <span className="text-primary">{email}</span>
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-foreground">Código de Verificación</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className={`h-12 bg-secondary border-border focus:border-primary text-center text-2xl tracking-widest font-mono ${errors.code ? "border-destructive" : ""}`}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                  {errors.code && <p className="text-sm text-destructive text-center">{errors.code}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setStep("email")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ¿No recibiste el código? Reenviar
                </button>
              </div>
            </>
          )}

          {step === "newPassword" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Nueva Contraseña
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Ingresa tu nueva contraseña
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      className={`pl-10 pr-10 h-12 bg-secondary border-border focus:border-primary ${errors.password ? "border-destructive" : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      className={`pl-10 pr-10 h-12 bg-secondary border-border focus:border-primary ${errors.confirmPassword ? "border-destructive" : ""}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Cambiar Contraseña"
                  )}
                </Button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="text-xl font-semibold text-foreground">
                Contraseña Actualizada
              </h2>
              
              <p className="text-muted-foreground text-sm">
                Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              
              <Link href="/login">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Ir a Iniciar Sesión
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
