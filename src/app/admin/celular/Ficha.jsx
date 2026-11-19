import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import apiClient, { cambiarEstadoUsuario, eliminarUsuario, getUsuarioById } from "@/api"
import { enlaceWhatsApp } from "@/lib/whatsapp"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/FichaView"

const I = { cal: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18", money: "M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8", doc: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5" }
const TIPOS_DOC = [["certificado_medico", "Certificado médico"], ["declaracion_jurada", "Declaración jurada"], ["comprobante_transferencia", "Comprobante de transferencia"]]
const pesos = (n) => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const fecha = (f) => { if (!f) return ""; const [y, m, d] = String(f).slice(0, 10).split("-").map(Number); return y ? `${d} ${MESES[m - 1]} ${y}` : "" }
const corta = (f) => { if (!f) return ""; const [, m, d] = String(f).slice(0, 10).split("-").map(Number); return `${d} ${MESES[m - 1]}` }
const ESTADO_RESERVA = { proxima: "Próxima", cancelada: "Cancelada", asistida: "Asistió", ausente: "No asistió", presente: "Asistió" }

// Ficha del alumno en celular (referencia 04): datos, reservas, abonos y documentos, con desactivar y eliminar
export default function FichaCelular() {
  const { c, oscuro } = useCelular()
  const { id } = useParams()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver")
  const puedeEditar = permisos.includes("usuarios:modificacion"), puedeBaja = permisos.includes("usuarios:baja")
  const propia = useMemo(() => { try { return Number(JSON.parse(localStorage.getItem("usuario") || "{}").idUsuario) === Number(id) } catch { return false } }, [id])

  const [user, setUser] = useState(null)
  const [ficha, setFicha] = useState(null)
  const [fichaLista, setFichaLista] = useState(false) // la ficha de alumno ya respondió (bien o mal)
  const [reservas, setReservas] = useState([])
  const [pagos, setPagos] = useState([])
  const [docs, setDocs] = useState([])
  const [error, setError] = useState(false)
  const [tab, setTab] = useState("datos")
  const [menu, setMenu] = useState(false)
  const [dlg, setDlg] = useState(null)
  const [conf, setConf] = useState("")
  const [busy, setBusy] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 4000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  useEffect(() => {
    if (!id || !puedeVer) return
    getUsuarioById(id).then((u) => setUser(u?.data || u)).catch(() => setError(true))
    apiClient.get(`/usuarios/${id}/ficha`).then((r) => setFicha(r.data?.data || null)).catch(() => setFicha(null)).finally(() => setFichaLista(true))
    apiClient.get(`/reservas/admin/usuario/${id}`).then((r) => setReservas(r.data?.data || r.data || [])).catch(() => {})
    apiClient.get(`/usuarios/${id}/pagos`).then((r) => setPagos(r.data?.data || [])).catch(() => {})
    apiClient.get(`/documentos/usuario/${id}`).then((r) => setDocs(r.data?.data || r.data || [])).catch(() => {})
  }, [id, puedeVer])

  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { setMenu(false); setDlg(null) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  const v = useMemo(() => {
    const u = user || {}
    const nombre = u.nombre || u.nombrecompleto || (error ? "No se pudo cargar" : "Cargando…")
    const perfil = String(u.perfil || "").trim()
    const perfilCap = u.perfiles?.length > 1 ? u.perfiles.map((p) => p.nombrePerfil).filter(Boolean).join(" ") : (perfil ? perfil.charAt(0).toUpperCase() + perfil.slice(1).toLowerCase() : "Sin perfil")
    const off = u.estado === "inactivo"
    const mem = u.membresia
    // Mientras llegan los datos no se muestra un estado inventado ("vencida" por defecto): primero "Cargando…" y recién después el real
    const cargando = !user && !error
    const memCargando = cargando || !fichaLista
    const vigente = ficha?.vigente || null
    const esAlumno = ficha?.esAlumno !== false
    const dp = ficha?.datosPersona || {}
    const falta = { v: "Sin cargar", fg: c.muted, font: "italic 500 14px Archivo" }
    const R = (k, val, x) => ({ k, v: val, fg: c.ink, font: "700 14px Archivo", ...(x || {}) })
    const sep = (rows) => rows.map((r, i) => ({ ...r, sep: i ? c.line2 : "transparent" }))
    const ultimo = pagos[0]
    const estadoTxt = mem === "vigente" || mem === "activa" ? "Activa" : mem === "por_vencer" ? "Por vencer" : "Vencida"
    const grupos = [
      ...(esAlumno ? [{ t: "MEMBRESÍA", rows: sep([
        R("Plan", memCargando ? "Cargando…" : (vigente?.plan || ultimo?.plan || "Sin plan activo"), memCargando ? { fg: c.muted } : {}),
        R("Estado", memCargando ? "Cargando…" : estadoTxt, memCargando ? { fg: c.muted } : estadoTxt === "Activa" ? { fg: c.okFg } : { fg: c.warnFg }),
        ...(memCargando ? [] : vigente ? [R("Inicio", fecha(vigente.inicio)), R("Vence", fecha(vigente.vencimiento)), R("Créditos", `${vigente.creditos} de ${vigente.totalCreditos}`)] : [R("Créditos", "0")]),
        ...(ultimo ? [R("Último pago", `${pesos(ultimo.importe)} · ${corta(ultimo.fecha)}`)] : []),
      ]) }] : []),
      { t: "DATOS PERSONALES", rows: sep([
        R("DNI", u.dni || "—"), R("Correo", u.email || "—", { font: "700 13px Archivo" }), R("Teléfono", u.telefono || "—"),
        dp.fechaNacimiento ? R("Nacimiento", fecha(dp.fechaNacimiento)) : R("Nacimiento", "", falta),
        dp.contactoEmergencia ? R("Contacto de emergencia", `${dp.contactoEmergencia}${dp.telefonoEmergencia ? " · " + dp.telefonoEmergencia : ""}`) : R("Contacto de emergencia", "", falta),
      ]) },
      { t: "CUENTA", rows: sep([R("Perfil", perfilCap), R("Acceso a la app", off ? "Inactivo" : "Activo", off ? { fg: c.muted } : {})]) },
    ]
    const faltan = (dp.fechaNacimiento ? 0 : 1) + (dp.contactoEmergencia ? 0 : 1)

    const O = {
      res: { icon: I.cal, rows: reservas.map((r) => ({ t: r.nombreClase, s: `${fecha(r.fechaReserva)}${r.horaInicio ? " · " + String(r.horaInicio).slice(0, 5) : ""}`, v: ESTADO_RESERVA[r.asistencia === "presente" ? "presente" : r.estadoReserva] || r.estadoReserva || "", fg: r.estadoReserva === "cancelada" ? c.muted : c.ink })), et: "Sin reservas", es: "Todavía no reservó ninguna clase." },
      ab: { icon: I.money, rows: pagos.map((p) => ({ t: p.plan || "Abono", s: `${fecha(p.fecha)}${p.vencimiento ? " → " + fecha(p.vencimiento) : ""}${p.formaPago ? " · " + p.formaPago : ""}`, v: pesos(p.importe), fg: String(p.estadoPago || "").toLowerCase().includes("pend") ? c.warnFg : c.okFg })), et: "Sin abonos", es: "Todavía no tiene pagos cargados." },
      doc: { icon: I.doc, rows: TIPOS_DOC.map(([key, label]) => { const d = docs.find((x) => x.tipo === key); const ok = d?.estado === "aprobado"; return { t: label, s: d ? `Subido el ${fecha(d.creadoEn)}` : "Sin archivo subido", v: !d ? "Pendiente" : ok ? "Aprobado" : "Por revisar", fg: ok ? c.okFg : c.warnFg } }), et: "", es: "" },
    }
    const o = O[tab] || O.res
    const okConf = conf.trim().toUpperCase() === "ELIMINAR"
    const cerrar = () => { setMenu(false); setDlg(null); setConf(""); setTimeout(() => document.getElementById("btn-more")?.focus(), 0) }
    const cambiarEstado = async (estado) => {
      setBusy(true)
      try { await cambiarEstadoUsuario(id, estado); setUser((x) => ({ ...x, estado })); setDlg(null); setMenu(false); avisar(estado === "inactivo" ? `Desactivaste a ${nombre}.` : `${nombre} está activo de nuevo.`) }
      catch (err) { setDlg(null); avisar(err.response?.data?.message || "No se pudo cambiar el estado.") } finally { setBusy(false) }
    }
    const chip = cargando ? "CARGANDO…" : off ? "DESACTIVADO" : mem === "vigente" || mem === "activa" ? "MEMBRESÍA ACTIVA" : mem === "por_vencer" ? "POR VENCER" : "MEMBRESÍA VENCIDA"
    const chOk = !cargando && !off && (mem === "vigente" || mem === "activa")
    return {
      c,
      tabs2: [["datos", "Datos"], ["res", "Reservas"], ["ab", "Abonos"], ["doc", "Docs"]].map(([tid, l]) => { const s = tid === tab; return { id: "tb-" + tid, l, sel: s ? "true" : "false", ti: s ? 0 : -1, bar: s ? "#9be600" : "transparent", fg: s ? c.ink : c.muted, pick: () => setTab(tid) } }),
      tabId: "tb-" + tab, tDatos: tab === "datos", tOtro: tab !== "datos",
      grupos, oIcon: o.icon, oList: o.rows.length > 0, oEmpty: !o.rows.length, oEmptyT: o.et, oEmptyS: o.es, oRows: sep(o.rows),
      chip, chBg: off || cargando ? "transparent" : chOk ? c.okBg : c.warnBg, chBd: off || cargando ? c.btnLine : chOk ? c.okLine : c.warnLine, chFg: off || cargando ? c.muted : chOk ? c.okFg : c.warnFg, inactivo: off,
      reactivar: () => { if (puedeEditar && !propia) cambiarEstado("activo") },
      menu, openMenu: () => setMenu(true), closeAll: cerrar,
      togIcon: off ? "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 8.5v7l6-3.5z" : "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 9v6M14 9v6", togT: off ? "Reactivar usuario" : "Desactivar usuario", togS: off ? "Vuelve a poder reservar y entrar a la app." : "No podrá reservar. Se guardan sus datos.",
      askToggle: () => { if (!puedeEditar || propia) { setMenu(false); avisar(propia ? "No podés desactivar tu propia cuenta." : "No tenés permiso para cambiar el estado."); return } if (off) cambiarEstado("activo"); else { setMenu(false); setDlg("off"); setConf("") } },
      askDel: () => { if (!puedeBaja || propia) { setMenu(false); avisar(propia ? "No podés eliminar tu propia cuenta." : "No tenés permiso para eliminar usuarios."); return } setMenu(false); setDlg("del"); setConf("") },
      dlgOff: dlg === "off", dlgDel: dlg === "del", busy,
      offLabel: busy ? "Desactivando…" : "Desactivar", doOff: () => cambiarEstado("inactivo"),
      conf, onConf: (ev) => setConf(ev.target.value), confBd: okConf ? c.errFg : c.line,
      delDis: !okConf || busy, delBg: okConf ? c.errFg : c.line2, delFg: okConf ? (oscuro ? "#1a0a08" : "#ffffff") : c.muted, delCur: okConf ? "pointer" : "not-allowed", delLabel: busy ? "Eliminando…" : "Eliminar para siempre",
      doDel: async () => { if (!okConf) return; setBusy(true); try { await eliminarUsuario(id); setDlg(null); setDeleted(true) } catch (err) { setDlg(null); avisar(err.response?.data?.message || "No se pudo eliminar el usuario.") } finally { setBusy(false) } },
      deleted, toast,
      ini: nombre.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?", nombre,
      subtitulo: `${perfilCap} · DNI ${u.dni || "—"}`,
      wa: enlaceWhatsApp(u.telefono, "") || "#", telHref: u.telefono ? `tel:${u.telefono}` : "#",
      hrefEditar: `/admin/usuarios/${id}/editar`, hrefAbono: `/admin/usuarios/abonos/carga-masiva?usuario=${id}`,
      faltan: esAlumno && faltan > 0, faltanTxt: `Faltan ${faltan} ${faltan === 1 ? "dato" : "datos"}: ${[dp.fechaNacimiento ? null : "nacimiento", dp.contactoEmergencia ? null : "contacto de emergencia"].filter(Boolean).join(" y ")}`,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ficha, fichaLista, reservas, pagos, docs, error, tab, menu, dlg, conf, busy, deleted, toast, c, oscuro, id, propia, puedeEditar, puedeBaja])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver usuarios.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
