import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { PlayCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import VideoPlayer from "@/components/VideoPlayer"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import apiClient from "@/api"

/**
 * "Ver rutina del día" de una reserva (diseño de la referencia "Ver rutina"):
 * - Desde 768 px: modal de 600 px con encabezado oscuro, X para cerrar y "Calcular mis %" + LISTO abajo.
 * - Celular (menos de 768 px): pantalla completa con flecha para volver y dos botones fijos abajo.
 * Los datos vienen de GET /reservas/:id/rutina, que solo responde si la reserva es del alumno.
 * Cada línea de la rutina es una fila numerada. Si un ejercicio tiene video, su botón de play lo abre debajo.
 */

function minutos(ini, fin) {
  if (!ini || !fin) return null
  const [h1, m1] = ini.split(":").map(Number)
  const [h2, m2] = fin.split(":").map(Number)
  const d = h2 * 60 + m2 - (h1 * 60 + m1)
  return d > 0 ? d : null
}

// El texto de la rutina puede venir en `contenido` o, en formato viejo, dentro de `descripcion` como JSON { desc, rutina }
function contenidoDe(rutina) {
  let contenido = rutina?.contenido || ""
  try {
    const p = JSON.parse(rutina?.descripcion || "")
    if (p && typeof p.rutina !== "undefined") contenido = p.rutina || ""
  } catch { /* texto plano: se usa `contenido` tal cual */ }
  return contenido
}

// Filas de la rutina: los renglones del texto del profesor (viñetas o párrafos).
// Si no hay texto, son los nombres de los ejercicios. Los ejercicios con video se unen a su renglón.
function lineasDe(rutina) {
  const ejercicios = Array.isArray(rutina?.ejercicios) ? rutina.ejercicios.filter((e) => e?.nombre) : []
  const div = document.createElement("div")
  div.innerHTML = sanitizarHtml(contenidoDe(rutina))
  const lis = [...div.querySelectorAll("li")]
  const bloques = lis.length ? lis : [...div.querySelectorAll("p, h1, h2, h3, h4")]
  const textos = (bloques.length ? bloques.map((b) => b.textContent) : (div.textContent || "").split("\n"))
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  if (!textos.length) return ejercicios.map((e) => ({ t: e.nombre, video: e.videoUrl || null }))

  const usados = new Set()
  const filas = textos.map((t) => {
    const e = ejercicios.find((x) => x.videoUrl && !usados.has(x) && x.nombre.trim().toLowerCase() === t.toLowerCase())
    if (e) usados.add(e)
    return { t, video: e?.videoUrl || null }
  })
  ejercicios.filter((e) => e.videoUrl && !usados.has(e)).forEach((e) => filas.push({ t: e.nombre, video: e.videoUrl }))
  return filas
}

// Un reserva por vez: al cambiar de reserva el componente se vuelve a montar y arranca limpio
function Contenido({ reserva, onClose }) {
  const sinId = !reserva.idReserva
  const [rutina, setRutina] = useState(undefined) // undefined = cargando, null = sin rutina
  const [error, setError] = useState(false)
  const [videoAbierto, setVideoAbierto] = useState(null) // índice de la fila con el video abierto

  useEffect(() => {
    if (sinId) return
    let vivo = true
    apiClient.get(`/reservas/${reserva.idReserva}/rutina`)
      .then((r) => { if (vivo) setRutina(r.data?.data ?? null) })
      .catch(() => { if (vivo) setError(true) })
    return () => { vivo = false }
  }, [reserva.idReserva, sinId])

  const datos = sinId ? null : rutina
  const filas = useMemo(() => lineasDe(datos), [datos])
  const cargando = !sinId && rutina === undefined && !error

  const fechaObj = new Date(`${reserva.fecha}T12:00:00`)
  const fecha = fechaObj.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "")
  const fechaTxt = fecha.charAt(0).toUpperCase() + fecha.slice(1)
  const anio = fechaObj.getFullYear()
  const dur = minutos(reserva.hora, reserva.horaFin)
  const coach = reserva.coach || "Staff Bravos"
  const nombre = datos?.categoria || reserva.clase || "Rutina"
  const videoActual = videoAbierto !== null ? filas[videoAbierto]?.video : null

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="bx top-0 left-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-bx-card p-0 text-bx-ink sm:max-w-none md:top-[50%] md:left-[50%] md:h-auto md:max-h-[42.5rem] md:w-[37.5rem] md:max-w-[37.5rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.25rem] md:border md:border-bx-line md:shadow-[0_1.5rem_3.75rem_rgba(0,0,0,.5)]"
      >
        <header className="relative shrink-0 overflow-hidden bg-[#0e0e0e] px-4 pb-5 pt-[calc(0.5rem+env(safe-area-inset-top))] text-[#ecefe4] md:px-7 md:pb-[1.625rem] md:pt-6">
          <img
            src="/bravos-logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-[58%] left-[30%] w-[27.5rem] -translate-y-1/2 -rotate-6 opacity-[.06] [filter:grayscale(1)_brightness(1.4)] md:top-1/2 md:left-auto md:-right-[3.75rem] md:w-[26.25rem]"
          />

          <div className="relative grid grid-cols-[2.75rem_1fr_2.75rem] items-center md:flex md:gap-3">
            <button type="button" onClick={onClose} aria-label="Volver a Mis reservas" className="grid h-11 w-11 place-items-center rounded-[0.625rem] md:hidden">
              <Ico d={IC.back} size={22} sw={2} />
            </button>
            <img src="/bravos-logo.png" alt="Bravos Box" className="h-6 w-auto justify-self-center md:h-[1.375rem] md:justify-self-start" />
            <span aria-hidden="true" className="md:flex-1" />
            <button type="button" onClick={onClose} aria-label="Cerrar rutina" className="-my-1.5 -mr-2.5 hidden h-11 w-11 place-items-center rounded-[0.625rem] hover:bg-[#1f1f1f] md:grid">
              <Ico d={IC.close} size={20} sw={2} />
            </button>
          </div>

          <p className="relative mt-[1.125rem] text-xs font-semibold tracking-[.1em] text-bx-lima md:mt-[1.375rem]">RUTINA DEL DÍA</p>
          <DialogTitle className="relative mt-1 text-[1.875rem] leading-[1.1] font-extrabold tracking-normal">{nombre}</DialogTitle>
          <DialogDescription className="relative mt-3 flex flex-wrap items-center gap-x-[1.125rem] gap-y-2 text-sm font-medium text-[#c9ccbf]">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Ico d={IC.cal} size={15} sw={1.9} className="text-bx-lima" />{fechaTxt}<span className="hidden md:inline"> {anio}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Ico d={IC.clock} size={15} sw={1.9} className="text-bx-lima" />{reserva.hora}{dur ? ` · ${dur} min` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Ico d={IC.user} size={15} sw={1.9} className="text-bx-lima" />Coach: {coach}
            </span>
          </DialogDescription>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="m-0 text-xs font-semibold tracking-[.1em] text-bx-muted">EJERCICIOS</h3>
            <span className="text-[0.8125rem] font-medium text-bx-muted">
              {cargando ? "Cargando…" : filas.length ? `${filas.length} ejercicios` : ""}
            </span>
          </div>

          {error ? (
            <p className="py-8 text-center text-sm text-bx-muted">No pudimos cargar la rutina. Probá de nuevo en un rato.</p>
          ) : cargando ? (
            <div aria-busy="true" aria-label="Cargando rutina" className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-[0.625rem] bg-bx-skeleton" />)}
            </div>
          ) : filas.length === 0 ? (
            <div className="rounded-[0.875rem] border border-dashed border-bx-btn-line px-5 py-8 text-center">
              <p className="m-0 text-base font-bold">El coach todavía no cargó la rutina</p>
              <p className="mt-1 mb-0 text-sm text-bx-muted">Te avisamos cuando esté lista.</p>
            </div>
          ) : (
            <>
              <ol className="m-0 flex list-none flex-col rounded-[0.875rem] border border-bx-line bg-bx-card py-2">
                {filas.map((f, i) => (
                  <li key={i} className="flex min-h-[2.875rem] items-center gap-3.5 px-3.5 py-1.5 md:min-h-11 md:px-4">
                    <span className="grid h-[1.875rem] w-[1.875rem] shrink-0 place-items-center rounded-lg bg-bx-tile text-sm font-extrabold text-bx-ok-fg md:h-7 md:w-7 md:text-[0.8125rem]">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-medium text-bx-ink md:text-sm">{f.t}</span>
                    {f.video && (
                      <button
                        type="button"
                        onClick={() => setVideoAbierto(videoAbierto === i ? null : i)}
                        aria-pressed={videoAbierto === i}
                        aria-label={`Ver video de ${f.t}`}
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${videoAbierto === i ? "text-bx-lima" : "text-bx-muted hover:text-bx-ok-fg"}`}
                      >
                        <PlayCircle className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              {videoActual && (
                <div className="mt-3">
                  {/* key: al cambiar de ejercicio se vuelve a montar el reproductor */}
                  <VideoPlayer key={videoAbierto} url={videoActual} label={`Ver video de ${filas[videoAbierto].t}`} />
                </div>
              )}
            </>
          )}
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2.5 border-t border-bx-line bg-bx-bg px-4 pt-3 pb-[calc(2.25rem+env(safe-area-inset-bottom))] md:flex md:items-center md:gap-3 md:bg-bx-card md:px-7 md:py-4 md:pb-4">
          <Link
            to="/alumno/calculadora-rm"
            className="flex h-[3.125rem] items-center justify-center gap-2 rounded-[0.625rem] border border-bx-btn-line text-sm font-bold text-bx-ink hover:border-bx-lima md:h-11 md:justify-start md:border-0 md:text-bx-ok-fg"
          >
            <Ico d={IC.calc} size={18} sw={1.9} />
            <span className="md:hidden">Calcular %</span>
            <span className="hidden md:inline">Calcular mis %</span>
          </Link>
          <span aria-hidden="true" className="hidden md:block md:flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="h-[3.125rem] rounded-[0.625rem] bg-bx-lima text-sm font-extrabold tracking-wide text-bx-negro hover:bg-bx-lima-hover md:h-11 md:px-6"
          >
            LISTO
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}

export default function PizarronRutina({ reserva, onClose }) {
  if (!reserva) return null
  return <Contenido key={reserva.idReserva ?? "sin-id"} reserva={reserva} onClose={onClose} />
}
