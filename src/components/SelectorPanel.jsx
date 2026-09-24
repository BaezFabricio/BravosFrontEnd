import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronDown } from "lucide-react"
import { PANELES, panelesPermitidos } from "@/lib/paneles"

/**
 * Muestra en qué panel (rol) está la persona y, si tiene permisos para más de uno,
 * deja abrir un selector para cambiar de panel sin pasar por la pantalla de elección.
 * Va en el encabezado, al lado del botón de modo claro / oscuro.
 */
export default function SelectorPanel({ actual }) {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  const permitidos = panelesPermitidos()
  const disponibles = PANELES.filter((p) => permitidos[p.key])
  const panelActual = PANELES.find((p) => p.key === actual)
  const variosPaneles = disponibles.length > 1

  // Cierra al tocar fuera o con Esc
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    const tecla = (e) => { if (e.key === "Escape") setAbierto(false) }
    document.addEventListener("mousedown", fuera)
    document.addEventListener("touchstart", fuera)
    document.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("touchstart", fuera)
      document.removeEventListener("keydown", tecla)
    }
  }, [abierto])

  if (!panelActual) return null
  const Icono = panelActual.icon

  const etiqueta = (
    <>
      <Icono className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" />
      <span className="hidden sm:inline">{panelActual.label}</span>
    </>
  )
  const claseBase =
    "flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs font-bold uppercase tracking-wide text-foreground"

  // Un solo panel: solo indica el rol, no se puede abrir
  if (!variosPaneles) {
    return (
      <div className={claseBase} title={`Panel de ${panelActual.label}`}>
        {etiqueta}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Panel actual: ${panelActual.label}. Cambiar de panel`}
        className={`${claseBase} transition-colors hover:border-lime-400/60 hover:bg-lime-400/5`}
      >
        {etiqueta}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
      </button>

      <div
        role="menu"
        aria-hidden={!abierto}
        className={`fixed inset-x-3 top-[4.25rem] w-auto sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-60 z-50 origin-top-right overflow-hidden rounded-xl border border-border bg-card shadow-xl transition-all duration-200 ease-out ${
          abierto ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <p className="border-b border-border px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Cambiar de panel
        </p>
        {disponibles.map((panel) => {
          const esActual = panel.key === actual
          const IconoPanel = panel.icon
          return (
            <button
              key={panel.key}
              type="button"
              role="menuitem"
              tabIndex={abierto ? 0 : -1}
              onClick={() => {
                setAbierto(false)
                if (!esActual) navigate(panel.href)
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                esActual ? "bg-lime-400/10" : "hover:bg-foreground/5"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
                <IconoPanel className="h-4 w-4 text-lime-700 dark:text-lime-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{panel.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{panel.descripcion}</span>
              </span>
              {esActual && <Check className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
