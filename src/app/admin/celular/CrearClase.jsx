import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/CrearClaseView"

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const WD = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"], WDL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const NAMES = ["Nombre y coach", "Rutina", "Día, horario y cupo", "Revisar"]
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const fDate = (s) => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); const dt = new Date(y, m - 1, d); return WDL[dt.getDay()].replace(/^./, (x) => x.toUpperCase()) + " " + d + " " + MES[m - 1] }
const toMin = (t) => { if (!t) return null; const [a, b] = t.split(":").map(Number); return a * 60 + b }
const ini = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0] || "").join("").toUpperCase() || "?"
// La descripción y la rutina se escriben con el editor de texto con formato y se guardan como HTML (igual que en tableta y escritorio).
// Cuando el editor está vacío devuelve <p></p>: se trata como sin contenido.
const sinContenido = (html = "") => !String(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
const horaLocal = (d) => `${iso(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`

// Crear clase del admin en celular (referencia 08): cuatro pasos y botón fijo abajo
export default function CrearClaseCelular() {
  const { c, oscuro } = useCelular()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const [original, setOriginal] = useState(null) // clase que se edita
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puede = permisos.includes(esEdicion ? "clases:modificacion" : "clases:alta")
  const hoy = useMemo(() => new Date(), [])
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i); return { iso: iso(d), wd: i === 0 ? "HOY" : WD[d.getDay()], n: d.getDate(), long: `${WDL[d.getDay()]} ${d.getDate()} de ${MESL[d.getMonth()]}` } }), [hoy])

  const [tipos, setTipos] = useState([])
  const [profes, setProfes] = useState([])
  const [horarios, setHorarios] = useState([])
  const [st, setSt] = useState({ turno: null, otra: false, manual: false, step: 1, name: "", coach: "", desc: "", rutina: "", fecha: dias[1].iso, ini: "", fin: "", cupo: 15, avisar: true, cuando: "ya", avDt: "", tried: false, sending: false, done: false, ask: false, error: "" })
  const set = (o) => setSt((s) => ({ ...s, ...o }))

  useEffect(() => {
    apiClient.get("/tipos-clase").then((r) => setTipos(r.data?.data || [])).catch(() => {})
    apiClient.get("/profesores").then((r) => { const l = r.data?.data || []; setProfes(l); if (l[0]) setSt((s) => (s.coach ? s : { ...s, coach: String(l[0].idProfesor) })) }).catch(() => {})
  }, [])
  // Editar: se cargan los datos de la clase
  useEffect(() => {
    if (!esEdicion) return
    apiClient.get(`/clases/${id}`).then((r) => {
      const k = r.data?.data || r.data
      if (!k) return
      let desc = k.rutina?.descripcion || "", cont = k.rutina?.contenido || ""
      try { const p = JSON.parse(k.rutina?.descripcion || ""); if (p && typeof p.rutina !== "undefined") { desc = p.desc || ""; cont = p.rutina || "" } } catch { /* texto plano */ }
      setOriginal(k)
      setSt((s) => ({ ...s, name: k.nombreClase || "", coach: String(k.idProfesor || ""), desc, rutina: cont, fecha: k.fechaEspecifica ? String(k.fechaEspecifica).slice(0, 10) : s.fecha, ini: String(k.horaInicio || "").slice(0, 5), fin: String(k.horaFin || "").slice(0, 5), cupo: Number(k.cupoMaximo) || 15, avisar: false }))
    }).catch(() => set({ error: "No se pudo cargar la clase.", tried: true }))
  }, [esEdicion, id]) // eslint-disable-line react-hooks/exhaustive-deps
  const tipoCod = (original && original.tipoPlan) || params.get("tipo") || (tipos.find((t) => t.activo) || {}).codigo || ""
  const tipoNombre = (tipos.find((t) => t.codigo === tipoCod) || {}).nombre || "Clase"
  useEffect(() => { if (tipoCod) apiClient.get("/turnos/horarios", { params: { tipoPlan: tipoCod } }).then((r) => setHorarios(r.data?.data || [])).catch(() => setHorarios([])) }, [tipoCod])
  useEffect(() => { const el = document.getElementById("wiz"); if (el) window.scrollTo(0, 0) }, [st.step])

  const v = useMemo(() => {
    const S = st, step = S.step
    const hrOk = S.ini && S.fin && toMin(S.fin) > toMin(S.ini)
    const errs = { 1: !S.name.trim() ? "Poné un nombre para la clase." : !S.coach ? "Elegí el coach." : "", 2: "", 3: !S.fecha ? "Elegí el día." : !S.ini || !S.fin ? "Elegí un horario." : !hrOk ? "La hora de fin tiene que ser después del inicio." : "", 4: "" }
    const err = S.tried ? errs[step] : ""
    const NT = ["Turno mañana", "Turno siesta", "Turno noche"]
    const turnoDe = (h) => { const m = toMin(h); return m < 720 ? 0 : m < 1080 ? 1 : 2 }
    const TB = NT.map((t, i) => [t, horarios.filter((h) => turnoDe(String(h.horaInicio).slice(0, 5)) === i).map((h) => [String(h.horaInicio).slice(0, 5), String(h.horaFin).slice(0, 5), h.etiqueta || ""]).sort((a, b) => a[0].localeCompare(b[0]))])
    const curT = (() => { const i = TB.findIndex(([, it]) => it.some(([a, b]) => S.ini === a && S.fin === b)); if (i >= 0) return i; const m = toMin(S.ini); return m == null ? 2 : turnoDe(S.ini) })()
    const dur = hrOk ? toMin(S.fin) - toMin(S.ini) : 0
    const go = (n) => set({ step: n, tried: false })
    const nb = (S.rutina.match(/<p>|<li>|<h[23]>/g) || []).length // bloques de la rutina (párrafos, ítems y títulos)
    const avMsg = S.cuando === "ya" ? "Se envía apenas crees la clase." : S.avDt ? `Se envía el ${fDate(S.avDt.slice(0, 10))} a las ${S.avDt.slice(11, 16)}.` : "Elegí cuándo enviarlo."
    const coach = profes.find((p) => String(p.idProfesor) === S.coach)
    const crear = async () => {
      set({ sending: true, error: "" })
      try {
        const turno = NOMBRE_TURNO[turnoDe(S.ini)]
        const fechaPublicacion = !S.avisar ? (esEdicion ? (original?.fechaPublicacion || null) : null) : S.cuando === "ya" ? horaLocal(new Date()) : (S.avDt ? horaLocal(new Date(S.avDt)) : horaLocal(new Date()))
        const payload = { nombreClase: S.name.trim(), tipoClase: "Grupal", cupoMaximo: S.cupo, cupoDisponible: S.cupo, estado: (esEdicion && original?.estado) || "Activo", idGimnasio: 1, idProfesor: parseInt(S.coach, 10), ...(esEdicion && !original?.fechaEspecifica ? { diasSemana: original?.diasSemana ? String(original.diasSemana).split(",") : [] } : { fechaEspecifica: S.fecha }), horaInicio: S.ini, horaFin: S.fin, turno, tipoPlan: tipoCod, fechaPublicacion, rutina: { descripcion: S.desc, ejercicios: S.rutina } }
        const r = esEdicion ? await apiClient.put(`/clases/${id}`, payload) : await apiClient.post("/clases", payload)
        if (r.data && r.data.success === false) throw new Error(r.data.message || "Error al crear la clase")
        set({ sending: false, done: true })
      } catch (e) { set({ sending: false, error: e.response?.data?.message || e.message || "No se pudo crear la clase.", tried: true }) }
    }
    return {
      c, scheme: oscuro ? "dark" : "light", step, stepName: NAMES[step - 1], tipoNombre, titulo: esEdicion ? "Editar clase" : "Nueva clase", doneTitulo: esEdicion ? "Cambios guardados" : "Clase creada", salirTxt: esEdicion ? "¿Salir sin guardar los cambios?" : "¿Salir sin crear la clase?", otraTxt: esEdicion ? "Volver a Clases" : "Crear otra clase",
      bars: [1, 2, 3, 4].map((i) => (i <= step ? "#9be600" : c.line2)),
      done: S.done, form: !S.done, s1: step === 1, s2: step === 2, s3: step === 3, s4: step === 4,
      err: err || (S.tried && S.error ? S.error : ""), name: S.name, onName: (e) => set({ name: e.target.value }), nameInv: err && step === 1 ? "true" : "false", nameBd: err && step === 1 ? c.errFg : c.line,
      sugs: ["WOD Competitivo", "Open Box", "Fuerza", "Funcional"].map((l) => { const on = S.name === l; return { l, bg: on ? "#9be600" : "transparent", fg: on ? "#0b0b0b" : c.ink, bd: on ? "#9be600" : c.btnLine, pick: () => set({ name: l }) } }),
      coaches: profes.map((k) => { const ch = S.coach === String(k.idProfesor); return { id: k.idProfesor, n: k.nombreProfesor, ini: ini(k.nombreProfesor), img: k.avatarUrl || null, ch: ch ? "true" : "false", bd: ch ? "2px solid #9be600" : "1px solid " + c.line, bg: ch ? c.okBg : c.card, rd: ch ? "6px solid #9be600" : "2px solid " + c.btnLine, rBg: ch ? "#0b0b0b" : "transparent", pick: () => set({ coach: String(k.idProfesor) }) } }),
      desc: S.desc, onDesc: (h) => set({ desc: sinContenido(h) ? "" : h }), rutina: S.rutina, onRut: (h) => set({ rutina: sinContenido(h) ? "" : h }),
      dias: dias.map((d) => { const ch = S.fecha === d.iso; return { ...d, ch: ch ? "true" : "false", aria: d.long, bg: ch ? "#9be600" : c.card, fg: ch ? "#0b0b0b" : c.ink, bd: ch ? "#9be600" : (S.tried && !S.fecha ? c.errFg : c.line), pick: () => set({ fecha: d.iso }) } }),
      fecha: S.fecha, onFecha: (e) => set({ fecha: e.target.value }),
      turnosBox: TB.map(([t, items], i) => { const sel = (S.turno ?? curT) === i, has = items.some(([a, b]) => S.ini === a && S.fin === b); return { t: t.replace("Turno ", "").replace(/^./, (x) => x.toUpperCase()), sel: sel ? "true" : "false", bg: sel ? c.ink : "transparent", fg: sel ? c.bg : c.ink, dot: has, dotC: "#9be600", pick: () => set({ turno: i }) } }),
      horasT: TB[S.turno ?? curT][1].map(([a, b, note]) => { const ch = S.ini === a && S.fin === b; return { l: a + "–" + b, note: note ? note : false, aria: `De ${a} a ${b}${note ? ", " + note : ""}`, ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, bd: ch ? "#9be600" : c.btnLine, pick: () => set({ ini: a, fin: b }) } }),
      noManual: !S.manual, manual: S.manual, showManual: () => set({ manual: true }),
      noOtra: !S.otra, otra: S.otra, showOtra: () => set({ otra: true }), otraLabel: dias.some((d) => d.iso === S.fecha) ? "Otra fecha" : "Otra fecha: " + fDate(S.fecha),
      ini: S.ini, fin: S.fin, onIni: (e) => set({ ini: e.target.value }), onFin: (e) => set({ fin: e.target.value }),
      hrInv: S.tried && step === 3 && !hrOk ? "true" : "false", hrBd: S.tried && step === 3 && !hrOk ? c.errFg : c.line,
      hrH: hrOk ? `${S.ini} a ${S.fin} · ${dur} min` : "Elegí un horario del box.", hrHFg: hrOk ? c.okFg : c.muted,
      cupo: S.cupo, dec: () => set({ cupo: Math.max(1, S.cupo - 1) }), inc: () => set({ cupo: Math.min(20, S.cupo + 1) }), minC: S.cupo <= 1, maxC: S.cupo >= 20, decOp: S.cupo <= 1 ? 0.4 : 1, incOp: S.cupo >= 20 ? 0.4 : 1,
      cupos: [10, 12, 15, 20].map((n) => { const p = S.cupo === n; return { l: String(n), p: p ? "true" : "false", bg: p ? "#9be600" : "transparent", fg: p ? "#0b0b0b" : c.ink, bd: p ? "#9be600" : c.btnLine, pick: () => set({ cupo: n }) } }),
      resumen: [["Clase", `${S.name} · ${tipoNombre}`, 1], ["Coach", coach ? coach.nombreProfesor : "—", 1], ["Rutina", S.rutina.trim() ? (nb ? nb + (nb === 1 ? " bloque" : " bloques") : "Cargada") : "Sin rutina", 2], ["Día y horario", `${fDate(S.fecha)} · ${S.ini}–${S.fin} (${dur} min)`, 3], ["Cupo", S.cupo + " alumnos", 3]].map(([k, val, s], i) => ({ k, v: val, fg: val === "Sin rutina" ? c.muted : c.ink, sep: i ? c.line2 : "transparent", aria: "Editar " + k.toLowerCase(), edit: () => go(s) })),
      avisar: S.avisar ? "true" : "false", avOn: S.avisar, toggleAv: () => set({ avisar: !S.avisar }),
      swBg: S.avisar ? "#9be600" : c.btnLine, swJ: S.avisar ? "flex-end" : "flex-start", swK: S.avisar ? "#0b0b0b" : c.ink,
      cuando: [["ya", "Al crear"], ["prog", "Programar"]].map(([id, l]) => { const ch = S.cuando === id; return { l, ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, pick: () => set({ cuando: id }) } }),
      prog: S.cuando === "prog", avDt: S.avDt, onAvDt: (e) => set({ avDt: e.target.value }), avMsg,
      canBack: step > 1, footCols: step > 1 ? "52px 1fr" : "1fr", back: () => go(step - 1),
      sending: S.sending, nxBg: S.sending ? "#7fbf00" : "#9be600", nxLabel: S.sending ? "Creando…" : step === 4 ? (esEdicion ? "GUARDAR CAMBIOS" : "CREAR CLASE") : step === 2 && !S.desc && !S.rutina ? "SALTEAR" : "CONTINUAR",
      next: () => { if (errs[step]) { set({ tried: true }); setTimeout(() => document.getElementById("err-w")?.focus(), 0); return } if (step < 4) return go(step + 1); crear() },
      doneSub: `${S.name} · ${fDate(S.fecha)} a las ${S.ini}. ${S.avisar ? (S.cuando === "ya" ? "Ya avisamos a los alumnos activos." : "El aviso quedó programado.") : "No se envió aviso."}`,
      again: () => esEdicion ? navigate("/admin/clases") : set({ step: 1, name: "", desc: "", rutina: "", ini: "", fin: "", cupo: 15, tried: false, done: false, error: "" }),
      exit: () => { if (!esEdicion && (S.name || S.desc || S.rutina || S.ini)) set({ ask: true }); else if (esEdicion) set({ ask: true }); else navigate("/admin/clases") },
      ask: S.ask, keep: () => set({ ask: false }), toast: null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, profes, horarios, tipoNombre, tipoCod, c, oscuro, dias, navigate, esEdicion, original, id])

  if (!puede) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para crear clases.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}

const NOMBRE_TURNO = ["Mañana", "Siesta", "Noche"]
