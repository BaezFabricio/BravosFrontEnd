import { avisarTexto } from "@/lib/avisoSileo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/PerfilesView"

// Módulos de cada panel y qué acciones no aplican (los mismos del editor de escritorio)
const PANELES = {
  admin: [["dashboard", "Resumen", "Resumen y reportes"], ["usuarios", "Usuarios y abonos", "Usuarios y abonos"], ["clases", "Clases", "Clases y turnos"], ["reservas", "Reservas", "Reservas de alumnos"], ["creditos", "Créditos", "Créditos de alumnos"], ["membresias", "Membresías", "Planes y pagos"], ["perfiles", "Perfiles", "Perfiles y permisos"], ["configuracion", "Configuración", "Datos del sitio"]],
  alumno: [["alumno", "General", "Inicio del alumno"], ["alumno_reservas", "Reservas", "Reservar clases"], ["alumno_creditos", "Créditos", "Créditos propios"]],
  profesor: [["profesor", "Asistencia", "Tomar asistencia"], ["profesor_rutinas", "Rutinas", "Rutinas"], ["profesor_perfil", "Perfil", "Perfil del profe"]],
}
const NO_APLICA = { alumno_creditos: ["baja"], profesor_perfil: ["alta", "baja"] }
const ACC = [["v", "consulta", "Ver"], ["a", "alta", "Crear"], ["e", "modificacion", "Editar"], ["b", "baja", "Borrar"]]
const TODOS = Object.values(PANELES).flat()
const naDe = (id, acc) => (NO_APLICA[id] || []).includes(acc)
const vacioPerm = () => Object.fromEntries(TODOS.map(([id]) => [id, { v: 0, a: 0, e: 0, b: 0 }]))
const todoPerm = () => Object.fromEntries(TODOS.map(([id]) => [id, { v: 1, a: naDe(id, "alta") ? 0 : 1, e: 1, b: naDe(id, "baja") ? 0 : 1 }]))
const esTotal = (perm) => TODOS.every(([id]) => ACC.every(([k, acc]) => naDe(id, acc) || (perm[id] || {})[k]))
const aPerm = (modulos = {}) => Object.fromEntries(TODOS.map(([id]) => { const p = modulos[id]?.permisos || {}; return [id, { v: p.consulta && !naDe(id, "consulta") ? 1 : 0, a: p.alta && !naDe(id, "alta") ? 1 : 0, e: p.modificacion ? 1 : 0, b: p.baja && !naDe(id, "baja") ? 1 : 0 }] }))
const cuentaMods = (perm) => Object.values(perm || {}).filter((p) => p.v || p.a || p.e || p.b).length

