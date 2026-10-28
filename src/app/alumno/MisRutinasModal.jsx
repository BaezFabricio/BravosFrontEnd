import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarClock, ChevronDown, Dumbbell, Maximize2, Minimize2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import VideoPlayer from "@/components/VideoPlayer"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import apiClient from "@/api"
import { Cargando } from '@/components/Cargando'

/**
 * Modal "Mis rutinas": las próximas clases que reservó el alumno, cada una con la rutina
 * que cargó el profesor. Los datos vienen de GET /reservas/mis-rutinas, que solo devuelve
 * clases reservadas por quien inició sesión.
 */

/*
 * Protección de la rutina (contenido solo para quienes pagan su membresía). En una página web NO se puede impedir
 * una captura de pantalla (eso solo existe en apps nativas), así que se hace lo que sí se puede:
 *  - marca de agua con el nombre y el correo de quien está mirando: si la rutina se filtra, se sabe de quién salió;
 *  - se bloquea seleccionar, copiar, arrastrar, el menú del botón derecho y la impresión.
 * El servidor, además, solo entrega la rutina de clases que la persona reservó (ver reservas.controller).
 */
function marcaDeAgua() {
  let texto = ""
  try {
    const u = JSON.parse(localStorage.getItem("usuario") || "{}")
    texto = [u.nombrecompleto, u.correo].filter(Boolean).join(" · ")
  } catch { /* sin nombre: queda solo la marca de la app */ }
  const limpio = (texto || "Bravos Box").replace(/[<>&"']/g, "")
  const w = Math.max(300, limpio.length * 9 + 80), h = Math.round(w * 0.65) // ancho según el largo del texto, para que no se corte
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h / 2}" fill="rgba(128,128,128,0.2)" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle" transform="rotate(-28 ${w / 2} ${h / 2})">${limpio}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const bloquear = (e) => e.preventDefault()

const HTML_RUTINA = "text-sm text-foreground/80 [&_li]:mt-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"

function fechaClase(fecha, hora) {
  const d = new Date(`${fecha}T12:00:00`)
  const hoy = new Date(); hoy.setHours(12, 0, 0, 0)
  const dias = Math.round((d - hoy) / 86400000)
  const dia = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
  return `${dia} · ${String(hora || "").slice(0, 5)}`
}

function TarjetaClase({ clase, abiertaAlInicio }) {
  const [abierta, setAbierta] = useState(abiertaAlInicio)
  const r = clase.rutina
  const id = `rutina-${clase.idReserva}`

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-controls={id}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-500"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${r ? "bg-lime-400/15 text-lime-700 dark:text-lime-400" : "bg-foreground/5 text-foreground/40"}`}>
          <Dumbbell className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground">{clase.nombreClase}</span>
          <span className="block text-xs capitalize text-foreground/60">{fechaClase(clase.fecha, clase.horaInicio)}</span>
        </span>
        {!r && <span className="shrink-0 text-[10px] font-bold uppercase text-foreground/45">Sin rutina</span>}
        <ChevronDown className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform ${abierta ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {abierta && (
        <div id={id} className="space-y-3 border-t border-border px-4 py-3">
          {clase.nombreProfesor && <p className="text-xs text-foreground/60">Profesor: <span className="font-semibold text-foreground/80">{clase.nombreProfesor}</span></p>}
          {!r ? (
            <p className="text-sm text-foreground/60">El profesor todavía no cargó la rutina de esta clase. Volvé a mirar más cerca del día.</p>
          ) : (
            <>
              {(r.categoria || r.nivel) && (
                <div className="flex flex-wrap gap-1.5">
                  {r.categoria && <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400">{r.categoria}</span>}
                  {r.nivel && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-foreground/70">{r.nivel}</span>}
                </div>
              )}
              {r.descripcion && <div className={HTML_RUTINA} dangerouslySetInnerHTML={{ __html: sanitizarHtml(r.descripcion) }} />}
              {r.contenido && (
                <div className={`rounded-lg border border-border bg-foreground/[0.03] p-3 ${HTML_RUTINA}`} dangerouslySetInnerHTML={{ __html: sanitizarHtml(r.contenido) }} />
              )}
              {r.ejercicios?.length > 0 && (
                <ol className="space-y-2">
                  {r.ejercicios.map((e, i) => (
                    <li key={i} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">{i + 1}. {e.nombre}</p>
                      {e.videoUrl && <div className="mt-1.5"><VideoPlayer url={e.videoUrl} /></div>}
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}

export default function MisRutinasModal({ open, onOpenChange }) {
  const [clases, setClases] = useState(null)
  const [error, setError] = useState(false)
  const [completa, setCompleta] = useState(false)
  const [marca] = useState(marcaDeAgua)

  // Se pide cada vez que se abre, así refleja reservas y rutinas recién cargadas
  useEffect(() => {
    if (!open) return
    let vivo = true
    apiClient.get("/reservas/mis-rutinas")
      .then((r) => { if (vivo) { setClases(r.data?.data || []); setError(false) } })
      .catch(() => { if (vivo) setError(true) })
    return () => { vivo = false }
  }, [open])

  const cerrarYLimpiar = (v) => {
    onOpenChange(v)
    if (!v) { setClases(null); setError(false); setCompleta(false) }
  }

  return (
    <Dialog open={open} onOpenChange={cerrarYLimpiar}>
      {/* Tamaño normal, o pantalla completa (botón de arriba) para leer la rutina como una pestaña exclusiva */}
      <DialogContent className={`flex flex-col gap-0 overflow-hidden border-border bg-background p-0 ${
        completa
          ? "left-0 top-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none"
          : "max-h-[85vh] sm:max-w-lg"
      }`}>
        <DialogHeader className="border-b border-border px-5 pb-3 pt-5 pr-24 text-left">
          <DialogTitle className="text-lg font-black uppercase tracking-tight">Mis rutinas</DialogTitle>
          <DialogDescription className="text-xs">Las rutinas de las clases que tenés reservadas.</DialogDescription>
        </DialogHeader>
        <button
          type="button"
          onClick={() => setCompleta((v) => !v)}
          aria-label={completa ? "Salir de pantalla completa" : "Ver en pantalla completa"}
          title={completa ? "Salir de pantalla completa" : "Pantalla completa"}
          className="absolute right-12 top-3.5 flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          {completa ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
        </button>

        <div className="relative flex min-h-0 flex-1 flex-col print:hidden">
        <div
          className="flex-1 select-none overflow-y-auto px-4 py-4 [-webkit-touch-callout:none]"
          onContextMenu={bloquear} onCopy={bloquear} onCut={bloquear} onDragStart={bloquear}
        >
          {error ? (
            <p className="py-8 text-center text-sm text-foreground/60">No pudimos cargar tus rutinas. Probá de nuevo en un rato.</p>
          ) : clases === null ? (
            <Cargando filas={3} className="py-4" />
          ) : clases.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CalendarClock className="h-10 w-10 text-foreground/30" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-foreground">No tenés clases reservadas</p>
              <p className="mt-1 text-xs text-foreground/60">Cuando reserves una clase, vas a ver acá su rutina.</p>
              <Link
                to="/alumno/reservar"
                onClick={() => cerrarYLimpiar(false)}
                className="mt-4 flex min-h-[44px] items-center rounded-xl bg-lime-400 px-5 text-xs font-black uppercase tracking-wider text-black"
              >
                Reservar clase
              </Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {/* La próxima clase se muestra abierta; las demás, plegadas */}
              {clases.map((c, i) => <TarjetaClase key={c.idReserva} clase={c} abiertaAlInicio={i === 0} />)}
            </ul>
          )}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ backgroundImage: marca }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
