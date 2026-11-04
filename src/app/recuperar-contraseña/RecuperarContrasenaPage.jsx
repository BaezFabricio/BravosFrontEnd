import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { enviarEnlaceRecuperacion, verificarEnlaceRecuperacion, resetearContrasena } from "@/api"
import PantallaEstado from "@/components/acceso/PantallaEstado"

/*
 * Recuperar contraseña con enlace de un solo uso:
 *  1. Correo: se pide el enlace.
 *  2. Enlace: el correo trae /recuperar-contrasena?token=... (vence en 30 minutos).
 *  3. Contraseña: con el enlace abierto se elige la nueva.
 * Las reglas de la contraseña son las mismas que exige el servidor.
 */

const STEP_LABELS = ["Correo", "Enlace", "Contraseña"]

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


  // Pantallas anchas: diseño de estados del acceso (estados-referencia: 5f paso 1, 5g paso 2, 5h enlace vencido)
  {
    if (step === "checking") {
      return (
        <PantallaEstado foto="hero.jpg" posicion="35% 40%" volverA="/login" volverTexto="Volver al login">
          <div className="status"><span className="tag">RECUPERAR ACCESO</span><span className="sep"></span><span className="chip">COMPROBANDO</span></div>
          <h1>Un momento<i>.</i></h1>
          <p className="lead" role="status">Estamos comprobando tu enlace…</p>
        </PantallaEstado>
      )
    }

    const pasos = (clases) => (
      <div className="steps">{STEP_LABELS.map((l, i) => <div key={l} className={clases[i]}>{String(i + 1).padStart(2, "0")} · {l.toUpperCase()}</div>)}</div>
    )
    const estado = (chip, tipo) => (
      <div className="status"><span className="tag">RECUPERAR ACCESO</span><span className="sep"></span><span className={`chip ${tipo}`}>{chip}</span></div>
    )
    const volver = { volverA: "/login", volverTexto: "Volver al login" }
    const ojo = (ver, alternar) => (
      <button type="button" className="ojo" onClick={alternar} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>{ver ? <EyeOff /> : <Eye />}</button>
    )

    if (step === "email") {
      return (
        <PantallaEstado foto="hero.jpg" posicion="35% 40%" {...volver}>
          {pasos(["cur", "", ""])}
          {estado("PASO 1 / 3", "")}
          <h1>Recuperar acceso<i>.</i></h1>
          <p className="lead">Te enviamos un enlace a tu correo para crear una contraseña nueva.</p>
          <form onSubmit={pedirEnlace} noValidate>
            <div className={`cell${errors.email ? " err" : ""}`}>
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" type="email" placeholder="tu@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {errors.email && <div className="errmsg" role="alert"><span>ERR</span>{errors.email}</div>}
            <div className="acciones"><button type="submit" className="btn" disabled={isLoading}>{isLoading ? "Enviando…" : "Enviar enlace →"}</button></div>
          </form>
        </PantallaEstado>
      )
    }
    if (step === "sent") {
      return (
        <PantallaEstado foto="hero.jpg" posicion="35% 40%" {...volver}>
          {pasos(["done", "cur", ""])}
          {estado("ENLACE ENVIADO", "ok")}
          <h1>Revisá tu correo<i>.</i></h1>
          <p className="lead">Si <em>{email}</em> está registrado, te llega un enlace para crear tu contraseña nueva. Vence en <b>30 minutos</b> y sirve una sola vez.</p>
          <div className="tip"><span>TIP</span>Si no lo ves, buscalo en Spam o Promociones.</div>
          {aviso && <div className="errmsg" role="alert"><span>ERR</span>{aviso}</div>}
          <div className="acciones">
            <button type="button" className="btn-line" onClick={pedirEnlace} disabled={isLoading}>{isLoading ? "Enviando…" : "Reenviar enlace"}</button>
            <button type="button" className="btn-sec" style={{ marginTop: "calc(12 * var(--u))" }} onClick={() => { setStep("email"); setAviso("") }}>Usar otro correo</button>
          </div>
        </PantallaEstado>
      )
    }
    if (step === "invalid") {
      return (
        <PantallaEstado foto="hero.jpg" posicion="35% 40%" {...volver}>
          {pasos(["done", "done", "bad"])}
          {estado("ENLACE VENCIDO", "err")}
          <h1>El enlace ya no sirve<i className="err">.</i></h1>
          <p className="lead">Venció, ya se usó o pediste uno más nuevo. Pedí otro enlace y usá el último que te llegue.</p>
          <div className="acciones"><button type="button" className="btn" onClick={() => setStep("email")}>Pedir un enlace nuevo →</button></div>
        </PantallaEstado>
      )
    }
    if (step === "newPassword") {
      return (
        <PantallaEstado foto="hero.jpg" posicion="35% 40%" {...volver}>
          {pasos(["done", "done", "cur"])}
          {estado("PASO 3 / 3", "")}
          <h1>Nueva contraseña<i>.</i></h1>
          <p className="lead">Elegí una contraseña segura.</p>
          <form onSubmit={guardarContrasena} noValidate>
            <div className={`cell con-ojo${errors.password ? " err" : ""}`}>
              <label htmlFor="password">Nueva contraseña</label>
              <input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" autoComplete="new-password" aria-describedby="reglas-contrasena" value={password} onChange={(e) => setPassword(e.target.value)} />
              {ojo(showPassword, () => setShowPassword(!showPassword))}
            </div>
            <ul id="reglas-contrasena" className="reglas">
              {REGLAS.map((r) => {
                const ok = r.test(password)
                return <li key={r.id} className={ok ? "ok" : ""}>{ok ? "✓" : "○"} {r.label}<span className="sr-only">{ok ? " (cumplido)" : " (falta)"}</span></li>
              })}
            </ul>
            {errors.password && <div className="errmsg" role="alert"><span>ERR</span>{errors.password}</div>}
            <div className={`cell con-ojo${errors.confirmPassword ? " err" : ""}`} style={{ marginTop: "calc(16 * var(--u))" }}>
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repetí tu contraseña" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {ojo(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
            </div>
            {errors.confirmPassword && <div className="errmsg" role="alert"><span>ERR</span>{errors.confirmPassword}</div>}
            <button type="submit" className="btn" disabled={isLoading}>{isLoading ? "Guardando…" : "Cambiar contraseña →"}</button>
          </form>
        </PantallaEstado>
      )
    }
    if (step === "success") {
      return (
        <PantallaEstado foto="hero.jpg" posicion="35% 40%" {...volver}>
          {pasos(["done", "done", "done"])}
          {estado("CONTRASEÑA CAMBIADA", "ok")}
          <h1>¡Listo<i>.</i></h1>
          <p className="lead">Tu contraseña fue cambiada. Ya podés iniciar sesión.</p>
          <div className="acciones"><Link to="/login" className="btn">Ir al inicio de sesión →</Link></div>
        </PantallaEstado>
      )
    }
  }

  return null
}
