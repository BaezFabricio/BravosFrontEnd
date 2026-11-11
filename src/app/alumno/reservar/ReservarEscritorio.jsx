import { useState } from "react"
import { Boton, Desplegable, Dialogo, ErrorBanner, Esqueleto, Pantalla, Progreso, Tarjeta, Vacio } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { sanitizarHtml } from "@/lib/sanitizarHtml"
import { aTexto, hoyTexto } from "@/lib/fechasBx"

/*
 * Reservar clase en escritorio (handoff, pantalla 02). La carga de datos y las reglas (solo clases del día,
 * hasta 2 horas antes, créditos) están en ReservarPage; acá solo se dibuja.
 */

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const ABREV_DIA = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] // la semana empieza el lunes

const fechaLarga = (d) => `${NOMBRES_DIA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`

// "21:00" → "19:00": hasta esa hora se puede cancelar y recuperar el crédito
function horaLimite(hora) {
  const [h, m] = String(hora || "00:00").split(":").map(Number)
  const total = Math.max(0, h * 60 + m - 120)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

export default function ReservarEscritorio({
  creditos, cargandoCreditos, semana, errorCarga, onReintentar,
  selectedDate, setSelectedDate, weekDates, hayClasesEn,
  turnos, turnoFiltro, setTurnoFiltro, horasDelDia,
  grupos, cargando,
  puedeReservar, esDeHoy, puedeCancelar, rutinaPublicada, fechaPublicacion,
  onReservar, onCancelar, irAProximoDiaConClases,
  confirmDialog, setConfirmDialog, selectedClass, handleReservar,
  cancelDialog, setCancelDialog, handleCancelar, isLoading,
}) {
  const [rutinaAbierta, setRutinaAbierta] = useState({})
  const hoy = hoyTexto()
  const sinCreditos = !cargandoCreditos && creditos <= 0
  const prevDeshabilitada = aTexto(weekDates[0]) <= hoy // la semana anterior ya pasó entera

  const mover = (dias) => { const d = new Date(selectedDate); d.setDate(d.getDate() + dias); setSelectedDate(d) }

  const franjas = [
    { id: null, label: "Todas", rango: "", cantidad: horasDelDia.length },
    ...turnos.map((t) => ({
      id: t.id,
      label: t.label,
      rango: `${t.desde}–${t.hasta === "23:59" ? "22:00" : t.hasta}`,
      cantidad: horasDelDia.filter((h) => h >= t.desde && h < t.hasta).length,
    })),
  ]
  const franjaActual = franjas.find((f) => f.id === turnoFiltro)
  const hayDia = horasDelDia.length > 0
  const total = grupos.reduce((n, g) => n + g.clases.length, 0)
  const esHoy = aTexto(selectedDate) === hoy

  // Descripción del límite de reserva cuando el botón está deshabilitado
  const motivoNoReservable = esDeHoy(selectedDate)
    ? "Solo se puede reservar hasta 2 horas antes de la clase."
    : "Solo se reservan las clases del día."

  return (
    <Pantalla className="gap-5">
      {errorCarga && (
        <ErrorBanner titulo="No pudimos cargar las clases" texto="Revisá tu conexión e intentá de nuevo." onReintentar={onReintentar} />
      )}

      <section aria-label="Créditos" className={`flex flex-wrap items-center gap-x-[1.125rem] gap-y-3.5 rounded-[0.875rem] border bg-bx-card px-5 py-4 ${sinCreditos ? "border-bx-err-line" : "border-bx-line"}`}>
        <span className={`bx-num grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 text-[1.625rem] leading-none ${sinCreditos ? "border-bx-err-fg text-bx-err-fg" : "border-bx-ok-fg text-bx-ok-fg"}`}>
          {cargandoCreditos ? "…" : creditos}
        </span>
        <div className="min-w-[13.75rem] flex-1">
          <div className="text-base font-bold">{sinCreditos ? "No tenés créditos" : "Créditos disponibles"}</div>
          <div className="text-sm leading-[1.45] text-bx-muted">
            {semana
              ? `Podés reservar hasta ${semana.porSemana} clases por semana (esta semana usaste ${semana.usadas}). Lo que no uses se pierde al terminar la semana y cancelar no devuelve el crédito.`
              : "Cada reserva consume 1 crédito. Si cancelás con 2 horas o más de anticipación, te lo devolvemos."}
          </div>
        </div>
        {sinCreditos
          ? <Boton to="/alumno/plan">Comprar créditos</Boton>
          : <Boton to="/alumno/creditos" variante="secundario" className="text-bx-ink">Ver mis créditos</Boton>}
      </section>

      <Tarjeta aria-labelledby="t-dia" className="flex flex-col gap-[1.125rem]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-[0.1em] text-bx-muted">ELEGÍ EL DÍA</div>
            <h2 id="t-dia" className="mt-1 text-[1.375rem] font-bold">{fechaLarga(selectedDate)}</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              disabled={prevDeshabilitada}
              onClick={() => mover(-7)}
              className="grid h-11 w-11 place-items-center rounded-[0.625rem] border border-bx-line2 bg-transparent text-bx-muted disabled:cursor-not-allowed disabled:opacity-45 enabled:border-bx-btn-line enabled:bg-bx-surf enabled:text-bx-ink enabled:hover:border-bx-lima"
            >
              <Ico d="m15 6-6 6 6 6" size={18} sw={2} />
            </button>
            <button
              type="button"
              aria-label="Semana siguiente"
              onClick={() => mover(7)}
              className="grid h-11 w-11 place-items-center rounded-[0.625rem] border border-bx-btn-line bg-bx-surf text-bx-ink hover:border-bx-lima"
            >
              <Ico d={IC.chevRight} size={18} sw={2} />
            </button>
          </div>
        </div>

        <div role="group" aria-label="Días de la semana" className="grid grid-cols-7 gap-2 overflow-x-auto p-0.5 [grid-template-columns:repeat(7,minmax(60px,1fr))]">
          {weekDates.map((date, i) => {
            const txt = aTexto(date)
            const pasado = txt < hoy
            const sel = txt === aTexto(selectedDate)
            const hayClases = hayClasesEn(date)
            const esDiaHoy = txt === hoy
            return (
              <button
                key={txt}
                type="button"
                disabled={pasado}
                aria-pressed={sel}
                aria-label={`${NOMBRES_DIA[date.getDay()]} ${date.getDate()}${esDiaHoy ? ", hoy" : ""}${hayClases ? ", hay clases" : ", sin clases"}${pasado ? ", no disponible" : ""}`}
                onClick={() => { setSelectedDate(date); setTurnoFiltro(null) }}
                className={`flex h-[5.25rem] flex-col items-center justify-center gap-1 rounded-xl border transition-[transform,background-color,border-color,color,opacity] duration-200 enabled:active:scale-95 ${
                  sel ? "scale-[1.04] border-bx-lima bg-bx-lima text-bx-negro shadow-[0_0.5rem_1.25rem_-0.25rem_rgba(155,230,0,0.35)]"
                  : pasado ? "cursor-not-allowed border-bx-line bg-transparent text-bx-muted opacity-45"
                  : "border-bx-line2 bg-bx-surf text-bx-ink hover:border-bx-lima"
                }`}
              >
                <span className="text-xs font-bold tracking-[0.08em]">{esDiaHoy ? "HOY" : ABREV_DIA[i]}</span>
                <span className="bx-num text-[1.875rem] leading-none">{date.getDate()}</span>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${hayClases ? (sel ? "bg-bx-negro" : "bg-bx-lima") : "bg-transparent"}`} />
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] font-medium text-bx-muted">
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-bx-lima" />Hay clases ese día</span>
          <span>Los días pasados no se pueden reservar</span>
        </div>
      </Tarjeta>

      <div role="group" aria-label="Franja horaria" className="flex flex-wrap gap-2">
        {franjas.map((f) => {
          const activa = f.id === turnoFiltro
          return (
            <button
              key={f.label}
              type="button"
              aria-pressed={activa}
              onClick={() => setTurnoFiltro(f.id)}
              className={`flex min-h-11 items-center gap-2.5 rounded-full border px-4 py-1.5 transition-colors hover:border-bx-lima ${activa ? "border-bx-ink bg-bx-ink text-bx-bg" : "border-bx-btn-line bg-transparent text-bx-ink"}`}
            >
              <span className="text-sm font-bold">{f.label}</span>
              {f.rango && <span className="text-xs font-medium opacity-80">{f.rango}</span>}
              <span className={`h-[1.375rem] min-w-[1.375rem] rounded-[0.6875rem] px-1.5 text-center text-xs font-bold leading-[1.375rem] ${activa ? "bg-[#c9ccbe] text-bx-negro dark:bg-[#c9ccbe]" : "bg-bx-line2"}`}>{f.cantidad}</span>
            </button>
          )
        })}
      </div>

      <section className="flex flex-col gap-3.5">
        {cargando && (
          <div aria-busy="true" aria-label="Cargando clases" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21.25rem),1fr))] gap-3.5">
            <Esqueleto alto={220} className="rounded-2xl" etiqueta="Cargando clase" />
            <Esqueleto alto={220} className="rounded-2xl" etiqueta="Cargando clase" />
          </div>
        )}

        {!cargando && total === 0 && (
          <Vacio
            className="rounded-2xl p-6"
            titulo={hayDia ? `No hay clases en la franja ${franjaActual?.label.toLowerCase()}` : `No hay clases el ${NOMBRES_DIA[selectedDate.getDay()].toLowerCase()} ${selectedDate.getDate()}`}
            texto={hayDia ? "Hay clases en otros horarios de este día." : "Probá con otro día de la semana."}
            accion={
              hayDia
                ? <Boton variante="secundario" onClick={() => setTurnoFiltro(null)}>Ver todas las franjas</Boton>
                : esHoy
                  ? <Boton variante="secundario" onClick={irAProximoDiaConClases}>Ver próximo día con clases</Boton>
                  : <Boton variante="secundario" onClick={() => { setSelectedDate(new Date()); setTurnoFiltro(null) }}>Ir a hoy</Boton>
            }
          />
        )}

        {!cargando && grupos.map(({ key, plan, clases }) => (
          <div key={key} className="flex flex-col gap-3.5">
            <div className="flex items-baseline gap-3">
              <h2 className="m-0 text-lg font-bold">{plan.nombre}</h2>
              <span aria-live="polite" className="text-sm font-medium text-bx-muted">{plural(clases.length, "clase", "clases")}</span>
            </div>
            <ul className="bx-lista m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,21.25rem),1fr))] gap-3.5 p-0">
              {clases.map((c) => {
                const sinCupos = c.cuposDisponibles === 0
                const puedeRes = puedeReservar(selectedDate, c.hora)
                const puedeCan = puedeCancelar(selectedDate, c.hora)
                const publicada = rutinaPublicada(c.publicarEn)
                const tieneContenido = c.descripcion || c.rutina
                const ocupados = Math.max(0, c.cuposTotales - c.cuposDisponibles)
                const idAyuda = `ayuda-${c.id}`
                return (
                  <li key={c.id} className={`bx-lift flex flex-col gap-3.5 rounded-2xl border bg-bx-card p-5 ${c.reservado ? "border-bx-ok-line" : "border-bx-line"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="bx-num text-[2.5rem] leading-none">{c.hora}</div>
                        <div className="mt-1 text-[0.8125rem] font-medium text-bx-muted">{c.duracion}</div>
                      </div>
                      {c.reservado && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-bx-ok-line bg-bx-ok-bg px-3 py-1.5 text-[0.8125rem] font-bold text-bx-ok-fg">
                          <Ico d={IC.check} size={14} sw={2.4} />Reservada
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-[1.0625rem] font-bold">{c.nombre}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-bx-muted"><Ico d={IC.user} size={16} />Coach: {c.coach}</div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-[0.8125rem] font-medium">
                        <span>{sinCupos ? "Sin lugares libres" : plural(c.cuposDisponibles, "lugar libre", "lugares libres")}</span>
                        <span className="text-bx-muted">de {c.cuposTotales}</span>
                      </div>
                      <Progreso valor={ocupados} max={c.cuposTotales} etiqueta="Lugares ocupados" alto={8} />
                    </div>

                    {tieneContenido && (
                      <div className="border-t border-bx-line pt-3">
                        {publicada ? (
                          <>
                            {c.descripcion && (
                              <div
                                className="mb-2 text-[0.8125rem] leading-relaxed text-bx-muted [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-bx-ink [&_ul]:list-disc [&_ul]:pl-4"
                                dangerouslySetInnerHTML={{ __html: sanitizarHtml(c.descripcion) }}
                              />
                            )}
                            {c.rutina && (
                              <>
                                <button
                                  type="button"
                                  aria-expanded={!!rutinaAbierta[c.id]}
                                  onClick={() => setRutinaAbierta((p) => ({ ...p, [c.id]: !p[c.id] }))}
                                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-bx-ok-fg hover:text-bx-ink"
                                >
                                  <Ico d={IC.chevDown} size={16} sw={2} className={`transition-transform duration-300 ${rutinaAbierta[c.id] ? "rotate-180" : ""}`} />
                                  {rutinaAbierta[c.id] ? "Ocultar rutina" : "Ver rutina"}
                                </button>
                                <Desplegable abierto={!!rutinaAbierta[c.id]}>
                                  <div
                                    className="mt-1 rounded-[0.625rem] border border-bx-line2 bg-bx-surf p-3 text-[0.8125rem] leading-relaxed text-bx-muted [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-bx-ink [&_ul]:list-disc [&_ul]:pl-4"
                                    dangerouslySetInnerHTML={{ __html: sanitizarHtml(typeof c.rutina === "string" ? c.rutina : JSON.stringify(c.rutina)) }}
                                  />
                                </Desplegable>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-[0.8125rem] text-bx-muted">
                            Rutina disponible el <strong className="text-bx-ink">{fechaPublicacion(c.publicarEn)}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {c.reservado ? (
                      puedeCan ? (
                        <button
                          type="button"
                          onClick={() => onCancelar(c)}
                          className="h-12 rounded-lg border border-bx-btn-line bg-transparent text-[0.9375rem] font-bold text-bx-ink transition-colors hover:border-bx-err-fg hover:text-bx-err-fg"
                        >
                          Cancelar reserva
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <button type="button" disabled aria-describedby={idAyuda} className="h-12 cursor-not-allowed rounded-lg border border-bx-line2 bg-bx-surf text-[0.9375rem] font-bold text-bx-muted">Reservada</button>
                          <span id={idAyuda} className="text-[0.8125rem] font-medium text-bx-muted">Faltan menos de 2 horas: ya no se puede cancelar.</span>
                        </div>
                      )
                    ) : sinCupos ? (
                      <button type="button" disabled className="h-12 cursor-not-allowed rounded-lg border border-bx-line2 bg-bx-surf text-[0.9375rem] font-bold text-bx-muted">Sin cupos disponibles</button>
                    ) : sinCreditos || !puedeRes ? (
                      <div className="flex flex-col gap-1.5">
                        <button type="button" disabled aria-describedby={idAyuda} className="h-12 cursor-not-allowed rounded-lg border border-bx-line2 bg-bx-surf text-[0.9375rem] font-bold text-bx-muted">Reservar · 1 crédito</button>
                        <span id={idAyuda} className="text-[0.8125rem] font-medium text-bx-muted">{sinCreditos ? "Necesitás al menos 1 crédito para reservar." : motivoNoReservable}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onReservar(c)}
                        aria-label={`Reservar ${c.nombre} a las ${c.hora}, usa 1 crédito`}
                        className="h-12 rounded-lg bg-bx-lima text-[0.9375rem] font-bold text-bx-negro transition-colors hover:bg-bx-lima-hover"
                      >
                        Reservar · 1 crédito
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <Dialogo
        abierto={confirmDialog}
        onCerrar={() => setConfirmDialog(false)}
        titulo="Confirmar reserva"
        ancho={440}
        idEnfocar="btn-confirmar-reserva"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setConfirmDialog(false)}>Volver</Boton>
            <Boton id="btn-confirmar-reserva" onClick={handleReservar} disabled={isLoading || creditos <= 0} aria-busy={isLoading}>
              {isLoading ? "Reservando…" : "Confirmar reserva"}
            </Boton>
          </>
        }
      >
        {selectedClass && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-bx-line2 bg-bx-surf p-4">
              <div className="bx-num text-[2rem] leading-none">{selectedClass.hora}</div>
              <div className="mt-1.5 text-[0.9375rem] font-bold">{selectedClass.nombre}{selectedClass.tipo ? ` · ${selectedClass.tipo}` : ""}</div>
              <div className="text-sm text-bx-muted">{fechaLarga(selectedDate)} · {selectedClass.duracion} · Coach: {selectedClass.coach}</div>
            </div>
            <ul className="m-0 pl-[1.125rem] text-sm leading-[1.6] text-bx-muted">
              {semana ? (
                <>
                  <li>Se descuenta 1 crédito. Te quedan {Math.max(0, creditos - 1)}.</li>
                  <li>En tu plan podés reservar hasta {semana.porSemana} clases por semana y cancelar no devuelve el crédito.</li>
                </>
              ) : (
                <>
                  <li>Se descuenta 1 crédito. Te quedan {Math.max(0, creditos - 1)}.</li>
                  <li>Si cancelás antes de las {horaLimite(selectedClass.hora)}, te devolvemos el crédito.</li>
                </>
              )}
            </ul>
          </div>
        )}
      </Dialogo>

      <Dialogo
        abierto={cancelDialog.open}
        onCerrar={() => setCancelDialog({ open: false, clase: null })}
        titulo="Cancelar reserva"
        alerta
        ancho={440}
        idEnfocar="btn-volver-cancelar"
        pie={
          <>
            <Boton id="btn-volver-cancelar" variante="secundario" onClick={() => setCancelDialog({ open: false, clase: null })}>Volver</Boton>
            <Boton variante="peligroSolido" onClick={handleCancelar} disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? "Cancelando…" : "Confirmar cancelación"}
            </Boton>
          </>
        }
      >
        {cancelDialog.clase && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-bx-line2 bg-bx-surf p-4">
              <div className="bx-num text-[2rem] leading-none">{cancelDialog.clase.hora}</div>
              <div className="mt-1.5 text-[0.9375rem] font-bold">{cancelDialog.clase.nombre}</div>
              <div className="text-sm text-bx-muted">{fechaLarga(selectedDate)} · Coach: {cancelDialog.clase.coach}</div>
            </div>
            <p className="m-0 text-sm leading-[1.6] text-bx-muted">
              {semana
                ? "En tu plan, cancelar no devuelve el crédito: cuenta para los de esta semana."
                : puedeCancelar(selectedDate, cancelDialog.clase.hora)
                  ? "Cancelás con más de 2 horas de anticipación: te devolvemos el crédito."
                  : "Faltan menos de 2 horas para la clase: el crédito no se devuelve."}
            </p>
          </div>
        )}
      </Dialogo>
    </Pantalla>
  )
}
