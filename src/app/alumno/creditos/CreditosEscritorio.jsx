import { useState } from "react"
import { Boton, ErrorBanner, Esqueleto, FiltroChips, HeroCard, Pantalla, Progreso } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { fechaDeTexto, fechaCorta, hoyTexto } from "@/lib/fechasBx"
import { Link } from "react-router-dom"

/*
 * Mis créditos en escritorio (handoff, pantalla 07). La carga de datos (y su actualización cada 8 s) está en CreditosPage.
 */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

const INFO_ICONOS = {
  rec: IC.bolt,
  dev: IC.back,
  uso: IC.check,
  anu: IC.close,
}

// Cada movimiento del servidor se traduce al tipo del diseño: Recarga, Devuelto, Asistió, Anulado…
function tipoDeMovimiento(estado) {
  switch (estado) {
    case "Histórico": return { k: "rec", tipo: "Recarga" }
    case "Cancelada (Devuelto)": return { k: "dev", tipo: "Devuelto" }
    case "Anulado": return { k: "anu", tipo: "Anulado" }
    case "Completada": return { k: "uso", tipo: "Asistió" }
    case "Próxima": return { k: "uso", tipo: "Reservada" }
    case "No asistió": return { k: "uso", tipo: "No asistió" }
    case "Cancelada (Fuera de término)":
    case "Cancelada (sin devolución)": return { k: "uso", tipo: "Cancelada sin devolución" }
    case "Vencido": return { k: "uso", tipo: "Sin usar (vencieron)" }
    default: return { k: "uso", tipo: estado }
  }
}

const ESTILO = {
  rec: { icono: "bg-bx-tile text-bx-ok-fg", monto: "text-bx-ok-fg" },
  dev: { icono: "bg-bx-tile text-bx-ok-fg", monto: "text-bx-ok-fg" },
  uso: { icono: "bg-bx-line2 text-bx-ink", monto: "text-bx-ink" },
  anu: { icono: "bg-transparent text-bx-muted", monto: "text-bx-muted" },
}

