import { useState } from "react"
import { Link } from "react-router-dom"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { ErrorBanner, Esqueleto, FiltroChips, Pestanas } from "@/components/bx"
import PizarronRutina from "./PizarronRutina"

/*
 * Mis reservas en el celular (handoff móvil, Prompt 2). Solo presentación: los datos y la cancelación vienen de ReservasPage.
 * Pestañas Próximas / Historial, tarjeta de cada reserva con "Ver rutina" y "Cancelar reserva", y la cancelación en BottomSheet.
 */

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]


// ¿Faltan 2 horas o más? (mismo criterio que el servidor para devolver el crédito)
function faltanDosHoras(fecha, hora) {
  return (new Date(`${fecha}T${hora || "00:00"}:00`) - new Date()) / 3600000 >= 2
}

// Hora límite para cancelar sin perder el crédito: 2 horas antes
function horaLimite(hora) {
  const [h, m] = String(hora || "00:00").split(":").map(Number)
  const t = Math.max(0, h * 60 + m - 120)
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
}

const ESTADO = {
  proxima: { texto: "Confirmada", clase: "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg" },
  completada: { texto: "Completada", clase: "border-bx-line bg-bx-surf text-bx-ink" },
  inasistencia: { texto: "No asististe", clase: "border-bx-err-line bg-bx-err-bg text-bx-err-fg" },
  cancelada: { texto: "Cancelada", clase: "border-bx-line bg-transparent text-bx-muted" },
}

