import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo } from "./pantallas/ResumenView"

const DIA_MS = 24 * 60 * 60 * 1000
const I = { money: "M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8", cal: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18", alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z", clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" }
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const pesos = (n) => "$" + Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const montoDe = (accion = "") => (String(accion).match(/\$\s?[\d.,]+/) || [""])[0]
const corta = (f) => { const d = new Date(f); return isNaN(d) ? "-" : `${d.getDate()} ${MESES[d.getMonth()]}` }
const hora = (f) => { const d = new Date(f); if (isNaN(d)) return null; const h = d.getHours(), m = d.getMinutes(); return h === 0 && m === 0 ? null : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` }
const metodo = (m) => ({ MercadoPago: "Mercado Pago", Efectivo: "Efectivo", Transferencia: "Transferencia" })[m] || m || ""
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

// Resumen del admin en celular (referencia 01): los datos salen de /dashboard/metrics, igual que el escritorio
export default function ResumenCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(false)
  const [filtro, setFiltro] = useState("todo")
  const [todo, setTodo] = useState(false)
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  // Solo oculta la pantalla: el permiso real lo controla el servidor en /dashboard/metrics
  const puedeVer = permisos.includes("dashboard:consulta")

  useEffect(() => {
    if (!puedeVer) return undefined
    let vigente = true
    apiClient.get("/dashboard/metrics")
      .then((r) => { if (vigente) setDatos({ ...(r.data?.data || r.data), ahora: Date.now() }) })
      .catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
  }, [puedeVer])

  const v = useMemo(() => {
    const d = datos
    const loading = !d && !error
    const tarjetas = d?.tarjetas || {}
    const total = Number(tarjetas.totalUsuarios) || 0
    const activos = Number(tarjetas.usuariosActivos) || 0
    const vencer = Number(tarjetas.membresiasPorVencer) || 0
    const sus = d?.suspendedUsers || []
    const atencion = d?.atencion || {}

    const kpis = [
      { l: "ACTIVOS", v: String(activos), n: `de ${total} usuarios`, fg: c.ink, dot: "#9be600", bd: c.line, aria: `Usuarios activos: ${activos} de ${total}`, href: "/admin/usuarios" },
      { l: "POR VENCER", v: String(vencer), n: "en renovación", fg: vencer ? c.warnFg : c.ink, dot: vencer ? c.warnFg : c.btnLine, bd: vencer ? c.warnLine : c.line, aria: `Membresías por vencer: ${vencer}`, href: "/admin/usuarios" },
      { l: "SIN PAGO", v: String(sus.length), n: sus.length ? (sus.length === 1 ? "suspendido" : "suspendidos") : "nadie suspendido", fg: sus.length ? c.errFg : c.ink, dot: sus.length ? c.errFg : c.btnLine, bd: sus.length ? c.errLine : c.line, aria: `Usuarios sin pago: ${sus.length}`, href: "/admin/usuarios" },
    ]

    // Requiere atención: usuarios sin pago y lo que está esperando una revisión
    const alertList = [
      ...sus.slice(0, 5).map((u) => ({ t: `${u.name} no pagó`, s: u.daysOverdue > 0 ? `${u.daysOverdue} días sin pagar · Cargar abono` : "Sin créditos · Cargar abono", d: I.alert, bg: c.errBg, fg: c.errFg, href: "/admin/usuarios/abonos/carga-masiva" })),
      ...(Number(atencion.pagosPendientes) > 0 ? [{ t: `${plural(Number(atencion.pagosPendientes), "pago pendiente", "pagos pendientes")} de confirmar`, s: "Revisar abonos", d: I.money, bg: c.warnBg, fg: c.warnFg, href: "/admin/usuarios/abonos/carga-masiva" }] : []),
      ...(Number(atencion.documentosPorRevisar) > 0 ? [{ t: `${plural(Number(atencion.documentosPorRevisar), "documento", "documentos")} para revisar`, s: "Ver usuarios", d: I.doc, bg: c.warnBg, fg: c.warnFg, href: "/admin/usuarios" }] : []),
      ...(Number(atencion.cuentasSinVerificar) > 0 ? [{ t: `${plural(Number(atencion.cuentasSinVerificar), "cuenta", "cuentas")} sin verificar el correo`, s: "Ver usuarios", d: I.clock, bg: c.warnBg, fg: c.warnFg, href: "/admin/usuarios" }] : []),
    ].map((a, i) => ({ ...a, sep: i ? c.line2 : "transparent" }))

    // Actividad: filtros, grupos por semana y mes, y "Ver más"
    const grupoDe = (f) => {
      const t = new Date(f).getTime()
      if (isNaN(t)) return "-"
      if (d?.ahora && d.ahora - t <= 7 * DIA_MS) return "ESTA SEMANA"
      return new Date(t).toLocaleDateString("es-AR", { month: "long" }).toUpperCase()
    }
    const todas = (d?.recentActivity || []).map((a) => {
      const pago = a.type === "payment" || String(a.action || "").toLowerCase().includes("pago")
      const reserva = a.type === "reservation" || String(a.action || "").toLowerCase().includes("reserv")
      let que = a.action
      if (a.type === "payment") que = `Pago recibido${a.plan ? " · " + a.plan : ""}${a.metodo ? " · " + metodo(a.metodo) : ""}`
      else if (a.type === "reservation" && a.fechaClase && a.horaClase) {
        const dia = new Date(a.fechaClase + "T12:00:00")
        que = `Reservó la clase del ${dia.toLocaleDateString("es-AR", { weekday: "long" })} ${dia.getDate()}, ${String(a.horaClase).slice(0, 5)}`
      } else if (/^Reservó:\s*(.+)$/i.test(String(a.action))) que = String(a.action).replace(/^Reservó:\s*/i, "Reservó la clase de ").trim()
      const importe = a.type === "payment" && a.importe != null ? pesos(a.importe) : (pago ? montoDe(a.action) : "")
      const cuando = `${corta(a.fecha_orden)}${hora(a.fecha_orden) ? " · " + hora(a.fecha_orden) : ""}`
      return { k: pago ? "pago" : reserva ? "res" : "otro", g: grupoDe(a.fecha_orden), who: a.user, what: que, amt: importe, when: cuando, d: pago ? I.money : I.cal, icBg: pago ? c.tile : c.surf, icFg: pago ? c.okFg : c.muted, amtFg: pago ? c.okFg : c.muted, href: "/admin/usuarios" }
    })
    const filtradas = todas.filter((r) => filtro === "todo" || (filtro === "pagos" ? r.k === "pago" : r.k === "res"))
    const visibles = todo ? filtradas : filtradas.slice(0, 6)
    const grupos = []
    for (const r of visibles) {
      let g = grupos.find((x) => x.t === r.g)
      if (!g) { g = { t: r.g, items: [] }; grupos.push(g) }
      g.items.push(r)
    }
    grupos.forEach((g) => { g.items = g.items.map((r, i) => ({ ...r, sep: i ? c.line2 : "transparent", aria: [r.who, r.what, r.amt, r.when].filter(Boolean).join(", ") })) })

    const nombre = (sesion.nombrecompleto || "").trim()
    const fechaTxt = (() => { const t = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(", ", " "); return t.charAt(0).toUpperCase() + t.slice(1) })()
    const hoyClases = (d?.clasesDeHoy || []).map((k) => ({ nombre: k.name, sub: `${k.time} · ${k.coach}`, cupos: String(k.spots || "0/0"), cuposTxt: "cupos", aria: `${k.name}, ${k.time}, ${k.spots} cupos`, href: "/admin/clases" }))

    return {
      c, loading, ready: !loading, kpis, allOk: alertList.length === 0, alertas: alertList.length > 0, alertList,
      acciones: [{ t: "Nuevo usuario", href: "/admin/usuarios/nuevo", d: "M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M16 11h6" }, { t: "Crear clase", href: "/admin/clases/nueva", d: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18" }, { t: "Check‑in", href: "/admin/checkin", d: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8" }],
      filtros: [["todo", "Todo"], ["pagos", "Pagos"], ["res", "Reservas"]].map(([id, l]) => { const p = filtro === id; return { l, p: p ? "true" : "false", bg: p ? "#9be600" : "transparent", fg: p ? "#0b0b0b" : c.ink, pick: () => { setFiltro(id); setTodo(false) } } }),
      grupos, actEmpty: !loading && grupos.length === 0, more: !loading && filtradas.length > visibles.length, showMore: () => setTodo(true),
      toast: null,
      fecha: fechaTxt, saludo: `Hola, ${nombre.split(/\s+/)[0] || "admin"}`, iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`,
      abrirNotif, abrirCuenta,
      hrefAbono: "/admin/usuarios/abonos/carga-masiva", hrefClases: "/admin/clases",
      ingresos: pesos(Number(tarjetas.ingresosMes) || 0),
      pagosTxt: error ? "No se pudo cargar" : "Pagos confirmados",
      hoy: { clases: hoyClases, titulo: "Hoy no hay clases", sub: "Cuando haya clases para hoy, aparecen acá." },
    }
  }, [datos, error, c, filtro, todo, noLeidas, sesion, abrirNotif, abrirCuenta])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver el resumen.</div>

  return (
    <>
      <style>{".hvrow:hover { background: " + c.surf + " !important; }"}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
    </>
  )
}
