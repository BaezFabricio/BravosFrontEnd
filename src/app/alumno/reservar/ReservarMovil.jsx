import { Cargando } from '@/components/Cargando'
import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarX2, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, Lock, Plus, XCircle } from "lucide-react"
import { sanitizarHtml } from "@/lib/sanitizarHtml"

/*
 * Reservar clase en el celular (debajo de lg). La versión de escritorio sigue en
 * ReservarPage.jsx, que calcula los datos y maneja los diálogos de confirmar y cancelar.
 */

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] // por getDay()

const iniciales = (nombre) => {
  const p = String(nombre || "").trim().split(/\s+/)
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "BR"
}

// Bravo asomado sobre el cuadrito verde cuando no hay clases (public/bravo_asomado.webp, fondo
// transparente). La imagen ya trae dibujado el borde donde apoya las patas: se ubica para que ese
// borde coincida con el filo de arriba del cuadrito y las patas cuelguen por delante.
// Medidas sacadas de la imagen (1024 px): borde en y = 896, cuerpo de x = 290 a x = 992.
const ANCHO_IMG = 84
const BORDE_Y = (896 / 1024) * ANCHO_IMG      // ≈ 74 px desde arriba de la imagen
const CENTRO_X = ((290 + 992) / 2 / 1024) * ANCHO_IMG

function MascotaEnCaja() {
  return (
    <div className="bravo-caja relative mt-[64px] h-[52px] w-[68px]" role="img" aria-label="Bravo se asoma sobre el cuadrito">
      <style>{`
        @keyframes bravo-asoma { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        /* Saltito sutil cada 3 segundos: Bravo y el cuadrito suben juntos, se estiran y vuelven a apoyarse */
        @keyframes bravo-salta {
          0%, 70%, 100% { transform: translateY(0) scale(1, 1); }
          76% { transform: translateY(1px) scale(1.03, .97); }
          84% { transform: translateY(-6px) scale(.98, 1.03); }
          92% { transform: translateY(0) scale(1.02, .98); }
        }
        .bravo-asoma { animation: bravo-asoma .6s cubic-bezier(.22,1.2,.36,1) .1s both; transform-origin: bottom center; }
        .bravo-caja { animation: bravo-salta 3s ease-in-out 1.2s infinite; transform-origin: bottom center; }
        @media (prefers-reduced-motion: reduce) { .bravo-asoma, .bravo-caja { animation: none; } }
      `}</style>
      {/* Cuadrito verde */}
      <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-lime-400 pt-2 text-black shadow-lg shadow-lime-500/20">
        <CalendarX2 className="h-7 w-7" strokeWidth={2.25} />
      </span>
      {/* Bravo, con las patas apoyadas en el filo */}
      <img
        src="/bravo_asomado.webp"
        alt=""
        draggable={false}
        className="bravo-asoma absolute max-w-none select-none"
        style={{ width: ANCHO_IMG, top: -BORDE_Y + 1, left: 34 - CENTRO_X }}
      />
    </div>
  )
}

