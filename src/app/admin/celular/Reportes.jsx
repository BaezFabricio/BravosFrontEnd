import { avisarTexto } from "@/lib/avisoSileo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient from "@/api"
import { descargarExcel } from "@/lib/exportarExcel"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/ReportesView"

const pesos = (n) => "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const ESTADOS = { proxima: "Próxima", cancelada: "Cancelada", asistio: "Asistió", ausente: "Ausente", completada: "Completada" }
const hh = (h) => (h ? String(h).slice(0, 5) : "")

// Reportes del admin en celular (referencia 10): ingresos, alumnos por plan, reservas y ocupación, por período
export default function ReportesCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("dashboard:consulta") || permisos.includes("dashboard:ver")
  const [per, setPer] = useState("mes")
  const [tab, setTab] = useState("ing")
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState("")
  const [toast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { avisarTexto(t) }, []) // los avisos los dibuja Sileo
  useEffect(() => () => clearTimeout(reloj.current), [])

  useEffect(() => {
    if (!puedeVer) return undefined
    let vigente = true
    setDatos(null); setError("")
    apiClient.get("/reportes/resumen", { params: { periodo: per } }).then((r) => {
      const d = r.data?.data
      if (vigente) setDatos(d ? { periodo: per, rango: { desde: "", hasta: "" }, ingresoPrevio: 0, ingresoPorPlan: [], alumnosPorPlan: [], ocupacionClases: [], reservasPorEstado: [], ingresoPorMetodo: [], ingresosPorMes: [], reservasProximas: 0, ...d, alumnosConPlan: d.alumnosConPlan ?? (d.alumnosPorPlan || []).reduce((a, x) => a + Number(x.cantidad), 0) } : null)
    }).catch((err) => { if (vigente) setError(err.response?.data?.message || "No se pudieron cargar los reportes.") })
    return () => { vigente = false }
  }, [per, puedeVer])

  const v = useMemo(() => {
    const d = datos || { rango: { desde: "", hasta: "" }, ingresoTotal: 0, ingresoPrevio: 0, ingresoPorPlan: [], alumnosPorPlan: [], ocupacionClases: [], reservasPorEstado: [], ingresoPorMetodo: [], ingresosPorMes: [], reservasProximas: 0, alumnosConPlan: 0 }
    const hoy = new Date()
    const PL = { mes: MESES_LARGOS[hoy.getMonth()].toUpperCase(), trimestre: "ÚLTIMO TRIMESTRE", anio: "AÑO " + hoy.getFullYear() }
    const previo = { mes: MESES_LARGOS[(hoy.getMonth() + 11) % 12].replace(/^./, (x) => x.toUpperCase()), trimestre: "El trimestre anterior", anio: "El año anterior" }[per]
    const dif = Number(d.ingresoTotal) - Number(d.ingresoPrevio)
    const totalIng = Number(d.ingresoTotal) || 0
    // Barras de ingresos: los últimos meses del período (cada una relativa a la mayor)
    const meses = [...d.ingresosPorMes].sort((a, b) => a.mes.localeCompare(b.mes))
    const max = Math.max(1, ...meses.map((r) => Number(r.total)))
    const CH = {
      ing: { t: "Evolución de ingresos", s: meses.length ? `${MESES_LARGOS[Number(meses[0].mes.slice(5)) - 1].replace(/^./, (x) => x.toUpperCase())} a ${MESES_LARGOS[Number(meses[meses.length - 1].mes.slice(5)) - 1]} ${meses[meses.length - 1].mes.slice(0, 4)}` : "Todavía no hay cobros en el período.", cols: meses.length > 0, bars: meses.map((r, i) => ({ l: MESES[Number(r.mes.slice(5)) - 1], v: pesos(r.total), h: Math.max(2, Math.round(Number(r.total) / max * 100)) + "%", c: i === meses.length - 1 ? "#9be600" : c.line2 })), foot: meses.length ? `Promedio: ${pesos(meses.reduce((s, r) => s + Number(r.total), 0) / meses.length)} por mes` : false },
      ocu: { t: "Ocupación por clase", s: "Lugares reservados sobre el cupo.", empty: !d.ocupacionClases.length, e: "No hay clases activas en este período.", rows: d.ocupacionClases.length > 0, items: d.ocupacionClases.map((k) => { const cupo = Number(k.cupoMaximo) || 0, oc = Number(k.ocupados) || 0, p = cupo ? Math.round(oc / cupo * 100) : 0; return { l: `${k.nombreClase}${k.horaInicio ? " · " + hh(k.horaInicio) : ""}`, v: `${oc}/${cupo}`, pct: p, w: p + "%", c: "#9be600" } }) },
      pla: { t: "Alumnos por plan", s: `Con el plan activo hoy · ${d.alumnosConPlan} en total`, rows: true, items: d.alumnosPorPlan.map((r) => { const p = d.alumnosConPlan ? Math.round(Number(r.cantidad) / d.alumnosConPlan * 100) : 0; return { l: r.plan, v: `${r.cantidad}${p ? ` (${p}%)` : ""}`, pct: p, w: p + "%", c: "#9be600" } }) },
      res: { t: "Reservas por estado", s: `${d.rango.desde ? "Desde el " + d.rango.desde.split("-").reverse().join("/") + " · " : ""}${d.reservasPorEstado.reduce((a, r) => a + Number(r.cantidad), 0)} en total`, rows: true, items: d.reservasPorEstado.map((r) => { const tot = d.reservasPorEstado.reduce((a, x) => a + Number(x.cantidad), 0); const p = tot ? Math.round(Number(r.cantidad) / tot * 100) : 0; return { l: ESTADOS[r.estado] || r.estado, v: `${r.cantidad} (${p}%)`, pct: p, w: p + "%", c: r.estado === "proxima" ? "#9be600" : c.info } }) },
    }
    const ch = { empty: false, cols: false, rows: false, foot: false, bars: [], items: [], ...CH[tab] }
    const lider = d.ingresoPorPlan[0]
    const exportar = () => {
      const label = { mes: "Este mes", trimestre: "Último trimestre", anio: "Año " + hoy.getFullYear() }[per]
      descargarExcel(`reportes-bravos-${per}.xlsx`, {
        titulo: "Reporte de Bravos", subtitulo: label,
        hojas: [
          { nombre: "Resumen", encabezados: ["Indicador", "Valor"], filas: [["Período", label], ["Ingreso total", totalIng], ["Ingreso del período anterior", Number(d.ingresoPrevio)], ["Alumnos con plan", d.alumnosConPlan], ["Reservas próximas", d.reservasProximas]], anchos: [34, 30], formatos: [null, "moneda"] },
          { nombre: "Ingresos por mes", encabezados: ["Mes", "Total"], filas: d.ingresosPorMes.map((r) => [r.mes, Number(r.total)]), anchos: [20, 18], formatos: [null, "moneda"] },
          { nombre: "Ingresos por plan", encabezados: ["Plan", "Total"], filas: d.ingresoPorPlan.map((r) => [r.plan, Number(r.total)]), anchos: [30, 18], formatos: [null, "moneda"] },
          { nombre: "Alumnos por plan", encabezados: ["Plan", "Alumnos"], filas: d.alumnosPorPlan.map((r) => [r.plan, Number(r.cantidad)]), anchos: [30, 14] },
        ],
      })
      avisar("Descargando reporte de " + PL[per].toLowerCase() + "…")
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, ch, perL: PL[per], cmp: `${dif >= 0 ? "↑" : "↓"} ${previo} fue de ${pesos(d.ingresoPrevio)}`,
      ingTotal: pesos(totalIng),
      metodosTxt: d.ingresoPorMetodo.length ? d.ingresoPorMetodo.map((m) => `${m.metodo} ${pesos(m.total)}${m.cantidad != null ? ` · ${m.cantidad} ${Number(m.cantidad) === 1 ? "pago" : "pagos"}` : ""}`).join("  |  ") : "Sin cobros en el período",
      per: [["mes", "Este mes"], ["trimestre", "Trimestre"], ["anio", "Año " + hoy.getFullYear()]].map(([id, l]) => { const s = per === id; return { l, ch: s ? "true" : "false", bg: s ? "#9be600" : "transparent", fg: s ? "#0b0b0b" : c.ink, pick: () => setPer(id) } }),
      kpis: [{ l: "ALUMNOS", v: String(d.alumnosConPlan), n: "con plan activo", fg: c.ink }, { l: "RESERVAS", v: String(d.reservasProximas), n: "próximas", fg: c.ink }, { l: "CLASES", v: String(d.ocupacionClases.length), n: "activas", fg: d.ocupacionClases.length ? c.ink : c.muted }],
      tabs2: [["ing", "Ingresos"], ["ocu", "Ocupación"], ["pla", "Planes"], ["res", "Reservas"]].map(([id, l]) => { const s = tab === id; return { l, sel: s ? "true" : "false", bg: s ? c.ink : "transparent", fg: s ? c.bg : c.ink, bd: s ? c.ink : c.btnLine, pick: () => setTab(id) } }),
      lider: { hay: !!lider, l: lider ? `${lider.plan} · ${pesos(lider.total)}` : "", p: lider && totalIng ? `${Math.round(Number(lider.total) / totalIng * 100)}% de lo cobrado` : "" },
      exp: exportar, toast: error || toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
  }, [datos, per, tab, toast, error, c, noLeidas, sesion, abrirNotif, abrirCuenta, avisar])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los reportes.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
