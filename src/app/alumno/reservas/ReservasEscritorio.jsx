import { useState } from "react"
import { Boton, Dialogo, ErrorBanner, Esqueleto, FiltroChips, Pantalla, Pestanas } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import PizarronRutina from "./PizarronRutina"
import { diaDelMes, diaSemanaCorto, duracion, etiquetaFecha, fechaCorta, limiteCancelacion, mesAbreviado, mesYAnio } from "@/lib/fechasBx"

/*
 * Mis reservas en escritorio (handoff, pantalla 03). Los datos y la cancelación los maneja ReservasPage.
 */

const ESTADOS = {
  completada: { etiqueta: "Completada", clases: "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg", icono: IC.check },
  cancelada: { etiqueta: "Cancelada", clases: "border-bx-btn-line bg-transparent text-bx-muted", icono: IC.close },
  inasistencia: { etiqueta: "No asistió", clases: "border-bx-err-line bg-bx-err-bg text-bx-err-fg", icono: IC.close },
}

function BotonRutina({ onClick, etiqueta, conFlecha = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-bx-btn-line px-4 text-sm font-bold text-bx-ink transition-colors hover:border-bx-lima"
    >
      <Ico d={IC.dumb} size={16} />Ver rutina del día{conFlecha && <Ico d={IC.chevRight} size={16} />}
    </button>
  )
}