// Perfiles y permisos del admin en celular (referencia 15): lista de perfiles y hoja con los permisos por módulo
export default function PerfilesCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const tiene = (p) => permisos.includes(p)
  const puedeVer = tiene("perfiles:consulta") || tiene("perfiles:ver")
  const puedeAlta = tiene("perfiles:alta"), puedeEditar = tiene("perfiles:modificacion"), puedeBaja = tiene("perfiles:baja") || tiene("membresias:baja")
  const [perfiles, setPerfiles] = useState(null)
  const [conteos, setConteos] = useState({})
  const [sel, setSel] = useState(null) // null · -1 nuevo · índice
  const [f, setF] = useState(null)
  const [pan, setPan] = useState("admin")
  const [conf, setConf] = useState(false)
  const [tried, setTried] = useState(false)
  const [toast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { avisarTexto(t) }, []) // los avisos los dibuja Sileo
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargar = useCallback(() => {
    apiClient.get("/perfiles").then((r) => setPerfiles(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => { setPerfiles([]); avisar("No se pudieron cargar los perfiles.") })
    apiClient.get("/usuarios").then((r) => { const l = r.data?.data || r.data; const m = {}; (Array.isArray(l) ? l : []).forEach((u) => { const k = String(u.idPerfil ?? ""); if (k) m[k] = (m[k] || 0) + 1 }); setConteos(m) }).catch(() => {})
  }, [avisar])
  useEffect(() => { if (puedeVer) cargar() }, [puedeVer, cargar])
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { setSel(null); setF(null); setConf(false) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  const v = useMemo(() => {
    const P = (perfiles || []).map((p) => { const perm = aPerm(p.modulos); const us = typeof p.usuarios === "number" ? p.usuarios : Array.isArray(p.usuarios) ? p.usuarios.length : (conteos[String(p.idPerfil)] || 0); return { id: p.idPerfil, n: p.nombrePerfil || p.nombre || "", d: p.descripcion || "", perm, tot: esTotal(perm), us } })
    const F = f || { n: "", d: "", perm: {}, tot: false, us: 0 }
    const perm = F.perm || {}
    const esEdicion = sel != null && sel >= 0
    const nErr = tried && !String(F.n || "").trim()
    const setPerm = (np) => setF((s) => ({ ...s, perm: np, tot: esTotal(np) }))
    const lista = PANELES[pan]
    const todoOn = lista.every(([id]) => ACC.every(([k, acc]) => naDe(id, acc) || (perm[id] || {})[k]))
    const payload = () => { const out = []; Object.entries(perm).forEach(([modulo, p]) => ACC.forEach(([k, acc]) => { if (p[k] && !naDe(modulo, acc)) out.push({ modulo, nombreAccion: acc }) })); return out }
    const guardar = async () => {
      if (!String(F.n || "").trim()) { setTried(true); return }
      try {
        if (esEdicion) await apiClient.put("/perfiles", { idPerfil: P[sel].id, nombrePerfil: F.n.trim(), descripcion: F.d || "", permisos: payload() })
        else await apiClient.post("/perfiles", { nombrePerfil: F.n.trim(), descripcion: F.d || "", permisos: payload() })
        setSel(null); setF(null); await cargar(); avisar(esEdicion ? "Perfil actualizado." : "Perfil creado.")
      } catch (err) { avisar(err.response?.data?.message || "No se pudo guardar el perfil.") }
    }
    const eliminar = async () => {
      try { await apiClient.delete(`/perfiles/${P[sel].id}`); setSel(null); setF(null); setConf(false); await cargar(); avisar("Perfil eliminado.") }
      catch (err) { setConf(false); avisar(err.response?.data?.message || "No se pudo eliminar el perfil.") }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, nP: P.length, nU: P.reduce((s, p) => s + p.us, 0),
      addNew: () => { if (puedeAlta) { setSel(-1); setF({ n: "", d: "", perm: vacioPerm(), tot: false, us: 0 }); setPan("admin"); setConf(false); setTried(false) } },
      list: P.map((p, i) => ({ n: p.n, d: p.d || "Sin descripción", mods: p.tot ? "Acceso total" : cuentaMods(p.perm) + " módulos", us: p.us === 1 ? "1 usuario" : p.us + " usuarios", sep: i ? c.line2 : "transparent", aria: `${p.n}, ${p.tot ? "acceso total" : cuentaMods(p.perm) + " módulos"}, ${p.us} usuarios. Editar`, open: () => { if (puedeEditar) { setSel(i); setF({ ...p, perm: JSON.parse(JSON.stringify(p.perm)) }); setPan("admin"); setConf(false); setTried(false) } } })),
      sheet: sel != null, sTitle: conf ? "Eliminar perfil" : esEdicion ? "Editar perfil" : "Nuevo perfil", close: () => { setSel(null); setF(null); setConf(false) },
      conf, formOn: !conf, isEdit: esEdicion, f: { n: F.n, d: F.d },
      onN: (ev) => setF((s) => ({ ...s, n: ev.target.value })), onD: (ev) => setF((s) => ({ ...s, d: ev.target.value })), nErr, nInv: nErr ? "true" : "false", nBd: nErr ? c.errFg : c.line,
      totA: F.tot ? "true" : "false", togTot: () => setF((s) => ({ ...s, tot: !s.tot, perm: !s.tot ? todoPerm() : vacioPerm() })),
      swBg: F.tot ? "#9be600" : c.btnLine, swJ: F.tot ? "flex-end" : "flex-start", swK: F.tot ? "#0b0b0b" : c.ink,
      panels: [["admin", "Admin"], ["alumno", "Alumno"], ["profesor", "Profesor"]].map(([id, l]) => { const s = pan === id; const n = PANELES[id].filter(([mid]) => { const p = perm[mid] || {}; return p.v || p.a || p.e || p.b }).length; return { l, n: n + "/" + PANELES[id].length, sel: s ? "true" : "false", bg: s ? "#9be600" : "transparent", fg: s ? "#0b0b0b" : c.ink, pick: () => setPan(id) } }),
      markL: todoOn ? "Quitar todo" : "Marcar todo",
      markAll: () => { const np = { ...perm }; lista.forEach(([id]) => { np[id] = todoOn ? { v: 0, a: 0, e: 0, b: 0 } : { v: 1, a: naDe(id, "alta") ? 0 : 1, e: 1, b: naDe(id, "baja") ? 0 : 1 } }); setPerm(np) },
      mods: lista.map(([id, n, d], i) => { const p = perm[id] || {}; return { n, d, sep: i ? c.line2 : "transparent", aria: "Permisos de " + n, p: ACC.map(([k, acc, l]) => { const dis = naDe(id, acc); const on = !dis && !!p[k]; return { l, na: dis, ch: on ? "true" : "false", op: dis ? 0.35 : 1, bg: on ? "#9be600" : "transparent", fg: on ? "#0b0b0b" : c.ink, bd: on ? "#9be600" : c.btnLine, tog: () => { if (!dis) setPerm({ ...perm, [id]: { ...p, [k]: p[k] ? 0 : 1 } }) } } }) } }),
      saveL: esEdicion ? "GUARDAR CAMBIOS" : "CREAR PERFIL", save: guardar,
      askDel: () => { if (puedeBaja) setConf(true) }, noDel: () => setConf(false), canDel: !F.us, noDelL: F.us ? "Entendido" : "Cancelar",
      delMsg: F.us ? `No se puede eliminar: ${F.us} ${F.us === 1 ? "usuario lo tiene" : "usuarios lo tienen"} asignado. Cambiales el perfil primero.` : "Nadie lo tiene asignado. No se puede deshacer.",
      doDel: eliminar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfiles, conteos, sel, f, pan, conf, tried, toast, c, noLeidas, sesion, abrirNotif, abrirCuenta, puedeAlta, puedeEditar, puedeBaja])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los perfiles.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
