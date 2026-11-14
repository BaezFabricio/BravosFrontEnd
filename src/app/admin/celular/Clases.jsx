import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { yaTermino, fechaDeClase } from "../clases/utilClases"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/ClasesView"

const DIAS_NUM = { DOMINGO: 0, LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6 }
const hh = (h) => (h ? String(h).slice(0, 5) : "")
const toM = (t) => { const [x, y] = String(t || "0:0").split(":").map(Number); return x * 60 + y }
const turnoDeHora = (t) => (toM(t) < 720 ? 0 : toM(t) < 1080 ? 1 : 2)
const TURNOS = ["Turno mañana", "Turno siesta", "Turno noche"]
const NOMBRE_TURNO = ["Mañana", "Siesta", "Noche"]
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Próxima fecha de una clase: la fecha única, o el primer día de la semana que todavía no pasó
function proximaFecha(c) {
  if (c.fechaEspecifica) return fechaDeClase(c.fechaEspecifica)
  if (!c.diasSemana) return null
  const base = new Date(); base.setSeconds(0, 0)
  let min = null
  for (const d of c.diasSemana.split(",").map((x) => x.trim().toUpperCase())) {
    const td = DIAS_NUM[d]
    if (td === undefined) continue
    let diff = (td - base.getDay() + 7) % 7
    if (diff === 0 && c.horaInicio) { const [a, b] = c.horaInicio.split(":").map(Number); const hoy = new Date(); hoy.setHours(a, b, 0, 0); if (base >= hoy) diff = 7 }
    if (min === null || diff < min) min = diff
  }
  if (min === null) return null
  const f = new Date(); f.setHours(12, 0, 0, 0); f.setDate(f.getDate() + min)
  return f
}
const aTexto = (html = "") => {
  const d = new DOMParser().parseFromString(String(html).replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, "\n"), "text/html")
  return (d.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim()
}
function textoRutina(r) {
  let desc = r.descripcion || "", contenido = r.contenido || ""
  try { const p = JSON.parse(r.descripcion || ""); if (p && typeof p.rutina !== "undefined") { desc = p.desc || ""; contenido = p.rutina || "" } } catch { /* texto plano */ }
  return [r.nombre, aTexto(desc), aTexto(contenido), ...(Array.isArray(r.ejercicios) ? r.ejercicios.map((e, i) => `${i + 1}. ${e.nombre}`) : [])].filter(Boolean).join("\n\n")
}