function Tarjeta({ r, onCancelar, onVerRutina, semana }) {
  const f = new Date(`${r.fecha}T12:00:00`)
  const est = ESTADO[r.estado] || ESTADO.cancelada
  const esProxima = r.estado === "proxima"
  const puedeDevolver = esProxima && !semana && faltanDosHoras(r.fecha, r.hora)
  return (
    <li className="bx-lift flex flex-col gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-4">
      <div className="flex gap-3.5">
        <div className="flex h-[4.25rem] w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-xl bg-bx-lateral text-[#ecefe4]" aria-hidden="true">
          <span className="text-[0.625rem] font-bold tracking-[0.06em] text-bx-lima">{DIAS[f.getDay()]}</span>
          <span className="bx-num text-[1.75rem] leading-none">{f.getDate()}</span>
          <span className="text-[0.625rem] font-semibold text-[#a3a698]">{MESES[f.getMonth()]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="bx-num text-[1.875rem] leading-none">{r.hora}</span>
            <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${est.clase}`}>
              {esProxima && <Ico d={IC.check} size={12} sw={2.6} />}{est.texto}
            </span>
          </div>
          <div className="mt-1.5 text-[0.9375rem] font-bold">{DIAS_LARGOS[f.getDay()]} {f.getDate()} de {MESES_LARGOS[f.getMonth()]} · {r.clase}</div>
          <div className="mt-0.5 text-[0.8125rem] text-bx-muted">Coach: {r.coach} · 60 min</div>
        </div>
      </div>

      {esProxima && (
        <div className="flex items-start gap-2 rounded-xl bg-bx-surf px-3 py-2.5 text-[0.8125rem] leading-snug text-bx-muted">
          <Ico d={IC.clock} size={16} sw={1.9} className="mt-px shrink-0" />
          <span>{semana ? "En tu plan, cancelar no devuelve el crédito." : puedeDevolver ? <>Podés cancelar sin perder el crédito hasta las <strong className="text-bx-ink">{horaLimite(r.hora)}</strong>.</> : "Ya no se devuelve el crédito si cancelás: faltan menos de 2 horas."}</span>
        </div>
      )}

      <div className={`grid gap-2 ${esProxima ? "grid-cols-2" : "grid-cols-1"}`}>
        <button type="button" onClick={() => onVerRutina(r)} className="flex h-[2.875rem] items-center justify-center gap-2 rounded-[0.625rem] border border-bx-ok-fg text-[0.875rem] font-bold text-bx-ok-fg active:bg-bx-ok-bg">
          <Ico d={IC.dumb} size={16} sw={1.9} />Ver rutina
        </button>
        {esProxima && (
          <button type="button" onClick={() => onCancelar(r)} className="h-[2.875rem] rounded-[0.625rem] border border-bx-btn-line text-[0.875rem] font-bold text-bx-err-fg active:bg-bx-err-bg">
            Cancelar reserva
          </button>
        )}
      </div>
    </li>
  )
}

export default function ReservasMovilNuevo({ proximas, historial, cargando, errorCarga, onReintentar, onConfirmarCancelar, semana }) {
  const [pestana, setPestana] = useState("prox")
  const [filtro, setFiltro] = useState("todas")
  const [rutinaDe, setRutinaDe] = useState(null)
  const [aCancelar, setACancelar] = useState(null)

  // Próximas: de la más cercana a la más lejana
  const proximasOrdenadas = [...proximas].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))

  // Historial agrupado por mes, con filtros
  const completadas = historial.filter((r) => r.estado === "completada")
  const canceladas = historial.filter((r) => r.estado === "cancelada")
  const ausentes = historial.filter((r) => r.estado === "inasistencia")
  const filtrado = historial.filter((r) => filtro === "todas" || (filtro === "completadas" ? r.estado === "completada" : filtro === "canceladas" ? r.estado === "cancelada" : r.estado === "inasistencia"))
  const grupos = []
  filtrado.forEach((r) => {
    const f = new Date(`${r.fecha}T12:00:00`)
    const mes = `${MESES_LARGOS[f.getMonth()]} ${f.getFullYear()}`
    const ult = grupos[grupos.length - 1]
    if (ult && ult.mes === mes) ult.items.push(r)
    else grupos.push({ mes, items: [r] })
  })

  // Confirmar: ejecuta la cancelación de la página (mismo flujo que el escritorio) y cierra la hoja
  const cancelarConfirmado = () => { if (aCancelar) onConfirmarCancelar(aCancelar); setACancelar(null) }

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Mis reservas</h1>

      <Pestanas
        etiqueta="Mis reservas"
        valor={pestana}
        onChange={setPestana}
        items={[{ id: "prox", label: "Próximas", contador: proximas.length }, { id: "hist", label: "Historial", contador: historial.length }]}
        className="gap-6"
      />

      <div key={pestana} role="tabpanel" className="bx-aparece flex flex-col gap-4">
        {errorCarga && <ErrorBanner titulo="No pudimos cargar tus reservas" texto="Revisá tu conexión e intentá de nuevo." onReintentar={onReintentar} />}

        {cargando && (
          <div aria-busy="true" aria-label="Cargando reservas" className="flex flex-col gap-2.5">
            <Esqueleto alto={120} className="rounded-2xl" etiqueta="Cargando reserva" />
            <Esqueleto alto={120} className="rounded-2xl" etiqueta="Cargando reserva" />
          </div>
        )}

        {!cargando && !errorCarga && pestana === "prox" && proximasOrdenadas.length === 0 && (
          <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-bx-line bg-bx-card px-5 py-9 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bx-tile text-bx-ok-fg"><Ico d={IC.cal} size={26} sw={1.9} /></span>
            <div>
              <div className="text-lg font-bold">No tenés reservas próximas</div>
              <p className="mb-0 mt-1.5 text-sm leading-normal text-bx-muted">Reservá una clase para empezar a entrenar{semana ? "" : ""}.</p>
            </div>
            <Link to="/alumno/reservar" className="flex h-[3.125rem] w-full items-center justify-center gap-2.5 rounded-[0.625rem] bg-bx-lima text-sm font-extrabold tracking-[0.04em] text-bx-negro active:scale-[0.98]">
              <Ico d={IC.cal} size={18} sw={2} />RESERVAR CLASE
            </Link>
          </div>
        )}

        {!cargando && !errorCarga && pestana === "prox" && proximasOrdenadas.length > 0 && (
          <ul className="bx-lista m-0 flex list-none flex-col gap-3 p-0">
            {proximasOrdenadas.map((r) => <Tarjeta key={r.idReserva} r={r} onCancelar={setACancelar} onVerRutina={setRutinaDe} semana={semana} />)}
          </ul>
        )}

        {!cargando && !errorCarga && pestana === "hist" && (
          historial.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bx-btn-line px-4 py-8 text-center text-sm text-bx-muted">Todavía no tenés clases anteriores.</div>
          ) : (
            <>
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FiltroChips
                  etiqueta="Filtrar historial"
                  tactil
                  valor={filtro}
                  onChange={setFiltro}
                  opciones={[
                    { id: "todas", label: "Todas", contador: historial.length },
                    { id: "completadas", label: "Completadas", contador: completadas.length },
                    { id: "canceladas", label: "Canceladas", contador: canceladas.length },
                    ...(ausentes.length ? [{ id: "ausentes", label: "No asististe", contador: ausentes.length }] : []),
                  ]}
                  className="w-max flex-nowrap"
                />
              </div>
              {filtrado.length === 0 && <div className="rounded-2xl border border-dashed border-bx-btn-line px-4 py-6 text-center text-sm text-bx-muted">No hay clases con este filtro.</div>}
              {grupos.map((g) => (
                <section key={g.mes} aria-label={g.mes} className="flex flex-col gap-2">
                  <h2 className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">{g.mes.toUpperCase()}</h2>
                  <ul className="m-0 flex list-none flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card p-0">
                    {g.items.map((r) => {
                      const f = new Date(`${r.fecha}T12:00:00`)
                      const est = ESTADO[r.estado] || ESTADO.cancelada
                      return (
                        <li key={r.idReserva} className="border-t border-bx-line2 first:border-t-0">
                          <button type="button" onClick={() => setRutinaDe(r)} aria-label={`Ver la rutina de ${r.clase}, ${f.getDate()} de ${MESES_LARGOS[f.getMonth()]}`} className="flex min-h-[4.5rem] w-full items-center gap-3 px-3.5 py-3 text-left active:bg-bx-surf">
                            <span className={`flex h-[3.125rem] w-[2.875rem] shrink-0 flex-col items-center justify-center rounded-[0.625rem] border border-bx-line2 bg-bx-surf ${r.estado === "cancelada" ? "opacity-60" : ""}`} aria-hidden="true">
                              <span className="text-[0.5625rem] font-bold tracking-[0.06em] text-bx-muted">{DIAS[f.getDay()]}</span>
                              <span className="bx-num text-[1.25rem] leading-none">{f.getDate()}</span>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-[0.9375rem] font-bold">{r.clase}</span>
                                <span className={`inline-flex items-center rounded-full border px-2 py-px text-[0.6875rem] font-bold ${est.clase}`}>{est.texto}</span>
                              </span>
                              <span className="mt-0.5 block text-[0.8125rem] text-bx-muted">{r.hora} · Coach: {r.coach}</span>
                            </span>
                            <Ico d={IC.chevRight} size={18} sw={2.2} className="shrink-0 text-bx-muted" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </>
          )
        )}
      </div>

      {/* Cancelar: BottomSheet de confirmación */}
      <BottomSheet
        abierto={!!aCancelar}
        onCerrar={() => setACancelar(null)}
        titulo="¿Cancelar esta reserva?"
        alerta
        descripcion={aCancelar ? `${aCancelar.clase} · ${DIAS_LARGOS[new Date(`${aCancelar.fecha}T12:00:00`).getDay()]} ${new Date(`${aCancelar.fecha}T12:00:00`).getDate()} a las ${aCancelar.hora}. ${semana ? "En tu plan, cancelar no devuelve el crédito." : faltanDosHoras(aCancelar.fecha, aCancelar.hora) ? "Como faltan más de 2 horas, te devolvemos 1 crédito." : "Faltan menos de 2 horas: el crédito no se devuelve."}` : ""}
        pie={
          <div className="flex w-full flex-col gap-2.5">
            <button type="button" autoFocus onClick={() => setACancelar(null)} className="h-[3.25rem] rounded-xl border border-bx-btn-line text-[0.9375rem] font-bold text-bx-ink">Mantener reserva</button>
            <button type="button" onClick={cancelarConfirmado} className="h-[3.25rem] rounded-xl bg-bx-err-fg text-[0.9375rem] font-bold text-bx-card active:scale-[0.98]">Sí, cancelar</button>
          </div>
        }
      />

      <PizarronRutina reserva={rutinaDe} onClose={() => setRutinaDe(null)} />
    </div>
  )
}
