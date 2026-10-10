import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react"
import { PANELES, panelesPermitidos } from "@/lib/paneles"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { ultimaRutaPublica } from "@/lib/ultimaRutaPublica"

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export default function SeleccionarPanelPage() {
  const navigate = useNavigate()
  const permitidos = panelesPermitidos()
  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} }
  })()

  const disponibles = PANELES.filter(p => permitidos[p.key])
  const nombre = usuario.nombrecompleto || usuario.nombre || ""
  const activa = !usuario.estado || usuario.estado === "activo"

  // Mismo cierre de sesión que el menú de los paneles
  const cerrarSesion = () => {
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden bg-background px-5 pb-6 pt-5">
      {/* Brillo verde detrás del logo */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-lime-400/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col">
        {/* Volver al sitio (no al historial: si se llegó desde el login, "atrás" sería el login) y estado de la cuenta */}
        <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(ultimaRutaPublica())}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-semibold text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </button>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
          activa ? "border-lime-500/40 bg-lime-400/10 text-lime-700 dark:text-lime-400" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${activa ? "bg-lime-500" : "bg-yellow-500"}`} aria-hidden="true" />
          {activa ? "Cuenta activa" : "Cuenta pendiente"}
        </span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          {/* Logo y saludo */}
          <div className="text-center">
            <img src="/logo.jpg" alt="" className="mx-auto h-20 w-20 rounded-2xl shadow-lg shadow-lime-500/20 ring-1 ring-lime-500/30" />
            <h1 className="mt-4 text-3xl font-black uppercase tracking-[0.3em] text-foreground">Bravos</h1>
            <p className="mt-3 text-base font-bold text-foreground">
              Hola{nombre ? `, ${nombre}` : ""} <span aria-hidden="true">👋</span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">¿A qué módulo querés ingresar?</p>
          </div>

          {/* Paneles */}
          <nav aria-label="Elegir módulo" className="mt-8 space-y-3">
            {disponibles.map((panel) => (
              <button
                key={panel.key}
                type="button"
                onClick={() => navigate(panel.href, { replace: true })}
                className={`group flex min-h-[76px] w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-lime-500/50 hover:bg-lime-400/5 active:scale-[0.98] ${FOCO}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-lime-500/30 bg-lime-400/10 text-lime-700 transition-colors group-hover:bg-lime-400/20 dark:text-lime-400">
                  <panel.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-foreground">{panel.label}</span>
                  <span className="block text-sm text-muted-foreground">{panel.descripcion}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
            {disponibles.length === 0 && (
              <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                Tu cuenta todavía no tiene un perfil asignado. El administrador del box te lo va a asignar pronto.
              </p>
            )}
          </nav>
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className={`mx-auto flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground/80 transition-colors hover:border-red-500/40 hover:text-red-700 dark:hover:text-red-400 ${FOCO}`}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
