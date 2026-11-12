import { useState } from "react"
import { Link } from "react-router-dom"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { Esqueleto, Progreso } from "@/components/bx"
import { sanitizarHtml } from "@/lib/sanitizarHtml"

/*
 * Reservar clase en el celular (handoff móvil, Prompt 2). Solo presentación: las reglas y los datos vienen de ReservarPage
 * (solo clases del día, hasta 2 h antes, créditos, cupos). Reservar y cancelar pasan por BottomSheet.
 */

const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

// Turno de una clase según su hora (mismos rangos que la página de reservas)
const turnoDeHora = (h) => (h < "12:00" ? "manana" : h < "17:00" ? "tarde" : "noche")

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

// Estado del cupo de una clase, para el texto y la barra
function resumenCupo(clase) {
  const libres = clase.cuposDisponibles ?? 0
  const total = clase.cuposTotales || 15
  const ocupados = Math.max(0, total - libres)
  return { libres, total, ocupados, pct: Math.min(100, (ocupados / total) * 100) }
}

function Chip({ children, tono }) {
  const tonos = {
    ok: "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg",
    neutro: "border-bx-line bg-bx-card text-bx-muted",
    cerrado: "border-bx-line bg-transparent text-bx-muted",
  }
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${tonos[tono]}`}>{children}</span>
}

export default function ReservarMovilNuevo({
  creditos, semana, cargandoCreditos, vencimiento, selectedDate, setSelectedDate, hayClasesEn,
  turnos, turnoFiltro, setTurnoFiltro, clases, cargando, puedeReservar, esDeHoy, puedeCancelar,
  rutinaPublicada, onReservar, onCancelar, irAProximoDiaConClases,
}) {
  const [creditosAbiertos, setCreditosAbiertos] = useState(false)
  const [rutinaAbierta, setRutinaAbierta] = useState({})
  const [hojaClase, setHojaClase] = useState(null) // clase que se confirma en la hoja

  // Fila de 7 días que arranca hoy (nunca muestra días pasados); las flechas pasan de a 7 días
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0)
  const elegido = new Date(selectedDate); elegido.setHours(0, 0, 0, 0)
  const bloque = Math.max(0, Math.floor(Math.round((elegido - inicioHoy) / 86400000) / 7))
  const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(inicioHoy); d.setDate(d.getDate() + bloque * 7 + i); return d })
  const irABloque = (n) => { const d = new Date(inicioHoy); d.setDate(d.getDate() + n * 7); setSelectedDate(d) }

  const titulo = `${DIAS_LARGOS[selectedDate.getDay()]} ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`
  const sinCreditos = !cargandoCreditos && creditos <= 0
  const hayClasesHoy = clases.length > 0
  const countLabel = cargando ? "Cargando…" : plural(clases.length, "clase", "clases")

  const venceTxt = (() => {
    if (!vencimiento) return null
    const v = new Date(`${String(vencimiento).slice(0, 10)}T12:00:00`)
    const h = new Date(); h.setHours(12, 0, 0, 0)
    const dias = Math.round((v - h) / 86400000)
    return `Vencen el ${v.getDate()} de ${MESES[v.getMonth()]} · ${dias <= 0 ? "hoy" : dias === 1 ? "mañana" : `${dias} días`}`
  })()

  const turnoElegido = turnos.find((t) => t.id === turnoFiltro)
  const vacioTitulo = turnoElegido ? `No hay clases en ${turnoElegido.label.toLowerCase()}` : "Este día no hay clases"
  const vacioTexto = turnoElegido ? "Probá con otro turno." : "Elegí otro día de la semana."

  const confirmar = () => { if (hojaClase) onReservar(hojaClase); setHojaClase(null) }

  return (
    <div className="bx bx-entrada flex flex-col gap-5">
      {/* Créditos: número, texto y ⓘ desplegable con cómo funcionan */}
      <section aria-label="Tus créditos" className="overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
        <div className="flex items-center gap-3 py-3 pl-4 pr-2">
          <span className={`bx-num text-[2.25rem] leading-none ${sinCreditos ? "text-bx-err-fg" : "text-bx-ok-fg"}`}>{cargandoCreditos ? "…" : creditos}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-bold">{creditos === 1 ? "crédito disponible" : "créditos disponibles"}</span>
            {venceTxt && <span className="block text-[0.8125rem] text-bx-muted">{venceTxt}</span>}
          </span>
          <button
            type="button"
            onClick={() => setCreditosAbiertos((v) => !v)}
            aria-expanded={creditosAbiertos}
            aria-controls="como-funcionan"
            aria-label="¿Cómo funcionan los créditos?"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-bx-ok-fg active:bg-bx-surf"
          >
            <Ico d={IC.help} size={20} sw={1.8} />
          </button>
        </div>
        {creditosAbiertos && (
          <p id="como-funcionan" className="m-0 border-t border-bx-line2 px-4 py-3 text-sm leading-normal text-bx-muted">
            {semana
              ? `Podés reservar hasta ${semana.porSemana} clases por semana (esta semana usaste ${semana.usadas}). Lo que no uses se pierde al terminar la semana y cancelar no devuelve el crédito.`
              : "Se descuenta 1 crédito por cada clase que reservás. Si cancelás con 2 horas o más de anticipación, te lo devolvemos. Las reservas cierran 2 horas antes de cada clase."}
          </p>
        )}
      </section>

      {/* Día: fila de 7 días (hoy primero; punto lima = hay clases) */}
      <section aria-labelledby="t-dia-m" className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <h2 id="t-dia-m" className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">ELEGÍ EL DÍA</h2>
            <div aria-live="polite" className="mt-0.5 truncate text-xl font-extrabold capitalize">{titulo}</div>
          </div>
          <button type="button" disabled={bloque === 0} onClick={() => irABloque(bloque - 1)} aria-label="Semana anterior" className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.625rem] border border-bx-line text-bx-muted disabled:opacity-40">
            <Ico d="m15 6-6 6 6 6" size={18} sw={2} />
          </button>
          <button type="button" onClick={() => irABloque(bloque + 1)} aria-label="Semana siguiente" className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.625rem] border border-bx-btn-line text-bx-ink">
            <Ico d={IC.chevRight} size={18} sw={2} />
          </button>
        </div>
        <div role="radiogroup" aria-label="Día" className="grid grid-cols-7 gap-1">
          {dias.map((d, i) => {
            const on = iso(d) === iso(elegido)
            const tieneClases = hayClasesEn(d)
            const etiqueta = bloque === 0 && i === 0 ? "HOY" : DIAS_CORTOS[d.getDay()]
            return (
              <button
                key={iso(d)}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${DIAS_LARGOS[d.getDay()]} ${d.getDate()}${etiqueta === "HOY" ? ", hoy" : ""}${tieneClases ? ", hay clases" : ", sin clases"}`}
                onClick={() => setSelectedDate(d)}
                className={`flex h-[4.25rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border transition-[background-color,transform] duration-200 active:scale-95 ${on ? "border-bx-lima bg-bx-lima text-bx-negro" : "border-bx-line bg-bx-card text-bx-ink"}`}
              >
                <span className="text-[0.625rem] font-bold tracking-[0.06em] opacity-85">{etiqueta}</span>
                <span className="bx-num text-[1.5rem] leading-none">{d.getDate()}</span>
                <span aria-hidden="true" className={`h-1 w-1 rounded-full ${tieneClases ? (on ? "bg-bx-negro" : "bg-bx-lima") : "bg-transparent"}`} />
              </button>
            )
          })}
        </div>
      </section>

      {/* Turnos con contador */}
      <div role="group" aria-label="Turno" className="grid grid-cols-4 gap-1 rounded-xl border border-bx-line bg-bx-card p-1">
        {[{ id: null, label: "Todas" }, ...turnos].map((t) => {
          const activo = (t.id ?? null) === (turnoFiltro ?? null)
          const n = t.id == null ? clases.length : clases.filter((c) => turnoDeHora(c.hora) === t.id).length
          return (
            <button key={t.label} type="button" aria-pressed={activo} onClick={() => setTurnoFiltro(t.id ?? null)}
              className={`flex h-10 min-w-0 items-center justify-center gap-1 rounded-[0.5625rem] px-1 text-[0.8125rem] font-bold transition-colors duration-200 ${activo ? "bg-bx-lima text-bx-negro" : "text-bx-ink"}`}>
              <span className="truncate">{t.label}</span>
              <span className="text-[0.6875rem] font-semibold opacity-70">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-[1.0625rem] font-bold">Clases</h2>
        <span aria-live="polite" className="shrink-0 text-[0.8125rem] text-bx-muted">{countLabel}</span>
      </div>

      {sinCreditos && hayClasesHoy && (
        <div role="alert" className="flex gap-2.5 rounded-xl border border-bx-warn-line bg-bx-warn-bg p-3.5 text-sm leading-normal text-bx-warn-fg">
          <Ico d={IC.warn} size={18} sw={2} className="mt-px shrink-0" />
          <span>No tenés créditos para reservar. <Link to="/alumno/plan" className="font-bold underline">Ver planes</Link></span>
        </div>
      )}

      {cargando && (
        <div aria-busy="true" aria-label="Cargando clases" className="flex flex-col gap-2.5">
          <Esqueleto alto={150} className="rounded-2xl" etiqueta="Cargando clase" />
          <Esqueleto alto={150} className="rounded-2xl" etiqueta="Cargando clase" />
        </div>
      )}

      {!cargando && clases.length === 0 && (
        <div className="rounded-2xl border border-dashed border-bx-btn-line px-5 py-8 text-center">
          <div className="text-base font-bold">{vacioTitulo}</div>
          <div className="mt-1 text-sm text-bx-muted">{vacioTexto}</div>
          {turnoElegido && <button type="button" onClick={() => setTurnoFiltro(null)} className="mt-3 min-h-11 text-sm font-bold text-bx-ok-fg">Ver todas las franjas</button>}
          {!turnoElegido && !esDeHoy(selectedDate) && <button type="button" onClick={irAProximoDiaConClases} className="mt-3 min-h-11 text-sm font-bold text-bx-ok-fg">Ver próximo día con clases</button>}
        </div>
      )}

      {!cargando && (
        <ul className="bx-lista m-0 flex list-none flex-col gap-2.5 p-0">
          {clases.map((c) => {
            const { libres, total, ocupados } = resumenCupo(c)
            const reservada = !!c.reservado
            const puedeRes = puedeReservar(selectedDate, c.hora)
            const puedeCan = puedeCancelar(selectedDate, c.hora)
            const cerrada = !reservada && !puedeRes
            const sinCupos = !reservada && libres <= 0
            const publicada = rutinaPublicada(c.publicarEn)
            const rutinaCtx = c.descripcion || c.rutina
            const hora = c.hora
            return (
              <li key={c.id} className={`bx-lift flex flex-col gap-3.5 rounded-2xl border p-4 ${reservada ? "border-bx-ok-line bg-bx-ok-bg" : "border-bx-line bg-bx-card"} ${cerrada ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3.5">
                  <div className="min-w-[4.5rem]">
                    <div className="bx-num text-[2.125rem] leading-none">{hora}</div>
                    <div className="mt-1 text-xs text-bx-muted">{c.duracion || "60 min"}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[1rem] font-bold">{c.nombre}</span>
                      {c.tipo && <span className="rounded-md border border-bx-btn-line px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-bx-muted">{c.tipo}</span>}
                    </div>
                    <div className="mt-1.5 text-[0.8125rem] text-bx-muted">Coach: {c.coach}</div>
                  </div>
                  {reservada ? <Chip tono="ok"><Ico d={IC.check} size={12} sw={2.6} />Reservada</Chip>
                    : cerrada ? <Chip tono="cerrado">Cerrada</Chip>
                    : sinCupos ? <Chip tono="cerrado">Sin lugar</Chip>
                    : <Chip tono="ok">{plural(libres, "libre", "libres")}</Chip>}
                </div>

                <div>
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-bx-muted">
                    <span>{plural(libres, "lugar libre", "lugares libres")} de {total}</span>
                    <span>{ocupados} anotados</span>
                  </div>
                  <Progreso valor={ocupados} max={total} etiqueta="Lugares ocupados" alto={6} color="bg-bx-barra" />
                </div>

                {/* Rutina de la clase (si ya está publicada) */}
                {rutinaCtx && publicada && (
                  <div>
                    <button type="button" aria-expanded={!!rutinaAbierta[c.id]} onClick={() => setRutinaAbierta((p) => ({ ...p, [c.id]: !p[c.id] }))} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-bx-ok-fg">
                      <Ico d={IC.dumb} size={16} />{rutinaAbierta[c.id] ? "Ocultar rutina" : "Ver rutina"}
                    </button>
                    {rutinaAbierta[c.id] && (
                      <div className="mt-2 rounded-xl border border-bx-line2 bg-bx-surf p-3 text-[0.8125rem] leading-relaxed text-bx-muted [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-bx-ink [&_ul]:list-disc [&_ul]:pl-4"
                        dangerouslySetInnerHTML={{ __html: sanitizarHtml(c.descripcion || (typeof c.rutina === "string" ? c.rutina : JSON.stringify(c.rutina))) }} />
                    )}
                  </div>
                )}

                {reservada ? (
                  <div className="flex flex-col gap-2">
                    {puedeCan ? (
                      <>
                        <span className="text-[0.8125rem] text-bx-muted">Podés cancelar sin perder el crédito hasta las {hora} (2 h antes).</span>
                        <button type="button" onClick={() => onCancelar(c)} className="h-12 rounded-xl border border-bx-btn-line bg-transparent text-[0.9375rem] font-bold text-bx-err-fg active:bg-bx-err-bg">Cancelar reserva</button>
                      </>
                    ) : (
                      <span className="text-[0.8125rem] text-bx-muted">Ya no se puede cancelar: faltan menos de 2 horas.</span>
                    )}
                  </div>
                ) : sinCupos ? (
                  <button type="button" disabled className="h-12 cursor-not-allowed rounded-xl bg-bx-line2 text-[0.9375rem] font-bold text-bx-muted">Sin lugares</button>
                ) : cerrada ? (
                  <span className="text-[0.8125rem] text-bx-muted">Las reservas cerraron 2 horas antes de la clase.</span>
                ) : sinCreditos ? (
                  <button type="button" disabled className="h-12 cursor-not-allowed rounded-xl bg-bx-line2 text-[0.9375rem] font-bold text-bx-muted">Sin créditos</button>
                ) : (
                  <button type="button" onClick={() => setHojaClase(c)} aria-label={`Reservar la clase de las ${hora}, usa 1 crédito`}
                    className="h-12 rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold tracking-[0.02em] text-bx-negro transition-[background-color,transform] duration-200 active:scale-[0.98] hover:bg-bx-lima-hover">
                    RESERVAR · 1 CRÉDITO
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Confirmar la reserva */}
      <BottomSheet
        abierto={!!hojaClase}
        onCerrar={() => setHojaClase(null)}
        titulo="¿Reservar esta clase?"
        pie={
          <div className="flex w-full flex-col gap-2.5">
            <button type="button" onClick={confirmar} className="h-[3.25rem] rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold tracking-[0.03em] text-bx-negro active:scale-[0.98]">CONFIRMAR RESERVA</button>
            <button type="button" onClick={() => setHojaClase(null)} className="h-11 text-sm font-bold text-bx-ink">Volver</button>
          </div>
        }
      >
        {hojaClase && (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5 rounded-xl border border-bx-line2 bg-bx-surf p-3.5">
              <span className="bx-num text-[2.125rem] leading-none">{hojaClase.hora}</span>
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-bold">{hojaClase.nombre} · {titulo.split(" de ")[0]}</span>
                <span className="block text-[0.8125rem] text-bx-muted">Coach: {hojaClase.coach} · {hojaClase.duracion || "60 min"}</span>
              </span>
            </div>
            <ul className="m-0 list-disc pl-5 text-sm leading-relaxed text-bx-muted">
              <li>Usa 1 crédito. Te quedan <strong className="text-bx-ink">{Math.max(0, creditos - 1)}</strong>.</li>
              <li>Podés cancelar sin perder el crédito hasta las {hojaClase.hora} (2 h antes).</li>
            </ul>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
