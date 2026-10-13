import { Link, useLocation } from "react-router-dom"
import { Sun, Moon, MonitorSmartphone, UserCog, ChevronRight, Check } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { BotonVolver } from "@/components/BotonVolver"
import ActivarNotificaciones from "@/components/ActivarNotificaciones"

/*
 * Mi configuración: preferencias de la persona (no del gimnasio). Se abre desde el menú del
 * perfil en cualquier panel: /alumno/configuracion, /profesor/configuracion o /mi-configuracion.
 */
const TEMAS = [
  { valor: "light", texto: "Claro", icono: Sun },
  { valor: "dark", texto: "Oscuro", icono: Moon },
  { valor: "system", texto: "Automático", icono: MonitorSmartphone },
]

function Seccion({ titulo, detalle, children }) {
  return (
    <section aria-label={titulo} className="space-y-2">
      <div className="px-1">
        <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-foreground/60">
          <span className="h-3 w-1 rounded-full bg-lime-400" aria-hidden="true" /> {titulo}
        </h2>
        {detalle && <p className="mt-1 text-xs text-foreground/50">{detalle}</p>}
      </div>
      {children}
    </section>
  )
}

export default function MiConfiguracionPage() {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const panel = pathname.startsWith("/alumno") ? "alumno" : pathname.startsWith("/profesor") ? "profesor" : "general"
  const rutaPerfil = panel === "alumno" ? "/alumno/perfil" : panel === "profesor" ? "/profesor/perfil" : "/perfil"
  const inicioPanel = panel === "alumno" ? "/alumno" : panel === "profesor" ? "/profesor" : "/admin"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* El panel de alumno ya muestra su "Volver" en el celular */}
      {panel !== "alumno" && <BotonVolver a={inicioPanel} texto="Volver" />}

      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">Mi configuración</h1>
        <p className="mt-1 text-sm text-foreground/60">Tus preferencias en este dispositivo.</p>
      </div>

      <Seccion titulo="Avisos en el celular" detalle="Clases canceladas, pagos acreditados, vencimientos y más, aunque la app esté cerrada.">
        <ActivarNotificaciones variante="tarjeta" />
      </Seccion>

      <Seccion titulo="Apariencia">
        <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
          {TEMAS.map(({ valor, texto, icono: Icono }) => {
            const elegido = theme === valor
            return (
              <button key={valor} type="button" role="radio" aria-checked={elegido} onClick={() => setTheme(valor)}
                className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                  elegido ? "border-lime-500 bg-lime-400/10 text-foreground" : "border-border bg-card text-foreground/65 hover:border-foreground/30"
                }`}>
                {elegido && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-lime-400 text-black">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                <Icono className={`h-5 w-5 ${elegido ? "text-lime-700 dark:text-lime-400" : ""}`} aria-hidden="true" />
                {texto}
              </button>
            )
          })}
        </div>
        <p className="px-1 text-xs text-foreground/50">"Automático" sigue el modo claro u oscuro de tu celular.</p>
      </Seccion>

      <Seccion titulo="Cuenta">
        <Link to={rutaPerfil}
          className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-border bg-card px-4 transition-colors hover:border-lime-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400">
            <UserCog className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-foreground">Mi perfil y contraseña</span>
            <span className="block truncate text-xs text-foreground/55">Tus datos, tu foto y el cambio de contraseña</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-foreground/35" aria-hidden="true" />
        </Link>
      </Seccion>
    </div>
  )
}