// Clases del admin en celular (referencia 07): próximas clases, turnos (horarios fijos) e historial
export default function ClasesCelular() {
  const { c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const [params] = useSearchParams()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const tiene = (p) => permisos.includes(p) || permisos.includes(p.replace(":consulta", ":ver"))
  const puedeVer = tiene("clases:consulta")
  const puedeBaja = permisos.includes("clases:baja")
  const puedeTurnos = permisos.includes("configuracion:modificacion") || permisos.includes("clases:modificacion")

  const [clases, setClases] = useState(null)
  const [tipos, setTipos] = useState([])
  const [horarios, setHorarios] = useState(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState(params.get("pestana") === "historial" ? "hist" : "clases")
  const [tipo, setTipo] = useState("todos")
  const [q, setQ] = useState("")
  const [tt, setTt] = useState(null)
  const [hs, setHs] = useState(null)
  const [del, setDel] = useState(false)
  const [dsel, setDsel] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [ddel, setDdel] = useState(false)
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3500) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargarClases = useCallback(() => apiClient.get("/clases").then((r) => setClases(r.data?.data || r.data || [])).catch(() => setError(true)), [])
  const cargarHorarios = useCallback(() => apiClient.get("/turnos/horarios").then((r) => setHorarios(r.data?.data || [])).catch(() => setHorarios([])), [])
  useEffect(() => {
    if (!puedeVer) return
    cargarClases(); cargarHorarios()
    apiClient.get("/tipos-clase").then((r) => setTipos(r.data?.data || [])).catch(() => {})
  }, [puedeVer, cargarClases, cargarHorarios])

  // Detalle de una clase del historial: la clase, su rutina y los alumnos
  useEffect(() => {
    if (dsel == null) { setDetalle(null); return undefined }
    let vigente = true
    Promise.allSettled([apiClient.get(`/clases/${dsel}`), apiClient.get(`/clases/${dsel}/asistentes`)]).then(([a, b]) => {
      if (!vigente) return
      setDetalle({ clase: a.status === "fulfilled" ? (a.value.data?.data || a.value.data) : null, asistentes: b.status === "fulfilled" ? (b.value.data?.data || []) : false })
    })
    return () => { vigente = false }
  }, [dsel])

  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { setHs(null); setDsel(null); setDdel(false); setDel(false) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  const v = useMemo(() => {
    const loading = !clases && !error
    const todas = clases || []
    const tiposActivos = tipos.filter((t) => t.activo || todas.some((k) => k.tipoPlan === t.codigo))
    const nombreTipo = (cod) => (tipos.find((t) => t.codigo === cod) || {}).nombre || cod || ""
    const proximas = todas.filter((k) => !yaTermino(k)).map((k) => {
      const f = proximaFecha(k)
      const dias = k.diasSemana ? k.diasSemana.split(",").length : 1
      const cupo = Number(k.cupoMaximo) || 0, anot = Number(k.anotados) || 0
      return { id: k.idClase, f, d: f ? f.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase().replace(/ DE /, " DE ") : "SIN FECHA", name: k.nombreClase, tipoCod: k.tipoPlan, tipo: String(nombreTipo(k.tipoPlan) || k.tipoClase || "").toUpperCase(), time: hh(k.horaInicio), n: dias, coach: k.nombreProfesor || "Sin coach", res: anot, cap: cupo, estado: k.estado }
    }).sort((a, b) => (a.f?.getTime() || 9e15) - (b.f?.getTime() || 9e15) || a.time.localeCompare(b.time))
    const busq = q.trim().toLowerCase()
    const L = loading ? [] : proximas.filter((k) => (tipo === "todos" || k.tipoCod === tipo) && (!busq || (k.name + k.coach).toLowerCase().includes(busq)))
    const DD = [...new Set(L.map((k) => k.d))]
    const cnt = (cod) => proximas.filter((k) => k.tipoCod === cod).length
    const hayFiltro = !!busq || tipo !== "todos"

    // Historial: clases únicas que ya pasaron, por mes
    const pasadas = todas.filter((k) => yaTermino(k)).sort((a, b) => b.fechaEspecifica.localeCompare(a.fechaEspecifica))
    const HIST = []
    for (const k of pasadas) {
      const f = fechaDeClase(k.fechaEspecifica)
      const mes = f.toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(" de ", " ").toUpperCase()
      let g = HIST.find((x) => x.t === mes)
      if (!g) { g = { t: mes, items: [] }; HIST.push(g) }
      const cupo = Number(k.cupoMaximo) || 0, asis = Number(k.asistieron) || 0
      g.items.push({ wd: f.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "").toUpperCase(), day: String(f.getDate()), name: k.nombreClase, s: `${hh(k.horaInicio)}–${hh(k.horaFin)} · ${k.nombreProfesor || "Sin coach"}`, asis: `${asis} de ${cupo}`, fg: asis ? c.ink : c.muted, aria: `${k.nombreClase} ${f.getDate()}, ${hh(k.horaInicio)}, asistieron ${asis} de ${cupo}. Ver detalle`, open: () => { setDsel(k.idClase); setDdel(false) } })
    }
    HIST.forEach((g) => { g.items = g.items.map((r, j) => ({ ...r, sep: j ? c.line2 : "transparent" })) })

    // Turnos: horarios fijos por tipo de clase
    const ttActual = tt || (tiposActivos[0] || {}).codigo || ""
    const H = (horarios || []).filter((h) => h.tipoPlan === ttActual).map((h) => ({ ...h, ini: hh(h.horaInicio), fin: hh(h.horaFin) })).sort((a, b) => toM(a.ini) - toM(b.ini))
    const tgrupos = [0, 1, 2].map((k) => {
      const it = H.filter((h) => turnoDeHora(h.ini) === k)
      return { t: TURNOS[k], up: TURNOS[k].toUpperCase(), n: it.length === 1 ? "1 horario" : it.length + " horarios", items: it.map((h, j) => ({ l: `${h.ini} – ${h.fin}`, note: h.etiqueta || false, dur: toM(h.fin) - toM(h.ini) + " min", sep: j ? c.line2 : "transparent", aria: `Editar horario ${h.ini} a ${h.fin}`, open: () => { if (puedeTurnos) { setHs({ id: h.idTurnoHorario, ini: h.ini, fin: h.fin, note: h.etiqueta || "", tipoPlan: h.tipoPlan }); setDel(false) } } })) }
    }).filter((g) => g.items.length)
    const E = hs || {}
    const ok = E.ini && E.fin && toM(E.fin) > toM(E.ini)
    const guardarH = async () => {
      if (!ok) return
      const cuerpo = { tipoPlan: E.tipoPlan || ttActual, turno: NOMBRE_TURNO[turnoDeHora(E.ini)], etiqueta: (E.note || "").trim(), horaInicio: E.ini, horaFin: E.fin }
      try {
        if (E.id) await apiClient.put(`/turnos/horarios/${E.id}`, cuerpo); else await apiClient.post("/turnos/horarios", cuerpo)
        setHs(null); await cargarHorarios(); avisar(E.id ? "Horario actualizado." : "Horario agregado.")
      } catch (err) { avisar(err.response?.data?.message || "No se pudo guardar el horario.") }
    }
    const borrarH = async () => {
      try { await apiClient.delete(`/turnos/horarios/${E.id}`); setHs(null); setDel(false); await cargarHorarios(); avisar("Horario eliminado.") }
      catch (err) { setDel(false); avisar(err.response?.data?.message || "No se pudo eliminar el horario.") }
    }

    // Detalle de la clase del historial
    const dc = detalle?.clase
    const lista = Array.isArray(detalle?.asistentes) ? detalle.asistentes : []
    const asistieron = lista.filter((r) => r.asistencia === "presente")
    const cupo = Number(dc?.cupoMaximo) || 0
    const fd = dc?.fechaEspecifica ? fechaDeClase(dc.fechaEspecifica) : null
    const dur = dc?.horaInicio && dc?.horaFin ? toM(hh(dc.horaFin)) - toM(hh(dc.horaInicio)) : 0
    const rutina = dc?.rutina ? textoRutina(dc.rutina) : ""
    const d = dc ? {
      name: dc.nombreClase, corta: fd ? `${fd.getDate()} ${fd.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}` : "",
      fecha: fd ? `${mayus(fd.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).replace(",", ""))} · ${hh(dc.horaInicio)} a ${hh(dc.horaFin)}` : "",
      asis: String(asistieron.length), cupo: String(cupo), pct: cupo ? Math.round(asistieron.length / cupo * 100) + "%" : "—", aFg: asistieron.length ? c.okFg : c.muted,
      rows: [["Tipo", dc.nombreTipo || nombreTipo(dc.tipoPlan)], ["Coach", dc.nombreProfesor || "Sin coach"], ["Horario", `${hh(dc.horaInicio)} a ${hh(dc.horaFin)}${dur > 0 ? ` · ${dur} min` : ""}`], ["Cupo", `${cupo} lugares`]].map(([k, val], j) => ({ k, v: val, sep: j ? c.line2 : "transparent" })),
      rutina: rutina || "Sin rutina cargada.", rFg: rutina ? c.ink : c.muted,
      noAl: !asistieron.length, hasAl: !!asistieron.length,
      al: asistieron.map((r) => ({ ini: String(r.nombre || "?").trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase(), n: r.nombre, h: "Asistió" })),
      hrefBase: `/admin/clases/nueva?duplicar=${dsel}`,
    } : { rows: [], al: [], hrefBase: "/admin/clases/nueva" }
    const borrarClase = async () => {
      try { await apiClient.delete(`/clases/${dsel}`); setDsel(null); setDdel(false); await cargarClases(); avisar("Clase eliminada del historial.") }
      catch (err) { setDdel(false); avisar(err.response?.data?.message || "No se pudo eliminar la clase.") }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, loading, q, onQ: (ev) => setQ(ev.target.value), clear: () => { setQ(""); setTipo("todos") },
      tabs2: [["clases", "Clases", 0], ["turnos", "Turnos", 0], ["hist", "Historial", pasadas.length]].map(([id, l, n]) => { const s = id === tab; return { id: "tb-" + id, l, n: n || false, sel: s ? "true" : "false", ti: s ? 0 : -1, bar: s ? "#9be600" : "transparent", fg: s ? c.ink : c.muted, cBg: s ? "#9be600" : c.line2, cFg: s ? "#0b0b0b" : c.ink, pick: () => setTab(id) } }),
      tabId: "tb-" + tab, tClases: tab === "clases", tTurnos: tab === "turnos" && !loading, tHist: tab === "hist" && !loading,
      tipos: [["todos", "Todas", proximas.length], ...tiposActivos.map((t) => [t.codigo, t.nombre, cnt(t.codigo)])].map(([id, l, n]) => { const p = tipo === id; return { l, n, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setTipo(id) } }),
      emptyAll: tab === "clases" && !loading && !L.length,
      eT: hayFiltro && proximas.length ? "No encontramos clases" : "Todavía no hay clases",
      eS: hayFiltro && proximas.length ? "Probá con otro nombre o tipo." : "Creá la primera clase y los alumnos ya van a poder reservarla.",
      eCta: !(hayFiltro && proximas.length), eClear: !!(hayFiltro && proximas.length), eTypes: !proximas.length,
      tiposList: tiposActivos.map((t, i) => ({ l: t.nombre, sep: i ? c.line2 : "transparent", aria: "Crear clase de " + t.nombre, href: `/admin/clases/nueva?tipo=${t.codigo}` })),
      dias: tab === "clases" ? DD.map((dd, i) => ({ t: i === 0 ? "PRÓXIMA · " + dd : dd, fg: i === 0 ? c.okFg : c.muted, items: L.filter((k) => k.d === dd).map((k) => ({ ...k, turnos: k.n === 1 ? "1 turno" : k.n + " turnos", w: (k.cap ? Math.min(100, k.res / k.cap * 100) : 0) + "%", href: `/admin/clases/editar/${k.id}`, aria: `${k.name}, ${k.tipo.toLowerCase()}, ${k.time}, ${k.res} de ${k.cap} reservas` })) })) : [],
      ttipos: tiposActivos.map((t) => { const p = ttActual === t.codigo; return { l: `${t.nombre} · ${(horarios || []).filter((h) => h.tipoPlan === t.codigo).length}`, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setTt(t.codigo) } }),
      tgrupos, tEmpty: !tgrupos.length, addH: () => { if (puedeTurnos) { setHs({ id: null, ini: "", fin: "", note: "", tipoPlan: ttActual }); setDel(false) } },
      hs: !!hs, hEdit: !!E.id, hTitle: del ? "Eliminar horario" : E.id ? "Editar horario" : "Nuevo horario", confDel: del, hForm: !del, scheme: oscuro ? "dark" : "light",
      hIni: E.ini || "", hFin: E.fin || "", hNote: E.note || "",
      onHIni: (ev) => setHs({ ...E, ini: ev.target.value }), onHFin: (ev) => setHs({ ...E, fin: ev.target.value }), onHNote: (ev) => setHs({ ...E, note: ev.target.value }),
      hInv: E.fin && !ok ? "true" : "false", hBd: E.fin && !ok ? c.errFg : c.line,
      hHint: ok ? `${TURNOS[turnoDeHora(E.ini)]} · ${toM(E.fin) - toM(E.ini)} min` : E.fin ? "Tiene que terminar después de empezar." : "El turno se asigna solo según la hora.", hHFg: ok ? c.okFg : E.fin ? c.errFg : c.muted,
      hSave: E.id ? "GUARDAR CAMBIOS" : "AGREGAR HORARIO", closeH: () => { setHs(null); setDel(false) }, saveH: guardarH, askDel: () => setDel(true), noDel: () => setDel(false), doDel: borrarH,
      hist: HIST, det: dsel != null && !!dc, dDel: ddel, dBody: !ddel, closeD: () => { setDsel(null); setDdel(false) }, askDelD: () => { if (puedeBaja) setDdel(true) }, noDelD: () => setDdel(false), doDelD: borrarClase, d,
      toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clases, tipos, horarios, error, tab, tipo, q, tt, hs, del, dsel, detalle, ddel, toast, c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver las clases.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
