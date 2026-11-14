import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink } from "lucide-react"
import apiClient from "@/api"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import { Cargando } from "@/components/Cargando"
import { ModalAdmin } from "@/components/ModalAdmin"
import { BOTON_SECUNDARIO } from "@/components/estilosModal"
import { yaTermino } from "./utilClases"

/*
 * Detalle de una clase (referencia 03): datos en tarjetas, la rutina y quiénes reservaron y cómo terminó cada reserva.
 * Se abre desde "Ver detalle" del Historial y "Ver anotados" del menú de cada clase. Solo lectura.
 */

const fechaLarga = (f) => (f ? new Date(`${String(f).slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "") : "—")
const hora = (h) => (h ? String(h).slice(0, 5) : "")
const minutos = (a, b) => { const [h1, m1] = a.split(":").map(Number); const [h2, m2] = b.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1) }

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
  if (r.estadoReserva === "cancelada") return { texto: "Canceló", color: "var(--muted-foreground)", borde: "var(--sh-control-line)", fondo: "transparent" }
  if (r.asistencia === "presente") return { texto: "Asistió", color: "var(--primary)", borde: "rgba(155, 230, 0, 0.3)", fondo: "var(--sh-active-bg)" }
  if (r.asistencia === "ausente") return { texto: "No asistió", color: "var(--sh-danger)", borde: "var(--sh-danger-line)", fondo: "var(--sh-danger-bg)" }
  return { texto: "Sin registrar", color: "var(--sh-warn)", borde: "var(--sh-warn-line)", fondo: "var(--sh-warn-bg)" }
}

const etiqueta = { font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }

function Dato({ etiqueta: titulo, valor }) {
  if (!valor) return null
  return (
    <div style={{ borderRadius: "10px", background: "color-mix(in srgb, var(--foreground) 4%, var(--card))", border: "1px solid var(--border)", padding: "12px 16px" }}>
      <div style={etiqueta}>{titulo}</div>
      <div style={{ marginTop: "4px", font: "800 15px Archivo" }}>{valor}</div>
    </div>
  )
}

export default function DetalleClaseDialog({ clase, onCerrar }) {
  const navigate = useNavigate()
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

  const permisos = (() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } })()
  const d = detalle?.clase
  const rutina = detalle?.rutina
  const partes = rutina ? partesDeRutina(rutina) : null
  const lista = Array.isArray(asistentes) ? asistentes : []
  const activas = lista.filter((r) => r.estadoReserva !== "cancelada")
  const asistieron = lista.filter((r) => r.asistencia === "presente").length
  const realizada = clase ? yaTermino(clase) : false
  const cupo = Number(d?.cupoMaximo || clase?.cupoMaximo) || 0
  const dur = d?.horaInicio && d?.horaFin ? minutos(hora(d.horaInicio), hora(d.horaFin)) : 0
  const asistenciaTexto = asistentes === null || asistentes === false || !cupo ? ""
    : realizada ? `${asistieron} de ${cupo} · ${Math.round(asistieron / cupo * 100)}%` : `${activas.length} anotados de ${cupo}`

  return (
    <ModalAdmin abierto={Boolean(clase)} onCerrar={onCerrar} ancho={680} titulo={clase?.nombreClase}
      extraTitulo={realizada && <span style={{ padding: "2px 8px", borderRadius: "999px", background: "var(--sh-active-bg)", border: "1px solid rgba(155, 230, 0, 0.3)", color: "var(--primary)", font: "700 11px Archivo" }}>Realizada</span>}
      subtitulo={clase ? `${fechaLarga(clase.fechaEspecifica)}${clase.horaInicio ? ` · ${hora(clase.horaInicio)}${clase.horaFin ? ` a ${hora(clase.horaFin)}` : ""}` : ""}` : ""}>
      <div style={{ maxHeight: "calc(0.9 * var(--bv-vh, 100vh) - 150px)", overflowY: "auto", marginTop: "16px" }}>
        {!detalle && !error && <Cargando filas={3} className="py-2" />}
        {error && <p style={{ padding: "24px 0", textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>No se pudo cargar el detalle de la clase. Probá de nuevo en un momento.</p>}

        {detalle && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Dato etiqueta="Coach" valor={d?.nombreProfesor || clase?.nombreProfesor} />
              <Dato etiqueta="Tipo de clase" valor={d?.nombreTipo || d?.tipoPlan} />
              <Dato etiqueta="Horario" valor={d?.horaInicio ? `${hora(d.horaInicio)} a ${hora(d.horaFin)}${d.turno ? ` · ${d.turno}` : ""}${dur > 0 ? ` · ${dur} min` : ""}` : ""} />
              <Dato etiqueta="Asistencia" valor={asistenciaTexto} />
              <Dato etiqueta="Cupo" valor={cupo ? `${cupo} lugares` : ""} />
              {d?.fechaPublicacion && <Dato etiqueta="Publicada" valor={new Date(d.fechaPublicacion).toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", "")} />}
            </div>

            <section aria-labelledby="det-rutina">
              <h3 id="det-rutina" className="bv-admin-titulo" style={{ margin: "0px 0px 10px", ...etiqueta }}>Rutina</h3>
              {!rutina ? (
                <p style={{ margin: 0, padding: "18px", borderRadius: "10px", border: "1px dashed var(--sh-control-line)", textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Esta clase no tuvo una rutina cargada.</p>
              ) : (
                <div style={{ borderRadius: "10px", border: "1px solid var(--border)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {rutina.nombre && <p style={{ margin: 0, font: "800 14px Archivo" }}>{rutina.nombre}</p>}
                  {partes?.desc && (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/80 prose-headings:font-black prose-headings:text-foreground prose-strong:text-foreground" dangerouslySetInnerHTML={{ __html: sanitizarHtml(partes.desc) }} />
                  )}
                  {partes?.contenido && (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/90 prose-headings:font-black prose-headings:text-[var(--primary)] prose-strong:text-foreground" dangerouslySetInnerHTML={{ __html: sanitizarHtml(partes.contenido) }} />
                  )}
                  {Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0 && (
                    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {rutina.ejercicios.map((e, i) => (
                        <li key={e.idEjercicio || i} style={{ display: "flex", alignItems: "center", gap: "10px", font: "500 14px Archivo" }}>
                          <span style={{ width: "24px", height: "24px", flexShrink: 0, borderRadius: "50%", background: "var(--sh-track)", display: "grid", placeItems: "center", font: "800 11px Archivo" }}>{i + 1}</span>
                          <span style={{ flex: "1 1 0%", minWidth: 0 }}>{e.nombre}</span>
                          {e.videoUrl && (
                            <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver el video de ${e.nombre}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--primary)", font: "700 12px Archivo", textDecoration: "none" }}>
                              Video <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                  {!partes?.desc && !partes?.contenido && !(rutina.ejercicios?.length > 0) && <p style={{ margin: 0, font: "500 14px Archivo", color: "var(--muted-foreground)" }}>La rutina no tiene contenido cargado.</p>}
                </div>
              )}
            </section>

            {asistentes !== false && (
              <section aria-labelledby="det-alumnos">
                <h3 id="det-alumnos" className="bv-admin-titulo" style={{ margin: "0px 0px 10px", ...etiqueta }}>Alumnos</h3>
                {asistentes === null ? (
                  <Cargando filas={2} className="py-2" />
                ) : lista.length === 0 ? (
                  <p style={{ margin: 0, padding: "18px", borderRadius: "10px", border: "1px dashed var(--sh-control-line)", textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Nadie reservó esta clase.</p>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", borderRadius: "10px", border: "1px solid var(--border)", overflow: "hidden" }}>
                    {lista.map((r, i) => {
                      const est = estadoDeReserva(r)
                      return (
                        <li key={r.idReserva} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                          <span style={{ flex: "1 1 0%", minWidth: 0, font: "700 14px Archivo", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nombre}</span>
                          <span style={{ padding: "2px 8px", borderRadius: "999px", border: `1px solid ${est.borde}`, background: est.fondo, color: est.color, font: "700 11px Archivo", whiteSpace: "nowrap" }}>{est.texto}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
        <button type="button" onClick={onCerrar} style={BOTON_SECUNDARIO}>Cerrar</button>
        {permisos.includes("clases:alta") && id && (
          <button type="button" onClick={() => navigate(`/admin/clases/nueva?duplicar=${id}`)}
            style={{ ...BOTON_SECUNDARIO, border: "1px solid var(--sh-accent)", color: "var(--sh-accent)" }}>Usar como base para una nueva clase</button>
        )}
      </div>
    </ModalAdmin>
  )
}
