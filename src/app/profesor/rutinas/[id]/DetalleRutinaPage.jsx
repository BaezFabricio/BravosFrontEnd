import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import { useTemaProfesor } from "../../paletaProfesor"
import { useEsMovil, useCabeceraMovil } from "../../movil"
import { TituloPagina } from "@/components/TituloPagina"
import VideoPlayer from "@/components/VideoPlayer"

const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

// "2026-11-16" -> "Lunes 16 de noviembre" (sin pasar por Date en UTC)
function fechaLarga(f) {
  if (!f) return ""
  const [a, m, d] = f.split("-").map(Number)
  const dia = new Date(a, m - 1, d, 12).getDay()
  return `${DIAS_LARGO[dia]} ${d} de ${MESES[m - 1]}`
}

// La rutina se guarda como JSON {desc, rutina} (o HTML/texto plano en clases viejas)
function partirRutina(descripcion) {
  try {
    const p = JSON.parse(descripcion || "")
    if (p && typeof p === "object") return { desc: p.desc || "", rutina: p.rutina || "" }
  } catch { /* texto o HTML plano */ }
  return { desc: descripcion || "", rutina: "" }
}

export default function DetalleRutinaPage() {
  const C = useTemaProfesor()
  const movil = useEsMovil()
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const fecha = params.get("fecha") || ""
  const idHorario = params.get("idHorario") || ""

  const [rutina, setRutina] = useState(null)
  const [hora, setHora] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vivo = true
    apiClient.get(`/rutinas/${id}`)
      .then(async (res) => {
        const r = res.data?.data
        if (!vivo) return
        setRutina(r)
        if (r?.idClase && idHorario) {
          try {
            const h = await apiClient.get(`/profesores/clases/${r.idClase}/horarios`)
            const found = (h.data?.data || []).find((x) => String(x.idHorario) === idHorario)
            if (vivo && found) setHora(String(found.horaInicio || "").slice(0, 5))
          } catch { /* sin hora */ }
        }
      })
      .catch(() => { if (vivo) setError("Rutina no encontrada o no tenés permiso para verla.") })
      .finally(() => { if (vivo) setLoading(false) })
    return () => { vivo = false }
  }, [id, idHorario])

  // Celular: la cabecera lleva el nombre de la clase y la hora; la flecha vuelve a Mis rutinas
  useCabeceraMovil(movil && rutina ? {
    titulo: `${rutina.nombreClase || rutina.nombre}${hora ? ` · ${hora}` : ""}`,
    sub: fecha ? fechaLarga(fecha) : rutina.nombre,
  } : null)

  if (loading) return <p style={{ font: "500 14px Archivo", color: C.muted }}>Cargando rutina…</p>
  if (error || !rutina) return <div role="alert" style={{ padding: 20, borderRadius: 14, border: `1px solid ${C.errLine}`, background: C.errBg, color: C.errFg, font: "600 14px Archivo" }}>{error || "Rutina no encontrada."}</div>

  const { desc, rutina: texto } = partirRutina(rutina.descripcion)
  const alumnos = rutina.alumnos?.length || 0
  const tomarLista = () => navigate("/profesor", { state: { fecha, idClase: rutina.idClase, idHorario: Number(idHorario) || null } })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1152, width: "100%", margin: "0 auto", color: C.ink, fontFamily: "Archivo, sans-serif" }}>
      {!movil && <TituloPagina descripcion={fecha ? fechaLarga(fecha) : rutina.nombre}>{`${rutina.nombreClase || rutina.nombre}${hora ? ` · ${hora}` : ""}`}</TituloPagina>}
      <section aria-labelledby="t-rd" style={{ position: "relative", overflow: "hidden", padding: movil ? 18 : 24, borderRadius: movil ? 16 : 20, background: "#0e0e0e", color: "#ecefe4", border: `1px solid ${C.line}`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 28px" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <span style={{ font: "600 12px Archivo", letterSpacing: ".1em", color: "#a3a698" }}>RUTINA DEL DÍA</span>
          <h2 id="t-rd" style={{ margin: "6px 0 0", font: movil ? "900 30px/1 'Big Shoulders Stencil Display'" : "900 40px/1 'Big Shoulders Stencil Display'", textTransform: "uppercase" }}>
            {rutina.nombreClase || rutina.nombre}{hora ? ` · ${hora}` : ""}
          </h2>
          <div style={{ marginTop: 6, font: "500 15px Archivo", color: "#b9bcae" }}>
            {fecha ? fechaLarga(fecha) : rutina.nombre} · {alumnos === 1 ? "1 alumno asignado" : `${alumnos} alumnos asignados`}
          </div>
        </div>
        {idHorario && (
          <button onClick={tomarLista} style={{ height: 48, flexShrink: 0, whiteSpace: "nowrap", width: movil ? "100%" : undefined, justifyContent: movil ? "center" : undefined, display: "flex", alignItems: "center", gap: 8, padding: "0 18px", borderRadius: 10, border: "1px solid #4a4d42", background: "transparent", color: "#ecefe4", font: "700 15px Archivo", cursor: "pointer" }}>
            Tomar lista de esta clase
          </button>
        )}
      </section>

      <section aria-label="Rutina" style={{ padding: "20px 24px", borderRadius: 16, background: C.card, border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <h3 style={{ margin: 0, font: "600 12px Archivo", letterSpacing: ".1em", color: C.muted }}>RUTINA</h3>
        {desc && <div style={{ font: "400 15px/1.6 Archivo", color: C.muted }} dangerouslySetInnerHTML={{ __html: sanitizarHtml(desc) }} />}
        {/* El texto de la rutina lo carga el administrador en su editor: se muestra renderizado y sanitizado */}
        <div style={{ font: "400 17px/1.6 Archivo", color: C.ink, wordBreak: "break-word" }} dangerouslySetInnerHTML={{ __html: sanitizarHtml(texto || "") }} />
        <span style={{ paddingTop: 10, borderTop: `1px solid ${C.line2}`, font: "500 13px Archivo", color: C.muted }}>Cargada por el administrador</span>
      </section>

      {rutina.ejercicios?.length > 0 && (
        <section aria-label="Ejercicios" style={{ padding: "20px 24px", borderRadius: 16, background: C.card, border: `1px solid ${C.line}` }}>
          <h3 style={{ margin: "0 0 10px", font: "600 12px Archivo", letterSpacing: ".1em", color: C.muted }}>EJERCICIOS</h3>
          <ol style={{ margin: 0, paddingLeft: 20, font: "600 15px Archivo" }}>
            {rutina.ejercicios.map((ej) => <li key={ej.idEjercicio} style={{ marginBottom: 10 }}>{ej.nombre}<div style={{ marginTop: 6 }}><VideoPlayer url={ej.videoUrl} label="Ver video" /></div></li>)}
          </ol>
        </section>
      )}
    </div>
  )
}
