import { Cargando } from '@/components/Cargando'
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BotonTema } from "@/components/BotonTema"
import { Mail, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, MailCheck, LinkIcon, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { enviarEnlaceRecuperacion, verificarEnlaceRecuperacion, resetearContrasena } from "@/api"

/*
 * Recuperar contraseña con enlace de un solo uso:
 *  1. Correo: se pide el enlace.
 *  2. Enlace: el correo trae /recuperar-contrasena?token=... (vence en 30 minutos).
 *  3. Contraseña: con el enlace abierto se elige la nueva.
 * Las reglas de la contraseña son las mismas que exige el servidor.
 */

const STEP_LABELS = ["Correo", "Enlace", "Contraseña"]
const PASO = { email: 0, sent: 1, checking: 2, newPassword: 2, invalid: 2 }

const REGLAS = [
  { id: "len", label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Una mayúscula (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Una minúscula (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "Un número (0-9)", test: (p) => /[0-9]/.test(p) },
]

// El token viene en el enlace del correo (?token=...)
const leerToken = () => new URLSearchParams(window.location.search).get("token")

export default function RecuperarContrasenaPage() {
  const [token] = useState(leerToken)
  const [step, setStep] = useState(token ? "checking" : "email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [aviso, setAviso] = useState("")

  // Con enlace: se saca el token de la barra de direcciones (no queda en el historial)
  // y se comprueba que siga sirviendo
  useEffect(() => {
    if (!token) return
    window.history.replaceState(null, "", window.location.pathname)
    verificarEnlaceRecuperacion(token)
      .then(() => setStep("newPassword"))
      .catch(() => setStep("invalid"))
  }, [token])

  const pedirEnlace = async (e) => {
    e?.preventDefault()
    if (!email) { setErrors({ email: "El correo es requerido" }); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setErrors({ email: "Correo inválido" }); return }
    setErrors({})
    setAviso("")
    setIsLoading(true)
    try {
      await enviarEnlaceRecuperacion(email)
      setStep("sent")
    } catch (err) {
      const msg = err?.response?.data?.message || "No pudimos enviar el correo. Probá de nuevo en unos minutos."
      if (step === "sent") setAviso(msg)
      else setErrors({ email: msg })
    } finally {
      setIsLoading(false)
    }
  }

  const guardarContrasena = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (REGLAS.some((r) => !r.test(password))) newErrors.password = "La contraseña no cumple los requisitos"
    if (!confirmPassword) newErrors.confirmPassword = "Confirmá tu contraseña"
    else if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden"
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setIsLoading(true)
    try {
      await resetearContrasena(token, password)
      setStep("success")
    } catch (err) {
      if (err?.response?.data?.errorCode === "INVALID_TOKEN") setStep("invalid")
      else setErrors({ password: err?.response?.data?.message || "No pudimos cambiar la contraseña" })
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (err) =>
    `h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-600 dark:focus-visible:border-lime-400 transition-colors ${err ? "border-destructive" : ""}`
  const stepIndex = PASO[step] ?? 0

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-6 pt-6 pb-8 bg-background relative">
      {/* Watermark logo */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "url('/logo-box-bravos-final.png')", backgroundSize: "50%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
      />
      <div className="absolute top-0 left-8 w-px h-full bg-gradient-to-b from-transparent via-lime-400/30 to-transparent hidden lg:block" />

      <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col anim-from-right">
        {/* Arriba de todo, igual que en el login: "Volver" como botón y el logo.
            Los pasos y la tarjeta van centrados en el espacio que queda */}
        <div className="flex items-center justify-between gap-3 anim-fade-up">
          <Link
            to="/login"
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          </Link>
          <Link to="/inicio" aria-label="Ir a la página principal" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
            <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-xl" />
            <p className="text-base font-black tracking-[0.3em] text-lime-700 dark:text-lime-400 uppercase leading-none">Bravos</p>
          </Link>
          <div className="flex w-[88px] justify-end"><BotonTema /></div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-6">
        {/* Pasos */}
        {step !== "success" && (
          // Pasos centrados: cada uno es un círculo con su nombre abajo, unidos por una línea
          <ol className="mx-auto mb-8 flex w-full max-w-[300px] items-start anim-fade-up anim-delay-100" aria-label="Pasos para recuperar la contraseña">
            {STEP_LABELS.map((label, i) => {
              const active = i === stepIndex
              const done = i < stepIndex
              const ultimo = i === STEP_LABELS.length - 1
              return (
                <li key={label} className={`flex items-start ${ultimo ? "" : "flex-1"}`} aria-current={active ? "step" : undefined}>
                  <div className="flex w-16 flex-col items-center gap-1.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                      done ? "bg-lime-400 text-black" : active ? "border-2 border-lime-500 bg-lime-400/15 text-lime-700 dark:text-lime-400" : "border border-border bg-muted text-muted-foreground"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${done ? "text-lime-700 dark:text-lime-400" : active ? "text-foreground/85" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  {!ultimo && <div className={`mt-3.5 h-px flex-1 ${done ? "bg-lime-500/60" : "bg-border"}`} aria-hidden="true" />}
                </li>
              )
            })}
          </ol>
        )}

        <div className="rounded-2xl border border-border bg-card p-7 shadow-2xl">

          {/* PASO 1: correo */}
          {step === "email" && (
            <div key="email" className="anim-fade-up space-y-5">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Recuperar acceso</h2>
                <p className="mt-1 text-sm text-muted-foreground">Te enviamos un enlace a tu correo para crear una contraseña nueva.</p>
              </div>
              <form onSubmit={pedirEnlace} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input id="email" type="email" placeholder="tu@email.com" autoComplete="email"
                      className={`pl-10 ${inputClass(errors.email)}`} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" disabled={isLoading}
                  className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm active:scale-[0.98] transition-all">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar enlace"}
                </Button>
              </form>
            </div>
          )}

          {/* PASO 2: enlace enviado */}
          {step === "sent" && (
            <div key="sent" className="anim-fade-up space-y-5 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-lime-700 dark:text-lime-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Revisá tu correo</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Si <span className="font-medium text-lime-700 dark:text-lime-400">{email}</span> está registrado, te llega un enlace para
                  crear tu contraseña nueva. Vence en <strong className="text-foreground">30 minutos</strong> y sirve una sola vez.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Si no lo ves, buscalo en Spam o Promociones.</p>
              </div>
              {aviso && <p className="text-xs text-destructive">{aviso}</p>}
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={pedirEnlace} disabled={isLoading} className="w-full h-11 font-bold">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Reenviar enlace"}
                </Button>
                <button type="button" onClick={() => { setStep("email"); setAviso("") }}
                  className="flex items-center justify-center gap-1.5 w-full min-h-[40px] text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Usar otro correo
                </button>
              </div>
            </div>
          )}

          {/* Comprobando el enlace */}
          {step === "checking" && (
            <Cargando filas={1} className="py-6" />
          )}

          {/* Enlace vencido o ya usado */}
          {step === "invalid" && (
            <div key="invalid" className="anim-fade-up space-y-5 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-700 dark:text-red-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">El enlace ya no sirve</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Venció, ya se usó o pediste uno más nuevo. Pedí otro enlace y usá el último que te llegue.
                </p>
              </div>
              <Button type="button" onClick={() => setStep("email")}
                className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm">
                <LinkIcon className="mr-2 h-4 w-4" /> Pedir un enlace nuevo
              </Button>
            </div>
          )}

          {/* PASO 3: contraseña nueva */}
          {step === "newPassword" && (
            <div key="newPassword" className="anim-fade-up space-y-5">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Nueva contraseña</h2>
                <p className="mt-1 text-sm text-muted-foreground">Elegí una contraseña segura.</p>
              </div>
              <form onSubmit={guardarContrasena} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password" aria-describedby="reglas-contrasena"
                      className={`pl-10 pr-10 ${inputClass(errors.password)}`} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ul id="reglas-contrasena" className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                    {REGLAS.map((r) => {
                      const ok = r.test(password)
                      return (
                        <li key={r.id} className={`flex items-center gap-1.5 text-xs ${ok ? "text-lime-700 dark:text-lime-400" : "text-muted-foreground"}`}>
                          <CheckCircle2 className={`h-3.5 w-3.5 ${ok ? "" : "opacity-40"}`} aria-hidden="true" />
                          {r.label}<span className="sr-only">{ok ? " (cumplido)" : " (falta)"}</span>
                        </li>
                      )
                    })}
                  </ul>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repetí tu contraseña"
                      autoComplete="new-password" className={`pl-10 pr-10 ${inputClass(errors.confirmPassword)}`}
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

          {/* Listo */}
          {step === "success" && (
            <div key="success" className="anim-fade-up text-center space-y-5 py-2">
              <div className="mx-auto h-20 w-20 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-lime-700 dark:text-lime-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">¡Listo!</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Tu contraseña fue cambiada. Ya podés iniciar sesión.</p>
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
    </div>
  )
}
