import { useState } from "react"
import { Link } from "react-router-dom"
import { Calendar, CalendarCheck, CircleSlash, Clock, Dumbbell, Info, RotateCcw, XCircle, Zap } from "lucide-react"
import { fmtFechaPlan } from "@/lib/miPlan"

/*
 * Mis créditos en el celular (debajo de lg). La versión de escritorio sigue en CreditosPage.jsx,
 * que carga los datos (GET /reservas/mis-creditos-movimientos) y los pasa por props.
 */

const REGLAS = [
  <>Cada reserva consume <strong>1 crédito</strong>.</>,
  <>Si no asistís a la clase, el crédito <strong>se descuenta igual</strong>.</>,
  <>Cancelar con <strong>2 horas o más de anticipación</strong> te devuelve el crédito.</>,
  <>Si contratás otra membresía, sus créditos <strong>se suman a los que ya tenés</strong>.</>,
  <>Los créditos de cada plan vencen junto con su membresía.</>,
]

const POR_PAGINA = 10

// "Reserva WOD Crossfit 19:00:00" → { clase: "WOD Crossfit", hora: "19:00" }
function partesReserva(descripcion) {
  const m = String(descripcion || "").match(/^Reserva (.+) (\d{2}:\d{2})(:\d{2})?$/)
  return m ? { clase: m[1], hora: m[2] } : { clase: descripcion, hora: null }
}

// Texto, ícono y color de cada movimiento según su estado real
function verMovimiento(mov) {
  const { clase, hora } = partesReserva(mov.descripcion)
  const fecha = fmtFechaPlan(String(mov.fecha || "").slice(0, 10))
  const conHora = hora ? `${fecha} · ${hora} h` : fecha
  switch (mov.estado) {
    case "Histórico":
      return { titulo: mov.descripcion, sub: fecha, Icon: Zap, tono: "lime" }
    case "Anulado":
      return { titulo: mov.descripcion, sub: `${fecha} · abono anulado, no suma créditos`, Icon: CircleSlash, tono: "gris" }
    case "Cancelada (Devuelto)":
      return { titulo: "Devolución por cancelación anticipada", sub: `${clase} · ${conHora}`, Icon: RotateCcw, tono: "lime" }
    case "Cancelada (Fuera de término)":
      return { titulo: `Cancelación tardía: ${clase}`, sub: `${conHora} · sin devolución`, Icon: CircleSlash, tono: "gris" }
    case "No asistió":
      return { titulo: `No asististe: ${clase}`, sub: conHora, Icon: XCircle, tono: "rojo" }
    case "Próxima":
      return { titulo: `Reserva: ${clase}`, sub: `${conHora} · próxima`, Icon: Clock, tono: "gris" }
    default:
      return { titulo: `Reserva consumida: ${clase}`, sub: conHora, Icon: Dumbbell, tono: "gris" }
  }
}

const TONOS = {
  lime: "border-lime-500/40 bg-lime-400/10 text-lime-700 dark:text-lime-400",
  rojo: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
  gris: "border-border bg-foreground/5 text-foreground/60",
}

