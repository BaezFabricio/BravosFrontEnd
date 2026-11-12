import { useEffect, useState } from "react"
import { CalendarDays, CheckCircle2, Clock, Dumbbell, ExternalLink, Layers, User, Users, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import apiClient from "@/api"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import { Cargando } from "@/components/Cargando"

/*
 * Detalle de una clase realizada (historial de Gestión de Clases): datos de la clase, la rutina con sus ejercicios y
 * quiénes reservaron y cómo terminó cada reserva. Solo lectura.
 */

const fechaLarga = (f) => (f ? new Date(`${String(f).slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—")
const hora = (h) => (h ? String(h).slice(0, 5) : "")

// La descripción de la rutina puede ser JSON { desc, rutina } (texto enriquecido) o texto plano (formato viejo)
function partesDeRutina(rutina) {
  let desc = rutina.descripcion || ""
  let contenido = rutina.contenido || ""
  try {
    const p = JSON.parse(rutina.descripcion || "")
    if (p && typeof p.rutina !== "undefined") { desc = p.desc || ""; contenido = p.rutina || "" }
  } catch { /* texto plano o HTML sin JSON: se muestra tal cual */ }
  return { desc, contenido }
}

// Cómo terminó cada reserva
function estadoDeReserva(r) {
  if (r.estadoReserva === "cancelada") return { texto: "Canceló", clase: "border-foreground/15 bg-foreground/5 text-foreground/55", Icono: XCircle }
  if (r.asistencia === "presente") return { texto: "Asistió", clase: "border-lime-500/40 bg-lime-400/10 text-lime-700 dark:text-lime-400", Icono: CheckCircle2 }
  if (r.asistencia === "ausente") return { texto: "No asistió", clase: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400", Icono: XCircle }
  return { texto: "Sin registrar", clase: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", Icono: Clock }
}

function Dato({ icono: Icono, etiqueta, valor }) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-foreground/[0.03] px-3 py-2.5">
      <Icono className="mt-0.5 h-4 w-4 shrink-0 text-foreground/45" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[0.625rem] font-black uppercase tracking-widest text-foreground/50">{etiqueta}</p>
        <p className="text-sm font-semibold text-foreground">{valor}</p>
      </div>
    </div>
  )
}

export default function DetalleClaseDialog({ clase, onCerrar }) {
  const [detalle, setDetalle] = useState(null) // { clase, rutina }
  const [asistentes, setAsistentes] = useState(null) // null: cargando; false: no disponible
  const [error, setError] = useState(false)
  const id = clase?.idClase

  useEffect(() => {
    if (!id) return undefined
    let vigente = true
    Promise.allSettled([apiClient.get(`/clases/${id}`), apiClient.get(`/clases/${id}/asistentes`)]).then(([c, a]) => {
      if (!vigente) return
      if (c.status === "fulfilled") {
        const d = c.value.data?.data || c.value.data
        setDetalle({ clase: d, rutina: d?.rutina || null })
      } else {
        setError(true)
      }
      // Sin permiso de Reservas (o servidor sin actualizar): no se muestra esa parte, el resto sí
      setAsistentes(a.status === "fulfilled" ? (a.value.data?.data || []) : false)
    })
    return () => { vigente = false }
  }, [id])

  const abierta = !!clase
  const d = detalle?.clase
  const rutina = detalle?.rutina
  const partes = rutina ? partesDeRutina(rutina) : null
  const lista = Array.isArray(asistentes) ? asistentes : []
  const activas = lista.filter((r) => r.estadoReserva !== "cancelada")
  const asistieron = lista.filter((r) => r.asistencia === "presente").length
  const ausentes = lista.filter((r) => r.asistencia === "ausente").length
  const canceladas = lista.length - activas.length

  return (
    <Dialog open={abierta} onOpenChange={(o) => { if (!o) onCerrar() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-black uppercase tracking-tight">
            {clase?.nombreClase}
            <span className="rounded-md bg-lime-400/15 px-1.5 py-0.5 text-[0.5625rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Realizada</span>
          </DialogTitle>
          <DialogDescription>{clase ? `${fechaLarga(clase.fechaEspecifica)}${clase.horaInicio ? ` · ${hora(clase.horaInicio)}${clase.horaFin ? ` a ${hora(clase.horaFin)}` : ""}` : ""}` : ""}</DialogDescription>
        </DialogHeader>

        {!detalle && !error && <Cargando filas={3} className="py-2" />}
        {error && <p className="py-6 text-center text-sm text-foreground/60">No se pudo cargar el detalle de la clase. Probá de nuevo en un momento.</p>}

        {detalle && (
          <div className="space-y-5">
            <div className="grid gap-2 sm:grid-cols-2">
              <Dato icono={User} etiqueta="Coach" valor={d?.nombreProfesor || clase?.nombreProfesor} />
              <Dato icono={Layers} etiqueta="Tipo de clase" valor={d?.nombreTipo || d?.tipoPlan} />
              <Dato icono={CalendarDays} etiqueta="Fecha" valor={fechaLarga(d?.fechaEspecifica || clase?.fechaEspecifica)} />
              <Dato icono={Clock} etiqueta="Horario" valor={d?.horaInicio ? `${hora(d.horaInicio)} a ${hora(d.horaFin)}${d.turno ? ` · ${d.turno}` : ""}` : ""} />
              <Dato icono={Users} etiqueta="Cupo" valor={d?.cupoMaximo ? `${d.cupoMaximo} lugares` : ""} />
              {d?.fechaPublicacion && <Dato icono={CalendarDays} etiqueta="Publicada" valor={new Date(d.fechaPublicacion).toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />}
            </div>

            {/* Rutina */}
            <section aria-labelledby="det-rutina">
              <h3 id="det-rutina" className="mb-2 flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-widest text-foreground/60">
                <Dumbbell className="h-4 w-4" aria-hidden="true" /> Rutina
              </h3>
              {!rutina ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-foreground/55">Esta clase no tuvo una rutina cargada.</p>
              ) : (
                <div className="space-y-3 rounded-xl border border-border bg-foreground/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {rutina.nombre && <p className="text-sm font-black text-foreground">{rutina.nombre}</p>}
                    {rutina.categoria && <span className="rounded-full border border-border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-foreground/65">{rutina.categoria}</span>}
                    {rutina.nivel && <span className="rounded-full border border-border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-foreground/65">Nivel {rutina.nivel}</span>}
                    {rutina.duracion && <span className="rounded-full border border-border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-foreground/65">{rutina.duracion} min</span>}
                  </div>
                  {partes?.desc && (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/80 prose-headings:font-black prose-headings:text-foreground prose-strong:text-foreground" dangerouslySetInnerHTML={{ __html: sanitizarHtml(partes.desc) }} />
                  )}
                  {partes?.contenido && (
                    <div className="prose prose-sm max-w-none rounded-lg border border-border bg-background/50 p-3 text-sm leading-relaxed text-foreground/80 prose-headings:font-black prose-headings:text-foreground prose-strong:text-foreground" dangerouslySetInnerHTML={{ __html: sanitizarHtml(partes.contenido) }} />
                  )}
                  {Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0 && (
                    <ol className="space-y-1.5">
                      {rutina.ejercicios.map((e, i) => (
                        <li key={e.idEjercicio || i} className="flex items-center gap-2.5 text-sm text-foreground/85">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[0.6875rem] font-black tabular-nums">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
                          {e.videoUrl && (
                            <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver el video de ${e.nombre}`} className="inline-flex min-h-[2.25rem] items-center gap-1 text-xs font-bold text-lime-700 hover:underline dark:text-lime-400">
                              Video <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                  {!partes?.desc && !partes?.contenido && !(rutina.ejercicios?.length > 0) && <p className="text-sm text-foreground/55">La rutina no tiene contenido cargado.</p>}
                </div>
              )}
            </section>

            {/* Quiénes reservaron */}
            {asistentes !== false && (
              <section aria-labelledby="det-alumnos">
                <h3 id="det-alumnos" className="mb-2 flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-widest text-foreground/60">
                  <Users className="h-4 w-4" aria-hidden="true" /> Alumnos
                </h3>
                {asistentes === null ? (
                  <Cargando filas={2} className="py-2" />
                ) : lista.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-foreground/55">Nadie reservó esta clase.</p>
                ) : (
                  <>
                    <p className="mb-2 text-xs text-foreground/65">
                      {activas.length} {activas.length === 1 ? "reserva" : "reservas"} · <strong className="text-foreground">{asistieron}</strong> {asistieron === 1 ? "asistió" : "asistieron"}
                      {ausentes > 0 && ` · ${ausentes} no ${ausentes === 1 ? "asistió" : "asistieron"}`}
                      {canceladas > 0 && ` · ${canceladas} ${canceladas === 1 ? "canceló" : "cancelaron"}`}
                    </p>
                    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {lista.map((r) => {
                        const est = estadoDeReserva(r)
                        return (
                          <li key={r.idReserva} className="flex items-center gap-3 px-3.5 py-2.5">
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{r.nombre}</span>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-wide ${est.clase}`}>
                              <est.Icono className="h-3 w-3" aria-hidden="true" />{est.texto}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