// Color y texto según los lugares que quedan
function estadoCupo(clase) {
  if (clase.reservado) return { borde: "border-l-lime-500", chip: "border-lime-500/40 bg-lime-400/15 text-lime-700 dark:text-lime-400", texto: "Reservado" }
  if (clase.cuposDisponibles <= 0) return { borde: "border-l-red-500", chip: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400", texto: "Completo" }
  if (clase.cuposDisponibles <= 3) {
    const n = clase.cuposDisponibles
    return { borde: "border-l-yellow-500", chip: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", texto: `¡${n} ${n === 1 ? "lugar restante" : "lugares restantes"}!` }
  }
  return { borde: "border-l-lime-500", chip: "border-lime-500/30 bg-lime-400/10 text-lime-700 dark:text-lime-400", texto: `${clase.cuposDisponibles} lugares libres` }
}

export default function ReservarMovil({
  creditos, cargandoCreditos, vencimiento, selectedDate, setSelectedDate, hayClasesEn,
  turnos, turnoFiltro, setTurnoFiltro, clases, nombrePlan, cargando, puedeReservar, puedeCancelar,
  rutinaPublicada, fechaPublicacion, onReservar, onCancelar, irAProximoDiaConClases,
}) {
  const [rutinaAbierta, setRutinaAbierta] = useState({})
  const hoy = new Date()
  const esHoy = (d) => d.toDateString() === hoy.toDateString()
  const titulo = selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  const venceTxt = (() => {
    if (!vencimiento) return null
    const v = new Date(`${String(vencimiento).slice(0, 10)}T12:00:00`)
    const h = new Date(); h.setHours(12, 0, 0, 0)
    const dias = Math.round((v - h) / 86400000)
    return `${v.toLocaleDateString("es-AR", { day: "numeric", month: "long" })} (${dias <= 0 ? "hoy" : dias === 1 ? "mañana" : `${dias} días`})`
  })()

  // Fila de 7 días que arranca hoy (nunca muestra días pasados). Las flechas pasan de a 7 días;
  // la ventana se deduce del día elegido, así "Ver próximos días" también la mueve.
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0)
  const elegido = new Date(selectedDate); elegido.setHours(0, 0, 0, 0)
  const bloque = Math.max(0, Math.floor(Math.round((elegido - inicioHoy) / 86400000) / 7))
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioHoy); d.setDate(d.getDate() + bloque * 7 + i); return d
  })
  const irABloque = (n) => { const d = new Date(inicioHoy); d.setDate(d.getDate() + n * 7); setSelectedDate(d) }
  const etiquetaDia = (d, i) => (bloque === 0 && i === 0 ? "Hoy" : DIAS_CORTOS[d.getDay()])

  return (
    <div className="space-y-4">
      {/* Créditos */}
      <div data-guia="creditos" className="rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-lime-500 text-lg font-black tabular-nums text-lime-700 dark:border-lime-400 dark:text-lime-400">
            {cargandoCreditos ? "…" : creditos}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              Créditos disponibles
              {vencimiento && <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400">Activo</span>}
            </p>
            {venceTxt && <p className="text-xs leading-snug text-foreground/60">Vence: {venceTxt}</p>}
          </div>
          <Link to="/alumno/plan" className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-lime-600/50 px-3 text-xs font-bold text-lime-700 dark:border-lime-400/50 dark:text-lime-400">
            <Plus className="h-3.5 w-3.5" /> Comprar
          </Link>
        </div>
        {/* Cómo se usan los créditos (mismas reglas que el servidor: 1 por reserva, se devuelve cancelando con 2 h o más) */}
        <p className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-xs leading-snug text-foreground/75">
          <Info className="mt-px h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
          <span>
            <strong className="text-foreground">Cada clase que reservás usa 1 crédito.</strong>{" "}
            Si cancelás con 2 horas o más de anticipación, te lo devolvemos.
          </span>
        </p>
      </div>

      {/* Elegir el día */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Elegí el día</p>
            <p className="mt-0.5 text-xl font-black capitalize leading-tight text-foreground">{titulo}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" aria-label="7 días anteriores" disabled={bloque === 0} onClick={() => irABloque(bloque - 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground/80 active:bg-foreground/5 disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="7 días siguientes" onClick={() => irABloque(bloque + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground/80 active:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div data-guia="dias" className="mt-4 grid grid-cols-7 gap-1.5">
          {dias.map((d, i) => {
            const sel = d.toDateString() === selectedDate.toDateString()
            const conClases = hayClasesEn(d)
            const etiqueta = etiquetaDia(d, i)
            return (
              <button
                key={d.toDateString()}
                type="button"
                onClick={() => setSelectedDate(d)}
                aria-pressed={sel}
                aria-label={`${d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}${esHoy(d) ? ", hoy" : ""}${conClases ? ", hay clases" : ", sin clases"}`}
                className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                  sel
                    ? "scale-[1.06] border-lime-400 bg-lime-400 text-black shadow-lg shadow-lime-500/30"
                    : conClases
                    ? "border-lime-500/50 bg-lime-400/10 text-foreground active:scale-95"
                    : "border-border bg-transparent text-foreground/45 active:scale-95"
                }`}
              >
                <span aria-hidden="true" className={`text-[11px] font-black uppercase tracking-wide ${
                  sel ? "text-black/75" : esHoy(d) ? "text-lime-700 dark:text-lime-400" : conClases ? "text-foreground/75" : ""
                }`}>{etiqueta}</span>
                <span aria-hidden="true" className="mt-0.5 text-2xl font-black leading-none tabular-nums">{d.getDate()}</span>
                <span aria-hidden="true" className={`mt-1.5 h-1.5 w-1.5 rounded-full ${conClases ? (sel ? "bg-black" : "bg-lime-500") : "bg-transparent"}`} />
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-foreground/60">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lime-500" /> Días con clases
          </p>
          {bloque > 0 && (
            <button type="button" onClick={() => setSelectedDate(new Date())} className="min-h-[44px] rounded-xl border border-border px-4 text-sm font-bold text-foreground/80 active:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card">
              Volver a hoy
            </button>
          )}
        </div>
      </div>

      {/* Turnos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-foreground/60">Turnos disponibles</p>
          {!cargando && (
            <p className="text-xs font-bold text-lime-700 dark:text-lime-400">
              {clases.length} {clases.length === 1 ? "clase encontrada" : "clases encontradas"}
            </p>
          )}
        </div>
        <div data-guia="turnos" className="grid grid-cols-4 gap-1.5">
          {[{ id: null, label: "Todas" }, ...turnos].map((t) => {
            const activo = turnoFiltro === t.id
            return (
              <button
                key={t.id ?? "todas"}
                type="button"
                onClick={() => setTurnoFiltro(t.id)}
                aria-pressed={activo}
                aria-label={t.id ? undefined : "Todas las clases del día"}
                className={`min-h-[44px] rounded-full border px-1 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                  activo ? "border-lime-400 bg-lime-400 text-black" : "border-border text-foreground/80"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Clases */}
      {cargando ? (
        <Cargando filas={3} className="py-4" />
      ) : clases.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-5 py-8 text-center">
          <MascotaEnCaja />
          <p className="mt-3 text-base font-black text-foreground">
            No hay clases disponibles{turnoFiltro ? ` a la ${turnos.find((t) => t.id === turnoFiltro)?.label.toLowerCase()}` : ""}
          </p>
          <p className="mt-1 text-sm text-foreground/50">Para este {selectedDate.toLocaleDateString("es-AR", { weekday: "long" })} no hay turnos programados.</p>
          <button
            type="button"
            onClick={irAProximoDiaConClases}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-lime-600/50 text-sm font-black text-lime-700 dark:border-lime-400/50 dark:text-lime-400"
          >
            Ver próximos días disponibles <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clases.map((c) => {
            const e = estadoCupo(c)
            const ocupados = Math.max((c.cuposTotales ?? 0) - (c.cuposDisponibles ?? 0), 0)
            const puedeRes = puedeReservar(selectedDate, c.hora)
            const puedeCan = puedeCancelar(selectedDate, c.hora)
            const plan = nombrePlan(c.idPlan)
            const publicada = rutinaPublicada(c.publicarEn)
            return (
              <div key={c.id} className={`rounded-2xl border border-l-4 border-border bg-card p-4 ${e.borde}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-black tabular-nums text-foreground">{c.hora}</span>
                      {plan && (
                        <span className="rounded border border-lime-500/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400">{plan}</span>
                      )}
                    </div>
                    <p className="mt-1 text-base font-bold leading-snug text-foreground">{c.nombre}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-black ${e.chip}`}>
                    {c.reservado && <CheckCircle2 className="mr-1 inline h-3 w-3" />}{e.texto}
                  </span>
                </div>

                {c.reservado && (
                  <Link to="/alumno/reservas" className="mt-3 flex min-h-[40px] items-center justify-between gap-2 rounded-xl bg-lime-400/10 px-3 text-xs font-black uppercase tracking-wide text-lime-700 active:bg-lime-400/20 dark:text-lime-400">
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Ya la reservaste · Ver mi reserva</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-xs font-black text-lime-700 dark:text-lime-400">
                      {iniciales(c.coach)}
                    </span>
                    <div className="min-w-0 text-xs">
                      <p className="text-foreground/50">Coach</p>
                      <p className="truncate font-bold text-foreground">{c.coach}</p>
                    </div>
                    <div className="shrink-0 text-xs">
                      <p className="text-foreground/50">Cupos</p>
                      <p className="font-bold tabular-nums text-foreground">{ocupados} / {c.cuposTotales}</p>
                    </div>
                  </div>

                  {/* Acción según el estado */}
                  {c.reservado ? (
                    puedeCan ? (
                      <button type="button" onClick={() => onCancelar(c)} className="flex shrink-0 items-center gap-1 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-black uppercase text-red-700 dark:text-red-400">
                        <XCircle className="h-3.5 w-3.5" /> Cancelar
                      </button>
                    ) : (
                      <span className="shrink-0 text-right text-[10px] font-bold leading-tight text-foreground/50">Ya no se<br />puede cancelar</span>
                    )
                  ) : c.cuposDisponibles <= 0 ? null : creditos <= 0 ? (
                    <span className="shrink-0 text-right text-[10px] font-bold leading-tight text-red-700 dark:text-red-400">Sin<br />créditos</span>
                  ) : !puedeRes ? (
                    <span className="shrink-0 text-right text-[10px] font-bold leading-tight text-foreground/50">Cerrada<br />(2 h antes)</span>
                  ) : (
                    <button type="button" data-guia="reservar" onClick={() => onReservar(c)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2.5 text-xs font-black uppercase text-black active:bg-lime-300">
                      Reservar <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Rutina de la clase, si el profesor la cargó */}
                {(c.descripcion || c.rutina) && (
                  <div className="mt-3 border-t border-border pt-2.5">
                    {publicada ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setRutinaAbierta((p) => ({ ...p, [c.id]: !p[c.id] }))}
                          className="flex items-center gap-1 text-xs font-bold text-lime-700 dark:text-lime-400"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${rutinaAbierta[c.id] ? "rotate-180" : ""}`} />
                          {rutinaAbierta[c.id] ? "Ocultar rutina" : "Ver rutina"}
                        </button>
                        {rutinaAbierta[c.id] && (
                          <div
                            className="mt-2 rounded-lg border border-border bg-foreground/5 p-3 text-xs text-foreground/70 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-4"
                            dangerouslySetInnerHTML={{
                              __html: sanitizarHtml(
                                [c.descripcion, typeof c.rutina === "string" ? c.rutina : c.rutina ? JSON.stringify(c.rutina) : ""].filter(Boolean).join("")
                              ),
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                        <Lock className="h-3.5 w-3.5 shrink-0" /> Rutina disponible el {fechaPublicacion(c.publicarEn)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
