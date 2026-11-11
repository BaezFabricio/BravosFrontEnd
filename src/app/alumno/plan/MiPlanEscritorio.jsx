import { useCallback, useEffect, useState } from "react"
import apiClient from "@/api"
import { Boton, Chip, ErrorBanner, Esqueleto, HeroCard, Pantalla, Pestanas, Progreso } from "@/components/bx"
import { Copiar } from "@/components/bx/DialogoPago"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { FAQS, ModalPago, numeroWhatsapp, useDatosPago } from "@/components/RenovarMembresia"
import { fmtPrecio, useMiPlan } from "@/lib/miPlan"
import { featuresDelPlan, partesDescripcion } from "@/lib/planes"
import { fechaCorta, rangoFechas } from "@/lib/fechasBx"

/*
 * Mi membresía en escritorio (handoff, pantalla 06): membresía actual con sus créditos, pestañas Planes e Historial,
 * preguntas frecuentes y medios de pago. Contratar o renovar abre un solo diálogo de pago (sin modal sobre modal).
 */

const ESTADOS_HERO = {
  activa: { etiqueta: "ACTIVA", clases: "border-[#3d5a10] bg-[#16220a] text-bx-lima", punto: "bg-bx-lima" },
  por_vencer: { etiqueta: "POR VENCER", clases: "border-[#5a4a12] bg-[#2a230a] text-[#e6c200]", punto: "bg-[#e6c200]" },
  vencida: { etiqueta: "VENCIDA", clases: "border-[#6b2a24] bg-[#2a1210] text-[#ffb4aa]", punto: "bg-[#ffb4aa]" },
}

