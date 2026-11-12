import { useState } from "react"
import { Link } from "react-router-dom"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { FiltroChips, Progreso } from "@/components/bx"

/*
 * Mis créditos en el celular (handoff móvil, Prompt 4). Disponibles grandes con barra, fila de 20 del plan / usados / vencimiento,
 * "Cómo funcionan" desplegable y movimientos con filtros (Todos, Cargas, Consumos). + en lima, − en texto normal y 0 en gris.
 */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const fecha = (f) => { const d = new Date(`${String(f).slice(0, 10)}T12:00:00`); return `${d.getDate()} ${MESES[d.getMonth()]}` }

export default function CreditosMovilNuevo({ abono, movimientos = [] }) {
  const [pol, setPol] = useState(false)
  const [filtro, setFiltro] = useState("todos")
  const total = abono?.totalCreditos || 0
  const disponibles = abono?.creditosCisponibles || 0
  const usados = abono?.creditosUtilizados || 0

  const cargas = movimientos.filter((m) => String(m.creditos).startsWith("+"))
  const consumos = movimientos.filter((m) => String(m.creditos).startsWith("-"))
  const lista = filtro === "cargas" ? cargas : filtro === "consumos" ? consumos : movimientos

  const reglas = abono?.semana
    ? [`Podés reservar hasta ${abono.semana.porSemana} clases por semana: esta semana usaste ${abono.semana.usadas}.`, "Lo que no uses en la semana se pierde cuando termina (el viernes).", "Cada reserva consume 1 crédito y cancelar no lo devuelve."]
    : ["Se descuenta 1 crédito por día de apertura, reserves o no.", "Si contratás otra membresía, sus créditos se suman a los que ya tenés."]
  reglas.push("Los créditos de cada plan vencen junto con su membresía.")

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Mis créditos</h1>

      <section aria-labelledby="t-disp-m" className="flex flex-col gap-3.5 rounded-2xl border border-bx-hero-line bg-bx-hero p-5 text-[#ecefe4]">
        <div className="flex items-center justify-between gap-2">
          <h2 id="t-disp-m" className="m-0 text-xs font-semibold tracking-[0.1em] text-[#a3a698]">CRÉDITOS DISPONIBLES</h2>
          {abono?.nombrePlan && <span className="text-xs font-semibold text-[#a3a698]">{abono.nombrePlan}</span>}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="bx-num text-[4.5rem] leading-[0.85] text-bx-lima">{disponibles}</span>
          <span className="text-lg font-bold text-[#a3a698]">de {total}</span>
        </div>
        <Progreso valor={disponibles} max={total || 1} etiqueta="Créditos disponibles" alto={8} color="bg-bx-lima" className="!bg-[#2a2a2a]" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-[#262626] bg-[#1a1a1a] px-2 py-2.5"><div className="bx-num text-xl">{total}</div><div className="text-[0.6875rem] text-[#a3a698]">del plan</div></div>
          <div className="rounded-xl border border-[#262626] bg-[#1a1a1a] px-2 py-2.5"><div className="bx-num text-xl">{usados}</div><div className="text-[0.6875rem] text-[#a3a698]">usados</div></div>
          <div className="rounded-xl border border-[#262626] bg-[#1a1a1a] px-2 py-2.5"><div className="bx-num text-xl">{abono?.fechaVencimiento ? fecha(abono.fechaVencimiento) : "—"}</div><div className="text-[0.6875rem] text-[#a3a698]">vencimiento</div></div>
        </div>
        {disponibles === 0 && (
          <Link to="/alumno/plan" className="flex h-[3rem] items-center justify-center rounded-xl bg-bx-lima text-sm font-extrabold tracking-[0.04em] text-bx-negro">VER PLANES</Link>
        )}
      </section>

      <section aria-labelledby="t-como-m" className="rounded-2xl border border-bx-line bg-bx-card">
        <button type="button" onClick={() => setPol((v) => !v)} aria-expanded={pol} aria-controls="pol-m" className="flex min-h-[3.5rem] w-full items-center justify-between gap-3 px-4 text-left">
          <h2 id="t-como-m" className="m-0 text-[0.9375rem] font-bold">Cómo funcionan los créditos</h2>
          <Ico d={IC.chevDown} size={18} sw={2} className={`text-bx-muted transition-transform duration-300 ${pol ? "rotate-180" : ""}`} />
        </button>
        {pol && (
          <ul id="pol-m" className="m-0 flex list-disc flex-col gap-2 border-t border-bx-line2 px-8 py-3 text-sm leading-normal text-bx-muted">
            {reglas.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-mov-m" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="t-mov-m" className="m-0 text-[1.0625rem] font-bold">Movimientos</h2>
          <span aria-live="polite" className="text-[0.8125rem] text-bx-muted">{movimientos.length} registros</span>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FiltroChips etiqueta="Filtrar movimientos" tactil valor={filtro} onChange={setFiltro} className="w-max flex-nowrap"
            opciones={[{ id: "todos", label: "Todos", contador: movimientos.length }, { id: "cargas", label: "Cargas", contador: cargas.length }, { id: "consumos", label: "Consumos", contador: consumos.length }]} />
        </div>
        {movimientos.length === 0 && <div className="rounded-2xl border border-dashed border-bx-btn-line px-4 py-6 text-center text-sm text-bx-muted">Todavía no tenés movimientos registrados.</div>}
        {movimientos.length > 0 && lista.length === 0 && <div className="rounded-2xl border border-dashed border-bx-btn-line px-4 py-6 text-center text-sm text-bx-muted">No hay movimientos de este tipo.</div>}
        <ul className="bx-lista m-0 flex list-none flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card p-0">
          {lista.map((m, i) => {
            const n = Number(String(m.creditos).replace("+", "")) || 0
            const signo = n > 0 ? "+" : n < 0 ? "−" : ""
            const monto = n === 0 ? "0" : `${signo}${Math.abs(n)}`
            const color = n > 0 ? "text-bx-ok-fg" : n === 0 ? "text-bx-muted" : "text-bx-ink"
            return (
              <li key={i} className="flex items-center gap-3 border-t border-bx-line2 px-4 py-3 first:border-t-0">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${n > 0 ? "bg-bx-tile text-bx-ok-fg" : "bg-bx-line2 text-bx-ink"}`}><Ico d={n > 0 ? IC.bolt : IC.check} size={18} sw={2} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.9375rem] font-bold">{m.descripcion}</div>
                  <div className="mt-0.5 text-[0.8125rem] text-bx-muted">{fecha(m.fecha)} · {m.estado}</div>
                </div>
                <span aria-label={n === 0 ? "sin cambios" : `${n > 0 ? "suma" : "resta"} ${Math.abs(n)} ${Math.abs(n) === 1 ? "crédito" : "créditos"}`} className={`bx-num min-w-[2.5rem] text-right text-[1.5rem] leading-none ${color}`}>{monto}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
