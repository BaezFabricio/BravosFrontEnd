import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import apiClient, { enviarFormulario } from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/AbonosView"

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const pesos = (n) => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const dia = (f) => String(f || "").slice(0, 10)
const fmtD = (d) => { const [Y, M, D] = String(d).split("-").map(Number); return Y ? `${D} ${MESES[M - 1].slice(0, 3)} ${Y}` : "" }
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
// Las membresías vencen siempre un día 10: el próximo 10 posterior al inicio, y si quedan menos de 10 días pasa al siguiente
// (misma regla que el cobro online y la carga masiva)
const proximoDia10 = (iso) => {
  const [Y, M, D] = iso.split("-").map(Number)
  const desde = new Date(Y, M - 1, D, 12)
  const venc = new Date(Y, M - 1, 10, 12)
  if (venc <= desde) venc.setMonth(venc.getMonth() + 1)
  if ((venc - desde) / 86400000 < 10) venc.setMonth(venc.getMonth() + 1)
  return `${venc.getFullYear()}-${String(venc.getMonth() + 1).padStart(2, "0")}-10`
}
const METODOS = [["Efectivo", "Efectivo"], ["Transferencia", "Transferencia"], ["Débito", "Débito"], ["Tarjeta Crédito", "Crédito"]]

// Abonos del admin en celular (referencia 06): membresías del mes y hoja para cargar un abono a un alumno
export default function AbonosCelular() {
  const { c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const [params] = useSearchParams()
  const usuarioPre = params.get("usuario")
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver") || permisos.includes("creditos:consulta")
  const puedeAlta = permisos.includes("usuarios:alta") || permisos.includes("creditos:alta") || permisos.includes("usuarios:modificacion")

  const [abonos, setAbonos] = useState(null)
  const [planes, setPlanes] = useState([])
  const [alumno, setAlumno] = useState(null)
  const [m, setM] = useState(0)
  const [sheet, setSheet] = useState(false)
  // Elegir el alumno sin salir de la hoja: lista con buscador (se carga la primera vez que se abre)
  const [elegir, setElegir] = useState(false)
  const [busca, setBusca] = useState("")
  const [usuarios, setUsuarios] = useState(null)
  // Filtro por hora de las clases próximas del alumno ("all" = todas)
  const [horaF, setHoraF] = useState("all")
  const [plan, setPlan] = useState(null)
  const [met, setMet] = useState("Efectivo")
  const [monto, setMonto] = useState("")
  const [ini, setIni] = useState(hoyISO())
  const [fin, setFin] = useState(proximoDia10(hoyISO()))
  // Horario (opcional, solo para anotar: no se guarda), comprobantes del alumno y comprobante elegido (undefined = el más reciente)
  const [hor, setHor] = useState("")
  const [docs, setDocs] = useState([])
  const [comp, setComp] = useState(undefined)
  const [visor, setVisor] = useState(null)
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 4000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargar = useCallback(() => {
    const url = usuarioPre ? `/usuarios/${usuarioPre}/abonos` : "/usuarios/abonos/todos"
    return apiClient.get(url).then((r) => setAbonos(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => setAbonos([]))
  }, [usuarioPre])
  useEffect(() => {
    if (!puedeVer) return
    cargar()
    apiClient.get("/planes").then((r) => setPlanes(r.data?.data || [])).catch(() => {})
    if (usuarioPre) apiClient.get(`/usuarios/${usuarioPre}`).then((r) => { const u = r.data?.data || r.data?.usuario || r.data; setAlumno({ id: usuarioPre, nombre: u.nombre || u.nombrecompleto || "", dni: u.dni || "" }) }).catch(() => {})
  }, [puedeVer, cargar, usuarioPre])

  const abrirElegir = useCallback(() => {
    setBusca(""); setElegir(true)
    if (usuarios === null) apiClient.get("/usuarios").then((r) => { const l = r.data?.data || r.data; setUsuarios(Array.isArray(l) ? l : []) }).catch(() => setUsuarios([]))
  }, [usuarios])
  // Desde el resumen se llega con ?nuevo=1: la hoja se abre sola y, si no se sabe el alumno, ya muestra para elegirlo
  const abierto = useRef(false)
  useEffect(() => {
    if (abierto.current || !puedeAlta || params.get("nuevo") !== "1") return
    abierto.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheet(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!usuarioPre) abrirElegir()
  }, [params, puedeAlta, usuarioPre, abrirElegir])

  const cargarDocs = useCallback((id) => (id ? apiClient.get(`/documentos/usuario/${id}`).then((r) => setDocs(r.data?.data || [])).catch(() => setDocs([])) : Promise.resolve(setDocs([]))), [])
  useEffect(() => { setComp(undefined); cargarDocs(alumno?.id) }, [alumno?.id, cargarDocs])

  useEffect(() => {
    // Esc cierra primero la pantalla del comprobante y después la hoja
    const tecla = (e) => { if (e.key === "Escape") { if (visor) setVisor(null); else if (elegir) setElegir(false); else setSheet(false) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [visor, elegir])

  const v = useMemo(() => {
    const hoy = new Date()
    const base = hoy.getFullYear() * 12 + hoy.getMonth() + m
    const y = Math.floor(base / 12), mn = base % 12
    const clave = `${y}-${String(mn + 1).padStart(2, "0")}`
    const mes = MESES[mn].charAt(0).toUpperCase() + MESES[mn].slice(1) + " " + y
    const loading = abonos === null
    const L = (abonos || []).map((a) => ({ id: a.idAbono || a.id, inicio: dia(a.fechaInicio || a.inicio), vence: dia(a.fechaVencimiento || a.vencimiento), name: a.nombreAlumno || alumno?.nombre || "—", plan: a.tipoAbono || a.abono || "Abono", met: a.metodoPago || "—", amt: Number(a.importe) || 0, idUsuario: a.idUsuario || usuarioPre, horas: a.horas || [] })).filter((a) => a.inicio.startsWith(clave)).sort((a, b) => b.inicio.localeCompare(a.inicio))
    const total = L.reduce((s, x) => s + x.amt, 0)
    const horasOpc = [...new Set(L.flatMap((x) => x.horas || []))].sort()
    const LF = horaF === "all" ? L : L.filter((x) => (x.horas || []).includes(horaF))
    const elegido = planes.find((p) => String(p.idPlan) === plan)
    const mErr = !(Number(monto) > 0)
    const nErr = (elegido ? 0 : 1) + (mErr ? 1 : 0) + (alumno ? 0 : 1)
    const precio = (p, metodo) => (p ? Math.round(Number(p.precio) * (metodo === "Tarjeta Crédito" ? 1.1 : 1)) : 0)
    // Comprobantes que el alumno subió desde la fecha de inicio; el elegido es el que se tocó o, si no, el más reciente
    const fmtDoc = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}` }
    const desde = ini ? new Date(ini + "T00:00:00") : null
    const docsAl = docs.filter((d) => d.tipo === "comprobante_transferencia" && (!desde || !d.creadoEn || new Date(d.creadoEn) >= desde))
    const compSel = (() => { const id = comp === undefined ? (docsAl[0]?.idDocumento ?? null) : comp; return docsAl.some((d) => d.idDocumento === id) ? id : null })()
    const primerNombre = (alumno?.nombre || "El alumno").trim().split(/\s+/)[0]
    const guardar = async () => {
      if (saving) return
      if (nErr) { setTried(true); setTimeout(() => document.getElementById("err-ab")?.focus(), 0); return }
      setSaving(true); setErrorServidor("")
      try {
        await apiClient.post(`/usuarios/${alumno.id}/abonos`, { tipoAbono: elegido.nombre, fechaInicio: ini, fechaVencimiento: fin || undefined, metodoPago: met, importe: parseFloat(monto), idUsuarioOperador: sesion.idUsuario })
        // Pago por transferencia: se aprueba solo el comprobante que se eligió
        if (met === "Transferencia" && compSel) {
          try { await apiClient.patch(`/documentos/${compSel}/aprobar`) } catch { /* el abono ya quedó guardado */ }
        }
        await cargar()
        setSheet(false); setM(0); setPlan(null); setMonto(""); setTried(false); setHor(""); setComp(undefined); cargarDocs(alumno.id)
        avisar(`Abono guardado: ${pesos(monto)} de ${alumno.nombre}.`)
      } catch (err) { setErrorServidor(err.response?.data?.message || "No se pudo guardar el abono."); setTried(true) } finally { setSaving(false) }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, mes, mesCorto: MESES[mn] + " " + y, actual: m === 0, notActual: m !== 0, nextFg: m === 0 ? c.muted : c.ink, nextOp: m === 0 ? 0.4 : 1,
      prev: () => setM((x) => x - 1), next: () => { if (m < 0) setM((x) => x + 1) }, hoy: () => setM(0),
      total: pesos(total), countLabel: LF.length === 1 ? "1 abono" : LF.length + " abonos",
      loading, empty: !loading && !LF.length, hasList: LF.length > 0,
      horasOpc: [{ id: "all", label: "Todas" }, ...horasOpc.map((h) => ({ id: h, label: h }))].map((o) => { const ch = horaF === o.id; return { id: o.id, label: o.label, ch: ch ? "true" : "false", bd: ch ? "2px solid #9be600" : "1px solid " + c.line2, bg: ch ? c.okBg : c.surf, fg: ch ? c.okFg : c.ink, pick: () => setHoraF(o.id) } }),
      lista: LF.map((x, i) => ({ ...x, ini: x.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?", rango: `${fmtD(x.inicio)} → ${fmtD(x.vence)}`, amt: pesos(x.amt), sep: i ? c.line2 : "transparent", href: x.idUsuario ? `/admin/usuarios/${x.idUsuario}` : "/admin/usuarios", aria: `${x.name}, ${x.plan}, ${x.met}, ${pesos(x.amt)}, ${fmtD(x.inicio)} a ${fmtD(x.vence)}` })),
      sheet, openNew: () => { if (puedeAlta) { setSheet(true); setTried(false) } }, close: () => setSheet(false),
      alu: { ini: alumno ? alumno.nombre.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "?", nombre: alumno ? alumno.nombre : "Elegí un alumno", dni: alumno ? "DNI " + alumno.dni : "Desde su ficha o la lista de usuarios", cambiar: alumno ? "Cambiar" : "Elegir", abrirElegir, corto: primerNombre },
      pick: {
        open: elegir, q: busca, onQ: (ev) => setBusca(ev.target.value), cerrar: () => setElegir(false), cargando: usuarios === null,
        lista: (usuarios || []).map((u) => ({ id: u.idUsuario || u.id, nombre: u.nombre || u.nombrecompleto || "", dni: u.dni || "" }))
          .filter((u) => u.id && u.nombre && (!busca.trim() || (u.nombre + " " + u.dni).toLowerCase().includes(busca.trim().toLowerCase())))
          .slice(0, 60)
          .map((u) => ({ ...u, ini: u.nombre.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?", elegir: () => { setAlumno({ id: String(u.id), nombre: u.nombre, dni: u.dni }); setElegir(false) } })),
      },
      planes: planes.map((p) => { const ch = plan === String(p.idPlan); return { id: p.idPlan, n: p.nombre, s: `${p.cantidadCreditos} ${Number(p.cantidadCreditos) === 1 ? "crédito" : "créditos"}`, pr: pesos(p.precio), ch: ch ? "true" : "false", bd: ch ? "2px solid #9be600" : "1px solid " + (tried && !elegido ? c.errFg : c.line2), bg: ch ? c.okBg : c.surf, rd: ch ? "6px solid #9be600" : "2px solid " + c.btnLine, rBg: ch ? "#0b0b0b" : "transparent", pick: () => { setPlan(String(p.idPlan)); setMonto(String(precio(p, met))); setFin(masUnMes(ini)) } } }),
      planErr: tried && !elegido, planInv: tried && !elegido ? "true" : "false",
      metodos: METODOS.map(([val, l]) => { const ch = met === val; return { l, ch: ch ? "true" : "false", bd: ch ? "2px solid #9be600" : "1px solid " + c.line2, bg: ch ? c.okBg : c.surf, fg: ch ? c.okFg : c.ink, pick: () => { setMet(val); if (elegido) setMonto(String(precio(elegido, val))) } } }),
      isTransf: met === "Transferencia",
      hor, onHor: (ev) => setHor(ev.target.value),
      // Créditos: los del plan (no se ajustan a mano)
      cred: elegido ? String(elegido.cantidadCreditos) : "", credFg: elegido ? c.okFg : c.muted, credH: elegido ? "Los del plan." : "Se completa al elegir el plan.", credMas: () => {}, credMenos: () => {},
      comps: docsAl.map((d) => { const sel = compSel === d.idDocumento; return { n: d.nombreArchivo || "comprobante", d: d.creadoEn ? fmtDoc(d.creadoEn) : "", verA: "Ver comprobante " + (d.nombreArchivo || ""), ch: sel ? "true" : "false", bd: sel ? "2px solid #9be600" : "1px solid " + c.line2, pick: () => setComp(sel ? null : d.idDocumento), ver: () => setVisor(d) } }),
      noComps: !docsAl.length, desde: fmtDoc(ini + "T12:00:00") || "la fecha de inicio",
      vOn: !!visor, v: visor ? { al: primerNombre, n: visor.nombreArchivo || "comprobante", d: visor.creadoEn ? fmtDoc(visor.creadoEn) : "", url: visor.urlArchivo, img: /\.(jpe?g|png|webp)$/i.test(visor.urlArchivo || ""), pdf: /\.pdf$/i.test(visor.urlArchivo || "") } : {},
      vClose: () => setVisor(null), vUsar: () => { if (visor) { setComp(visor.idDocumento); setVisor(null) } }, vUsarL: visor && compSel === visor.idDocumento ? "YA ESTÁ ELEGIDO" : "USAR ESTE COMPROBANTE",
      adjuntar: () => document.getElementById("adj-ab")?.click(),
      onAdjunto: async (ev) => {
        const archivo = ev.target.files?.[0]
        ev.target.value = ""
        if (!archivo || !alumno?.id) return
        if (archivo.size > 10 * 1024 * 1024) { avisar("El archivo pasa los 10 MB."); return }
        const datos = new FormData()
        datos.append("archivo", archivo)
        try {
          const r = await enviarFormulario("POST", `/documentos/usuario/${alumno.id}/subir`, datos)
          await cargarDocs(alumno.id)
          if (r?.data?.idDocumento) setComp(r.data.idDocumento)
          avisar("Comprobante adjuntado.")
        }
        catch (err) { avisar(err.message || "No se pudo adjuntar el comprobante.") }
      },
      monto, onMonto: (ev) => setMonto(ev.target.value.replace(/\D/g, "").slice(0, 8)),
      montoInv: tried && mErr ? "true" : "false", montoBd: tried && mErr ? c.errFg : c.line,
      montoH: tried && mErr ? "Ingresá el monto cobrado." : elegido ? `Precio del plan: ${pesos(elegido.precio)}${met === "Tarjeta Crédito" ? " + 10% por tarjeta de crédito" : ""}. Podés cambiarlo si hubo descuento.` : "Se completa al elegir el plan.", montoHFg: tried && mErr ? c.errFg : c.muted,
      ini, fin, scheme: oscuro ? "dark" : "light", onIni: (ev) => { const val = ev.target.value; if (val) { setIni(val); setFin(proximoDia10(val)) } }, onFin: (ev) => setFin(ev.target.value),
      err: tried && (nErr > 0 || !!errorServidor), errMsg: errorServidor || (!alumno ? "Elegí un alumno desde su ficha." : nErr === 1 ? "Revisá 1 campo antes de guardar." : `Revisá ${nErr} campos antes de guardar.`),
      resumen: elegido ? `${elegido.nombre} · ${met}` : false, resumenAmt: pesos(monto),
      saving, saveBg: saving ? "#7fbf00" : "#9be600", saveLabel: saving ? "Guardando…" : "GUARDAR ABONO", save: guardar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abonos, planes, alumno, m, sheet, plan, met, monto, ini, fin, tried, saving, errorServidor, toast, c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta, usuarioPre, horaF, hor, docs, comp, visor])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los abonos.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
