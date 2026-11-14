import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/EjerciciosView"

const ML = { peso: "Peso", repeticiones: "Repeticiones", tiempo: "Tiempo" }
const MD = { peso: "Gana el que levanta más peso. Los alumnos cargan kilos.", repeticiones: "Gana el que hace más repeticiones.", tiempo: "Gana el que lo termina en menos tiempo." }
const UNIDAD = { peso: "kg", repeticiones: "reps", tiempo: "s" }
const mejor = (valor, tipo) => { const n = Number(valor); if (!Number.isFinite(n)) return "—"; return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/, "")} ${UNIDAD[tipo] || ""}`.trim() }

// Ejercicios del RM del admin en celular (referencia 13): catálogo con búsqueda, filtros y hoja para agregar, renombrar o eliminar
export default function EjerciciosCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("configuracion:consulta") || permisos.includes("configuracion:ver")
  const puedeEditar = permisos.includes("configuracion:modificacion")
  const [lista, setLista] = useState(null)
  const [q, setQ] = useState("")
  const [fl, setFl] = useState("todos")
  const [f, setF] = useState(null) // { id, n, m, cnt, best } · id null = nuevo
  const [conf, setConf] = useState(false)
  const [tried, setTried] = useState(false)
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3500) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargar = useCallback(() => apiClient.get("/marcas/catalogo").then((r) => setLista(r.data?.data || [])).catch(() => { setLista([]); avisar("No se pudieron cargar los ejercicios.") }), [avisar])
  useEffect(() => { if (puedeVer) cargar() }, [puedeVer, cargar])
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { setF(null); setConf(false) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  const v = useMemo(() => {
    const E = lista || []
    const busq = q.trim().toLowerCase()
    const L = E.filter((e) => (fl === "todos" || e.tipoMarca === fl) && (!busq || e.nombre.toLowerCase().includes(busq)))
    const F = f || {}
    const esEdicion = !!f && f.id != null
    const nErr = tried && !String(F.n || "").trim()
    const guardar = async () => {
      if (!String(F.n || "").trim()) { setTried(true); return }
      if (!puedeEditar) return
      try {
        if (esEdicion) await apiClient.put(`/marcas/catalogo/${F.id}`, { nombre: F.n.trim() })
        else await apiClient.post("/marcas/catalogo", { nombre: F.n.trim(), tipoMarca: F.m })
        setF(null); await cargar(); avisar(esEdicion ? "Cambios guardados." : "Ejercicio agregado.")
      } catch (err) { avisar(err.response?.data?.message || "No se pudo guardar el ejercicio.") }
    }
    const eliminar = async () => {
      try { await apiClient.delete(`/marcas/catalogo/${F.id}`); setF(null); setConf(false); await cargar(); avisar("Ejercicio eliminado.") }
      catch (err) { setConf(false); avisar(err.response?.data?.message || "No se pudo eliminar el ejercicio.") }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, q, onQ: (ev) => setQ(ev.target.value),
      addNew: () => { if (puedeEditar) { setF({ id: null, n: "", m: "peso", cnt: 0, best: "—" }); setConf(false); setTried(false) } },
      fil: [["todos", "Todos"], ["peso", "Peso"], ["repeticiones", "Repeticiones"], ["tiempo", "Tiempo"]].map(([id, l]) => { const p = fl === id; return { l, n: id === "todos" ? E.length : E.filter((e) => e.tipoMarca === id).length, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setFl(id) } }),
      empty: lista !== null && !L.length, eT: E.length ? "No encontramos ejercicios" : "Todavía no hay ejercicios", lBd: L.length ? c.line : "transparent",
      list: L.map((e, j) => { const m = Number(e.marcas) || 0; const best = m ? mejor(e.mejorValor, e.tipoMarca) : "—"; return { n: e.nombre, m: ML[e.tipoMarca] || "—", s: m === 1 ? "1 marca cargada" : m + " marcas cargadas", best, sep: j ? c.line2 : "transparent", aria: `${e.nombre}, ${ML[e.tipoMarca] || ""}, mejor marca ${best}. Editar`, open: () => { if (puedeEditar) { setF({ id: e.idCatalogo, n: e.nombre, m: e.tipoMarca, cnt: m, best }); setConf(false); setTried(false) } } } }),
      sheet: !!f, sTitle: conf ? "Eliminar ejercicio" : esEdicion ? "Editar ejercicio" : "Nuevo ejercicio", close: () => { setF(null); setConf(false) },
      conf, formOn: !conf, isEdit: esEdicion, isNew: !esEdicion, f: F,
      onN: (ev) => setF((s) => ({ ...s, n: ev.target.value })), nErr, nInv: nErr ? "true" : "false", nBd: nErr ? c.errFg : c.line,
      med: ["peso", "repeticiones", "tiempo"].map((id) => { const ch = F.m === id; return { l: id === "peso" ? "Peso (kg)" : ML[id], ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, pick: () => { if (!esEdicion) setF((s) => ({ ...s, m: id })) } } }),
      mOp: esEdicion ? 0.6 : 1, mDesc: MD[F.m] || "",
      saveL: esEdicion ? "GUARDAR CAMBIOS" : "AGREGAR EJERCICIO", save: guardar,
      askDel: () => { if (F.cnt > 0) { avisar(`No se puede eliminar: tiene ${F.cnt} ${F.cnt === 1 ? "marca cargada" : "marcas cargadas"}.`); return } if (puedeEditar) setConf(true) }, noDel: () => setConf(false),
      delMsg: "No tiene marcas cargadas. No se puede deshacer.", doDel: eliminar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, q, fl, f, conf, tried, toast, c, noLeidas, sesion, abrirNotif, abrirCuenta, puedeEditar])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los ejercicios.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
