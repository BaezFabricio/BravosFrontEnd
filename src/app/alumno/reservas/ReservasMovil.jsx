import { useState } from "react"
import { Link } from "react-router-dom"
import { CalendarPlus, CheckCircle2, ChevronRight, Clock, Dumbbell, Loader2, Search, XCircle, Ban } from "lucide-react"
import { useMiPlan } from "@/lib/miPlan"
import PizarronRutina from "./PizarronRutina"
import { Cargando } from '@/components/Cargando'

/*
 * Mis reservas en el celular (debajo de lg). La versión de escritorio sigue en ReservasPage.jsx,
 * que carga las reservas y maneja el diálogo de cancelar.
 */

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card"

const ESTADOS = {
  proxima: { label: "Confirmada", cls: "border-lime-500/40 bg-lime-400/10 text-lime-700 dark:text-lime-400", Icon: CheckCircle2 },
  completada: { label: "Completada", cls: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400", Icon: CheckCircle2 },
  inasistencia: { label: "No asististe", cls: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400", Icon: XCircle },
  cancelada: { label: "Cancelada", cls: "border-border bg-foreground/5 text-foreground/60", Icon: Ban },
}

const iniciales = (n) => {
  const p = String(n || "").trim().split(/\s+/)
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "BR"
}

// ¿Faltan 2 horas o más? (mismo criterio que el servidor para devolver el crédito)
function devuelveCredito(fecha, hora) {
  const inicio = new Date(`${fecha}T${hora || "00:00"}:00`)
  return (inicio - new Date()) / 3600000 >= 2
}

function TarjetaReserva({ r, onCancelar, onVerRutina }) {
  const e = ESTADOS[r.estado] || ESTADOS.cancelada
  const f = new Date(`${r.fecha}T12:00:00`)
  const dia = f.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")
  const mes = f.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
  const esProxima = r.estado === "proxima"
  const conDevolucion = esProxima && devuelveCredito(r.fecha, r.hora)

  return (
    <li className={`overflow-hidden rounded-2xl border border-border bg-card ${esProxima ? "border-l-4 border-l-lime-500" : ""}`}>
      <div className="flex gap-3 p-4">
        {/* Fecha */}
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-foreground/[0.03] py-2" aria-hidden="true">
          <span className="text-[11px] font-black uppercase text-lime-700 dark:text-lime-400">{dia}</span>
          <span className="text-2xl font-black leading-none tabular-nums text-foreground">{f.getDate()}</span>
          <span className="text-[10px] font-bold uppercase text-foreground/55">{mes}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {r.tipo && <span className="rounded border border-lime-500/40 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400">{r.tipo}</span>}
            <span className="flex items-center gap-1 text-xs font-bold text-foreground/70"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{r.hora} h</span>
            <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${e.cls}`}>
              <e.Icon className="h-3 w-3" aria-hidden="true" /> {e.label}
            </span>
          </div>
          <p className="mt-1.5 text-base font-black leading-snug text-foreground">{r.clase}</p>
          <p className="sr-only">{f.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-400/15 text-[10px] font-black text-lime-700 dark:text-lime-400" aria-hidden="true">{iniciales(r.coach)}</span>
            <p className="min-w-0 truncate text-xs"><span className="text-foreground/55">Coach </span><span className="font-bold text-foreground">{r.coach}</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-2 px-4 pb-4">
        <button
          type="button"
          onClick={() => onVerRutina(r)}
          className={`flex min-h-[48px] w-full items-center gap-2 rounded-xl px-4 text-sm font-black uppercase tracking-wide ${
            esProxima ? "bg-lime-400 text-black active:bg-lime-300" : "border border-border text-foreground/80 active:bg-foreground/5"
          } ${FOCO}`}
        >
          <Dumbbell className="h-5 w-5" aria-hidden="true" /> Ver rutina del día <ChevronRight className="ml-auto h-5 w-5" aria-hidden="true" />
        </button>
        {esProxima && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onCancelar(r)}
              className={`flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-black text-red-700 active:bg-red-500/20 dark:text-red-400 ${FOCO}`}
            >
              <XCircle className="h-4 w-4" aria-hidden="true" /> Cancelar
            </button>
            <p className="text-xs leading-snug text-foreground/55">{conDevolucion ? "Si cancelás, te devolvemos el crédito." : "Si cancelás ahora no se devuelve el crédito (faltan menos de 2 h)."}</p>
          </div>
        )}
      </div>
    </li>
  )
}

export default function ReservasMovil({ proximas, historial, cargando, onCancelar }) {
  const [pestana, setPestana] = useState("proximas")
  const [rutinaDe, setRutinaDe] = useState(null)
  const { data: plan } = useMiPlan()
  // Próximas: de la más cercana a la más lejana (el servidor las manda de la más nueva a la más vieja)
  const proximasOrdenadas = [...proximas].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
  const lista = pestana === "proximas" ? proximasOrdenadas : historial
  const nombrePlan = plan?.vigente ? [...new Set(plan.planes.map((p) => p.nombrePlan))].join(" + ") : null

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-foreground">Mis reservas</h1>
          <p className="mt-1.5 text-sm text-foreground/60">Tus clases y sus rutinas</p>
        </div>
        {plan?.vigente && (
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 rounded-full border border-lime-500/40 bg-lime-400/10 px-2.5 py-1 text-xs font-black text-lime-700 dark:text-lime-400">
              {plan.totalDisponibles} créditos
            </span>
            {nombrePlan && <p className="mt-1 max-w-[9rem] truncate text-[11px] text-foreground/55">{nombrePlan}</p>}
          </div>
        )}
      </div>

      {/* Pestañas */}
      <div role="tablist" aria-label="Mis reservas" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
        {[{ id: "proximas", label: "Próximas", n: proximas.length }, { id: "historial", label: "Historial", n: historial.length }].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={pestana === t.id}
            onClick={() => setPestana(t.id)}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors ${FOCO} ${
              pestana === t.id ? "bg-foreground/10 text-foreground" : "text-foreground/60"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-[11px] font-black ${pestana === t.id ? "bg-lime-400 text-black" : "bg-foreground/10"}`}>{t.n}</span>
          </button>
        ))}
      </div>

      {cargando ? (
        <Cargando filas={3} className="py-4" />
      ) : (
        <>
          {lista.length === 0 ? (
            pestana === "historial" && (
              <p className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-foreground/60">Todavía no tenés clases anteriores.</p>
            )
          ) : (
            <ul className="space-y-3">
              {lista.map((r) => <TarjetaReserva key={r.idReserva} r={r} onCancelar={onCancelar} onVerRutina={setRutinaDe} />)}
            </ul>
          )}

          {pestana === "proximas" && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-4 py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15 text-lime-700 dark:text-lime-400">
                <CalendarPlus className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-3 text-base font-black text-foreground">
                {proximas.length === 0 ? "No tenés clases reservadas" : "¿Tenés espacio en tu semana?"}
              </p>
              {plan?.vigente && (
                <p className="mt-1 text-sm text-foreground/60">
                  Te quedan {plan.totalDisponibles} {plan.totalDisponibles === 1 ? "crédito disponible" : "créditos disponibles"} para entrenar.
                </p>
              )}
              <Link
                to="/alumno/reservar"
                className={`mt-4 flex min-h-[44px] items-center gap-2 rounded-xl border border-lime-500/50 px-5 text-sm font-black text-lime-700 dark:text-lime-400 ${FOCO}`}
              >
                <Search className="h-4 w-4" aria-hidden="true" /> Explorar clases disponibles
              </Link>
            </div>
          )}
        </>
      )}

      <PizarronRutina reserva={rutinaDe} onClose={() => setRutinaDe(null)} />
    </div>
  )
}
