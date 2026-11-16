import { useEffect, useMemo, useState } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { useTemaProfesor } from "./paletaProfesor"
import { useEsMovil, useCabeceraMovil } from "./movil"
import { TituloPagina } from "@/components/TituloPagina"
import AvatarPersona from "@/components/AvatarPersona"

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

// Fecha local como AAAA-MM-DD (nunca toISOString: en Argentina cambia el día de noche)
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const hoy = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d }
const etiquetaDia = (d) => `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
const sinSegundos = (h) => String(h || "").slice(0, 5)

// Fecha de "Tomar lista de esta clase" (rutina), de un aviso (?fecha= o ?clase=) o de hoy
function fechaDeTxt(txt) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt || "")
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null
}
function fechaInicial(state, fechaUrl) {
  if (state?.fecha) return fechaDeTxt(state.fecha) || hoy()
  if (fechaUrl) return fechaDeTxt(fechaUrl) || hoy()
  return hoy()
}

export default function ProfesorDashboard() {
  const C = useTemaProfesor()
  const movil = useEsMovil()
  const location = useLocation()
  const [params] = useSearchParams()
  const claseUrl = params.get("clase") // "idClase-idHorario-AAAA-MM-DD" (lo manda un aviso)
  const [fecha, setFecha] = useState(() => fechaInicial(location.state, claseUrl ? claseUrl.slice(-10) : params.get("fecha")))
  const pedidoClase = location.state?.idClase && location.state?.idHorario ? `${location.state.idClase}-${location.state.idHorario}-${location.state.fecha}` : (claseUrl || null)
  const [horariosPorClase, setHorariosPorClase] = useState([]) // [{idClase, nombre, idHorario, fecha, hora}]
  const [alumnosPorClave, setAlumnosPorClave] = useState({}) // clave "idClase-idHorario-fecha" -> alumnos
  const [abierta, setAbierta] = useState(null) // clave de la clase con la lista abierta

  const fechaTxt = ymd(fecha)
  const esHoy = fechaTxt === ymd(hoy())

  // Todas las clases del profesor con su horario puntual (una vez)
  useEffect(() => {
    apiClient.get("/profesores/mis-clases")
      .then(async (res) => {
        const clases = res.data?.data || []
        const listas = await Promise.all(clases.map(async (c) => {
          try {
            const r = await apiClient.get(`/profesores/clases/${c.idClase}/horarios`)
            return (r.data?.data || []).map((h) => ({
              idClase: c.idClase, nombre: c.categoria || c.nombreClase, idHorario: h.idHorario,
              fecha: h.fecha, hora: sinSegundos(h.horaInicio), fin: sinSegundos(h.horaFin),
            }))
          } catch { return [] }
        }))
        const todas = listas.flat()
        setHorariosPorClase(todas)
        if (pedidoClase && todas.some((h) => `${h.idClase}-${h.idHorario}-${h.fecha}` === pedidoClase)) setAbierta(pedidoClase)
      })
      .catch(() => toast.error("No pudimos cargar tus clases"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clasesDelDia = useMemo(
    () => horariosPorClase.filter((h) => h.fecha === fechaTxt).sort((a, b) => a.hora.localeCompare(b.hora)),
    [horariosPorClase, fechaTxt]
  )

  const claveDe = (k) => `${k.idClase}-${k.idHorario}-${k.fecha}`

  function cargarAlumnos(k) {
    apiClient.get(`/profesores/clases/${k.idClase}/alumnos`, { params: { fecha: k.fecha, idHorario: k.idHorario } })
      .then((r) => setAlumnosPorClave((prev) => ({ ...prev, [claveDe(k)]: r.data?.data || [] })))
      .catch(() => toast.error("No pudimos cargar los alumnos"))
  }

  // Alumnos de cada clase del día (para contar y mostrar el estado de cada tarjeta)
  useEffect(() => {
    clasesDelDia.forEach((k) => cargarAlumnos(k))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaTxt, horariosPorClase])


  const claseAbierta = clasesDelDia.find((k) => claveDe(k) === abierta) || null
  const alumnosAbiertos = claseAbierta ? alumnosPorClave[claveDe(claseAbierta)] || [] : []

  // Tocar el mismo estado otra vez lo quita (vuelve a "sin marcar"); tocar el otro lo cambia
  async function marcar(k, idReserva, estado) {
    const actual = (alumnosPorClave[claveDe(k)] || []).find((a) => a.idReserva === idReserva)?.asistencia
    const quitar = actual === estado
    try {
      if (quitar) await apiClient.delete(`/profesores/asistencias/${idReserva}`)
      else await apiClient.put(`/profesores/asistencias/${idReserva}`, { estado })
      setAlumnosPorClave((prev) => {
        const lista = (prev[claveDe(k)] || []).map((a) => (a.idReserva === idReserva ? { ...a, asistencia: quitar ? null : estado } : a))
        return { ...prev, [claveDe(k)]: lista }
      })
    } catch {
      toast.error("No se pudo guardar la asistencia")
    }
  }

  async function marcarTodos(k) {
    const pendientes = (alumnosPorClave[claveDe(k)] || []).filter((a) => a.asistencia !== "presente")
    await Promise.all(pendientes.map((a) => marcar(k, a.idReserva, "presente")))
    toast.success("Marcaste a todos presentes")
  }

  const irDia = (n) => { setFecha((f) => { const d = new Date(f); d.setDate(d.getDate() + n); d.setHours(12, 0, 0, 0); return d > hoy() ? hoy() : d }); setAbierta(null) }
  const volverHoy = () => { setFecha(hoy()); setAbierta(null) }

  // Celular: la cabecera muestra la clase abierta y vuelve a las clases del día
  useCabeceraMovil(movil && claseAbierta ? {
    titulo: `${claseAbierta.nombre} · ${claseAbierta.hora}`,
    sub: `${etiquetaDia(fecha)} · ${alumnosAbiertos.length === 1 ? "1 reservado" : `${alumnosAbiertos.length} reservados`}`,
    onVolver: () => setAbierta(null),
  } : null)

  const estadoDe = (k) => {
    const lista = alumnosPorClave[claveDe(k)]
    if (!lista) return { n: 0, done: 0, st: "Cargando", full: false, part: false }
    const n = lista.length
    const done = lista.filter((a) => a.asistencia === "presente" || a.asistencia === "ausente").length
    const full = n > 0 && done === n
    return { n, done, full, part: done > 0 && !full, st: !n ? "Sin reservas" : full ? "Lista completa" : done > 0 ? `A medias · ${done}/${n}` : "Sin tomar" }
  }

  if (movil) {
    return (
      <AsistenciaMovil C={C} fecha={fecha} esHoy={esHoy} clasesDelDia={clasesDelDia} estadoDe={estadoDe} claveDe={claveDe} irDia={irDia} volverHoy={volverHoy} setAbierta={setAbierta} claseAbierta={claseAbierta} alumnosAbiertos={alumnosAbiertos} marcar={marcar} marcarTodos={marcarTodos} />
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1152, width: "100%", margin: "0 auto", color: C.ink, fontFamily: "Archivo, sans-serif" }}>
      <TituloPagina descripcion="Tomá lista de tus clases">Asistencia</TituloPagina>
      {/* Elegir día */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div role="group" aria-label="Día" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => irDia(-1)} aria-label="Día anterior" style={botonCuadrado(C)}>
            <Flecha dir="izq" />
          </button>
          <div aria-live="polite" style={{ minWidth: 220, height: 44, boxSizing: "border-box", padding: "0 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: esHoy ? C.lime : C.surf, color: esHoy ? C.onLime : C.muted, font: "700 11px Archivo", letterSpacing: ".06em" }}>{esHoy ? "HOY" : "AYER"}</span>
            <span style={{ font: "700 15px Archivo" }}>{etiquetaDia(fecha)}</span>
          </div>
          <button onClick={() => irDia(1)} disabled={esHoy} aria-label="Día siguiente" style={{ ...botonCuadrado(C), opacity: esHoy ? 0.4 : 1 }}>
            <Flecha dir="der" />
          </button>
        </div>
        {!esHoy && (
          <button onClick={volverHoy} style={{ height: 44, padding: "0 14px", border: "none", background: "transparent", color: C.okFg, font: "700 14px Archivo", cursor: "pointer" }}>Volver a hoy</button>
        )}
      </div>

      {!claseAbierta && (
        <section aria-labelledby="t-cl" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 id="t-cl" style={{ margin: 0, font: "600 12px Archivo", letterSpacing: ".1em", color: C.muted }}>
            {(esHoy ? "TUS CLASES DE HOY" : "TUS CLASES DE ESE DÍA") + " · " + clasesDelDia.length}
          </h2>
          {clasesDelDia.length === 0 && (
            <div style={{ padding: "48px 20px", borderRadius: 16, border: `1px dashed ${C.btnLine}`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ font: "700 17px Archivo" }}>No tenés clases este día</div>
              <div style={{ font: "400 14px Archivo", color: C.muted }}>Usá las flechas para ver otro día.</div>
            </div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 12 }}>
            {clasesDelDia.map((k) => {
              const e = estadoDe(k)
              const sBg = e.full ? C.okBg : e.part ? C.warnBg : "transparent"
              const sBd = e.full ? C.okLine : e.part ? C.warnLine : C.btnLine
              const sFg = e.full ? C.okFg : e.part ? C.warnFg : C.ink
              const cta = !e.n ? "Ver clase" : e.full ? "Ver lista" : "Tomar lista"
              return (
                <li key={claveDe(k)}>
                  <button
                    onClick={() => setAbierta(claveDe(k))}
                    aria-label={`${k.nombre} de las ${k.hora}, ${e.n} reservados, ${e.st}`}
                    style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: 16, border: `1px solid ${e.full ? C.okLine : C.line}`, background: C.card, color: C.ink, textAlign: "left", cursor: "pointer", transitionProperty: "transform,border-color", transitionDuration: "150ms", transitionTimingFunction: "ease-out" }}
                  >
                    <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <span>
                        <span style={{ display: "block", font: "900 34px/1 'Big Shoulders Stencil Display'" }}>{k.hora}</span>
                        <span style={{ display: "block", marginTop: 4, font: "700 15px Archivo" }}>{k.nombre}</span>
                      </span>
                      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: sBg, border: `1px solid ${sBd}`, color: sFg, font: "700 12px Archivo", whiteSpace: "nowrap" }}>
                        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />{e.st}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 12, borderTop: `1px solid ${C.line2}`, font: "500 14px Archivo", color: C.muted }}>
                      <span>{e.n === 1 ? "1 reservado" : `${e.n} reservados`}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, font: "700 14px Archivo", color: e.n ? C.okFg : C.muted }}>{cta} <Flecha dir="der" tam={16} /></span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {claseAbierta && (
        <section aria-labelledby="t-li" style={{ borderRadius: 16, background: C.card, border: `1px solid ${C.line}`, overflow: "hidden" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 20px", padding: 18, borderBottom: `1px solid ${C.line}` }}>
            <button onClick={() => setAbierta(null)} aria-label="Volver a las clases del día" style={{ ...botonCuadrado(C), background: "transparent" }}>
              <Flecha dir="izq" tam={18} />
            </button>
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <h2 id="t-li" style={{ margin: 0, font: "900 28px/1 'Big Shoulders Stencil Display'", textTransform: "uppercase" }}>{claseAbierta.nombre} · {claseAbierta.hora}</h2>
              <div style={{ marginTop: 4, font: "500 14px Archivo", color: C.muted }}>{etiquetaDia(fecha)} · {alumnosAbiertos.length === 1 ? "1 reservado" : `${alumnosAbiertos.length} reservados`}</div>
            </div>
            <ConteoLista C={C} lista={alumnosAbiertos} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 20px", borderBottom: `1px solid ${C.line2}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ font: "600 14px Archivo" }}>{progresoTxt(alumnosAbiertos)}</span>
              {alumnosAbiertos.some((a) => a.asistencia !== "presente") && alumnosAbiertos.length > 0 && (
                <button onClick={() => marcarTodos(claseAbierta)} style={{ minHeight: 40, padding: "0 4px", border: "none", background: "transparent", color: C.okFg, font: "700 14px Archivo", cursor: "pointer" }}>Marcar todos presentes</button>
              )}
            </div>
            <div role="progressbar" aria-label="Lista tomada" aria-valuemin={0} aria-valuemax={alumnosAbiertos.length} aria-valuenow={alumnosAbiertos.filter((a) => a.asistencia).length} style={{ height: 8, borderRadius: 4, background: C.track, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${alumnosAbiertos.length ? (alumnosAbiertos.filter((a) => a.asistencia).length / alumnosAbiertos.length) * 100 : 0}%`, background: C.lime, transitionProperty: "width", transitionDuration: "300ms" }} />
            </div>
          </div>
          {alumnosAbiertos.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", font: "500 15px Archivo", color: C.muted }}>Nadie reservó esta clase todavía.</div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {alumnosAbiertos.map((a, i) => {
              const p = a.asistencia === "presente", x = a.asistencia === "ausente"
              return (
                <li key={a.idReserva} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 16px", padding: "12px 20px", borderTop: i ? `1px solid ${C.line2}` : "none", background: p ? C.okBg : x ? C.errBg : "transparent" }}>
                  <AvatarPersona nombre={a.nombrecompleto} url={a.avatarUrl} size={42} fondo={p ? C.lime : x ? C.errBg : C.surf} color={p ? C.onLime : x ? C.errFg : C.ink} font="800 14px Archivo" />
                  <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                    <div style={{ font: "700 16px Archivo" }}>{a.nombrecompleto}</div>
                    <div style={{ font: "500 13px Archivo", color: C.muted }}>Reservó · {i + 1}.º</div>
                  </div>
                  <div role="radiogroup" aria-label={`Asistencia de ${a.nombrecompleto}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: 280, maxWidth: "100%" }}>
                    <button role="radio" aria-checked={p} onClick={() => marcar(claseAbierta, a.idReserva, "presente")} style={botonMarca(C, p, "lime")}>Presente</button>
                    <button role="radio" aria-checked={x} onClick={() => marcar(claseAbierta, a.idReserva, "ausente")} style={botonMarca(C, x, "err")}>Ausente</button>
                  </div>
                </li>
              )
            })}
          </ul>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderTop: `1px solid ${C.line}`, font: "500 13px Archivo", color: C.muted }}>
            {alumnosAbiertos.some((a) => a.asistencia) ? "Se guarda automáticamente." : "Cada marca se guarda al instante."}
          </div>
        </section>
      )}
    </div>
  )
}

