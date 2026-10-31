import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserX } from "lucide-react"
import { toast } from '@/lib/notificar'
import BravoAvatar from '@/components/BravoAvatar'
import { useEscritorio } from '@/lib/useEscritorio'
import { BIG, COLOR } from '@/lib/accesoEstilos'
import { ESTILOS_MOVIL, FICHA_FLOTANTE } from '@/lib/estilosMovil'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/vv1"

// Estilos globales de la referencia, acotados a esta pantalla
const ESTILOS_REF = `
.lr a{color:#9be600}.lr a:hover{color:#c4ff3d}
.lr input::placeholder{color:#6b705e}.lr input:focus{outline:none}
.lr button:hover{background:#c4ff3d!important}
.lr .ficha-flota{transition:transform .25s ease-out;will-change:transform;transform:translateY(-4px)}
.lr .ficha-flota:hover{transition:transform .08s linear}
@media (prefers-reduced-motion: reduce){.lr .ficha-flota{transition:none}}
@keyframes lr-in{from{opacity:0}to{opacity:1}}
@keyframes lr-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(-4px)}}
.lr{animation:lr-in .4s ease both}
.lr.sale{opacity:0;transition:opacity .22s ease}
.lr .ficha-flota{animation:lr-up .5s cubic-bezier(.22,1,.36,1) .05s backwards}
@media (prefers-reduced-motion: reduce){.lr,.lr .ficha-flota{animation:none}.lr.sale{transition:none}}
`

