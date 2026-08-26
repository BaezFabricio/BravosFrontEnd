import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound, Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { enviarCodigoRecuperacion, verificarCodigoRecuperacion, resetearContrasena } from "@/api"

const STEPS = ["email", "code", "newPassword", "success"]
const STEP_LABELS = ["Correo", "Código", "Contraseña"]

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

  const stepIndex = STEPS.indexOf(step)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setErrors({ email: "El correo es requerido" }); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setErrors({ email: "Correo inválido" }); return }
    setErrors({})
    setIsLoading(true)
    try {
      await enviarCodigoRecuperacion(email)
      setStep("code")
    } catch (err) {
      setErrors({ email: err?.response?.data?.message || "Error al enviar código" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!code || code.length !== 6) { setErrors({ code: "Ingresá el código de 6 dígitos" }); return }
    setErrors({})
    setIsLoading(true)
    try {
      await verificarCodigoRecuperacion(email, code)
      setStep("newPassword")
    } catch (err) {
      setErrors({ code: err?.response?.data?.message || "Código inválido" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!password) newErrors.password = "La contraseña es requerida"
    else if (password.length < 8) newErrors.password = "Mínimo 8 caracteres"
    if (!confirmPassword) newErrors.confirmPassword = "Confirmá tu contraseña"
    else if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden"
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setIsLoading(true)
    try {
      await resetearContrasena(email, code, password)
      setStep("success")
    } catch (err) {
      setErrors({ password: err?.response?.data?.message || "Error al cambiar contraseña" })
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (err) =>
    `h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 transition-colors ${err ? "border-destructive" : ""}`

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0d09] relative">
      {/* Watermark logo */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "url('/logo-box-bravos-final.png')", backgroundSize: "50%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
      />
      {/* Línea decorativa izquierda */}
      <div className="absolute top-0 left-8 w-px h-full bg-gradient-to-b from-transparent via-lime-400/30 to-transparent hidden lg:block" />

      <div className="relative z-10 w-full max-w-sm anim-from-right">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 anim-fade-up">
          <img src="/logo.jpg" alt="Bravos" className="h-9 w-9 rounded-xl" />
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-lime-400 uppercase leading-none">Bravos</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Box & Gym</p>
          </div>
        </div>

        {/* Stepper — solo cuando no es success */}
        {step !== "success" && (
          <div className="flex items-center gap-2 mb-8 anim-fade-up anim-delay-100">
            {STEP_LABELS.map((label, i) => {
              const active = i === stepIndex
              const done = i < stepIndex
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 ${i > 0 ? '' : ''}`}>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                      ${done ? 'bg-lime-400 text-black' : active ? 'bg-lime-400/20 border border-lime-400 text-lime-400' : 'bg-white/5 border border-white/10 text-white/20'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block transition-colors
                      ${done ? 'text-lime-400' : active ? 'text-white/70' : 'text-white/20'}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-px transition-colors ${done ? 'bg-lime-400/60' : 'bg-white/10'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-background p-7 shadow-2xl">

          {/* STEP: email */}
          {step === "email" && (
            <div key="email" className="anim-fade-up space-y-5">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Recuperar acceso</h2>
                <p className="mt-1 text-sm text-muted-foreground">Te enviamos un código a tu correo</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email" type="email" placeholder="tu@email.com" autoComplete="email"
                      className={`pl-10 ${inputClass(errors.email)}`}
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm active:scale-[0.98] transition-all">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar código"}
                </Button>
              </form>

              <Link to="/login" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
              </Link>
            </div>
          )}

          {/* STEP: code */}
          {step === "code" && (
            <div key="code" className="anim-fade-up space-y-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <KeyRound className="h-5 w-5 text-lime-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Ingresá el código</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Lo enviamos a <span className="text-lime-400 font-medium">{email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="code" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Código de 6 dígitos
                  </label>
                  <Input
                    id="code" type="text" placeholder="000000" maxLength={6}
                    className={`h-14 text-center text-3xl tracking-[0.4em] font-mono bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.code ? "border-destructive" : ""}`}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                  {errors.code && <p className="text-xs text-destructive text-center">{errors.code}</p>}
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm active:scale-[0.98] transition-all">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</> : "Verificar código"}
                </Button>
              </form>

              <button onClick={() => setStep("email")} className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Cambiar correo
              </button>
            </div>
          )}

          {/* STEP: newPassword */}
          {step === "newPassword" && (
            <div key="newPassword" className="anim-fade-up space-y-5">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Nueva contraseña</h2>
                <p className="mt-1 text-sm text-muted-foreground">Elegí una contraseña segura de al menos 8 caracteres</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className={`pl-10 pr-10 ${inputClass(errors.password)}`}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repetí tu contraseña"
                      autoComplete="new-password"
                      className={`pl-10 pr-10 ${inputClass(errors.confirmPassword)}`}
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm active:scale-[0.98] transition-all">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Cambiar contraseña"}
                </Button>
              </form>
            </div>
          )}

          {/* STEP: success */}
          {step === "success" && (
            <div key="success" className="anim-fade-up text-center space-y-5 py-2">
              <div className="mx-auto h-20 w-20 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-lime-400" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">¡Listo!</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Tu contraseña fue cambiada exitosamente. Ya podés iniciar sesión.
                </p>
              </div>

              <Link to="/login" className="block">
                <Button className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
