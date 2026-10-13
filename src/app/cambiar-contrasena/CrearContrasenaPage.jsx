import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { haySesion, cerrarSesionEnServidor } from "@/lib/sesion"
import { PANELES, panelesPermitidos } from "@/lib/paneles"
import { BotonTema } from "@/components/BotonTema"

/*
 * Primer ingreso de una cuenta creada por un admin: la contraseña que eligió el admin es
 * temporal y hay que reemplazarla. El servidor no deja hacer nada más con esa sesión
 * (ver auth.middleware.js); esta pantalla es el único camino.
 */
const REGLAS = [
  { id: "len", label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Una mayúscula (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Una minúscula (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "Un número (0-9)", test: (p) => /[0-9]/.test(p) },
]

function leerUsuario() {
  try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} }
}

// Después de crear la contraseña, a qué panel entra (mismo criterio que el login)
function destinoDespues() {
  const permitidos = panelesPermitidos()
  const paneles = PANELES.filter((p) => permitidos[p.key])
  if (paneles.length > 1) return "/seleccionar-panel"
  return paneles[0]?.href || "/inicio"
}

export default function CrearContrasenaPage() {
  const navigate = useNavigate()
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [repetir, setRepetir] = useState("")
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  if (!haySesion()) return <Navigate to="/login" replace />
  const usuario = leerUsuario()
  const nombre = String(usuario.nombrecompleto || "").split(" ")[0]

  const guardar = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!actual) errs.actual = "Ingresá la contraseña que te dieron"
    if (REGLAS.some((r) => !r.test(nueva))) errs.nueva = "La contraseña no cumple todos los requisitos"
    else if (nueva === actual) errs.nueva = "Tiene que ser distinta de la contraseña temporal"
    if (nueva !== repetir) errs.repetir = "Las contraseñas no coinciden"
    setErrores(errs)
    if (Object.keys(errs).length) return

    setGuardando(true)
    try {
      await apiClient.post("/auth/cambiar-contrasena", { contrasenaActual: actual, contrasenaNueva: nueva })
      localStorage.setItem("usuario", JSON.stringify({ ...usuario, debeCambiarContrasena: false }))
      toast.success("¡Listo! Ya tenés tu contraseña")
      navigate(destinoDespues(), { replace: true })
    } catch (err) {
      const codigo = err?.response?.data?.errorCode
      const mensaje = err?.response?.data?.message
      if (codigo === "INVALID_PASSWORD") setErrores({ actual: "La contraseña temporal no es correcta" })
      else if (codigo === "SAME_PASSWORD") setErrores({ nueva: "Tiene que ser distinta de la contraseña temporal" })
      else toast.error("No se pudo guardar", { description: mensaje || "Intentá de nuevo." })
    } finally {
      setGuardando(false)
    }
  }

  const salir = async () => {
    await cerrarSesionEnServidor()
    localStorage.removeItem("usuario")
    localStorage.removeItem("permisos")
    navigate("/login", { replace: true })
  }

  const campo = (err) => `h-11 rounded-xl bg-background/60 pl-10 pr-10 ${err ? "border-destructive" : "border-border"}`

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-background px-5 pb-8 pt-5">
      <div className="flex w-full max-w-sm flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-black tracking-widest text-foreground">BRAVOS</span>
          </div>
          <BotonTema />
        </div>

        <div className="flex flex-1 flex-col justify-center py-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">
              {nombre ? `Hola, ${nombre}` : "Creá tu contraseña"}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Entraste con una contraseña temporal. Creá una propia para empezar a usar tu cuenta.
            </p>

            <form onSubmit={guardar} className="mt-5 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="actual" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña temporal</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="actual" type={ver ? "text" : "password"} autoComplete="current-password" className={campo(errores.actual)}
                    value={actual} onChange={(e) => setActual(e.target.value)} />
                </div>
                {errores.actual && <p className="text-xs text-destructive">{errores.actual}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nueva" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="nueva" type={ver ? "text" : "password"} autoComplete="new-password" aria-describedby="reglas-nueva"
                    className={campo(errores.nueva)} value={nueva} onChange={(e) => setNueva(e.target.value)} />
                  <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul id="reglas-nueva" className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                  {REGLAS.map((r) => {
                    const ok = r.test(nueva)
                    return (
                      <li key={r.id} className={`flex items-center gap-1.5 text-xs ${ok ? "text-lime-700 dark:text-lime-400" : "text-muted-foreground"}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 ${ok ? "" : "opacity-40"}`} aria-hidden="true" />
                        {r.label}<span className="sr-only">{ok ? " (cumplido)" : " (falta)"}</span>
                      </li>
                    )
                  })}
                </ul>
                {errores.nueva && <p className="text-xs text-destructive">{errores.nueva}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="repetir" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Repetí la nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="repetir" type={ver ? "text" : "password"} autoComplete="new-password" className={campo(errores.repetir)}
                    value={repetir} onChange={(e) => setRepetir(e.target.value)} />
                </div>
                {errores.repetir && <p className="text-xs text-destructive">{errores.repetir}</p>}
              </div>

              <button type="submit" disabled={guardando}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wider text-black transition-colors hover:bg-lime-300 active:scale-[0.98] disabled:opacity-60">
                {guardando ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : "Guardar y entrar"}
              </button>
            </form>
          </div>

          <button type="button" onClick={salir}
            className="mx-auto mt-4 flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-foreground/60 transition-colors hover:text-foreground">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
          </button>
        </div>
      </div>
    </div>
  )
}
