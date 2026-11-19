import { useCallback, useEffect, useState } from "react"
import { Minus, Plus, RotateCcw, Save, Loader2 } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { cargarReglasBox } from "@/lib/reglasBox"

/*
 * Reglas de reservas del box (Configuración del box → Reglas de reservas): cuántas horas antes se puede reservar,
 * cuántas horas antes se puede cancelar recuperando el crédito y cuántos días hacia adelante se puede reservar.
 * El servidor valida los límites y es quien las aplica en cada reserva y cancelación; esta pantalla solo las edita.
 */
const unidad = (n, uno, varios) => (Number(n) === 1 ? uno : varios)
const hhmm = (min) => { const t = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}` }

// Un tiempo en minutos como lo diría una persona: "30 minutos", "2 horas", "1 hora y 30 min"
const tiempo = (minutos) => {
  const m = Math.round(Number(minutos) || 0)
  if (m < 60) return `${m} ${m === 1 ? "minuto" : "minutos"}`
  const h = Math.floor(m / 60), r = m % 60
  return `${h} ${h === 1 ? "hora" : "horas"}${r ? ` y ${r} min` : ""}`
}
// Para el contador: el número grande y su unidad (30 / MINUTOS · 2 / HORAS · 1:30 / HORAS)
const partesTiempo = (m) => {
  if (m < 60) return { grande: String(m), chica: m === 1 ? "minuto" : "minutos" }
  if (m % 60 === 0) return { grande: String(m / 60), chica: m / 60 === 1 ? "hora" : "horas" }
  return { grande: `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`, chica: "horas" }
}
// Paso de cada toque: fino al principio (5 min) y más grande a medida que el tiempo crece, así llegar a varias horas no lleva cien toques.
// Sube y baja por los mismos escalones.
const pasoMinutos = (valor, dir) => {
  if (dir > 0) return valor < 120 ? 5 : valor < 360 ? 15 : valor < 1440 ? 30 : 60
  return valor <= 120 ? 5 : valor <= 360 ? 15 : valor <= 1440 ? 30 : 60
}

const REGLAS = [
  {
    id: "minutosReservar",
    titulo: "Reservar con anticipación",
    detalle: "Las reservas se cierran este tiempo antes de que empiece la clase.",
    formato: tiempo,
    partes: partesTiempo,
    paso: pasoMinutos,
    atajos: [15, 30, 60, 120, 180],
    ejemplo: (n) => (n === 0 ? "Se puede reservar hasta que empieza la clase." : `Una clase de las 19:00 se puede reservar hasta las ${hhmm(19 * 60 - n)}.`),
  },
  {
    id: "minutosCancelar",
    titulo: "Cancelar sin perder el crédito",
    detalle: "Si el alumno cancela con al menos este tiempo de anticipación, recupera el crédito.",
    formato: tiempo,
    partes: partesTiempo,
    paso: pasoMinutos,
    atajos: [15, 30, 60, 120, 180],
    ejemplo: (n) => (n === 0 ? "Recupera el crédito mientras la clase no haya empezado." : `Una clase de las 19:00 se cancela con crédito hasta las ${hhmm(19 * 60 - n)}.`),
  },
  {
    id: "diasAdelante",
    titulo: "Días hacia adelante para reservar",
    detalle: "Cuántos días antes pueden empezar a reservar. Con 0, solo se reservan las clases del día.",
    formato: (n) => `${n} ${unidad(n, "día", "días")}`,
    partes: (n) => ({ grande: String(n), chica: unidad(n, "día", "días") }),
    paso: () => 1,
    ejemplo: (n) => (n === 0 ? "Los alumnos solo reservan las clases de hoy." : `Los alumnos reservan clases de hoy y de los próximos ${n} ${unidad(n, "día", "días")}.`),
  },
]

function Contador({ valor, min, max, onCambio, deshabilitado, etiqueta, partes }) {
  const boton = "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:cursor-not-allowed disabled:opacity-35"
  return (
    <div role="group" aria-label={etiqueta} className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/60 p-1.5">
      <button type="button" className={boton} onClick={() => onCambio(-1)} disabled={deshabilitado || valor <= min} aria-label={`Una menos: ${etiqueta}`}>
        <Minus className="h-5 w-5" aria-hidden="true" />
      </button>
      <output className="flex flex-1 flex-col items-center justify-center" aria-live="polite">
        <span className="text-3xl font-black leading-none tabular-nums text-foreground">{partes.grande}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-foreground/55">{partes.chica}</span>
      </output>
      <button type="button" className={boton} onClick={() => onCambio(1)} disabled={deshabilitado || valor >= max} aria-label={`Una más: ${etiqueta}`}>
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function ReglasReservas({ puedeModificar }) {
  const [valores, setValores] = useState(null) // lo que se ve en pantalla
  const [guardados, setGuardados] = useState(null) // lo que hay en el servidor
  const [limites, setLimites] = useState({})
  const [porDefecto, setPorDefecto] = useState({ minutosReservar: 120, minutosCancelar: 120, diasAdelante: 0 })
  const [error, setError] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    setError(false)
    return apiClient.get("/reglas-box")
      .then((r) => {
        const d = r.data?.data
        const v = { minutosReservar: d.minutosReservar, minutosCancelar: d.minutosCancelar, diasAdelante: d.diasAdelante }
        setValores(v); setGuardados(v); setLimites(d.limites || {}); setPorDefecto((p) => d.porDefecto || p)
      })
      .catch(() => setError(true))
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar() }, [cargar])

  // Suma o resta sobre el valor más reciente (dos toques rápidos seguidos cuentan los dos)
  const cambiar = (id, dir) => {
    const { min = 0, max = 99 } = limites[id] || {}
    const regla = REGLAS.find((r) => r.id === id)
    setValores((v) => ({ ...v, [id]: Math.min(max, Math.max(min, v[id] + dir * regla.paso(v[id], dir))) }))
  }
  const fijar = (id, valor) => {
    const { min = 0, max = 99 } = limites[id] || {}
    setValores((v) => ({ ...v, [id]: Math.min(max, Math.max(min, valor)) }))
  }
  const hayCambios = valores && guardados && Object.keys(valores).some((k) => valores[k] !== guardados[k])
  const sonLasDeSiempre = valores && Object.keys(porDefecto).every((k) => valores[k] === porDefecto[k])

  const guardar = async () => {
    setGuardando(true)
    try {
      const r = await apiClient.put("/reglas-box", valores)
      const d = r.data?.data
      const v = { minutosReservar: d.minutosReservar, minutosCancelar: d.minutosCancelar, diasAdelante: d.diasAdelante }
      setValores(v); setGuardados(v)
      cargarReglasBox(true)
      toast.success("Reglas guardadas", { description: "Valen desde ahora para las reservas y cancelaciones nuevas.", guardar: false })
    } catch (err) {
      toast.error("No se guardaron las reglas", { description: err.response?.data?.message || "Revisá tu conexión e intentá de nuevo." })
    } finally {
      setGuardando(false)
    }
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-foreground/70">
        <p className="m-0">No se pudieron cargar las reglas. Si el sistema se actualizó hace un momento, puede faltar reiniciar el servidor.</p>
        <button type="button" onClick={cargar}
          className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reintentar
        </button>
      </div>
    )
  }
  if (!valores) return <div className="bv-esq space-y-3" role="status" aria-label="Cargando">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl border border-border bg-foreground/[0.05]" />)}</div>

  return (
    <section aria-label="Reglas de reservas" className="bv-reglas flex flex-col gap-5">
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {REGLAS.map((r) => {
          const { min = 0, max = 99 } = limites[r.id] || {}
          return (
            <li key={r.id} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-base font-extrabold leading-tight text-foreground">{r.titulo}</p>
                <p className="mt-1.5 text-sm leading-snug text-foreground/65">{r.detalle}</p>
                <p className="mt-3 text-[0.8125rem] font-semibold leading-snug text-lime-700 dark:text-lime-400">{r.ejemplo(valores[r.id])}</p>
                <p className="mt-1 text-xs text-foreground/45">Entre {r.formato(min)} y {r.formato(max)}. Valor de siempre: {r.formato(porDefecto[r.id])}.</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-[15rem] sm:shrink-0">
                <Contador valor={valores[r.id]} min={min} max={max} onCambio={(dir) => cambiar(r.id, dir)} deshabilitado={!puedeModificar || guardando}
                  etiqueta={r.titulo} partes={r.partes(valores[r.id])} />
                {r.atajos && (
                  <div role="group" aria-label={`Valores rápidos: ${r.titulo}`} className="flex flex-wrap justify-center gap-1.5">
                    {r.atajos.filter((m) => m >= min && m <= max).map((m) => {
                      const activo = valores[r.id] === m
                      return (
                        <button key={m} type="button" onClick={() => fijar(r.id, m)} disabled={!puedeModificar || guardando} aria-pressed={activo}
                          className={`h-9 rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                            activo ? "border-lime-400 bg-lime-400 text-black" : "border-border text-foreground/70 hover:bg-foreground/5 hover:text-foreground"}`}>
                          {m < 60 ? `${m} min` : `${m / 60} h`}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {puedeModificar ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="button" onClick={guardar} disabled={!hayCambios || guardando}
            className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-foreground/40 sm:w-auto">
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {guardando ? "Guardando…" : "Guardar reglas"}
          </button>
          <button type="button" onClick={() => setValores({ ...porDefecto })} disabled={sonLasDeSiempre || guardando}
            className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Volver a los valores de siempre
          </button>
          {hayCambios && <span role="status" className="text-center text-sm font-semibold text-yellow-700 dark:text-yellow-400 sm:text-left">Tenés cambios sin guardar.</span>}
        </div>
      ) : (
        <p className="m-0 text-sm text-foreground/55">Solo podés ver las reglas: para cambiarlas hace falta el permiso de modificar la configuración.</p>
      )}
    </section>
  )
}
