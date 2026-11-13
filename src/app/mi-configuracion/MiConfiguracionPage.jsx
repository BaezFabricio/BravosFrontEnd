import { Link, useLocation } from "react-router-dom"
import { Sparkles, Check, ChevronRight } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { BotonVolver } from "@/components/BotonVolver"
import ActivarNotificaciones from "@/components/ActivarNotificaciones"
import InstalarApp from "@/components/InstalarApp"
import { TituloPagina } from "@/components/TituloPagina"

/*
 * Mi configuración (Preferencias): preferencias de la persona (no del gimnasio). Se abre desde el menú del
 * perfil en cualquier panel: /alumno/configuracion, /profesor/configuracion o /mi-configuracion.
 */
const TEMAS = [
  { valor: "light", texto: "Claro", detalle: "Siempre claro" },
  { valor: "dark", texto: "Oscuro", detalle: "Siempre oscuro" },
  { valor: "system", texto: "Automático", detalle: "Como tu equipo" },
]

// Vista previa de cada tema: solo ilustra el modo, no muestra datos
function VistaTema({ valor }) {
  const claro = valor === "light"
  const oscuro = valor === "dark"
  return (
    <div className="flex h-[70px] overflow-hidden rounded-[10px] border border-[#2a2a2a]" aria-hidden="true">
      <div className={`flex flex-1 flex-col justify-center gap-[7px] px-3 ${oscuro ? "bg-[#111]" : "bg-[#f6f6f1]"} ${valor === "system" ? "bg-[#f6f6f1]" : ""}`}>
        <span className={`h-[3px] w-[60%] rounded ${oscuro ? "bg-[#ecefe4]" : "bg-[#141510]"}`} />
        <span className="h-[3px] w-[35%] rounded bg-[#9be600]" />
      </div>
      <div className={`flex flex-1 flex-col justify-center gap-[7px] px-3 ${claro ? "bg-[#0b0b0b]" : "bg-[#111]"} ${valor === "system" ? "bg-[#111]" : ""}`}>
        <span className={`h-[3px] w-[60%] rounded ${claro ? "bg-[#ecefe4]" : "bg-[#ecefe4]"}`} />
        <span className="h-[3px] w-[35%] rounded bg-[#9be600]" />
      </div>
    </div>
  )
}

export default function MiConfiguracionPage() {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const panel = pathname.startsWith("/alumno") ? "alumno" : pathname.startsWith("/profesor") ? "profesor" : "general"
  const rutaPerfil = panel === "alumno" ? "/alumno/perfil" : panel === "profesor" ? "/profesor/perfil" : "/perfil"
  const inicioPanel = panel === "alumno" ? "/alumno" : panel === "profesor" ? "/profesor" : "/admin"

  return (
    <div className="space-y-6">
      {/* El panel de alumno ya muestra su "Volver" en el celular */}
      {panel !== "alumno" && <BotonVolver a={inicioPanel} texto="Volver" />}

      <div>
        <TituloPagina descripcion={"Cómo se ve la app y qué avisos te llegan en este equipo"}>Preferencias</TituloPagina>
      </div>

      <div className="flex w-full flex-col gap-8 lg:w-[920px]">
        {/* Apariencia */}
        <section aria-labelledby="pref-apariencia" className="space-y-4">
          <div>
            <h2 id="pref-apariencia" className="text-xl font-extrabold text-foreground">Apariencia</h2>
            <p className="mt-1 text-sm text-muted-foreground">Se guarda en este equipo.</p>
          </div>
          <div role="radiogroup" aria-labelledby="pref-apariencia" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TEMAS.map(({ valor, texto, detalle }) => {
              const elegido = theme === valor
              return (
                <button key={valor} type="button" role="radio" aria-checked={elegido} onClick={() => setTheme(valor)}
                  className={`relative flex flex-col gap-4 rounded-2xl border bg-card p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    elegido ? "border-lime-400" : "border-border hover:border-foreground/30"
                  }`}>
                  <VistaTema valor={valor} />
                  <span className="flex items-center justify-between gap-2">
                    <span>
                      <span className="block text-[15px] font-extrabold text-foreground">{texto}</span>
                      <span className="block text-[13px] text-muted-foreground">{detalle}</span>
                    </span>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${elegido ? "border-lime-400 bg-lime-400 text-[#0b0b0b]" : "border-border"}`} aria-hidden="true">
                      {elegido && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Avisos en este equipo */}
        <section aria-labelledby="pref-avisos" className="space-y-4">
          <div>
            <h2 id="pref-avisos" className="text-xl font-extrabold text-foreground">Avisos en este equipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Te llegan aunque tengas la app cerrada.</p>
          </div>
          <ActivarNotificaciones variante="tarjeta" />
        </section>

        {/* Instalación */}
        <section aria-labelledby="pref-celular" className="space-y-4">
          <div>
            <h2 id="pref-celular" className="text-xl font-extrabold text-foreground">Bravos en tu celular</h2>
            <p className="mt-1 text-sm text-muted-foreground">Para Android y iPhone. Es lo primero para poder recibir avisos.</p>
          </div>
          <InstalarApp />
        </section>

        {/* Enlace a Mi perfil */}
        <Link to={rutaPerfil} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-lime-700 no-underline hover:text-lime-600 dark:text-lime-400 dark:hover:text-[#c4ff3d]">
          Tus datos, tu foto y tu contraseña están en Mi perfil <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        {/* La guía de bienvenida de Bravo, para volver a verla (por ahora la del alumno) */}
        {panel === "alumno" && (
          <section aria-labelledby="pref-ayuda" className="space-y-4">
            <div>
              <h2 id="pref-ayuda" className="text-xl font-extrabold text-foreground">Ayuda</h2>
            </div>
            <button type="button"
              onClick={() => { try { sessionStorage.setItem("bravos-guia-repetir", "bienvenida") } catch { /* nada */ } window.dispatchEvent(new CustomEvent("bravos:abrir-guia", { detail: "bienvenida" })) }}
              className="flex min-h-[4rem] w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left transition-colors hover:border-lime-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">Ver la guía de bienvenida</span>
                <span className="block truncate text-xs text-muted-foreground">Bravo te muestra cómo usar la app</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
