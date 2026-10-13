import { useEffect, useState } from "react"
import { BellRing, BellOff, Loader2, Smartphone } from "lucide-react"
import { estadoPush, activarPush, desactivarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"

/*
 * Pie de la campanita: activar o desactivar los avisos en el celular (notificaciones push) para
 * este dispositivo. Cada persona elige; el permiso se pide solo cuando toca el botón.
 */
// variante: "pie" (al final de la campanita) o "tarjeta" (en Mi configuración)
export default function ActivarNotificaciones({ variante = "pie" }) {
  const [estado, setEstado] = useState(null)
  const [trabajando, setTrabajando] = useState(false)

  useEffect(() => {
    let vigente = true
    estadoPush().then((e) => { if (vigente) setEstado(e) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  // Sin service worker (por ejemplo, en desarrollo) o navegador sin soporte: no se muestra nada
  if (!estado || estado === "sin-app" || estado === "no-soportado") {
    // En Mi configuración se explica por qué no aparece la opción
    if (variante !== "tarjeta" || !estado) return null
    return (
      <p className="rounded-2xl border border-border bg-card px-4 py-3 text-xs leading-relaxed text-foreground/60">
        {estado === "sin-app"
          ? "Los avisos funcionan con la app instalada: agregala a la pantalla de inicio desde el navegador."
          : "Este navegador no permite recibir avisos."}
      </p>
    )
  }

  const cambiar = async (activar) => {
    setTrabajando(true)
    try {
      if (activar) await activarPush()
      else await desactivarPush()
      toast.success(activar ? "Avisos activados en este dispositivo" : "Avisos desactivados en este dispositivo")
    } catch (err) {
      toast.error(activar ? "No se pudieron activar los avisos" : "No se pudieron desactivar los avisos", {
        description: err.response?.data?.message || err.message,
      })
    } finally {
      setEstado(await estadoPush().catch(() => estado))
      setTrabajando(false)
    }
  }

  const pie = variante === "tarjeta"
    ? "flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
    : "flex items-start gap-3 border-t border-border bg-muted/30 px-4 py-3"

  if (estado === "instalar-ios") {
    return (
      <div className={pie}>
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-foreground/70">
          Para recibir avisos en el iPhone, instalá la app: en Safari, <strong>Compartir → Agregar a inicio</strong>, y abrila desde el ícono.
        </p>
      </div>
    )
  }

  if (estado === "bloqueadas") {
    return (
      <div className={pie}>
        <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-foreground/70">
          Los avisos están bloqueados en este navegador. Para recibirlos, permitilos en la configuración del sitio y volvé a abrir la app.
        </p>
      </div>
    )
  }

  const activas = estado === "activas"

  // En Mi configuración: fila con interruptor (como el de modo oscuro), toda la fila se puede tocar
  if (variante === "tarjeta") {
    return (
      <button type="button" role="switch" aria-checked={activas} onClick={() => cambiar(!activas)} disabled={trabajando}
        className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left transition-colors hover:border-lime-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:opacity-70">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activas ? "bg-lime-400/15 text-lime-700 dark:text-lime-400" : "bg-foreground/5 text-foreground/50"}`}>
          {activas ? <BellRing className="h-5 w-5" aria-hidden="true" /> : <BellOff className="h-5 w-5" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-foreground">Avisos en este dispositivo</span>
          <span className="block text-xs text-foreground/55">{trabajando ? "Guardando…" : activas ? "Activados" : "Desactivados"}</span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${activas ? "bg-lime-400" : "bg-foreground/15"}`} aria-hidden="true">
          <span className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-all ${activas ? "left-[22px]" : "left-0.5"}`}>
            {trabajando && <Loader2 className="h-3.5 w-3.5 animate-spin text-black/60" />}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className={`${pie} items-center`}>
      {activas
        ? <BellRing className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
        : <BellOff className="h-4 w-4 shrink-0 text-foreground/50" aria-hidden="true" />}
      <p className="flex-1 text-[11px] leading-snug text-foreground/70">
        {activas ? "Avisos en este dispositivo: activados" : "Recibí los avisos en este dispositivo, aunque la app esté cerrada"}
      </p>
      <button
        type="button"
        onClick={() => cambiar(!activas)}
        disabled={trabajando}
        className={`flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-black uppercase tracking-wide transition-colors disabled:opacity-50 ${
          activas ? "border border-border text-foreground/70 hover:border-foreground/30" : "bg-lime-400 text-black hover:bg-lime-300"
        }`}
      >
        {trabajando && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        {activas ? "Desactivar" : "Activar"}
      </button>
    </div>
  )
}