export default function ReservasEscritorio({
  proximas, historial, cargando, errorCarga, onReintentar, semana, creditos,
  onCancelar, cancelDialog, cerrarCancelar, devuelveCredito, handleCancelar, cancelando,
}) {
  const [pestana, setPestana] = useState("prox")
  const [filtro, setFiltro] = useState("todas")
  const [rutinaDe, setRutinaDe] = useState(null) // reserva cuya rutina se está viendo (la pide PizarronRutina)

  const abrirRutina = (reserva) => setRutinaDe(reserva)

  const completadas = historial.filter((r) => r.estado === "completada")
  const canceladas = historial.filter((r) => r.estado === "cancelada")
  const ausentes = historial.filter((r) => r.estado === "inasistencia")
  const filtros = [
    { id: "todas", label: `Todas · ${historial.length}` },
    { id: "completada", label: `Completadas · ${completadas.length}` },
    { id: "cancelada", label: `Canceladas · ${canceladas.length}` },
    ...(ausentes.length ? [{ id: "inasistencia", label: `No asistió · ${ausentes.length}` }] : []),
  ]
  const visibles = historial.filter((r) => filtro === "todas" || r.estado === filtro)
  const grupos = []
  visibles.forEach((r) => {
    const mes = mesYAnio(r.fecha)
    const ult = grupos[grupos.length - 1]
    if (ult && ult.mes === mes) ult.items.push(r)
    else grupos.push({ mes, items: [r] })
  })


  return (
    <Pantalla className="gap-5">
      {errorCarga && <ErrorBanner titulo="No pudimos cargar tus reservas" texto="Revisá tu conexión e intentá de nuevo." onReintentar={onReintentar} />}

      <Pestanas
        etiqueta="Reservas"
        valor={pestana}
        onChange={setPestana}
        items={[{ id: "prox", label: "Próximas", contador: proximas.length }, { id: "hist", label: "Historial", contador: historial.length }]}
        className="gap-1"
      />

      <div key={pestana} role="tabpanel" aria-label={pestana === "prox" ? "Próximas" : "Historial"} className="bx-aparece flex flex-col gap-4">
        {cargando && (
          <div aria-busy="true" aria-label="Cargando reservas" className="flex flex-col gap-2.5">
            <Esqueleto alto={88} className="rounded-[0.875rem]" etiqueta="Cargando reserva" />
            <Esqueleto alto={88} className="rounded-[0.875rem]" etiqueta="Cargando reserva" />
          </div>
        )}

        {!cargando && !errorCarga && pestana === "prox" && proximas.length === 0 && (
          <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-bx-line bg-bx-card px-6 py-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-bx-tile text-bx-ok-fg"><Ico d={IC.cal} size={28} /></span>
            <div>
              <h2 className="m-0 text-xl font-bold">No tenés reservas próximas</h2>
              <p className="mb-0 mt-1.5 text-[0.9375rem] text-bx-muted">
                Reservá una clase para empezar a entrenar.{creditos != null ? ` Tenés ${creditos} ${creditos === 1 ? "crédito disponible" : "créditos disponibles"}.` : ""}
              </p>
            </div>
            <Boton to="/alumno/reservar" tamano="lg" className="h-12 gap-2.5"><Ico d={IC.cal} size={18} />Reservar clase</Boton>
          </div>
        )}

        {!cargando && pestana === "prox" && proximas.length > 0 && (
          <ul className="bx-lista m-0 flex list-none flex-col gap-3 p-0">
            {proximas.map((r) => {
              const dur = duracion(r.hora, r.horaFin)
              const limite = limiteCancelacion(r.fecha, r.hora)
              return (
                <li key={r.idReserva} className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border border-bx-ok-line bg-bx-card p-5">
                  <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl bg-bx-lateral text-[#ecefe4]">
                    <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-bx-lima">{mesAbreviado(r.fecha)}</span>
                    <span className="bx-num text-[2rem] leading-none">{diaDelMes(r.fecha)}</span>
                  </div>
                  <div className="min-w-[12.5rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="bx-num text-[1.875rem] leading-none">{r.hora}</span>
                      <span className="inline-flex items-center rounded-full border border-bx-ok-line bg-bx-ok-bg px-2.5 py-1 text-xs font-bold text-bx-ok-fg">Confirmada</span>
                    </div>
                    <div className="mt-1.5 text-[0.9375rem] font-bold">{etiquetaFecha(r.fecha)} · {r.clase}</div>
                    <div className="text-sm text-bx-muted">Coach: {r.coach}{dur ? ` · ${dur}` : ""}</div>
                    <div className="mt-1.5 text-[0.8125rem] font-medium text-bx-muted">
                      {semana
                        ? "En tu plan, cancelar no devuelve el crédito: cuenta para los de la semana."
                        : limite.pasado
                          ? "Faltan menos de 2 horas: si cancelás, el crédito no se devuelve."
                          : `Podés cancelar sin perder el crédito hasta las ${limite.hora}.`}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <BotonRutina onClick={() => abrirRutina(r)} etiqueta={`Ver rutina del día de ${r.clase}`} />
                    <button
                      type="button"
                      onClick={() => onCancelar(r)}
                      className="h-11 rounded-lg border border-bx-btn-line bg-transparent px-4 text-sm font-bold text-bx-err-fg transition-colors hover:border-bx-err-fg"
                    >
                      Cancelar reserva
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {!cargando && !errorCarga && pestana === "hist" && (
          historial.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bx-btn-line p-6 text-[0.9375rem] text-bx-muted">Todavía no tenés reservas anteriores.</div>
          ) : (
            <>
              <FiltroChips opciones={filtros} valor={filtro} onChange={setFiltro} etiqueta="Filtrar historial" className="[&>button]:h-11 [&>button]:px-4 [&>button]:text-sm" />
              {grupos.map((g) => (
                <section key={g.mes} aria-label={g.mes} className="flex flex-col gap-2.5">
                  <h2 className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">{g.mes}</h2>
                  <ul className="bx-lista m-0 flex list-none flex-col gap-2.5 p-0">
                    {g.items.map((r) => {
                      const est = ESTADOS[r.estado] || ESTADOS.cancelada
                      return (
                        <li key={r.idReserva} className="flex flex-wrap items-center gap-x-[1.125rem] gap-y-3.5 rounded-[0.875rem] border border-bx-line bg-bx-card px-[1.125rem] py-4">
                          <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[0.625rem] border border-bx-line2 bg-bx-surf ${r.estado === "cancelada" ? "opacity-60" : ""}`}>
                            <span className="text-[0.625rem] font-semibold tracking-[0.08em] text-bx-muted">{diaSemanaCorto(r.fecha)}</span>
                            <span className="bx-num text-2xl leading-none">{diaDelMes(r.fecha)}</span>
                          </div>
                          <div className="min-w-[11.25rem] flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="text-base font-bold">{r.clase}</span>
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[0.1875rem] text-xs font-bold ${est.clases}`}>
                                <Ico d={est.icono} size={12} sw={2.6} />{est.etiqueta}
                              </span>
                            </div>
                            <div className="mt-0.5 text-sm text-bx-muted">{fechaCorta(r.fecha)} · {r.hora} · Coach: {r.coach}</div>
                          </div>
                          <BotonRutina onClick={() => abrirRutina(r)} etiqueta={`Ver rutina del ${r.clase.toLowerCase()} ${fechaCorta(r.fecha)}`} conFlecha />
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

      <Dialogo
        abierto={cancelDialog.open}
        onCerrar={cerrarCancelar}
        titulo="¿Cancelar esta reserva?"
        alerta
        ancho={420}
        idEnfocar="btn-mantener-reserva"
        pie={
          <>
            <Boton id="btn-mantener-reserva" variante="secundario" onClick={cerrarCancelar}>Mantener reserva</Boton>
            <Boton variante="peligroSolido" onClick={handleCancelar} disabled={cancelando} aria-busy={cancelando}>
              {cancelando ? "Cancelando…" : "Sí, cancelar"}
            </Boton>
          </>
        }
      >
        <p className="m-0 text-[0.9375rem] leading-[1.5] text-bx-muted">
          {cancelDialog.claseNombre} · {cancelDialog.fechaStr}.{" "}
          {semana
            ? "En tu plan, cancelar no devuelve el crédito: cuenta para los de esta semana."
            : devuelveCredito
              ? "Como faltan más de 2 horas, te devolvemos 1 crédito."
              : "Faltan menos de 2 horas para la clase: el crédito no se devuelve."}
        </p>
      </Dialogo>

      <PizarronRutina reserva={rutinaDe} onClose={() => setRutinaDe(null)} />
    </Pantalla>
  )
}
