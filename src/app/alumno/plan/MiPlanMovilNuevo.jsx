import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { Chip, Esqueleto, ErrorBanner, Pestanas } from "@/components/bx"
import { ModalPago, useDatosPago } from "@/components/RenovarMembresia"
import { fmtFechaPlan, fmtPrecio, useMiPlan } from "@/lib/miPlan"
import { featuresDelPlan, partesDescripcion } from "@/lib/planes"

/*
 * Mi membresía en el celular (handoff móvil, Prompt 4). Tarjeta oscura con estado, anillo de créditos y vencimiento.
 * Color según estado: lima activa, amarillo si vence en 7 días o menos, rojo si está vencida (con "Renovar membresía").
 * "Contratar otra membresía" abre una hoja con los planes; elegir uno pasa a la pasarela de pago (la misma que en escritorio).
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const fecha = (f) => { const [, m, d] = String(f).slice(0, 10).split("-").map(Number); return `${d} ${MESES[m - 1]}` }

function Anillo({ disponibles, total, tono }) {
  const r = 30, c = 2 * Math.PI * r, prop = total > 0 ? Math.min(disponibles / total, 1) : 0
  const color = tono === "warn" ? "stroke-[#e6c200]" : tono === "err" ? "stroke-[#ffb4aa]" : "stroke-bx-lima"
  return (
    <div className="relative grid h-[5rem] w-[5rem] shrink-0 place-items-center" role="img" aria-label={`${disponibles} de ${total} créditos disponibles`}>
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className="stroke-[#2a2a2a]" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className={`${color} transition-[stroke-dashoffset] duration-700`} strokeDasharray={c} strokeDashoffset={c * (1 - prop)} />
      </svg>
      <span className="bx-num text-[1.375rem] leading-none text-[#ecefe4]">{disponibles}</span>
    </div>
  )
}

export default function MiPlanMovilNuevo() {
  const { data, cargando, recargar } = useMiPlan()
  const { planes: planesVenta, loading: cargandoPlanes, configBanco } = useDatosPago()
  const [pestana, setPestana] = useState("act")
  const [historial, setHistorial] = useState(null)
  const [hojaPlanes, setHojaPlanes] = useState(false)
  const [elegido, setElegido] = useState(null)
  const [planPago, setPlanPago] = useState(null)
  const [errorHist, setErrorHist] = useState(false)

  const cargarHistorial = useCallback(() => {
    setErrorHist(false)
    apiClient.get("/pagos/mi-historial").then((r) => setHistorial(r.data?.data || [])).catch(() => { setErrorHist(true); setHistorial([]) })
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarHistorial() }, [cargarHistorial])

  const alRenovar = () => { recargar(); cargarHistorial() }

  if (cargando) return <div aria-busy="true" aria-label="Cargando membresía" className="flex flex-col gap-3"><Esqueleto alto={200} className="rounded-2xl" /></div>
  if (!data) return <ErrorBanner titulo="No pudimos cargar tu membresía" texto="Revisá tu conexión e intentá de nuevo." onReintentar={recargar} />

  const { planes, vigente, porVencer, ultimoPlan, totalDisponibles, totalCreditos, proximoVencimiento } = data
  const dias = vigente ? Math.min(...planes.map((p) => p.diasRestantes)) : null
  const tono = !vigente ? "err" : porVencer ? "warn" : "ok"
  const estadoTxt = !vigente ? "Vencida" : porVencer ? "Por vencer" : "Activa"
  const nombres = vigente ? [...new Set(planes.map((p) => p.nombrePlan))].join(" + ") : (ultimoPlan?.nombrePlan || "Sin membresía")
  const planARenovar = vigente ? { idPlan: planes[0].idPlan, nombre: planes[0].nombrePlan, precio: planes[0].precio } : ultimoPlan
  const ordenados = [...planesVenta].sort((a, b) => Number(a.precio) - Number(b.precio))
  const elegidoPlan = ordenados.find((p) => p.idPlan === elegido) || ordenados[0]

  const cardColor = !vigente ? "border-[#6b2a24] bg-[#1a0f0e]" : porVencer ? "border-[#5a4a12] bg-[#17140a]" : "border-bx-hero-line bg-bx-hero"

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Mi membresía</h1>
      <Pestanas etiqueta="Mi membresía" valor={pestana} onChange={setPestana} items={[{ id: "act", label: "Activa" }, { id: "hist", label: "Historial", contador: historial?.length }]} className="gap-6" />

      <div key={pestana} role="tabpanel" className="bx-aparece flex flex-col gap-4">
        {pestana === "act" && (
          <>
            <section aria-labelledby="t-act-m" className={`flex flex-col gap-4 rounded-2xl border p-5 text-[#ecefe4] ${cardColor}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-[0.1em] text-[#a3a698]">MEMBRESÍA ACTUAL</span>
                <Chip tono={tono} className="!border-transparent !bg-transparent !text-current">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{estadoTxt}
                </Chip>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 id="t-act-m" className="bx-num m-0 text-[2rem] uppercase leading-none">{nombres}</h2>
                  <div className="mt-2 text-sm text-[#b9bcae]">{vigente ? `Vence el ${fmtFechaPlan(proximoVencimiento)}` : `Venció el ${fmtFechaPlan(proximoVencimiento)}`}</div>
                  {vigente && dias != null && <div className={`mt-1 text-sm font-bold ${porVencer ? "text-[#e6c200]" : "text-bx-lima"}`}>{dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Faltan ${dias} días`}</div>}
                </div>
                <Anillo disponibles={vigente ? totalDisponibles : 0} total={vigente ? totalCreditos : 0} tono={tono} />
              </div>
              <div className="text-xs font-bold tracking-[0.1em] text-[#a3a698]">CRÉDITOS · {vigente ? totalDisponibles : 0} DE {vigente ? totalCreditos : 0}</div>
              {!vigente || porVencer ? (
                <button type="button" onClick={() => setPlanPago(planARenovar)} className={`h-[3.25rem] rounded-xl text-[0.9375rem] font-extrabold active:scale-[0.98] ${!vigente ? "bg-[#ffb4aa] text-[#2a1210]" : "bg-[#e6c200] text-[#2a230a]"}`}>
                  Renovar membresía{planARenovar?.precio ? ` · ${fmtPrecio(planARenovar.precio)}` : ""}
                </button>
              ) : null}
              <button type="button" onClick={() => setHojaPlanes(true)} className="h-[3.25rem] rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold text-bx-negro active:scale-[0.98]">
                <span className="inline-flex items-center gap-2"><Ico d={IC.plus} size={18} sw={2.4} />Contratar otra membresía</span>
              </button>
              <p className="m-0 text-[0.8125rem] leading-normal text-[#a3a698]">Si contratás otra membresía, sus créditos se suman a los que ya tenés y vencen junto con esa nueva membresía.</p>
            </section>

            <aside aria-label="Consejo de Bravo" className="flex items-center gap-3 rounded-2xl border border-bx-line bg-bx-card p-3.5">
              <img src="/dog-t.png" alt="" className="h-[3.25rem] w-[3.25rem] shrink-0 rounded-full object-cover" />
              <p className="m-0 text-sm leading-normal"><strong>Consejo de Bravo:</strong> renová antes del vencimiento y seguís reservando sin cortes.</p>
            </aside>

            <section aria-labelledby="t-gest-m" className="flex flex-col gap-2">
              <h2 id="t-gest-m" className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">GESTIÓN</h2>
              <ul className="m-0 flex list-none flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card p-0">
                <li className="border-b border-bx-line2">
                  <Link to="/alumno/creditos" className="flex min-h-[4rem] items-center gap-3 px-4 active:bg-bx-surf">
                    <Ico d={IC.card} size={18} sw={1.9} className="text-bx-muted" />
                    <span className="min-w-0 flex-1"><span className="block text-[0.9375rem] font-bold">Mis créditos</span><span className="block text-xs text-bx-muted">Movimientos y cómo funcionan</span></span>
                    <Ico d={IC.chevRight} size={18} sw={2.2} className="text-bx-muted" />
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={() => setPestana("hist")} className="flex min-h-[4rem] w-full items-center gap-3 px-4 text-left active:bg-bx-surf">
                    <Ico d={IC.hist} size={18} sw={1.9} className="text-bx-muted" />
                    <span className="min-w-0 flex-1"><span className="block text-[0.9375rem] font-bold">Historial de membresías</span><span className="block text-xs text-bx-muted">Todas las que compraste</span></span>
                    <Ico d={IC.chevRight} size={18} sw={2.2} className="text-bx-muted" />
                  </button>
                </li>
              </ul>
            </section>
          </>
        )}

        {pestana === "hist" && (
          <>
            {errorHist && <ErrorBanner titulo="No pudimos cargar tu historial" texto="Revisá tu conexión e intentá de nuevo." onReintentar={cargarHistorial} />}
            {historial === null && <Esqueleto alto={140} className="rounded-2xl" etiqueta="Cargando historial" />}
            {historial && historial.length === 0 && !errorHist && <div className="rounded-2xl border border-dashed border-bx-btn-line px-4 py-8 text-center text-sm text-bx-muted">Todavía no compraste ninguna membresía.</div>}
            <ul className="bx-lista m-0 flex list-none flex-col gap-3 p-0">
              {(historial || []).map((m) => {
                const est = m.estado === "ACTIVO" ? { t: "Activa", c: "ok" } : m.estado === "VENCIDO" ? { t: "Vencida", c: "err" } : { t: "Cancelada", c: "neutral" }
                return (
                  <li key={m.idCredito} className="flex flex-col gap-2.5 rounded-2xl border border-bx-line bg-bx-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[0.9375rem] font-bold">{m.nombrePlan} · N.º {m.idCredito}</span>
                      <Chip tono={est.c}>{est.t}</Chip>
                    </div>
                    <div className="text-sm text-bx-muted">{fecha(m.fechaInicio)} – {fecha(m.fechaVencimiento)}{m.importe != null ? ` · ${fmtPrecio(m.importe)}${m.formaPago ? ` · ${m.formaPago}` : ""}` : ""}</div>
                    <div className="text-sm">{m.utilizados} de {m.totalCreditos} usados{m.estado === "ACTIVO" ? ` · ${m.disponibles} disponibles` : ""}</div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Contratar otra membresía: hoja con los planes y "Continuar al pago" */}
      <BottomSheet abierto={hojaPlanes} onCerrar={() => setHojaPlanes(false)} titulo="Elegí tu membresía" descripcion="Si contratás otra, sus créditos se suman a los que ya tenés."
        pie={
          <div className="flex w-full flex-col gap-2.5">
            <button type="button" disabled={!elegidoPlan || cargandoPlanes} onClick={() => { setHojaPlanes(false); setPlanPago(elegidoPlan) }} className="h-[3.25rem] rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold text-bx-negro active:scale-[0.98] disabled:opacity-50">
              Continuar al pago{elegidoPlan ? ` · ${fmtPrecio(elegidoPlan.precio)}` : ""}
            </button>
          </div>
        }
      >
        <div role="radiogroup" aria-label="Membresías" className="flex flex-col gap-2.5">
          {cargandoPlanes && <Esqueleto alto={80} className="rounded-xl" />}
          {!cargandoPlanes && ordenados.length === 0 && <p className="m-0 text-sm text-bx-muted">No hay membresías disponibles por ahora.</p>}
          {ordenados.map((p) => {
            const on = (elegidoPlan?.idPlan ?? null) === p.idPlan
            const corta = partesDescripcion(p.descripcion).corta
            return (
              <button key={p.idPlan} type="button" role="radio" aria-checked={on} onClick={() => setElegido(p.idPlan)}
                className={`flex min-h-[4.25rem] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${on ? "border-bx-lima bg-bx-ok-bg" : "border-bx-line bg-bx-card"}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-bx-lima bg-bx-lima" : "border-bx-btn-line"}`} aria-hidden="true">{on && <span className="h-1.5 w-1.5 rounded-full bg-bx-negro" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-bold">{p.nombre}</span>
                  <span className="block truncate text-xs text-bx-muted">{corta || `${Number(p.cantidadCreditos) || 0} créditos`}</span>
                </span>
                <span className="bx-num shrink-0 text-[1.25rem]">{fmtPrecio(p.precio)}</span>
              </button>
            )
          })}
          {elegidoPlan && (
            <ul className="m-0 flex list-none flex-col gap-1.5 pt-1 text-sm text-bx-muted">
              {featuresDelPlan(elegidoPlan).map((f, i) => <li key={i} className="flex items-start gap-2"><Ico d={IC.check} size={14} sw={2.4} className="mt-0.5 shrink-0 text-bx-ok-fg" />{f.text}</li>)}
            </ul>
          )}
        </div>
      </BottomSheet>

      {/* Pasarela de pago: la misma que en escritorio */}
      <ModalPago variante="bx" plan={planPago} open={!!planPago} onClose={() => setPlanPago(null)} onRenovado={alRenovar} configBanco={configBanco} />
    </div>
  )
}