function Movimiento({ mov }) {
  const v = verMovimiento(mov)
  const n = String(mov.creditos)
  const color = n.startsWith("+") ? "text-lime-700 dark:text-lime-400" : n.startsWith("-") ? "text-red-700 dark:text-red-400" : "text-foreground/50"
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${TONOS[v.tono]}`}>
        <v.Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{v.titulo}</p>
        <p className="truncate text-xs text-foreground/60">{v.sub}</p>
      </div>
      <span className={`shrink-0 text-base font-black tabular-nums ${color}`}>
        {n === "0" ? "0" : n}
        <span className="sr-only"> créditos</span>
      </span>
    </li>
  )
}

export default function CreditosMovil({ abono, movimientos }) {
  const [filtro, setFiltro] = useState("todos")
  const [visibles, setVisibles] = useState(POR_PAGINA)

  const total = abono?.totalCreditos || 0
  const disponibles = abono?.creditosCisponibles || 0
  const usados = abono?.creditosUtilizados || 0
  const porcentaje = total > 0 ? Math.round((disponibles / total) * 100) : 0
  // Barritas: una por crédito hasta 20; con más créditos, cada barrita representa varios
  const escala = total > 20 ? total / 20 : 1
  const barras = Math.round(total / escala)
  const llenas = Math.round(disponibles / escala)

  const cargas = movimientos.filter((m) => String(m.creditos).startsWith("+"))
  const consumos = movimientos.filter((m) => String(m.creditos).startsWith("-"))
  const lista = filtro === "cargas" ? cargas : filtro === "consumos" ? consumos : movimientos
  const filtros = [
    { id: "todos", label: `Todos (${movimientos.length})` },
    { id: "cargas", label: `Cargas (${cargas.length})` },
    { id: "consumos", label: `Consumos (${consumos.length})` },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-foreground">Mis créditos</h1>
        <p className="mt-1.5 text-sm text-foreground/60">Estado de tu cuenta y movimientos</p>
      </div>

      {/* Disponibles */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-foreground/60">Disponibles</p>
            <p className="mt-1 text-6xl font-black leading-none tabular-nums text-lime-700 dark:text-lime-400">{disponibles}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black leading-none tabular-nums text-foreground/25">{porcentaje}%</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-foreground/50">Restante</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-foreground/70">
          de <span className="font-bold text-foreground">{total} créditos</span>
          {abono?.nombrePlan && <span className="uppercase"> · {abono.nombrePlan}</span>}
        </p>
        {barras > 0 && (
          <div className="mt-3 grid grid-cols-10 gap-1.5" aria-hidden="true">
            {Array.from({ length: barras }).map((_, i) => (
              <span key={i} className={`h-2.5 rounded-full ${i < llenas ? "bg-lime-500 dark:bg-lime-400" : "bg-foreground/10"}`} />
            ))}
          </div>
        )}
        {abono?.fechaVencimiento && (
          <p className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
            <span className="flex items-center gap-1.5 text-foreground/60"><Calendar className="h-4 w-4" aria-hidden="true" /> Vencimiento</span>
            <span className="font-bold text-foreground">{fmtFechaPlan(String(abono.fechaVencimiento).slice(0, 10))}</span>
          </p>
        )}
      </div>

      {/* Total y usados */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Total del plan</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-foreground">{total}</p>
          <p className="text-xs text-foreground/50">créditos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Usados</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-foreground">{usados}</p>
          <p className={`text-xs font-bold ${usados === 0 ? "text-lime-700 dark:text-lime-400" : "text-foreground/50"}`}>
            {usados === 0 ? "Sin uso todavía" : `${usados === 1 ? "clase" : "clases"}`}
          </p>
        </div>
      </div>

      {/* Reglas */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
          <Info className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Cómo funcionan los créditos
        </p>
        <ul className="mt-3 space-y-2.5">
          {REGLAS.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-foreground/75 [&_strong]:text-foreground">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime-500 dark:bg-lime-400" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/alumno/reservar"
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black active:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <CalendarCheck className="h-5 w-5" aria-hidden="true" /> Reservar clase
      </Link>

      {/* Historial */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="titulo-historial">
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <h2 id="titulo-historial" className="text-sm font-black uppercase tracking-wide text-foreground">Historial de movimientos</h2>
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-bold text-foreground/60">{movimientos.length} registros</span>
        </div>
        <div className="mt-3 flex gap-2 px-4" role="group" aria-label="Filtrar movimientos">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => { setFiltro(f.id); setVisibles(POR_PAGINA) }}
              className={`min-h-[40px] rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                filtro === f.id ? "border-lime-400 bg-lime-400 text-black" : "border-border text-foreground/75"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {lista.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/60">Todavía no tenés movimientos de este tipo.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {lista.slice(0, visibles).map((m, i) => <Movimiento key={i} mov={m} />)}
          </ul>
        )}
        {lista.length > visibles && (
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setVisibles((v) => v + POR_PAGINA)}
              className="min-h-[44px] w-full rounded-xl border border-border text-sm font-bold text-foreground/80 active:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              Ver más ({lista.length - visibles} restantes)
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
