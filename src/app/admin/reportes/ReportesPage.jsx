import { useEffect, useState } from "react"
import { Banknote, Users, Dumbbell, CalendarCheck, Download, TrendingUp, TrendingDown, Trophy, Flame, Loader2 } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts"
import { AdminPageSkeleton } from "@/components/AdminPageSkeleton"
import apiClient from "@/api"

// Colores distintos entre sí (no variaciones del mismo verde), con el verde de marca como ancla
const COLORES = ["#84cc16", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"]
const ESTADO_LABELS = { proxima: "Próxima", cancelada: "Cancelada", asistio: "Asistió", ausente: "Ausente", completada: "Completada" }
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const DIA_CORTO = { LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié", JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb", DOMINGO: "Dom" }

const plata = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v) || 0)
const mesCorto = (ym) => { const [a, m] = String(ym).split("-"); return `${MESES[Number(m) - 1]} ${a.slice(2)}` }

// CSV para Excel: separador ";" y comillas; los textos que empiezan con = + - @ se neutralizan
// (si no, Excel los puede ejecutar como fórmula al abrir el archivo)
const celda = (v) => {
  let t = String(v ?? "")
  if (/^[=+\-@]/.test(t)) t = "'" + t
  return `"${t.replace(/"/g, '""')}"`
}

// Dona con el total en el centro y su leyenda con barras
function Dona({ data, total, centro }) {
  return (
  <div className="relative mx-auto h-40 w-40 shrink-0">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={data.length > 1 ? 3 : 0} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-2xl font-black tabular-nums text-foreground">{total}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/55">{centro}</span>
    </div>
  </div>
  )
}

