import { avisarTexto } from "@/lib/avisoSileo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient, { enviarFormulario } from "@/api"
import { TIPOS_NOVEDAD, COLORES_NOVEDAD, colorDe } from "@/lib/novedades"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/NovedadesView"

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGEN = 5 * 1024 * 1024
const VACIO = { idNovedad: null, titulo: "", tipo: "aviso", texto: "", activa: true, hasta: "", imagen: null, archivo: null, previa: null, quitarImagen: false, enlace: "", enlaceTexto: "", colorFondo: "" }
const ddmm = (v) => { if (!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` }

// Novedades del admin en celular (referencia 12): lista con filtros y hoja para crear, editar o eliminar una novedad
export default function NovedadesCelular() {
  const { c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("configuracion:consulta") || permisos.includes("configuracion:ver")
  const puedeEditar = permisos.includes("configuracion:modificacion")
  const [lista, setLista] = useState(null)
  const [fl, setFl] = useState("todas")
  const [f, setF] = useState(null) // novedad abierta (nueva o existente)
  const [conf, setConf] = useState(false)
  const [tried, setTried] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast] = useState(null)
  const reloj = useRef(null)
  const archivo = useRef(null)
  const avisar = useCallback((t) => { avisarTexto(t) }, []) // los avisos los dibuja Sileo
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargar = useCallback(() => apiClient.get("/novedades").then((r) => setLista(r.data?.data || r.data || [])).catch(() => { setLista([]); avisar("No se pudieron cargar las novedades.") }), [avisar])
  useEffect(() => { if (puedeVer) cargar() }, [puedeVer, cargar])
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { setF(null); setConf(false) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  const elegirFoto = (e) => {
    const a = e.target.files?.[0]
    e.target.value = ""
    if (!a) return
    if (!TIPOS_IMAGEN.includes(a.type)) return avisar("La foto tiene que ser JPG, PNG, WEBP o GIF.")
    if (a.size > MAX_IMAGEN) return avisar("La foto pesa más de 5 MB.")
    setF((p) => { if (p?.previa) URL.revokeObjectURL(p.previa); return { ...p, archivo: a, previa: URL.createObjectURL(a), quitarImagen: false } })
  }

  const v = useMemo(() => {
    const N = lista || []
    const st = (n) => (!n.activa ? "oc" : !n.vigente ? "ven" : "act")
    const STL = { act: ["Visible", "#9be600", c.okFg], ven: ["Vencida", c.warnFg, c.warnFg], oc: ["Oculta", c.btnLine, c.muted] }
    const cnt = (k) => N.filter((n) => st(n) === k).length
    const filas = N.filter((n) => fl === "todas" || st(n) === fl)
    const F = f || VACIO
    const esEdicion = !!F.idNovedad
    const sinTitulo = !String(F.titulo || "").trim()
    const foto = F.previa || F.imagen
    const upd = (k) => (ev) => { const val = ev.target.value; setF((s) => ({ ...s, [k]: val })) }
    const colActual = colorDe(F).hex
    const guardar = async () => {
      if (sinTitulo || !String(F.texto || "").trim()) { setTried(true); return }
      if (guardando || !puedeEditar) return
      setGuardando(true)
      const fd = new FormData()
      fd.append("titulo", F.titulo); fd.append("tipo", F.tipo); fd.append("texto", F.texto); fd.append("activa", String(!!F.activa)); fd.append("hasta", F.hasta || "")
      fd.append("enlace", F.enlace || ""); fd.append("enlaceTexto", F.enlaceTexto || ""); fd.append("colorFondo", F.colorFondo || "")
      if (F.archivo) fd.append("imagen", F.archivo); else if (F.quitarImagen) fd.append("quitarImagen", "true")
      try {
        if (esEdicion) await enviarFormulario("PUT", `/novedades/${F.idNovedad}`, fd); else await enviarFormulario("POST", "/novedades", fd)
        setF(null); await cargar(); avisar(esEdicion ? "Cambios guardados." : F.activa ? "Novedad publicada." : "Borrador guardado.")
      } catch (err) { avisar(err.response?.data?.message || err.message || "No se pudo guardar la novedad.") } finally { setGuardando(false) }
    }
    const eliminar = async () => {
      try { await apiClient.delete(`/novedades/${F.idNovedad}`); setF(null); setConf(false); await cargar(); avisar("Novedad eliminada.") }
      catch (err) { setConf(false); avisar(err.response?.data?.message || "No se pudo eliminar la novedad.") }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, scheme: oscuro ? "dark" : "light", addNew: () => { if (puedeEditar) { setF({ ...VACIO }); setConf(false); setTried(false) } },
      fil: [["todas", "Todas", N.length], ["act", "Visibles", cnt("act")], ["ven", "Vencidas", cnt("ven")], ["oc", "Ocultas", cnt("oc")]].map(([id, l, n]) => { const p = fl === id; return { l, n, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setFl(id) } }),
      empty: lista !== null && !filas.length,
      list: filas.map((n) => { const s = STL[st(n)]; return { t: n.titulo, m: n.texto, tipo: (TIPOS_NOVEDAD[n.tipo]?.nombre || "Aviso").toUpperCase(), col: colorDe(n).hex, img: n.imagen ? `url('${n.imagen}')` : "none", st: s[0], dot: s[1], stFg: s[2], f: ddmm(n.creadaEn), op: st(n) === "act" ? 1 : 0.75, aria: `${TIPOS_NOVEDAD[n.tipo]?.nombre || "Aviso"}: ${n.titulo}, ${s[0]}. Editar`, open: () => { if (puedeEditar) { setF({ ...VACIO, idNovedad: n.idNovedad, titulo: n.titulo, tipo: n.tipo || "aviso", texto: n.texto || "", activa: !!n.activa, hasta: n.hasta ? String(n.hasta).slice(0, 10) : "", imagen: n.imagen || null, enlace: n.enlace || "", enlaceTexto: n.enlaceTexto || "", colorFondo: n.colorFondo || "" }); setConf(false); setTried(false) } } } }),
      sheet: !!f, sTitle: conf ? "Eliminar novedad" : esEdicion ? "Editar novedad" : "Nueva novedad", close: () => { setF(null); setConf(false) },
      conf, formOn: !conf, isEdit: esEdicion,
      f: { t: F.titulo, m: F.texto, u: F.enlace, b: F.enlaceTexto, h: F.hasta },
      on: { t: upd("titulo"), m: upd("texto"), u: upd("enlace"), b: upd("enlaceTexto"), h: upd("hasta") },
      tErr: tried && sinTitulo, tInv: tried && sinTitulo ? "true" : "false", tBd: tried && sinTitulo ? c.errFg : c.line,
      tipos: Object.entries(TIPOS_NOVEDAD).map(([k, t]) => { const ch = F.tipo === k; return { l: t.nombre, ch: ch ? "true" : "false", bg: ch ? c.ink : "transparent", fg: ch ? c.bg : c.ink, bd: ch ? c.ink : c.btnLine, pick: () => setF((s) => ({ ...s, tipo: k })) } }),
      cols: Object.values(COLORES_NOVEDAD).map((k) => { const ch = colActual === k.hex; return { v: k.hex, l: k.nombre, ch: ch ? "true" : "false", ring: ch ? c.ink : "transparent", pick: () => setF((s) => ({ ...s, colorFondo: k.hex })) } }),
      mN: String((F.texto || "").length), pvT: F.titulo || "Título de la novedad", pvM: F.texto || "Mensaje", pvB: (F.enlaceTexto || "Ver más").toUpperCase(), pvTipo: (TIPOS_NOVEDAD[F.tipo]?.nombre || "").toUpperCase(), pvImg: foto ? `url('${foto}')` : "none",
      fotoL: foto ? "Quitar foto" : "Elegir foto",
      togFoto: () => { if (foto) setF((s) => { if (s.previa) URL.revokeObjectURL(s.previa); return { ...s, archivo: null, previa: null, imagen: null, quitarImagen: true } }); else archivo.current?.click() },
      pubA: F.activa ? "true" : "false", togPub: () => setF((s) => ({ ...s, activa: !s.activa })), pubD: F.activa ? "Los alumnos la ven en la portada." : "Guardada como borrador. Nadie la ve.",
      swBg: F.activa ? "#9be600" : c.btnLine, swJ: F.activa ? "flex-end" : "flex-start", swK: F.activa ? "#0b0b0b" : c.ink,
      saveL: guardando ? "GUARDANDO…" : esEdicion ? "GUARDAR CAMBIOS" : F.activa ? "PUBLICAR" : "GUARDAR BORRADOR", save: guardar,
      askDel: () => setConf(true), noDel: () => setConf(false), doDel: eliminar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, fl, f, conf, tried, guardando, toast, c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta, puedeEditar])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver las novedades.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
      <input ref={archivo} type="file" accept={TIPOS_IMAGEN.join(",")} onChange={elegirFoto} style={{ display: "none" }} />
    </>
  )
}
