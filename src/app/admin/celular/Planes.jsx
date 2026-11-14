import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient from "@/api"
import { armarDescripcion, partesDescripcion, MAX_CONDICIONES } from "@/lib/planes"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/PlanesView"

const pesos = (n) => "$" + Number(n || 0).toLocaleString("es-AR")
const VACIO = { n: "", t: "", d: "", p: "", c: "", w: "", inc: [], al: 0 }

// Planes del admin en celular (referencia 09): lista de planes, tipos de clase y hoja para crear, editar o eliminar un plan
export default function PlanesCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const tiene = (p) => permisos.includes(p)
  const puedeVer = tiene("membresias:consulta") || tiene("membresias:ver")
  const puedeAlta = tiene("membresias:alta"), puedeEditar = tiene("membresias:modificacion"), puedeBaja = tiene("membresias:baja")

  const [planes, setPlanes] = useState(null)
  const [tipos, setTipos] = useState(null)
  const [tab, setTab] = useState("planes")
  const [sel, setSel] = useState(null) // null: cerrada · -1: nuevo · número: índice
  const [f, setF] = useState(null)
  const [conf, setConf] = useState(false)
  const [tried, setTried] = useState(false)
  const [ni, setNi] = useState("")
  const [nt, setNt] = useState("")
  const [toast, setToast] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3500) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargarPlanes = useCallback(() => apiClient.get("/planes").then((r) => setPlanes(r.data?.data || [])).catch(() => setPlanes([])), [])
  const cargarTipos = useCallback(() => apiClient.get("/tipos-clase").then((r) => setTipos(r.data?.data || [])).catch(() => setTipos([])), [])
  useEffect(() => { if (puedeVer) { cargarPlanes(); cargarTipos() } }, [puedeVer, cargarPlanes, cargarTipos])

  const v = useMemo(() => {
    const P = (planes || []).map((p) => {
      const partes = partesDescripcion(p.descripcion)
      return { id: p.idPlan, n: p.nombre, t: p.tipo, tn: p.nombreTipo || p.tipo || "Sin tipo", d: partes.corta, p: String(Number(p.precio) || 0), c: String(p.cantidadCreditos ?? ""), w: p.creditosPorSemana ? String(p.creditosPorSemana) : "", inc: partes.condiciones, al: Number(p.alumnosActivos) || 0 }
    })
    const T = tipos || []
    const F = f || VACIO
    const esEdicion = sel != null && sel >= 0
    const E = { n: !String(F.n || "").trim(), p: !(Number(F.p) > 0), c: !(Number(F.c) > 0), t: !F.t }
    const hayError = tried && (E.n || E.p || E.c || E.t)
    const cambiar = (k) => (ev) => { const val = ["p", "c", "w"].includes(k) ? ev.target.value.replace(/\D/g, "") : ev.target.value; setF((s) => ({ ...s, [k]: val })) }
    const prev = [F.c ? F.c + " créditos para reservar clases" : null, F.w ? "Hasta " + F.w + " clases por semana" : null, ...(F.inc && F.inc.length ? F.inc : ["Reservás tus clases desde la app", "Vence el próximo día 10"])].filter(Boolean)
    const abrirNuevo = () => { if (!puedeAlta) return; setSel(-1); setF({ ...VACIO, t: (T.find((t) => t.activo) || {}).codigo || "" }); setConf(false); setTried(false) }
    const guardar = async () => {
      if (E.n || E.p || E.c || E.t) { setTried(true); return }
      const payload = { nombre: F.n.trim(), descripcion: armarDescripcion(F.d || "", F.inc || []), precio: Number(F.p), cantidadCreditos: Number(F.c), creditosPorSemana: F.w === "" ? null : Number(F.w), tipo: F.t }
      setOcupado(true)
      try {
        if (esEdicion) await apiClient.put(`/planes/${P[sel].id}`, payload); else await apiClient.post("/planes", payload)
        await cargarPlanes()
        setSel(null); setF(null); avisar(esEdicion ? "Plan actualizado." : "Plan creado.")
      } catch (err) { avisar(err.response?.data?.message || "No se pudo guardar el plan.") } finally { setOcupado(false) }
    }
    const eliminar = async () => {
      setOcupado(true)
      try { await apiClient.delete(`/planes/${P[sel].id}`); await cargarPlanes(); setSel(null); setF(null); setConf(false); avisar("Plan eliminado.") }
      catch (err) { setConf(false); avisar(err.response?.data?.message || "No se pudo eliminar el plan.") } finally { setOcupado(false) }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, addAria: tab === "planes" ? "Nuevo plan" : "Nuevo tipo de clase",
      addNew: () => { if (tab === "planes") abrirNuevo(); else document.querySelector('input[aria-label="Nuevo tipo de clase"]')?.focus() },
      tabs2: [["planes", "Planes · " + P.length], ["tipos", "Tipos de clase"]].map(([id, l]) => { const s = tab === id; return { l, sel: s ? "true" : "false", bar: s ? "#9be600" : "transparent", fg: s ? c.ink : c.muted, pick: () => setTab(id) } }),
      tPlanes: tab === "planes", tTipos: tab === "tipos",
      planes: P.map((p, i) => ({ n: p.n, tipo: p.tn + (p.d ? " · " + p.d : ""), pr: pesos(p.p), cred: p.c + " clases" + (p.w ? " · " + p.w + "/semana" : ""), al: p.al ? p.al + (p.al === 1 ? " alumno activo" : " alumnos activos") : "Sin alumnos activos", alFg: p.al ? c.okFg : c.muted, aria: `${p.n}, ${pesos(p.p)}, ${p.c} clases. Editar`, open: () => { if (!puedeEditar) return; setSel(i); setF({ ...p, inc: [...p.inc] }); setConf(false); setTried(false) } })),
      tipos: T.map((t, i) => ({
        n: t.nombre, s: `${t.planes} ${t.planes === 1 ? "plan" : "planes"} · ${t.clases} ${t.clases === 1 ? "clase" : "clases"} · ${t.horarios} ${t.horarios === 1 ? "horario" : "horarios"}`, op: t.activo ? 1 : 0.55, sep: i ? c.line2 : "transparent", on: t.activo ? "true" : "false", aria: (t.activo ? "Desactivar " : "Activar ") + t.nombre, swBg: t.activo ? "#9be600" : c.btnLine, swJ: t.activo ? "flex-end" : "flex-start", swK: t.activo ? "#0b0b0b" : c.ink,
        toggle: async () => { if (!puedeEditar) return; try { await apiClient.put(`/tipos-clase/${t.idTipoClase}`, { nombre: t.nombre, activo: !t.activo }); await cargarTipos() } catch (err) { avisar(err.response?.data?.message || "No se pudo cambiar el tipo.") } },
      })),
      nt, onNt: (ev) => setNt(ev.target.value), ntDis: !nt.trim() || !puedeAlta, ntBg: nt.trim() ? "#9be600" : c.line2, ntFg: nt.trim() ? "#0b0b0b" : c.muted,
      addTipo: async () => { const n = nt.trim(); if (!n) return; try { await apiClient.post("/tipos-clase", { nombre: n }); setNt(""); await cargarTipos(); avisar(`Tipo "${n}" agregado.`) } catch (err) { avisar(err.response?.data?.message || "No se pudo crear el tipo.") } },
      sheet: sel != null, sTitle: conf ? "Eliminar plan" : esEdicion ? "Editar plan" : "Nuevo plan", close: () => { setSel(null); setF(null); setConf(false) },
      conf, formOn: !conf, isEdit: esEdicion, f: F,
      on: { n: cambiar("n"), d: cambiar("d"), p: cambiar("p"), c: cambiar("c"), w: cambiar("w") },
      nInv: tried && E.n ? "true" : "false", nBd: tried && E.n ? c.errFg : c.line, nH: tried && E.n ? "Poné un nombre." : "Lo ven los alumnos.", nHFg: tried && E.n ? c.errFg : c.muted,
      prBd: tried && E.p ? c.errFg : c.line, crBd: tried && E.c ? c.errFg : c.line,
      tipoOpts: T.filter((t) => t.activo || t.codigo === F.t).map((t) => { const ch = F.t === t.codigo; return { l: t.nombre, ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, bd: ch ? "#9be600" : c.btnLine, pick: () => setF((s) => ({ ...s, t: t.codigo })) } }),
      incN: (F.inc || []).length, incs: (F.inc || []).map((t, k) => ({ t, aria: "Quitar " + t, rm: () => setF((s) => ({ ...s, inc: s.inc.filter((_, j) => j !== k) })) })),
      ni, onNi: (ev) => setNi(ev.target.value), niDis: !ni.trim() || (F.inc || []).length >= MAX_CONDICIONES, niBg: ni.trim() ? "#9be600" : c.line2, niFg: ni.trim() ? "#0b0b0b" : c.muted,
      addInc: () => { const t = ni.trim(); if (!t || (F.inc || []).length >= MAX_CONDICIONES) return; setF((s) => ({ ...s, inc: [...(s.inc || []), t] })); setNi("") },
      pvN: F.n || "Nombre del plan", pvP: pesos(F.p), pv: prev,
      saveL: ocupado ? "GUARDANDO…" : hayError ? "COMPLETÁ NOMBRE, PRECIO Y CRÉDITOS" : esEdicion ? "GUARDAR CAMBIOS" : "CREAR PLAN",
      save: guardar, askDel: () => { if (puedeBaja) setConf(true) }, noDel: () => setConf(false),
      canDel: !F.al, noDelL: F.al ? "Entendido" : "Cancelar",
      delMsg: F.al ? `No se puede eliminar: ${F.al} ${F.al === 1 ? "alumno lo tiene activo" : "alumnos lo tienen activo"}. Esperá a que venzan sus membresías.` : "Ningún alumno lo tiene activo. No se puede deshacer.",
      doDel: eliminar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planes, tipos, tab, sel, f, conf, tried, ni, nt, toast, ocupado, c, noLeidas, sesion, abrirNotif, abrirCuenta])

  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { setSel(null); setF(null); setConf(false) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los planes.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