function Leyenda({ data, total }) {
  return (
  <ul className="w-full space-y-2.5">
    {data.map((r, i) => {
      const pct = total ? Math.round((r.value / total) * 100) : 0
      return (
        <li key={r.name}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORES[i % COLORES.length] }} aria-hidden="true" />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-foreground/70">{r.value} ({pct}%)</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORES[i % COLORES.length] }} />
          </div>
        </li>
      )
    })}
  </ul>
  )
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("mes")
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [pestana, setPestana] = useState("ingresos")

  useEffect(() => {
    let vigente = true
    apiClient.get("/reportes/resumen", { params: { periodo } })
      .then((r) => {
        if (!vigente) return
        const d = r.data?.data
        // Valores por defecto: si el servidor todavía no se reinició con la versión nueva, no se rompe la pantalla
        setDatos(d ? {
          periodo, rango: { desde: "", hasta: "" }, ingresoPrevio: 0, ingresoPorPlan: [], alumnosPorPlan: [],
          ocupacionClases: [], reservasPorEstado: [], ingresosPorMes: [], reservasProximas: 0, ...d,
          alumnosConPlan: d.alumnosConPlan ?? (d.alumnosPorPlan || []).reduce((a, x) => a + Number(x.cantidad), 0),
        } : null)
        setError("")
      })
      .catch((err) => { if (vigente) setError(err.response?.data?.message || "No se pudieron cargar los reportes.") })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [periodo])

  const cambiarPeriodo = (p) => { if (p !== periodo) { setCargando(true); setPeriodo(p) } }

  if (!datos && cargando) return <AdminPageSkeleton rows={4} />
  if (!datos) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error || "No hay datos disponibles."}</div>
  }

  const hoy = new Date()
  const PERIODOS = [
    { id: "mes", label: `Este mes (${MESES[hoy.getMonth()]})` },
    { id: "trimestre", label: "Último trimestre" },
    { id: "anio", label: `Año ${hoy.getFullYear()}` },
  ]

  const ingresos = datos.ingresosPorMes.map((r) => ({ mes: mesCorto(r.mes), total: Number(r.total) }))
  const promedio = ingresos.length ? Math.round(ingresos.reduce((a, r) => a + r.total, 0) / ingresos.length) : 0
  const variacion = datos.ingresoPrevio > 0 ? ((datos.ingresoTotal - datos.ingresoPrevio) / datos.ingresoPrevio) * 100 : null
  const textoPrevio = { mes: "el mes anterior", trimestre: "el trimestre anterior", anio: "el año anterior" }[datos.periodo]

  const planes = datos.alumnosPorPlan.map((r) => ({ name: r.plan, value: Number(r.cantidad) }))
  const totalPlanes = planes.reduce((a, r) => a + r.value, 0)
  const reservas = datos.reservasPorEstado.map((r) => ({ name: ESTADO_LABELS[r.estado] || r.estado, value: Number(r.cantidad) }))
  const totalReservas = reservas.reduce((a, r) => a + r.value, 0)
  const clases = datos.ocupacionClases.map((c) => ({ ...c, cupoMaximo: Number(c.cupoMaximo), ocupados: Number(c.ocupados) }))
  const capacidad = clases.reduce((a, c) => a + c.cupoMaximo, 0)
  const ocupadosTotal = clases.reduce((a, c) => a + c.ocupados, 0)

  const lider = datos.ingresoPorPlan[0]
  const masLlena = clases.find((c) => c.ocupados > 0)
  const horarioDe = (c) => {
    const dias = c.fechaEspecifica ? c.fechaEspecifica.split("-").reverse().slice(0, 2).join("/") : (c.diasSemana || "").split(",").map((d) => DIA_CORTO[d] || d).join(" · ")
    return [dias, c.horaInicio && c.horaFin ? `${c.horaInicio} – ${c.horaFin}` : null].filter(Boolean).join(" · ")
  }

  const exportarCSV = () => {
    const filas = [
      ["Reporte Bravos", PERIODOS.find((p) => p.id === datos.periodo)?.label, `desde ${datos.rango.desde} hasta ${datos.rango.hasta}`],
      [],
      ["Ingresos por mes", "Total (ARS)"], ...datos.ingresosPorMes.map((r) => [r.mes, Number(r.total)]),
      ["Total del período", datos.ingresoTotal], ["Período anterior", datos.ingresoPrevio],
      [],
      ["Ingresos por plan", "Total (ARS)"], ...datos.ingresoPorPlan.map((r) => [r.plan, Number(r.total)]),
      [],
      ["Alumnos con plan activo", "Cantidad"], ...planes.map((r) => [r.name, r.value]),
      [],
      ["Ocupación de clases", "Horario", "Ocupados", "Cupo"], ...clases.map((c) => [c.nombreClase, horarioDe(c), c.ocupados, c.cupoMaximo]),
      [],
      ["Reservas por estado", "Cantidad"], ...reservas.map((r) => [r.name, r.value]),
    ]
    const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n") // BOM: Excel lee bien los acentos
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `reportes-bravos-${datos.periodo}-${datos.rango.hasta}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const kpi = "rounded-2xl border border-border bg-card p-4"
  const kpiTitulo = "text-[10px] font-black uppercase tracking-widest text-foreground/55"
  const icono = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
  const tooltipEstilo = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--popover-foreground)" }

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400" aria-hidden="true" /> Reportes
          </h1>
          <p className="mt-1 text-sm text-foreground/55">Ingresos, planes, ocupación y reservas.</p>
        </div>
        <button type="button" onClick={exportarCSV}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-black uppercase tracking-wide text-foreground hover:border-lime-500">
          <Download className="h-4 w-4" aria-hidden="true" /> CSV
        </button>
      </div>

      {/* Período */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Período">
        {PERIODOS.map((p) => (
          <button key={p.id} type="button" onClick={() => cambiarPeriodo(p.id)} aria-pressed={periodo === p.id}
            className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-black transition-colors ${periodo === p.id ? "border-lime-500 bg-lime-400 text-black" : "border-border bg-card text-foreground/70"}`}>
            {periodo === p.id && cargando && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
            {p.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}

      {/* Indicadores */}
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${cargando ? "opacity-60" : ""}`}>
        <div className={kpi}>
          <div className="flex items-start justify-between gap-2"><p className={kpiTitulo}>Ingreso total</p><span className={`${icono} bg-lime-400/15 text-lime-700 dark:text-lime-400`}><Banknote className="h-4 w-4" /></span></div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground sm:text-2xl">{plata(datos.ingresoTotal)}</p>
          {variacion === null ? (
            <p className="mt-1 text-[11px] text-foreground/50">Sin cobros en {textoPrevio}</p>
          ) : (
            <p className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${variacion >= 0 ? "text-lime-700 dark:text-lime-400" : "text-red-700 dark:text-red-400"}`}>
              {variacion >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {variacion >= 0 ? "+" : ""}{variacion.toFixed(1).replace(".", ",")}% vs {textoPrevio}
            </p>
          )}
        </div>
        <div className={kpi}>
          <div className="flex items-start justify-between gap-2"><p className={kpiTitulo}>Alumnos con plan</p><span className={`${icono} bg-sky-400/15 text-sky-700 dark:text-sky-400`}><Users className="h-4 w-4" /></span></div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground sm:text-2xl">{datos.alumnosConPlan}</p>
          <p className="mt-1 text-[11px] text-foreground/55">con el plan activo hoy</p>
        </div>
        <div className={kpi}>
          <div className="flex items-start justify-between gap-2"><p className={kpiTitulo}>Clases activas</p><span className={`${icono} bg-amber-400/15 text-amber-700 dark:text-amber-400`}><Dumbbell className="h-4 w-4" /></span></div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground sm:text-2xl">{clases.length}</p>
          <p className="mt-1 text-[11px] text-foreground/55">{capacidad} lugares en total</p>
        </div>
        <div className={kpi}>
          <div className="flex items-start justify-between gap-2"><p className={kpiTitulo}>Reservas</p><span className={`${icono} bg-violet-400/15 text-violet-700 dark:text-violet-400`}><CalendarCheck className="h-4 w-4" /></span></div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground sm:text-2xl">{datos.reservasProximas}</p>
          <p className="mt-1 text-[11px] text-foreground/55">próximas, desde hoy</p>
        </div>
      </div>

      {/* Gráficos en pestañas */}
      <section className="rounded-2xl border border-border bg-card p-4" aria-label="Gráficos">
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-background/60 p-1" role="tablist">
          {[["ingresos", "Ingresos"], ["ocupacion", "Ocupación"], ["planes", "Planes"], ["reservas", "Reservas"]].map(([id, txt]) => (
            <button key={id} type="button" role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}
              className={`min-h-[38px] rounded-lg text-[11px] font-black transition-colors ${pestana === id ? "bg-lime-400/15 text-lime-700 dark:text-lime-400" : "text-foreground/60"}`}>
              {txt}
            </button>
          ))}
        </div>

        <div className={`mt-4 ${cargando ? "opacity-60" : ""}`} role="tabpanel">
          {pestana === "ingresos" && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Evolución de ingresos</h2>
                  {ingresos.length > 0 && <p className="text-xs text-foreground/55">{datos.ingresosPorMes.length > 1 ? `${MESES_LARGOS[Number(datos.ingresosPorMes[0].mes.slice(5)) - 1]} a ${MESES_LARGOS[Number(datos.ingresosPorMes.at(-1).mes.slice(5)) - 1]} ${datos.ingresosPorMes.at(-1).mes.slice(0, 4)}` : mesCorto(datos.ingresosPorMes[0].mes)}</p>}
                </div>
                <span className="shrink-0 rounded-md bg-lime-400/15 px-2 py-0.5 text-[11px] font-black tabular-nums text-lime-700 dark:text-lime-400">{plata(ingresos.reduce((a, r) => a + r.total, 0))}</span>
              </div>
              {ingresos.length === 0 ? (
                <p className="py-12 text-center text-sm text-foreground/55">Sin cobros confirmados en este período.</p>
              ) : (
                <>
                  <div className="mt-3 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ingresos} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="relleno-ingresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#84cc16" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#84cc16" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip formatter={(v) => [plata(v), "Ingresos"]} contentStyle={tooltipEstilo} />
                        <Area type="monotone" dataKey="total" stroke="#84cc16" strokeWidth={3} fill="url(#relleno-ingresos)" dot={{ r: 4, fill: "#84cc16" }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-foreground/60"><span className="h-2 w-2 rounded-full bg-lime-400" aria-hidden="true" /> Cobros confirmados</span>
                    <span className="font-semibold text-foreground/70">Promedio: <span className="tabular-nums text-foreground">{plata(promedio)}</span>/mes</span>
                  </div>
                </>
              )}
            </>
          )}

          {pestana === "ocupacion" && (
            <>
              <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Ocupación por clase</h2>
              <p className="text-xs text-foreground/55">Lugares reservados sobre el cupo de cada clase activa.</p>
              {clases.length === 0 ? (
                <p className="py-12 text-center text-sm text-foreground/55">No hay clases activas.</p>
              ) : (
                <>
                  <ul className="mt-3 space-y-3">
                    {clases.map((c, i) => {
                      const pct = c.cupoMaximo ? Math.round((c.ocupados / c.cupoMaximo) * 100) : 0
                      return (
                        <li key={i}>
                          <div className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate font-bold text-foreground">{c.nombreClase} <span className="text-xs font-normal text-foreground/55">{horarioDe(c)}</span></span>
                            <span className="shrink-0 text-xs tabular-nums text-foreground/70">{c.ocupados}/{c.cupoMaximo} ({pct}%)</span>
                          </div>
                          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sky-500/25">
                            <div className="h-full rounded-full bg-lime-400" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-foreground/60">
                    <span className="flex items-center gap-3"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime-400" />Ocupados</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500/60" />Libres</span></span>
                    <span>Capacidad: {capacidad} lugares · <span className="font-bold text-lime-700 dark:text-lime-400">{ocupadosTotal} ocupados</span></span>
                  </div>
                </>
              )}
            </>
          )}

          {pestana === "planes" && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Alumnos por plan</h2>
                  <p className="text-xs text-foreground/55">Con el plan activo hoy.</p>
                </div>
                <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] font-black text-foreground/70">Total: {totalPlanes}</span>
              </div>
              {planes.length === 0 ? (
                <p className="py-12 text-center text-sm text-foreground/55">Ningún alumno tiene un plan activo.</p>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
                  <Dona data={planes} total={totalPlanes} centro={totalPlanes === 1 ? "alumno" : "alumnos"} />
                  <Leyenda data={planes} total={totalPlanes} />
                </div>
              )}
            </>
          )}

          {pestana === "reservas" && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Reservas por estado</h2>
                  <p className="text-xs text-foreground/55">{datos.rango.desde ? `Reservas de clases desde el ${datos.rango.desde.split("-").reverse().join("/")}.` : "Reservas de clases."}</p>
                </div>
                <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] font-black text-foreground/70">{totalReservas} en total</span>
              </div>
              {reservas.length === 0 ? (
                <p className="py-12 text-center text-sm text-foreground/55">Sin reservas en este período.</p>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
                  <Dona data={reservas} total={totalReservas} centro={totalReservas === 1 ? "reserva" : "reservas"} />
                  <Leyenda data={reservas} total={totalReservas} />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Hallazgos: salen de los mismos datos */}
      {(lider || masLlena) && (
        <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="titulo-hallazgos">
          <h2 id="titulo-hallazgos" className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
            <TrendingUp className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Hallazgos del período
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lider && (
              <div className="rounded-xl bg-foreground/5 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/60"><Trophy className="h-3.5 w-3.5 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Plan que más recaudó</p>
                <p className="mt-1 text-base font-black uppercase text-foreground">{lider.plan}</p>
                <p className="text-xs font-semibold text-lime-700 dark:text-lime-400">
                  {plata(lider.total)}{datos.ingresoTotal > 0 ? ` · ${Math.round((Number(lider.total) / datos.ingresoTotal) * 100)}% de lo cobrado` : ""}
                </p>
              </div>
            )}
            {masLlena && (
              <div className="rounded-xl bg-foreground/5 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/60"><Flame className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" /> Clase más reservada</p>
                <p className="mt-1 text-base font-black uppercase text-foreground">{masLlena.nombreClase}</p>
                <p className="text-xs text-foreground/60">{masLlena.ocupados} de {masLlena.cupoMaximo} lugares · {horarioDe(masLlena)}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