export default function LoginPage() {
  const escritorio = useEscritorio()
  // Al pasar al registro: la pantalla se desvanece y recién ahí navega (el registro entra con su propia animación)
  const [saliendo, setSaliendo] = useState(false)
  const irA = (destino) => (e) => {
    e.preventDefault()
    setSaliendo(true)
    setTimeout(() => navigate(destino), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220)
  }
  const fichaRef = useRef(null)
  // Efecto flotante: la ficha se inclina un poco hacia donde está el cursor
  const inclinar = (e) => {
    const el = fichaRef.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1100px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`
  }
  const soltar = () => { if (fichaRef.current) fichaRef.current.style.transform = "" }
  const navigate = useNavigate()
  // "Volver al sitio" lleva siempre a la página principal (no al registro ni al login, que son pantallas hermanas)
  const volver = () => navigate("/inicio")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [cuentaDesactivada, setCuentaDesactivada] = useState(false)
  // Después de una contraseña incorrecta, Bravo ofrece recuperarla
  const [pistaOlvido, setPistaOlvido] = useState(false)

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
        if (data.errorCode === 'INVALID_CREDENTIALS') {
          setPistaOlvido(true)
        } else {
          toast.error(data.message || "Error al iniciar sesión")
        }
        setIsLoading(false)
        return
      }

      localStorage.setItem("usuario", JSON.stringify(data.data.usuario))
      const listadoPermisos = data.data?.permisos || []
      localStorage.setItem("permisos", JSON.stringify(listadoPermisos))
      if (data.data?.usuario?.avatarUrl) localStorage.setItem("avatarUrl", data.data.usuario.avatarUrl)

      // Cuenta creada por un admin: antes de entrar tiene que reemplazar la contraseña temporal
      if (data.data?.usuario?.debeCambiarContrasena) {
        navigate("/crear-contrasena", { replace: true })
        return
      }

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

    } catch {
      toast.error("Error de conexión", { description: "Asegúrate de que el backend esté encendido." })
      setIsLoading(false)
    }
  }

  if (cuentaDesactivada) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-[#ecefe4]" style={{ background: COLOR.form }}>
        <div className="w-full max-w-md space-y-5 border p-8 text-center" style={{ borderColor: COLOR.linea }}>
          <div className="flex justify-center">
            <div className="rounded-full border border-red-500/30 bg-red-500/10 p-4"><UserX className="h-10 w-10 text-red-400" /></div>
          </div>
          <div>
            <div role="heading" aria-level={1} className="text-3xl uppercase" style={BIG}>Cuenta desactivada</div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: COLOR.apagado }}>
              Tu cuenta fue desactivada. Para volver a acceder al sistema, contactá al administrador del gimnasio para que la reactive.
            </p>
          </div>
          <button onClick={() => { setCuentaDesactivada(false); setFormData({ email: "", password: "" }) }}
            className="w-full border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-white"
            style={{ borderColor: COLOR.linea, color: COLOR.apagado }}>
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  const vistaMovil = (
    <div className={`lm${saliendo ? " sale" : ""}`} style={{ margin: 0, background: "#0e100a", color: "#ecefe4", fontFamily: "Archivo,sans-serif", lineHeight: "normal", minHeight: "100dvh" }}>
      <style>{ESTILOS_MOVIL}</style>
      <div style={{ position: "relative", width: "100%", maxWidth: "480px", margin: "0 auto", minHeight: "100dvh", overflowX: "hidden", background: "#0e100a" }}>
        <div style={{ position: "relative", height: "270px", overflow: "hidden" }}>
          <img src="/acceso/grupo-c.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 55%", filter: "grayscale(1) contrast(1.1) brightness(0.9)" }} />
          <div style={{ position: "absolute", inset: 0, background: "#4a5626", mixBlendMode: "multiply", opacity: 0.5 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(14,16,10,0.55) 0%,rgba(14,16,10,0) 30%,rgba(14,16,10,0.2) 60%,#0e100a 100%)" }} />
          <div style={{ position: "absolute", top: "calc(env(safe-area-inset-top) + 16px)", left: "20px", right: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><img src="/acceso/brvs.png" alt="" style={{ width: "34px", height: "34px", borderRadius: "8px" }} /><span style={{ font: "900 15px 'Big Shoulders Stencil Display'", letterSpacing: "0.3em", color: "#9be600", whiteSpace: "nowrap" }}>BRAVOS BOX</span></div>
            <Link to="/inicio" style={{ font: "500 12px 'JetBrains Mono'", letterSpacing: "0.14em", textDecoration: "none", whiteSpace: "nowrap", color: "#ecefe4", display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 16px", border: "1px solid rgba(236,239,228,.28)", borderRadius: "999px", background: "rgba(14,16,10,.5)", margin: "-4px -6px -4px 0" }}>← SITIO</Link>
          </div>
          <div role="heading" aria-level={1} style={{ position: "absolute", left: "20px", top: "calc(env(safe-area-inset-top) + 64px)", font: "900 46px/0.9 'Big Shoulders Stencil Display'", textTransform: "uppercase" }}>Nadie<br />entrena <span style={{ color: "#9be600" }}>solo.</span></div>
        </div>
        <div style={{ position: "absolute", left: "-30px", right: "-30px", top: "236px", transform: "rotate(-3deg)", background: "#9be600", color: "#0b0c09", padding: "8px 46px", display: "flex", justifyContent: "space-between", alignItems: "center", whiteSpace: "nowrap", font: "900 15px 'Big Shoulders Stencil Display'", letterSpacing: "0.12em", boxShadow: "rgba(0,0,0,0.45) 0 6px 18px" }}><span>✦</span><span>EMPIEZA AUNQUE NO SEPAS LO QUE VIENE</span><span>✦</span></div>

        <div style={{ position: "relative", margin: "92px 20px 0" }}>
          <div ref={fichaRef} onMouseMove={inclinar} onMouseLeave={soltar} className="flota" style={{ position: "relative", borderRadius: "14px", padding: "20px 18px 18px", ...FICHA_FLOTANTE }}>
            <img src="/acceso/dog-t.png" alt="" style={{ position: "absolute", right: "18px", bottom: "calc(100% - 2px)", width: "84px", height: "84px" }} />
            <div style={{ font: "500 10px 'JetBrains Mono'", letterSpacing: "0.16em", color: "#9be600", paddingBottom: "10px", borderBottom: "1px dashed #3a3d32" }}>ACCESO SOCIOS</div>
            <div role="heading" aria-level={2} style={{ font: "900 42px/0.9 'Big Shoulders Stencil Display'", textTransform: "uppercase", margin: "14px 0 4px" }}>Ingresar<span style={{ color: "#9be600" }}>.</span></div>
            <div style={{ color: "#8a8f7a", fontSize: "13px", marginBottom: "16px" }}>Ingresá con tu cuenta para continuar.</div>

            {/* Contraseña incorrecta: Bravo ofrece ayuda */}
            {pistaOlvido && (
              <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px", padding: "12px", border: "1px solid #9be600", borderRadius: "10px", background: "rgba(155,230,0,.08)", fontSize: "14px", lineHeight: 1.35 }}>
                <BravoAvatar size={36} className="rounded-full" />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>El correo o la contraseña no coinciden.</p>
                  <p style={{ margin: "2px 0 0", color: "#8a8f7a" }}>¿La olvidaste? <Link to="/recuperar-contrasena" style={{ fontWeight: 700 }}>Te ayudo a recuperarla</Link></p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ border: "1px solid #3a3d32", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #3a3d32" }}>
                  <label className="lbl" htmlFor="email-m">CORREO ELECTRÓNICO</label>
                  <input id="email-m" className="inp" type="email" autoComplete="email" placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  {errors.email && <p role="alert" style={{ margin: "4px 0 0", font: "500 13px Archivo", color: "#ff6b4a" }}>{errors.email}</p>}
                </div>
                <div style={{ padding: "10px 14px 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label className="lbl" htmlFor="password-m">CONTRASEÑA</label><Link to="/recuperar-contrasena" style={{ font: "600 12px Archivo", textDecoration: "none", padding: "8px 0 8px 12px", margin: "-8px 0" }}>¿La olvidaste?</Link></div>
                  <input id="password-m" className="inp" type="password" autoComplete="current-password" placeholder="••••••••" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setPistaOlvido(false) }} />
                  {errors.password && <p role="alert" style={{ margin: "4px 0 0", font: "500 13px Archivo", color: "#ff6b4a" }}>{errors.password}</p>}
                </div>
              </div>
              <button type="submit" disabled={isLoading} style={{ marginTop: "16px", width: "100%", height: "54px", border: "none", borderRadius: "10px", cursor: "pointer", background: "#9be600", color: "#0b0c09", font: "900 22px 'Big Shoulders Stencil Display'", letterSpacing: "0.12em", textTransform: "uppercase", boxShadow: "rgba(155,230,0,0.28) 0 0 28px", opacity: isLoading ? 0.7 : 1 }}>{isLoading ? "INGRESANDO…" : "Iniciar sesión →"}</button>
            </form>
          </div>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
            <span style={{ textAlign: "center", font: "500 10px 'JetBrains Mono'", letterSpacing: "0.16em", color: "#8a8f7a" }}>¿PRIMERA VEZ?</span>
            <Link to="/registro" onClick={irA("/registro")} className="btn2" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "44px", border: "1px solid rgba(155,230,0,.55)", borderRadius: "10px", textDecoration: "none", color: "#9be600", font: "900 16px 'Big Shoulders Stencil Display'", letterSpacing: "0.12em", textTransform: "uppercase" }}>Crear una cuenta →</Link>
          </div>
        </div>
        <div style={{ marginTop: "28px", paddingBottom: "18px", textAlign: "center", font: "500 9.5px 'JetBrains Mono'", letterSpacing: "0.16em", color: "#4b5233" }}>FORMOSA · EVA PERÓN 552</div>
      </div>
    </div>
  )

  if (!escritorio) return vistaMovil

  // Referencia (login) medida sobre 1280×880: cada medida es calc(N * var(--u)), --u = min(100vw / 1280, 100vh / 880)
  const U = (n) => `calc(${n} * var(--u))`
  const MONO_REF = "'JetBrains Mono'"
  const BIG_REF = "'Big Shoulders Stencil Display'"
  const msjError = { margin: `${U(2)} 0 0`, font: `500 ${U(14)} Archivo`, color: "#ff6b4a" }

  return (
    <div className={`lr${saliendo ? " sale" : ""}`} style={{ margin: 0, color: "#ecefe4", fontFamily: "Archivo,sans-serif", lineHeight: "normal", "--u": "min(100vw / 1280, 100vh / 880)" }}>
      <style>{ESTILOS_REF}</style>
      <div style={{ display: "grid", gridTemplateColumns: `min(${U(800)}, 52vw) 1fr`, position: "fixed", inset: 0, width: "100%", height: "100%", overflow: "hidden", background: "#0b0c09" }}>

        {/* PANEL IZQUIERDO: FOTOS */}
        <div style={{ position: "relative", overflow: "hidden", display: "grid", gridTemplateRows: `${U(380)} 1fr`, gridTemplateColumns: "1fr 1fr", gap: `${U(4)}`, background: "#0b0c09" }}>
          {/* fila 1: soldados */}
          <div style={{ gridColumn: "1 / 3", position: "relative", overflow: "hidden" }}>
            <img src="/acceso/hero.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 15%", filter: "grayscale(1) contrast(1.1) brightness(0.8)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#4a5626", mixBlendMode: "multiply", opacity: 0.4 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(11,12,9,0.85), transparent 60%)" }} />
            <div style={{ position: "absolute", top: `${U(30)}`, left: `${U(36)}`, display: "flex", alignItems: "center", gap: `${U(14)}` }}><img src="/acceso/brvs.png" alt="" style={{ width: `${U(44)}`, height: `${U(44)}`, borderRadius: `${U(8)}` }} /><span style={{ font: `900 ${U(20)} ${BIG_REF}`, letterSpacing: "0.3em", color: "#9be600", whiteSpace: "nowrap" }}>BRAVOS BOX</span></div>
            <div role="heading" aria-level={1} style={{ position: "absolute", left: `${U(36)}`, bottom: `${U(44)}`, font: `900 ${U(74)} / 0.92 ${BIG_REF}`, textTransform: "uppercase", maxWidth: `${U(430)}` }}>Nadie entrena <span style={{ color: "#9be600" }}>solo.</span></div>
          </div>
          {/* fila 2: chico + grupo */}
          <div style={{ gridColumn: "1 / 3", position: "relative", overflow: "hidden", background: "#0b0c09" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
              <img src="/acceso/hookgrip-c.png" alt="" style={{ flex: "none", height: "100%", width: U(320), objectFit: "cover", objectPosition: "50% 0%", position: "relative", zIndex: 1, filter: "grayscale(1) contrast(1.05) brightness(0.9)", WebkitMaskImage: "linear-gradient(90deg, #000 85%, transparent 100%)", maskImage: "linear-gradient(90deg, #000 85%, transparent 100%)" }} />
              <img src="/acceso/grupo-c.png" alt="" style={{ flex: "1 1 0%", minWidth: 0, height: "100%", marginLeft: `${U(-60)}`, objectFit: "cover", objectPosition: "40% 80%", filter: "grayscale(1) contrast(1.1) brightness(1.15)" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "#4a5626", mixBlendMode: "multiply", opacity: 0.4 }} />
            <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(0deg, rgba(11,12,9,0.6), transparent 40%)" }} />
          </div>
          {/* cinta */}
          <div style={{ position: "absolute", left: `${U(-40)}`, right: `${U(-40)}`, top: `${U(336)}`, zIndex: 3, transform: "rotate(-2.5deg)", background: "#9be600", color: "#0b0c09", padding: `${U(12)} ${U(86)}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: `${U(14)}`, whiteSpace: "nowrap", font: `900 ${U(26)} ${BIG_REF}`, letterSpacing: "0.14em", boxShadow: `rgba(0,0,0,0.4) 0 ${U(6)} ${U(20)}` }}><span>✦</span><span>EMPIEZA AUNQUE NO SEPAS LO QUE VIENE</span><span>✦</span></div>
          {/* fundido hacia el formulario */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: `${U(110)}`, zIndex: 4, background: "linear-gradient(90deg, rgba(14,16,10,0), #0e100a)", pointerEvents: "none" }} />
        </div>

        {/* PANEL DERECHO: FORMULARIO */}
        <div style={{ position: "relative", padding: `${U(40)} 0 ${U(28)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#0e100a" }}>
          <a href="#volver" onClick={(e) => { e.preventDefault(); volver() }} style={{ position: "absolute", top: `${U(32)}`, right: `${U(40)}`, font: `500 ${U(12)} ${MONO_REF}`, letterSpacing: "0.14em", textDecoration: "none", color: "#8a8f7a" }}>← VOLVER AL SITIO</a>
          <div ref={fichaRef} onMouseMove={inclinar} onMouseLeave={soltar} className="ficha-flota" style={{ position: "relative", width: `${U(480)}`, border: `${U(1)} solid #4a4e3f`, borderRadius: `${U(16)}`, padding: `${U(24)} ${U(30)}`, marginTop: `max(${U(100)}, calc((100vh - ${U(566)}) / 2 + ${U(100)}))`, background: "linear-gradient(160deg, #16190f 0%, #0e100a 60%)", boxShadow: `0 ${U(1)} 0 rgba(236,239,228,.08) inset, 0 ${U(30)} ${U(60)} ${U(-12)} rgba(0,0,0,.75), 0 ${U(12)} ${U(24)} ${U(-8)} rgba(0,0,0,.6), 0 0 ${U(60)} ${U(-20)} rgba(155,230,0,.18)` }}>
            <img src="/acceso/dog-t.png" alt="" style={{ position: "absolute", left: `${U(30)}`, bottom: `calc(100% - ${U(2)})`, width: `${U(110)}`, height: `${U(110)}` }} />
            <div style={{ display: "flex", justifyContent: "space-between", font: `500 ${U(10.5)} ${MONO_REF}`, letterSpacing: "0.16em", color: "#8a8f7a", paddingBottom: `${U(12)}`, borderBottom: `${U(1)} dashed #3a3d32` }}><span style={{ color: "#9be600", whiteSpace: "nowrap" }}>ACCESO SOCIOS</span></div>
            <div role="heading" aria-level={2} style={{ font: `900 ${U(54)} / 0.9 ${BIG_REF}`, textTransform: "uppercase", margin: `${U(16)} 0 ${U(4)}` }}>Ingresar<span style={{ color: "#9be600" }}>.</span></div>
            <div style={{ color: "#8a8f7a", fontSize: `${U(14)}`, marginBottom: `${U(18)}` }}>Ingresá con tu cuenta para continuar.</div>

            {/* Contraseña incorrecta: Bravo ofrece ayuda */}
            {pistaOlvido && (
              <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: `${U(12)}`, marginBottom: `${U(16)}`, padding: `${U(12)}`, border: `${U(1)} solid #9be600`, background: "rgba(155,230,0,.08)", fontSize: `${U(14)}`, lineHeight: 1.35 }}>
                <BravoAvatar size={36} className="rounded-full" />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>El correo o la contraseña no coinciden.</p>
                  <p style={{ margin: `${U(2)} 0 0`, color: "#8a8f7a" }}>¿La olvidaste? <Link to="/recuperar-contrasena" style={{ fontWeight: 700 }}>Te ayudo a recuperarla</Link></p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `${U(1)} solid #3a3d32`, borderRadius: `${U(12)}`, overflow: "hidden" }}>
                <div style={{ gridColumn: "1 / 3", padding: `${U(8)} ${U(12)} ${U(6)}`, border: `${U(1)} solid #3a3d32`, margin: `${U(-0.5)}` }}>
                  <label htmlFor="email" style={{ font: `500 ${U(9.5)} ${MONO_REF}`, letterSpacing: "0.16em", color: "#8a8f7a" }}>CORREO ELECTRÓNICO</label>
                  <input id="email" type="email" placeholder="tu@email.com" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", background: "transparent", border: "none", color: "#ecefe4", font: `500 ${U(16)} Archivo`, padding: `${U(4)} 0` }} />
                  {errors.email && <p role="alert" style={msjError}>{errors.email}</p>}
                </div>
                <div style={{ gridColumn: "1 / 3", padding: `${U(8)} ${U(12)} ${U(6)}`, border: `${U(1)} solid #3a3d32`, margin: `${U(-0.5)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><label htmlFor="password" style={{ font: `500 ${U(9.5)} ${MONO_REF}`, letterSpacing: "0.16em", color: "#8a8f7a" }}>CONTRASEÑA</label><Link to="/recuperar-contrasena" style={{ font: `500 ${U(11)} Archivo`, textDecoration: "none" }}>¿La olvidaste?</Link></div>
                  <input id="password" type="password" placeholder="••••••••" autoComplete="current-password" value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setPistaOlvido(false) }}
                    style={{ width: "100%", background: "transparent", border: "none", color: "#ecefe4", font: `500 ${U(16)} Archivo`, padding: `${U(4)} 0` }} />
                  {errors.password && <p role="alert" style={msjError}>{errors.password}</p>}
                </div>
              </div>
              <button type="submit" disabled={isLoading} style={{ marginTop: `${U(18)}`, width: "100%", border: "none", cursor: "pointer", background: "#9be600", color: "#0b0c09", font: `900 ${U(26)} ${BIG_REF}`, letterSpacing: "0.12em", textTransform: "uppercase", padding: `${U(12)}`, borderRadius: `${U(12)}`, boxShadow: `0 ${U(8)} ${U(20)} ${U(-6)} rgba(155,230,0,.45)`, opacity: isLoading ? 0.7 : 1 }}>{isLoading ? "INGRESANDO…" : "Iniciar sesión →"}</button>
            </form>
          </div>
          <div style={{ width: `${U(480)}`, marginTop: `${U(18)}`, fontSize: `${U(13)}`, color: "#8a8f7a" }}>¿Primera vez? <Link to="/registro" onClick={irA("/registro")} style={{ fontWeight: 600 }}>Crear una cuenta nueva</Link></div>
        </div>
      </div>
    </div>
  )
}