// "10 de diciembre de 2026" y cuántos días faltan
function vencimientoLargo(f) {
  const d = fechaDeTexto(f)
  if (Number.isNaN(d.getTime())) return ""
  const hoy = fechaDeTexto(hoyTexto())
  const dias = Math.round((d - hoy) / 86400000)
  const cuando = dias < 0 ? "vencieron" : dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()} (${cuando})`
}

export default function CreditosEscritorio({ datos, cargando, error, onReintentar }) {
  const [filtro, setFiltro] = useState("todos")

  if (error) {
    return <Pantalla><ErrorBanner titulo="No pudimos cargar tus créditos" texto="Revisá tu conexión e intentá de nuevo." onReintentar={onReintentar} /></Pantalla>
  }
  if (cargando || !datos) {
    return (
      <Pantalla>
        <div aria-busy="true" aria-label="Cargando créditos" className="flex flex-col gap-6">
          <Esqueleto alto={200} className="rounded-[20px]" />
          <Esqueleto alto={260} className="rounded-2xl" />
        </div>
      </Pantalla>
    )
  }

  const { abono, movimientos = [] } = datos
  const sinAbono = !abono || abono.nombrePlan === "Sin plan activo"
  const total = abono?.totalCreditos || 0
  const disponibles = abono?.creditosCisponibles || 0
  const usados = abono?.creditosUtilizados || 0

  const movs = movimientos.map((m) => {
    const t = tipoDeMovimiento(m.estado)
    const n = Number(String(m.creditos).replace("+", "")) || 0
    return { ...m, ...t, n }
  })
  const lista = movs.filter((m) => filtro === "todos" || m.k === filtro)
  const filtros = [
    { id: "todos", label: "Todos" },
    { id: "rec", label: "Recargas" },
    { id: "uso", label: "Usos" },
    { id: "dev", label: "Devoluciones" },
  ]

  const reglas = abono?.semana
    ? [
        `Podés reservar hasta ${abono.semana.porSemana} clases por semana: esta semana usaste ${abono.semana.usadas}.`,
        "Lo que no uses en la semana se pierde cuando termina (el viernes).",
        "Cada reserva consume 1 crédito y cancelar no lo devuelve.",
        "Si contratás otra membresía, sus créditos se suman a los que ya tenés.",
        "Los créditos de cada plan vencen junto con su membresía.",
      ]
    : [
        "Se descuenta 1 crédito por día de apertura, reserves o no.",
        "Si contratás otra membresía, sus créditos se suman a los que ya tenés.",
        "Los créditos de cada plan vencen junto con su membresía.",
      ]

  return (
    <Pantalla>
      {sinAbono ? (
        <HeroCard aria-labelledby="t-disp" logo>
          <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-4">
            <div>
              <h2 id="t-disp" className="m-0 text-xs font-semibold tracking-[0.1em] text-[#a3a698]">CRÉDITOS DISPONIBLES</h2>
              <div className="mt-2 text-lg font-bold">Sin membresía vigente</div>
              <div className="text-[15px] text-[#b9bcae]">Renová tu plan para volver a reservar clases.</div>
            </div>
            <Boton to="/alumno/plan" tamano="lg" className="gap-2"><Ico d={IC.wallet} size={18} sw={2} />Ver planes</Boton>
          </div>
        </HeroCard>
      ) : (
        <HeroCard aria-labelledby="t-disp" logo={false}>
          <img src="/bravos-logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-[45%] top-1/2 h-[245px] w-[760px] max-w-none -translate-y-1/2 -rotate-6 opacity-[0.05] [filter:grayscale(1)_brightness(1.4)]" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-12 gap-y-6">
            <div className="flex min-w-0 flex-col gap-2">
              <h2 id="t-disp" className="m-0 text-xs font-semibold tracking-[0.1em] text-[#a3a698]">CRÉDITOS DISPONIBLES</h2>
              <div className="flex items-baseline gap-2.5">
                <span className="bx-num text-[clamp(80px,9vw,120px)] leading-[0.85] text-bx-lima">{disponibles}</span>
                <span className="text-[22px] font-bold text-[#a3a698]">de {total}</span>
              </div>
              <div className="text-[15px] text-[#b9bcae]">
                {abono.nombrePlan}{abono.fechaVencimiento ? ` · Vencen el ${vencimientoLargo(abono.fechaVencimiento)}` : ""}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3.5">
              <div>
                <Progreso valor={disponibles} max={total || 1} etiqueta="Créditos disponibles" alto={12} color="bg-bx-lima" className="!bg-[#2a2a2a]" />
                <div className="mt-2 flex justify-between gap-3 text-[13px] font-medium text-[#a3a698]">
                  <span className="whitespace-nowrap">{usados} {usados === 1 ? "usado" : "usados"}</span>
                  <span className="whitespace-nowrap">{disponibles} {disponibles === 1 ? "disponible" : "disponibles"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Boton to="/alumno/reservar" tamano="lg" className="h-12 gap-2 whitespace-nowrap px-5"><Ico d={IC.cal} size={18} sw={2} />Reservar clase</Boton>
              </div>
            </div>
          </div>
        </HeroCard>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="t-mov" className="min-w-0 flex-[2_1_520px] overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5">
            <div>
              <h2 id="t-mov" className="m-0 text-lg font-bold">Movimientos</h2>
              <div aria-live="polite" className="mt-0.5 text-[13px] font-medium text-bx-muted">{lista.length === 1 ? "1 registro" : `${lista.length} registros`}</div>
            </div>
            <FiltroChips
              etiqueta="Filtrar movimientos"
              valor={filtro}
              onChange={setFiltro}
              opciones={filtros}
              className="[&>button]:h-10 [&>button]:px-3.5 [&>button]:text-[13px]"
            />
          </div>
          {movs.length === 0 ? (
            <div className="border-t border-bx-line2 px-5 py-6 text-[15px] font-medium text-bx-muted">Todavía no tenés movimientos registrados.</div>
          ) : lista.length === 0 ? (
            <div className="border-t border-bx-line2 px-5 py-6 text-[15px] font-medium text-bx-muted">No hay movimientos de este tipo.</div>
          ) : (
            <ul className="m-0 list-none p-0">
              {lista.map((m, i) => {
                const est = ESTILO[m.k]
                const monto = m.n > 0 ? `+${m.n}` : m.n < 0 ? `−${Math.abs(m.n)}` : "0"
                const color = m.n === 0 ? "text-bx-muted" : m.n > 0 ? "text-bx-ok-fg" : est.monto
                return (
                  <li key={i} className="flex items-center gap-3.5 border-t border-bx-line2 px-5 py-3.5">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${est.icono}`}><Ico d={INFO_ICONOS[m.k]} size={18} sw={2} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold">{m.descripcion}</div>
                      <div className="mt-0.5 text-[13px] text-bx-muted">{fechaCorta(m.fecha)} · {m.tipo}</div>
                    </div>
                    <span
                      aria-label={m.n === 0 ? "sin cambios" : `${m.n > 0 ? "suma" : "resta"} ${Math.abs(m.n)} ${Math.abs(m.n) === 1 ? "crédito" : "créditos"}`}
                      className={`bx-num min-w-12 text-right text-[26px] leading-none ${color}`}
                    >
                      {monto}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside aria-labelledby="t-how" className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-5">
          <h2 id="t-how" className="m-0 text-lg font-bold">Cómo funcionan</h2>
          <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
            {reglas.map((t, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-normal">
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-bx-tile text-[13px] font-extrabold text-bx-ok-fg">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <Link to="/alumno/plan" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-bx-ok-fg">
            Ver mi membresía<Ico d={IC.chevRight} size={16} sw={2} />
          </Link>
        </aside>
      </div>
    </Pantalla>
  )
}
