import { useEffect, useState } from "react"
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

const REGLAS = [
  {
    id: "horasReservar",
    titulo: "Reservar con anticipación",
    detalle: "Las reservas se cierran esta cantidad de horas antes de que empiece la clase.",
    unidad: (n) => unidad(n, "hora", "horas"),
    ejemplo: (n) => (n === 0 ? "Se puede reservar hasta que empieza la clase." : `Una clase de las 19:00 se puede reservar hasta las ${hhmm(19 * 60 - n * 60)}.`),
  },
  {
    id: "horasCancelar",
    titulo: "Cancelar sin perder el crédito",
    detalle: "Si el alumno cancela con al menos esta cantidad de horas de anticipación, recupera el crédito.",
    unidad: (n) => unidad(n, "hora", "horas"),
    ejemplo: (n) => (n === 0 ? "Recupera el crédito mientras la clase no haya empezado." : `Una clase de las 19:00 se cancela con crédito hasta las ${hhmm(19 * 60 - n * 60)}.`),
  },
  {
    id: "diasAdelante",
    titulo: "Días hacia adelante para reservar",
    detalle: "Cuántos días antes pueden empezar a reservar. Con 0, solo se reservan las clases del día.",
    unidad: (n) => unidad(n, "día", "días"),
    ejemplo: (n) => (n === 0 ? "Los alumnos solo reservan las clases de hoy." : `Los alumnos reservan clases de hoy y de los próximos ${n} ${unidad(n, "día", "días")}.`),
  },
]

function Contador({ valor, min, max, onCambio, deshabilitado, etiqueta, unidadTexto }) {
  const boton = "flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/60 text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:cursor-not-allowed disabled:opacity-40"
  return (
    <div role="group" aria-label={etiqueta} className="flex items-center gap-3">
      <button type="button" className={boton} onClick={() => onCambio(-1)} disabled={deshabilitado || valor <= min} aria-label={`Una menos: ${etiqueta}`}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <output className="min-w-[5.5rem] text-center" aria-live="polite">
        <span className="block text-3xl font-black leading-none tabular-nums text-foreground">{valor}</span>
        <span className="mt-1 block text-xs font-semibold text-foreground/55">{unidadTexto}</span>
      </output>
      <button type="button" className={boton} onClick={() => onCambio(1)} disabled={deshabilitado || valor >= max} aria-label={`Una más: ${etiqueta}`}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function ReglasReservas({ puedeModificar }) {
  const [valores, setValores] = useState(null) // lo que se ve en pantalla
  const [guardados, setGuardados] = useState(null) // lo que hay en el servidor
  const [limites, setLimites] = useState({})
  const [porDefecto, setPorDefecto] = useState({ horasReservar: 2, horasCancelar: 2, diasAdelante: 0 })
  const [error, setError] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true
    apiClient.get("/reglas-box")
      .then((r) => {
        if (!vigente) return
        const d = r.data?.data
        const v = { horasReservar: d.horasReservar, horasCancelar: d.horasCancelar, diasAdelante: d.diasAdelante }
        setValores(v); setGuardados(v); setLimites(d.limites || {}); setPorDefecto(d.porDefecto || porDefecto)
      })
      .catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Suma o resta sobre el valor más reciente (dos toques rápidos seguidos cuentan los dos)
  const cambiar = (id, delta) => {
    const { min = 0, max = 99 } = limites[id] || {}
    setValores((v) => ({ ...v, [id]: Math.min(max, Math.max(min, v[id] + delta)) }))
  }
  const hayCambios = valores && guardados && Object.keys(valores).some((k) => valores[k] !== guardados[k])
  const sonLasDeSiempre = valores && Object.keys(porDefecto).every((k) => valores[k] === porDefecto[k])

  const guardar = async () => {
    setGuardando(true)
    try {
      const r = await apiClient.put("/reglas-box", valores)
      const d = r.data?.data
      const v = { horasReservar: d.horasReservar, horasCancelar: d.horasCancelar, diasAdelante: d.diasAdelante }
      setValores(v); setGuardados(v)
      cargarReglasBox(true)
      toast.success("Reglas guardadas", { description: "Valen desde ahora para las reservas y cancelaciones nuevas.", guardar: false })
    } catch (err) {
      toast.error("No se guardaron las reglas", { description: err.response?.data?.message || "Revisá tu conexión e intentá de nuevo." })
    } finally {
      setGuardando(false)
    }
  }

  if (error) return <p role="alert" className="rounded-2xl border border-border bg-card p-6 text-sm text-foreground/70">No se pudieron cargar las reglas. Recargá la página para intentar de nuevo.</p>
  if (!valores) return <div className="bv-esq space-y-3" role="status" aria-label="Cargando">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl border border-border bg-foreground/[0.05]" />)}</div>

  return (
    <section aria-label="Reglas de reservas" className="space-y-4">
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {REGLAS.map((r) => {
          const { min = 0, max = 99 } = limites[r.id] || {}
          return (
            <li key={r.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-base font-extrabold text-foreground">{r.titulo}</p>
                <p className="mt-1 text-sm leading-snug text-foreground/65">{r.detalle}</p>
                <p className="mt-2 text-[0.8125rem] font-semibold text-lime-700 dark:text-lime-400">{r.ejemplo(valores[r.id])}</p>
                <p className="mt-1 text-xs text-foreground/45">Entre {min} y {max}. Valor de siempre: {porDefecto[r.id]}.</p>
              </div>
              <Contador valor={valores[r.id]} min={min} max={max} onCambio={(delta) => cambiar(r.id, delta)} deshabilitado={!puedeModificar || guardando}
                etiqueta={r.titulo} unidadTexto={r.unidad(valores[r.id])} />
            </li>
          )
        })}
      </ul>

      {puedeModificar ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={guardar} disabled={!hayCambios || guardando}
            className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {guardando ? "Guardando…" : "Guardar reglas"}
          </button>
          <button type="button" onClick={() => setValores({ ...porDefecto })} disabled={sonLasDeSiempre || guardando}
            className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Volver a los valores de siempre
          </button>
          {hayCambios && <span role="status" className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Tenés cambios sin guardar.</span>}
        </div>
      ) : (
        <p className="text-sm text-foreground/55">Solo podés ver las reglas: para cambiarlas hace falta el permiso de modificar la configuración.</p>
      )}
    </section>
  )
}
