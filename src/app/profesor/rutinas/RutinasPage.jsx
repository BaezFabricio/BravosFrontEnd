import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { useTemaProfesor } from "../paletaProfesor"
import { useEsMovil } from "../movil"
import { TituloPagina } from "@/components/TituloPagina"

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const hoyTxt = () => ymd(new Date())
// "2026-11-16" -> fecha local sin cambio de día por zona horaria
const desdeTxt = (f) => { const [a, m, d] = f.split("-").map(Number); return new Date(a, m - 1, d, 12) }

export default function RutinasPage() {
  const C = useTemaProfesor()
  const movil = useEsMovil()
  const [sesiones, setSesiones] = useState([]) // una fila por fecha y horario de cada clase con rutina
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pestana, setPestana] = useState("prox")

  useEffect(() => {
    let vivo = true
    apiClient.get("/rutinas")
      .then(async (res) => {
        const lista = res.data?.data || []
        if (!vivo) return
        const clases = [...new Set(lista.filter((r) => r.idClase).map((r) => r.idClase))]
        const horarios = await Promise.all(clases.map(async (idClase) => {
          try {
            const r = await apiClient.get(`/profesores/clases/${idClase}/horarios`)
            return { idClase, horarios: r.data?.data || [] }
          } catch { return { idClase, horarios: [] } }
        }))
        if (!vivo) return
        const filas = []
        for (const r of lista) {
          if (!r.idClase) continue
          const hs = horarios.find((h) => h.idClase === r.idClase)?.horarios || []
          for (const h of hs) {
            filas.push({ idRutina: r.idRutina, nombre: r.nombre, clase: r.nombreClase, fecha: h.fecha, idHorario: h.idHorario, hora: String(h.horaInicio || "").slice(0, 5), dia: h.dia, cantidadAlumnos: r.cantidadAlumnos })
          }
        }
        setSesiones(filas)
      })
      .catch(() => { if (vivo) setError("No pudimos cargar tus rutinas.") })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  const hoy = hoyTxt()
  const visibles = useMemo(() => {
    const ok = (f) => (pestana === "prox" ? f >= hoy : f < hoy)
    return sesiones.filter((s) => ok(s.fecha)).sort((a, b) => (pestana === "prox" ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha)) || a.hora.localeCompare(b.hora))
  }, [sesiones, pestana, hoy])

  const grupos = useMemo(() => {
    const g = []
    for (const s of visibles) {
      const last = g[g.length - 1]
      if (last && last.fecha === s.fecha) last.items.push(s)
      else g.push({ fecha: s.fecha, items: [s] })
    }
    return g
  }, [visibles])

  const contProx = sesiones.filter((s) => s.fecha >= hoy).length
  const contHist = sesiones.filter((s) => s.fecha < hoy).length

  const pestanas = [["prox", "Próximas", contProx], ["hist", "Historial", contHist]]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1152, width: "100%", margin: "0 auto", color: C.ink, fontFamily: "Archivo, sans-serif" }}>
      {!movil && <TituloPagina descripcion="Las rutinas que el administrador asignó a tus clases">Mis rutinas</TituloPagina>}
      {/* Celular: las pestañas quedan fijas arriba al hacer scroll */}
      <div role="tablist" aria-label="Rutinas" style={movil ? { display: "grid", gridTemplateColumns: "1fr 1fr", position: "sticky", top: -16, zIndex: 2, margin: "-16px -16px 0", padding: "0 16px", background: C.bg, borderBottom: `1px solid ${C.line}` } : { display: "flex", gap: 4, borderBottom: `1px solid ${C.line}` }}>
        {pestanas.map(([id, l, n]) => {
          const sel = pestana === id
          return (
            <button key={id} role="tab" aria-selected={sel} onClick={() => setPestana(id)} style={{ minHeight: 48, padding: "0 18px", marginBottom: -1, border: "none", borderBottom: `3px solid ${sel ? C.lime : "transparent"}`, background: "transparent", color: sel ? C.ink : C.muted, display: "flex", alignItems: "center", gap: 10, font: "700 15px Archivo", cursor: "pointer" }}>
              {l}
              <span style={{ minWidth: 24, height: 24, padding: "0 7px", boxSizing: "border-box", borderRadius: 12, background: sel ? C.lime : C.line2, color: sel ? C.onLime : C.ink, font: "700 12px/24px Archivo" }}>{n}</span>
            </button>
          )
        })}
      </div>

      {error && <div role="alert" style={{ padding: 20, borderRadius: 14, border: `1px solid ${C.errLine}`, background: C.errBg, color: C.errFg, font: "600 14px Archivo" }}>{error}</div>}

      {!cargando && !error && grupos.length === 0 && (
        <div style={{ padding: "48px 20px", borderRadius: 16, border: `1px dashed ${C.btnLine}`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ font: "700 17px Archivo" }}>{pestana === "prox" ? "Sin rutinas próximas" : "Sin rutinas en el historial"}</div>
          <div style={{ font: "400 14px Archivo", color: C.muted }}>Cuando el administrador asigne una rutina a tus clases, aparece acá.</div>
        </div>
      )}

      {grupos.map((g) => {
        const d = desdeTxt(g.fecha)
        return (
          <section key={g.fecha} aria-label={`${DIAS_LARGO[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ margin: 0, font: "600 12px Archivo", letterSpacing: ".1em", color: C.muted }}>{`${DIAS_LARGO[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`.toUpperCase()}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, borderRadius: 14, background: C.card, border: `1px solid ${C.line}`, overflow: "hidden" }}>
              {g.items.map((s, i) => (
                <li key={`${s.idRutina}-${s.idHorario}`} style={{ borderTop: i ? `1px solid ${C.line2}` : "none" }}>
                  <Link to={`/profesor/rutinas/${s.idRutina}?fecha=${s.fecha}&idHorario=${s.idHorario}`} aria-label={`Ver rutina de ${s.clase}, ${s.hora}`} style={{ width: "100%", display: "flex", alignItems: "center", gap: movil ? 12 : 14, minHeight: movil ? 68 : 72, padding: movil ? "10px 12px 10px 14px" : "10px 16px", color: C.ink, textDecoration: "none", boxSizing: "border-box" }}>
                    <span style={{ width: 52, height: 54, flexShrink: 0, borderRadius: 10, background: pestana === "prox" ? C.surf : C.surf, color: pestana === "prox" ? C.okFg : C.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ font: "700 10px Archivo", letterSpacing: ".08em", opacity: 0.85 }}>{DIAS[d.getDay()]}</span>
                      <span style={{ font: "900 24px/1 'Big Shoulders Stencil Display'" }}>{d.getDate()}</span>
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", font: "700 16px Archivo" }}>{s.clase} · {s.hora}</span>
                      <span style={{ display: "block", marginTop: 2, font: "500 13px Archivo", color: C.muted }}>{s.nombre} · {s.cantidadAlumnos === 1 ? "1 alumno asignado" : `${s.cantidadAlumnos} alumnos asignados`}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, font: "700 14px Archivo", color: C.okFg }}>Ver rutina ›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {cargando && <p style={{ font: "500 14px Archivo", color: C.muted }}>Cargando rutinas…</p>}
    </div>
  )
}