const ESTADOS_HIST = {
  ACTIVO: { etiqueta: "Activa", tono: "ok" },
  VENCIDO: { etiqueta: "Vencida", tono: "err" },
  CANCELADO: { etiqueta: "Cancelada", tono: "neutral" },
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
const precioPlan = (p) => `$${Number(p.precio).toLocaleString("es-AR")}`

// "Vence en 29 días", "Vence mañana" o "Vence hoy"
const venceEn = (dias) => (dias <= 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`)

export default function MiPlanEscritorio() {
  const { data, cargando, recargar } = useMiPlan()
  const { planes: planesVenta, loading: cargandoPlanes, configBanco } = useDatosPago()
  const [historial, setHistorial] = useState(null)
  const [pestana, setPestana] = useState("planes")
  const [faq, setFaq] = useState(-1)
  const [planPago, setPlanPago] = useState(null) // plan que se está pagando en el diálogo

  const cargarHistorial = useCallback(() => {
    apiClient.get("/pagos/mi-historial").then((r) => setHistorial(r.data?.data || [])).catch(() => setHistorial([]))
  }, [])
  useEffect(() => { cargarHistorial() }, [cargarHistorial])

  // Después de pagar: se actualizan la membresía y el historial
  const alRenovar = () => { recargar(); cargarHistorial() }

  const ordenados = [...planesVenta].sort((a, b) => Number(a.precio) - Number(b.precio))
  const hayPopular = ordenados.length > 1

  if (cargando) {
    return (
      <Pantalla>
        <div aria-busy="true" aria-label="Cargando membresía" className="flex flex-col gap-6">
          <Esqueleto alto={220} className="rounded-[1.25rem]" />
          <Esqueleto alto={160} className="rounded-2xl" />
        </div>
      </Pantalla>
    )
  }
  if (!data) {
    return (
      <Pantalla>
        <ErrorBanner titulo="No pudimos cargar tu membresía" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => window.location.reload()} />
      </Pantalla>
    )
  }

  const { planes, vigente, porVencer, ultimoPlan, totalDisponibles, totalCreditos } = data
  const principal = vigente ? planes[0] : null
  // Se renueva el plan que vence primero; si ya no hay vigentes, el último que pagó
  const planARenovar = vigente ? { idPlan: planes[0].idPlan, nombre: planes[0].nombrePlan, precio: planes[0].precio } : ultimoPlan
  const puedePagarMes = (porVencer || !vigente) && !!planARenovar
  const completo = (idPlan) => planesVenta.find((p) => p.idPlan === idPlan)
  const pagar = (plan) => setPlanPago(completo(plan.idPlan) || plan)

  const estadoClave = !vigente ? "vencida" : porVencer ? "por_vencer" : "activa"
  const estado = ESTADOS_HERO[estadoClave]
  const dePrincipal = principal ? historial?.find((h) => h.idCredito === principal.idCredito) : null
  const usados = Math.max(0, (totalCreditos || 0) - (totalDisponibles || 0))
  const otras = vigente ? planes.slice(1) : []

  return (
    <Pantalla>
      <HeroCard aria-labelledby="t-act" logo={false} className="!p-[clamp(1.25rem,3vw,2rem)]">
        <img src="/bravos-logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-[45%] top-1/2 h-[15.3125rem] w-[47.5rem] max-w-none -translate-y-1/2 -rotate-6 opacity-[0.05] [filter:grayscale(1)_brightness(1.4)]" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18.75rem),1fr))] items-center gap-x-10 gap-y-6">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold tracking-[0.1em] text-[#a3a698]">{principal ? `MEMBRESÍA ACTUAL · N.º ${principal.idCredito}` : "MEMBRESÍA"}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.06em] ${estado.clases}`}>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />{estado.etiqueta}
              </span>
            </div>
            <h2 id="t-act" className="bx-num m-0 text-[clamp(2rem,3.4vw,2.75rem)] uppercase leading-none">
              {principal ? principal.nombrePlan : "Sin membresía vigente"}
            </h2>
            <div className="text-[0.9375rem] text-[#b9bcae]">
              {principal ? (
                <>
                  {dePrincipal ? `${rangoFechas(dePrincipal.fechaInicio, principal.fechaVencimiento, { sep: " al ", prefijo: "Del " })} · ` : ""}
                  {venceEn(principal.diasRestantes)}
                  {dePrincipal?.importe != null && ` · Pagado ${fmtPrecio(dePrincipal.importe)}${dePrincipal.formaPago ? ` en ${String(dePrincipal.formaPago).toLowerCase()}` : ""}`}
                </>
              ) : (
                ultimoPlan ? `Tu última membresía fue ${ultimoPlan.nombrePlan}.` : "Todavía no contrataste una membresía."
              )}
            </div>
            {otras.length > 0 && (
              <div className="text-[0.8125rem] text-[#a3a698]">También tenés: {otras.map((p) => `${p.nombrePlan} (vence ${fechaCorta(p.fechaVencimiento)})`).join(" · ")}</div>
            )}
            <div className="mt-2 flex flex-wrap gap-2.5">
              {puedePagarMes && (
                <Boton tamano="lg" onClick={() => pagar(planARenovar)} className="h-12 gap-2 px-5">
                  <Ico d={IC.card} size={18} sw={2} />Renovar membresía{planARenovar.precio ? ` · ${fmtPrecio(planARenovar.precio)}` : ""}
                </Boton>
              )}
              <button
                type="button"
                onClick={() => setPestana("planes")}
                className={`inline-flex h-12 items-center gap-2 rounded-lg px-5 text-[0.9375rem] font-bold transition-colors ${puedePagarMes ? "border border-[#4a4d42] bg-transparent text-[#ecefe4] hover:border-bx-lima hover:text-bx-lima" : "bg-bx-lima text-bx-negro hover:bg-bx-lima-hover"}`}
              >
                <Ico d={IC.plus} size={18} sw={2} />{vigente ? "Contratar otra membresía" : "Ver planes"}
              </button>
              <button type="button" onClick={() => setPestana("hist")} className="h-12 rounded-lg border border-[#4a4d42] bg-transparent px-[1.125rem] text-[0.9375rem] font-bold text-[#ecefe4] transition-colors hover:border-bx-lima hover:text-bx-lima">Ver historial</button>
            </div>
          </div>

          <div className="relative flex flex-col gap-2.5 rounded-[0.875rem] border border-[#262626] bg-[#1a1a1a] p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.8125rem] font-semibold text-[#a3a698]">Créditos disponibles</span>
              <span>
                <span className="bx-num text-5xl leading-none text-bx-lima">{vigente ? totalDisponibles : 0}</span>
                <span className="text-lg font-bold text-[#a3a698]"> / {vigente ? totalCreditos : 0}</span>
              </span>
            </div>
            <Progreso valor={vigente ? totalDisponibles : 0} max={vigente ? totalCreditos || 1 : 1} etiqueta="Créditos disponibles" color="bg-bx-lima" className="!bg-[#2a2a2a]" />
            <div className="text-[0.8125rem] text-[#a3a698]">
              {vigente
                ? `${plural(usados, "usado", "usados")} · Vencen junto con la membresía el ${fechaCorta(principal.fechaVencimiento)}.`
                : "Sin créditos disponibles. Renová tu membresía para volver a reservar."}
            </div>
          </div>
        </div>
      </HeroCard>

      <Pestanas
        etiqueta="Membresía"
        valor={pestana}
        onChange={setPestana}
        items={[{ id: "planes", label: "Planes", contador: ordenados.length }, { id: "hist", label: "Historial", contador: historial ? historial.length : undefined }]}
        className="gap-1"
      />

      <div role="tabpanel" aria-label={pestana === "planes" ? "Planes" : "Historial"} className="flex flex-col gap-6">
        {pestana === "planes" && (
          <>
            <div>
              <h2 className="m-0 text-xl font-bold">Elegí tu plan o pack de créditos</h2>
              <p className="mb-0 mt-1 text-[0.9375rem] text-bx-muted">Si contratás otra membresía, sus créditos se suman a los que ya tenés y vencen junto con esa membresía.</p>
            </div>

            {cargandoPlanes ? (
              <div aria-busy="true" aria-label="Cargando planes" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))] gap-4">
                <Esqueleto alto={320} className="rounded-2xl" /><Esqueleto alto={320} className="rounded-2xl" />
              </div>
            ) : ordenados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bx-btn-line p-6 text-[0.9375rem] text-bx-muted">No hay membresías disponibles por ahora.</div>
            ) : (
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))] gap-4 p-0">
                {ordenados.map((p) => {
                  const pop = hayPopular && !!p.masPopular
                  const corta = partesDescripcion(p.descripcion).corta
                  const creditos = Number(p.cantidadCreditos) || 0
                  return (
                    <li key={p.idPlan} className={`relative flex flex-col gap-4 rounded-2xl p-6 ${pop ? "border-2 border-bx-lima bg-bx-hero text-[#ecefe4]" : "border border-bx-line bg-bx-card text-bx-ink"}`}>
                      <div className="flex min-h-[1.625rem] items-center justify-between gap-2.5">
                        <span className={`text-xs font-semibold tracking-[0.1em] ${pop ? "text-[#a3a698]" : "text-bx-muted"}`}>{creditos > 0 ? `${creditos} CRÉDITOS` : "MEMBRESÍA"}</span>
                        {pop && <span className="rounded-full bg-bx-lima px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.06em] text-bx-negro">MÁS ELEGIDO</span>}
                      </div>
                      <div>
                        <h3 className="m-0 text-xl font-bold">{p.nombre}</h3>
                        <div className="mt-2.5 flex items-baseline gap-1.5">
                          <span className={`bx-num text-[2.75rem] leading-none ${pop ? "text-bx-lima" : "text-bx-ink"}`}>{precioPlan(p)}</span>
                          <span className={`text-[0.8125rem] font-bold ${pop ? "text-[#a3a698]" : "text-bx-muted"}`}>ARS</span>
                        </div>
                        {corta && <div className={`mt-1 text-[0.8125rem] font-medium ${pop ? "text-[#a3a698]" : "text-bx-muted"}`}>{corta}</div>}
                      </div>
                      <ul className={`m-0 flex list-none flex-col gap-2.5 border-t p-0 pt-4 text-[0.9375rem] ${pop ? "border-[#262626]" : "border-bx-line2"}`}>
                        {featuresDelPlan(p).map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className={`mt-0.5 flex ${pop ? "text-bx-lima" : "text-bx-ok-fg"}`}><Ico d={IC.check} size={16} sw={2} /></span>{f.text}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setPlanPago(p)}
                        aria-label={`Elegir plan ${p.nombre}, ${precioPlan(p)}`}
                        className={`mt-auto h-12 rounded-lg text-[0.9375rem] font-bold transition-colors ${pop ? "border border-bx-lima bg-bx-lima text-bx-negro hover:bg-bx-lima-hover" : "border border-bx-btn-line bg-transparent text-bx-ink hover:border-bx-lima"}`}
                      >
                        Elegir plan
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,25rem),1fr))] items-start gap-6">
              <section aria-labelledby="t-faq" className="flex flex-col gap-2.5">
                <h2 id="t-faq" className="m-0 mb-1 text-lg font-bold">Preguntas frecuentes</h2>
                {FAQS.map((q, i) => {
                  const abierta = faq === i
                  return (
                    <div key={q.q} className="rounded-xl border border-bx-line bg-bx-card">
                      <h3 className="m-0">
                        <button
                          type="button"
                          onClick={() => setFaq(abierta ? -1 : i)}
                          aria-expanded={abierta}
                          aria-controls={`faq-${i}`}
                          className="flex min-h-14 w-full items-center justify-between gap-3 px-[1.125rem] py-3 text-left text-[0.9375rem] font-semibold text-bx-ink"
                        >
                          {q.q}
                          <Ico d={IC.chevDown} size={18} sw={2} className={`shrink-0 text-bx-muted ${abierta ? "rotate-180" : ""}`} />
                        </button>
                      </h3>
                      {abierta && <div id={`faq-${i}`} className="px-[1.125rem] pb-4 text-[0.9375rem] leading-normal text-bx-muted">{q.a}</div>}
                    </div>
                  )
                })}
              </section>

              <section aria-labelledby="t-pago" className="flex flex-col gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-5">
                <h2 id="t-pago" className="m-0 text-lg font-bold">Medios de pago</h2>
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="min-w-[11.25rem] flex-1">
                    <div className="text-[0.9375rem] font-bold">Mercado Pago</div>
                    <div className="text-sm text-bx-muted">Tarjeta, débito o dinero en cuenta</div>
                  </div>
                  <Chip tono="ok" className="px-2.5 py-1 text-xs">Inmediato</Chip>
                </div>
                <div className="h-px bg-bx-line2" />
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="min-w-[11.25rem] flex-1">
                    <div className="text-[0.9375rem] font-bold">Transferencia bancaria</div>
                    <div className="text-sm text-bx-muted">
                      {configBanco.alias || configBanco.cbu
                        ? <>{configBanco.alias ? <>Alias: <strong className="text-bx-ink">{configBanco.alias}</strong></> : configBanco.cbu} · Se acredita en 10–30 min</>
                        : "Consultá los datos en recepción."}
                    </div>
                  </div>
                  {configBanco.alias && <Copiar texto={configBanco.alias} etiqueta="Copiar alias" />}
                </div>
                <div className="h-px bg-bx-line2" />
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="min-w-[11.25rem] flex-1">
                    <div className="text-[0.9375rem] font-bold">¿Dudas con tu facturación?</div>
                    <div className="text-sm text-bx-muted">Escribile al equipo de soporte.</div>
                  </div>
                  {numeroWhatsapp(configBanco.whatsapp) ? (
                    <a
                      href={`https://wa.me/${numeroWhatsapp(configBanco.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-bx-btn-line px-3.5 text-sm font-bold text-bx-ink hover:border-bx-lima"
                    >
                      <Ico d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" size={16} sw={2} />WhatsApp soporte
                    </a>
                  ) : (
                    <span className="text-sm text-bx-muted">Consultá en recepción.</span>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {pestana === "hist" && (
          <>
            <p className="m-0 text-[0.9375rem] text-bx-muted">Todas las membresías que compraste, de la más nueva a la más vieja.</p>
            {historial === null ? (
              <Esqueleto alto={160} className="rounded-2xl" etiqueta="Cargando historial" />
            ) : historial.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-bx-btn-line p-6 text-[0.9375rem] text-bx-muted">Todavía no compraste ninguna membresía.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-bx-line bg-bx-card">
                <table className="w-full min-w-[47.5rem] border-collapse text-[0.9375rem] font-medium">
                  <caption className="sr-only">Historial de membresías</caption>
                  <thead>
                    <tr className="border-b border-bx-line">
                      {["MEMBRESÍA", "PERÍODO", "CRÉDITOS", "PAGO", "ESTADO"].map((h, i) => (
                        <th key={h} scope="col" className={`py-3.5 text-xs font-semibold tracking-[0.1em] text-bx-muted ${i === 0 ? "px-5 text-left" : i === 4 ? "px-5 text-right" : "px-3 text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((m) => {
                      const est = ESTADOS_HIST[m.estado] || ESTADOS_HIST.CANCELADO
                      const sinUsar = m.estado === "VENCIDO" ? m.disponibles : 0
                      return (
                        <tr key={m.idCredito} className="border-b border-bx-line2">
                          <th scope="row" className="px-5 py-4 text-left">
                            <div className="text-[0.9375rem] font-bold">{m.nombrePlan}</div>
                            <div className="text-[0.8125rem] font-medium text-bx-muted">N.º {m.idCredito}</div>
                          </th>
                          <td className="px-3 py-4">{rangoFechas(m.fechaInicio, m.fechaVencimiento)}</td>
                          <td className="px-3 py-4">
                            <div>{m.utilizados} de {m.totalCreditos} usados</div>
                            <div className={`text-[0.8125rem] font-medium ${m.estado === "ACTIVO" ? "text-bx-ok-fg" : "text-bx-muted"}`}>
                              {m.estado === "ACTIVO" ? `${m.disponibles} disponibles` : sinUsar > 0 ? `${sinUsar} vencieron sin usar` : m.utilizados === 0 ? "Sin uso" : ""}
                            </div>
                          </td>
                          <td className="px-3 py-4">{m.importe != null ? `${fmtPrecio(m.importe)}${m.formaPago ? ` · ${m.formaPago}` : ""}` : "—"}</td>
                          <td className="px-5 py-4 text-right"><Chip tono={est.tono} className="px-2.5 py-1 text-xs">{est.etiqueta}</Chip></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <ModalPago variante="bx" plan={planPago} open={!!planPago} onClose={() => setPlanPago(null)} onRenovado={alRenovar} configBanco={configBanco} />
    </Pantalla>
  )
}
