import { useEffect, useState } from "react"
import { Dumbbell, Loader2, PlayCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import VideoPlayer from "@/components/VideoPlayer"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import apiClient from "@/api"
import { Cargando } from '@/components/Cargando'

/**
 * "Pizarrón digital": la rutina de la clase de una reserva, en versión compacta para que el
 * alumno la vea entera en una pantalla, sin hacer scroll.
 * Los datos vienen de GET /reservas/:id/rutina, que solo responde si la reserva es del alumno.
 * El profesor escribe la rutina como texto libre: los títulos que use quedan como encabezados
 * cortos y las viñetas se acomodan en dos columnas.
 */

const HTML_COMPACTO = [
  "text-sm leading-snug text-foreground/90",
  // Títulos de bloque: chicos, en verde, con una línea arriba (salvo el primero)
  "[&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-3 [&_h4]:mt-3",
  "[&_h1]:border-t [&_h2]:border-t [&_h3]:border-t [&_h4]:border-t [&_h1]:border-border [&_h2]:border-border [&_h3]:border-border [&_h4]:border-border",
  "[&_h1]:pt-2 [&_h2]:pt-2 [&_h3]:pt-2 [&_h4]:pt-2",
  "[&>:first-child]:mt-0 [&>:first-child]:border-0 [&>:first-child]:pt-0",
  "[&_h1]:text-xs [&_h2]:text-xs [&_h3]:text-xs [&_h4]:text-xs [&_h1]:font-black [&_h2]:font-black [&_h3]:font-black [&_h4]:font-black",
  "[&_h1]:uppercase [&_h2]:uppercase [&_h3]:uppercase [&_h4]:uppercase [&_h1]:tracking-widest [&_h2]:tracking-widest [&_h3]:tracking-widest [&_h4]:tracking-widest",
  "[&_h1]:text-lime-700 [&_h2]:text-lime-700 [&_h3]:text-lime-700 [&_h4]:text-lime-700 dark:[&_h1]:text-lime-400 dark:[&_h2]:text-lime-400 dark:[&_h3]:text-lime-400 dark:[&_h4]:text-lime-400",
  "[&_p]:mt-1 [&_strong]:font-bold [&_strong]:text-foreground",
  // Viñetas en dos columnas, con un punto verde
  "[&_ul]:mt-1 [&_ul]:grid [&_ul]:grid-cols-2 [&_ul]:gap-x-3 [&_ul]:gap-y-0.5 [&_ul]:pl-0 [&_ul]:list-none",
  "[&_ul>li]:relative [&_ul>li]:pl-3 [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55em] [&_ul>li]:before:h-1.5 [&_ul>li]:before:w-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-lime-500",
  // Listas numeradas en una columna (suelen ser el WOD, con detalle)
  "[&_ol]:mt-1 [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_ol]:pl-5 [&_ol>li]:marker:font-black [&_ol>li]:marker:text-lime-600",
].join(" ")

function minutos(ini, fin) {
  if (!ini || !fin) return null
  const [h1, m1] = ini.split(":").map(Number)
  const [h2, m2] = fin.split(":").map(Number)
  const d = h2 * 60 + m2 - (h1 * 60 + m1)
  return d > 0 ? d : null
}

// La nota del profesor puede venir con etiquetas HTML: se pasa a texto para mostrarla en una línea
const textoPlano = (html) => {
  const div = document.createElement("div")
  div.innerHTML = sanitizarHtml(html || "")
  return (div.textContent || "").replace(/\s+/g, " ").trim()
}

export default function PizarronRutina({ reserva, onClose }) {
  const [rutina, setRutina] = useState(undefined) // undefined = cargando, null = sin rutina
  const [error, setError] = useState(false)
  const [video, setVideo] = useState(null) // ejercicio con el video abierto

  useEffect(() => {
    if (!reserva) return
    let vivo = true
    apiClient.get(`/reservas/${reserva.idReserva}/rutina`)
      .then((r) => { if (vivo) setRutina(r.data?.data ?? null) })
      .catch(() => { if (vivo) setError(true) })
    return () => { vivo = false }
  }, [reserva])

  const cerrar = () => { onClose(); setRutina(undefined); setError(false); setVideo(null) }
  if (!reserva) return null

  const fecha = new Date(`${reserva.fecha}T12:00:00`).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "")
  const duracion = minutos(reserva.hora, reserva.horaFin)
  const coach = reserva.coach || "Staff Bravos"
  const nota = rutina?.descripcion ? textoPlano(rutina.descripcion) : ""
  const titulo = rutina?.categoria || reserva.tipo || "Rutina"

  return (
    <Dialog open onOpenChange={(o) => { if (!o) cerrar() }}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:border"
      >
        {/* Encabezado en dos líneas: clase y fecha / coach y nota */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-black uppercase leading-tight tracking-tight text-foreground">
                <span className="text-lime-700 dark:text-lime-400">{titulo}</span> · {reserva.clase}
              </DialogTitle>
              <p className="mt-0.5 text-xs font-semibold capitalize text-foreground/65">
                {fecha} · {reserva.hora} h{duracion ? ` · ${duracion}'` : ""}{rutina?.nivel ? ` · ${rutina.nivel}` : ""}
              </p>
            </div>
            <button type="button" onClick={cerrar} aria-label="Cerrar rutina"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="mt-1.5 line-clamp-2 text-xs text-foreground/70">
            <span className="font-bold text-foreground">Coach {coach}</span>
            {nota && <> · <span className="italic">“{nota}”</span></>}
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error ? (
            <p className="py-8 text-center text-sm text-foreground/60">No pudimos cargar la rutina. Probá de nuevo en un rato.</p>
          ) : rutina === undefined ? (
            <Cargando filas={3} className="py-4" />
          ) : rutina === null || (!rutina.contenido && !rutina.ejercicios?.length) ? (
            <div className="py-8 text-center">
              <Dumbbell className="mx-auto h-8 w-8 text-foreground/30" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-foreground">Todavía no hay rutina</p>
              <p className="mt-1 text-xs text-foreground/60">El profesor aún no cargó la rutina de esta clase.</p>
            </div>
          ) : (
            <>
              {rutina.contenido && (
                <div className={HTML_COMPACTO} dangerouslySetInnerHTML={{ __html: sanitizarHtml(rutina.contenido) }} />
              )}

              {/* Ejercicios con video: una fila de chips; el video se abre debajo */}
              {rutina.ejercicios?.length > 0 && (
                <div className={rutina.contenido ? "mt-3 border-t border-border pt-2" : ""}>
                  <p className="text-xs font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Ejercicios</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {rutina.ejercicios.map((e, i) => (
                      e.videoUrl ? (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setVideo(video === i ? null : i)}
                          aria-pressed={video === i}
                          className={`flex min-h-[36px] items-center gap-1 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                            video === i ? "border-lime-400 bg-lime-400 text-black" : "border-lime-500/40 text-foreground"
                          }`}
                        >
                          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> {i + 1}. {e.nombre}
                        </button>
                      ) : (
                        <span key={i} className="flex min-h-[36px] items-center rounded-full border border-border px-3 text-xs font-bold text-foreground/80">
                          {i + 1}. {e.nombre}
                        </span>
                      )
                    ))}
                  </div>
                  {video !== null && rutina.ejercicios[video]?.videoUrl && (
                    <div className="mt-2">
                      {/* key: al cambiar de ejercicio se vuelve a montar el reproductor */}
                      <VideoPlayer key={video} url={rutina.ejercicios[video].videoUrl} label={`Ver video de ${rutina.ejercicios[video].nombre}`} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