// Celular (referencia 02-profesor-celular.html): filas tocables y lista en tarjetas con botones de 48 px
function AsistenciaMovil({ C, fecha, esHoy, clasesDelDia, estadoDe, claveDe, irDia, volverHoy, setAbierta, claseAbierta, alumnosAbiertos, marcar, marcarTodos }) {
  const n = alumnosAbiertos.length
  const p = alumnosAbiertos.filter((a) => a.asistencia === "presente").length
  const x = alumnosAbiertos.filter((a) => a.asistencia === "ausente").length
  const marcados = p + x
  const numero = { display: "block", font: "900 26px/1 'Big Shoulders Stencil Display'" }
  const boton = (on, tono) => ({ ...botonMarca(C, on, tono), height: 48, fontSize: 15, borderRadius: 12 })

  if (claseAbierta) {
    return (
      <>
        <section aria-label="Resumen de la lista" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: 14, background: C.card, border: `1px solid ${C.line}` }}>
          <div aria-live="polite" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center" }}>
            <span><strong style={{ ...numero, color: C.okFg }}>{p}</strong><span style={{ font: "600 12px Archivo", color: C.muted }}>presentes</span></span>
            <span><strong style={{ ...numero, color: C.errFg }}>{x}</strong><span style={{ font: "600 12px Archivo", color: C.muted }}>ausentes</span></span>
            <span><strong style={{ ...numero, color: C.ink }}>{n - marcados}</strong><span style={{ font: "600 12px Archivo", color: C.muted }}>sin marcar</span></span>
          </div>
          <div role="progressbar" aria-label="Lista tomada" aria-valuemin={0} aria-valuemax={n} aria-valuenow={marcados} style={{ height: 8, borderRadius: 4, background: C.track, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${n ? (marcados / n) * 100 : 0}%`, background: C.lime }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ font: "600 13px Archivo", color: C.muted }}>{progresoTxt(alumnosAbiertos)}</span>
            {n > 0 && p < n && (
              <button onClick={() => marcarTodos(claseAbierta)} style={{ minHeight: 40, padding: "0 2px", border: "none", background: "transparent", color: C.okFg, font: "700 13px Archivo", cursor: "pointer", whiteSpace: "nowrap" }}>Todos presentes</button>
            )}
          </div>
        </section>

        {n === 0 && <div style={{ padding: "32px 16px", textAlign: "center", font: "500 15px Archivo", color: C.muted }}>Nadie reservó esta clase todavía.</div>}

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {alumnosAbiertos.map((a, i) => {
            const pres = a.asistencia === "presente", ause = a.asistencia === "ausente"
            return (
              <li key={a.idReserva} style={{ padding: 12, borderRadius: 14, background: pres ? C.okBg : ause ? C.errBg : C.card, border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AvatarPersona nombre={a.nombrecompleto} url={a.avatarUrl} size={40} fondo={pres ? C.lime : ause ? C.errBg : C.surf} color={pres ? C.onLime : ause ? C.errFg : C.ink} font="800 13px Archivo" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: "700 16px Archivo" }}>{a.nombrecompleto}</span>
                    <span style={{ display: "block", font: "500 12px Archivo", color: C.muted }}>Reservó · {i + 1}.º</span>
                  </span>
                </div>
                <div role="radiogroup" aria-label={`Asistencia de ${a.nombrecompleto}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button role="radio" aria-checked={pres} onClick={() => marcar(claseAbierta, a.idReserva, "presente")} style={boton(pres, "lime")}>Presente</button>
                  <button role="radio" aria-checked={ause} onClick={() => marcar(claseAbierta, a.idReserva, "ausente")} style={boton(ause, "err")}>Ausente</button>
                </div>
              </li>
            )
          })}
        </ul>
        <p style={{ margin: 0, textAlign: "center", font: "500 13px Archivo", color: C.muted }}>{marcados ? "Se guarda automáticamente." : "Cada marca se guarda al instante."}</p>
      </>
    )
  }

  return (
    <>
      <div role="group" aria-label="Día" style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", gap: 8 }}>
        <button onClick={() => irDia(-1)} aria-label="Día anterior" style={{ height: 48, borderRadius: 12, border: `1px solid ${C.btnLine}`, background: C.card, color: C.ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Flecha dir="izq" tam={18} />
        </button>
        <div aria-live="polite" style={{ height: 48, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ padding: "2px 8px", borderRadius: 999, background: esHoy ? C.lime : C.surf, color: esHoy ? C.onLime : C.muted, font: "700 11px Archivo" }}>{esHoy ? "HOY" : "AYER"}</span>
          <span style={{ font: "700 15px Archivo" }}>{etiquetaDia(fecha)}</span>
        </div>
        <button onClick={() => irDia(1)} disabled={esHoy} aria-label="Día siguiente" style={{ height: 48, borderRadius: 12, border: `1px solid ${C.btnLine}`, background: C.card, color: C.ink, opacity: esHoy ? 0.4 : 1, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Flecha dir="der" tam={18} />
        </button>
      </div>
      {!esHoy && (
        <button onClick={volverHoy} style={{ alignSelf: "flex-start", height: 40, padding: "0 4px", border: "none", background: "transparent", color: C.okFg, font: "700 14px Archivo", cursor: "pointer" }}>Volver a hoy</button>
      )}

      <h2 style={{ margin: "4px 0 0", font: "600 12px Archivo", letterSpacing: ".1em", color: C.muted }}>{(esHoy ? "TUS CLASES DE HOY" : "TUS CLASES DE ESE DÍA") + " · " + clasesDelDia.length}</h2>
      {clasesDelDia.length === 0 && (
        <div style={{ padding: "36px 16px", borderRadius: 14, border: `1px dashed ${C.btnLine}`, textAlign: "center" }}>
          <div style={{ font: "700 16px Archivo" }}>No tenés clases este día</div>
          <div style={{ marginTop: 4, font: "400 14px Archivo", color: C.muted }}>Usá las flechas para ver otro día.</div>
        </div>
      )}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {clasesDelDia.map((k) => {
          const e = estadoDe(k)
          const sBg = e.full ? C.okBg : e.part ? C.warnBg : "transparent"
          const sBd = e.full ? C.okLine : e.part ? C.warnLine : C.btnLine
          const sFg = e.full ? C.okFg : e.part ? C.warnFg : C.ink
          return (
            <li key={claveDe(k)}>
              <button onClick={() => setAbierta(claveDe(k))} aria-label={`${k.nombre} de las ${k.hora}, ${e.n} reservados, ${e.st}`} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, border: `1px solid ${e.full ? C.okLine : C.line}`, background: C.card, color: C.ink, textAlign: "left", cursor: "pointer", transitionProperty: "transform,background-color,border-color,color", transitionDuration: "150ms", transitionTimingFunction: "ease-out" }}>
                <span style={{ minWidth: 64, font: "900 30px/1 'Big Shoulders Stencil Display'" }}>{k.hora}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", font: "700 15px Archivo" }}>{k.nombre}</span>
                  <span style={{ display: "block", marginTop: 2, font: "500 13px Archivo", color: C.muted }}>{e.n === 1 ? "1 reservado" : `${e.n} reservados`}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "2px 9px", borderRadius: 999, background: sBg, border: `1px solid ${sBd}`, color: sFg, font: "700 11px Archivo" }}>
                    <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />{e.st}
                  </span>
                </span>
                <span style={{ color: C.muted, display: "flex" }}><Flecha dir="der" tam={18} /></span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function progresoTxt(lista) {
  const n = lista.length
  if (!n) return "Sin alumnos"
  const p = lista.filter((a) => a.asistencia === "presente").length
  const done = lista.filter((a) => a.asistencia).length
  return done === n ? `Lista completa · ${Math.round((p / n) * 100)} % de asistencia` : `${done} de ${n} marcados`
}

function ConteoLista({ C, lista }) {
  const p = lista.filter((a) => a.asistencia === "presente").length
  const x = lista.filter((a) => a.asistencia === "ausente").length
  const f = lista.length - p - x
  const num = { font: "900 22px 'Big Shoulders Stencil Display'" }
  return (
    <div aria-live="polite" style={{ display: "flex", gap: 16, font: "600 14px Archivo", color: C.muted }}>
      <span><strong style={{ ...num, color: C.okFg }}>{p}</strong> presentes</span>
      <span><strong style={{ ...num, color: C.errFg }}>{x}</strong> ausentes</span>
      <span><strong style={{ ...num, color: C.ink }}>{f}</strong> sin marcar</span>
    </div>
  )
}

function iniciales(nombre = "") {
  const p = nombre.trim().split(" ")
  return (p.length > 1 ? p[0][0] + p[1][0] : nombre.substring(0, 2)).toUpperCase()
}

function botonCuadrado(C) {
  return { width: 44, height: 44, flexShrink: 0, borderRadius: 10, border: `1px solid ${C.btnLine}`, background: C.card, color: C.ink, display: "grid", placeItems: "center", cursor: "pointer" }
}

function botonMarca(C, on, tono) {
  const acento = tono === "lime" ? C.lime : C.errFg
  return {
    height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10,
    border: `1px solid ${on ? acento : C.btnLine}`,
    background: on ? acento : "transparent",
    color: on ? (tono === "lime" ? C.onLime : "#ffffff") : C.ink,
    font: "700 14px Archivo", cursor: "pointer",
    transitionProperty: "transform,background-color,border-color,color", transitionDuration: "150ms", transitionTimingFunction: "ease-out",
  }
}

function Flecha({ dir, tam = 18 }) {
  const d = dir === "izq" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
