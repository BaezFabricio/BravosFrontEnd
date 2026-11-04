import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { TituloPagina } from "@/components/TituloPagina"

/*
 * Calculadora de RM. Diseño: "calculadora-referencia.html" (números grandes en stencil, tabla con barras),
 * con esquinas redondeadas, etiquetas en Archivo y los colores del tema de la app.
 */

// Fórmula de Epley, la más usada para estimar el 1RM
const epley = (peso, reps) => peso * (1 + reps / 30)

// Porcentaje del 1RM y repeticiones aproximadas que se pueden hacer con él
const TABLA_PORCENTAJES = [
  { pct: 100, reps: "1" },
  { pct: 95, reps: "2" },
  { pct: 90, reps: "4" },
  { pct: 85, reps: "6" },
  { pct: 80, reps: "8" },
  { pct: 75, reps: "10" },
  { pct: 70, reps: "12" },
  { pct: 65, reps: "15" },
  { pct: 60, reps: "20" },
  { pct: 50, reps: "30+" },
]

// Redondeo a 0,5 kg (el salto mínimo habitual de discos)
const aMedio = (n) => Math.round(n * 2) / 2
const fmtNum = (n) => String(Math.round(n * 10) / 10)

const STENCIL = { fontWeight: 900 }
const etiqueta = "block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
const cabecera = "flex items-center justify-between gap-3 border-b border-dashed border-border px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em]"
const paso = "h-11 rounded-xl border border-border bg-foreground/[0.03] text-[15px] font-bold text-foreground transition-colors hover:border-lime-500 hover:text-lime-700 dark:hover:text-lime-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"

export default function CalculadoraRMPage() {
  const [peso, setPeso] = useState("")
  const [reps, setReps] = useState("")

  const pesoNum = Number(peso)
  const repsNum = Number(reps)
  const valido = pesoNum > 0 && pesoNum < 1000 && Number.isInteger(repsNum) && repsNum >= 1 && repsNum <= 30

  const rm = useMemo(() => {
    if (!valido) return null
    if (repsNum === 1) return pesoNum
    return aMedio(epley(pesoNum, repsNum))
  }, [valido, pesoNum, repsNum])

  // Botones − / +: parten de lo que hay escrito y nunca bajan del mínimo
  const mover = (setter, actual, delta, min) => setter(fmtNum(Math.max(min, (Number(actual) || 0) + delta)))

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="text-center">
        <TituloPagina descripcion={"Estimá tu repetición máxima (1RM) a partir de una serie, sin tener que probar tu máximo real."}>Calculadora RM</TituloPagina>
      </div>

      <Card data-guia="calc-datos" className="gap-0 overflow-hidden rounded-2xl border-border bg-card py-0">
        <div className={cabecera}><span className="text-lime-700 dark:text-lime-400">Tu serie</span><span className="text-muted-foreground">Peso × reps</span></div>

        <div className="grid grid-cols-2">
          <div className="border-b border-r border-border px-5 pb-4 pt-3.5">
            <label htmlFor="calc-peso" className={etiqueta}>Peso levantado</label>
            <div className="mt-1.5 flex items-baseline gap-2">
              <input id="calc-peso" type="number" inputMode="decimal" min="0" step="0.5" placeholder="80" value={peso} onChange={(e) => setPeso(e.target.value)}
                className="w-full min-w-0 bg-transparent p-0 text-[44px] leading-none text-foreground placeholder:text-foreground/25 focus:outline-none sm:text-[52px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" style={STENCIL} />
              <span className="text-[22px] uppercase text-muted-foreground" style={STENCIL}>kg</span>
            </div>
          </div>

          <div className="border-b border-border px-5 pb-4 pt-3.5">
            <label htmlFor="calc-reps" className={etiqueta}>Repeticiones</label>
            <div className="mt-1.5 flex items-baseline gap-2">
              <input id="calc-reps" type="number" inputMode="numeric" min="1" max="30" placeholder="5" value={reps} onChange={(e) => setReps(e.target.value)}
                className="w-full min-w-0 bg-transparent p-0 text-[44px] leading-none text-foreground placeholder:text-foreground/25 focus:outline-none sm:text-[52px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" style={STENCIL} />
              <span className="text-[22px] uppercase text-muted-foreground" style={STENCIL}>reps</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button type="button" className={paso} onClick={() => mover(setReps, reps, -1, 1)} aria-label="Restar una repetición">− 1</button>
              <button type="button" className={paso} onClick={() => mover(setReps, reps, 1, 1)} aria-label="Sumar una repetición">+ 1</button>
            </div>
          </div>
        </div>

      </Card>

      <Card data-guia="calc-resultado" className={`gap-0 overflow-hidden rounded-2xl bg-card py-0 ${rm ? "border-lime-500/40" : "border-border"}`}>
        <div className={cabecera}>
          <span className="text-lime-700 dark:text-lime-400">Tu 1RM estimado</span>
          <span className="text-muted-foreground">Epley</span>
        </div>
        <div className="px-5 pb-5 pt-4">
          {rm ? (
            <>
              <div className="flex items-baseline justify-center gap-3.5 text-lime-700 dark:text-lime-400">
                <span className="text-[84px] leading-[0.82] sm:text-[104px]" style={STENCIL}>{fmtNum(rm)}</span>
                <span className="text-[34px] uppercase" style={STENCIL}>kg</span>
              </div>
              <p className="mt-3 text-center text-[15px] text-muted-foreground">
                Según {fmtNum(pesoNum)} kg × {repsNum} {repsNum === 1 ? "repetición" : "repeticiones"} · fórmula Epley
              </p>
              {repsNum > 10 && (
                <div className="mx-auto mt-4 flex max-w-xl gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-[13px] text-foreground/75">
                  <span className="mt-px shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-yellow-700 dark:text-yellow-400">Ojo</span>
                  Con más de 10 repeticiones la estimación pierde precisión. Es mejor usar una serie más pesada y corta.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-3.5 text-foreground/15">
                <span className="text-[84px] leading-[0.82] sm:text-[104px]" style={STENCIL}>—</span>
                <span className="text-[34px] uppercase" style={STENCIL}>kg</span>
              </div>
              <p className="mt-3 text-center text-[19px] font-bold text-foreground">Ingresá el peso y las repeticiones</p>
              <p className="mt-1.5 text-center text-[15px] text-muted-foreground">Por ejemplo, 80 kg × 5 repeticiones.</p>
            </>
          )}
        </div>
      </Card>

      {rm && (
        <Card data-guia="calc-tabla" className="gap-0 overflow-hidden rounded-2xl border-border bg-card py-0">
          <div className={cabecera}>
            <span className="text-lime-700 dark:text-lime-400">Pesos de trabajo por porcentaje</span>
            <span className="text-muted-foreground">Reps aprox.</span>
          </div>
          <div>
            {TABLA_PORCENTAJES.map((f) => (
              <div key={f.pct} className="grid grid-cols-[56px_minmax(0,1fr)_92px] items-center gap-3 border-b border-border/60 px-5 py-2 last:border-b-0 hover:bg-lime-400/[0.04] sm:grid-cols-[76px_minmax(0,1fr)_120px_90px] sm:gap-5">
                <span className={`text-2xl ${f.pct === 100 ? "text-lime-700 dark:text-lime-400" : "text-foreground"}`} style={STENCIL}>{f.pct}%</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
                  <i className={`block h-full rounded-full ${f.pct === 100 ? "bg-lime-400" : "bg-lime-400/40"}`} style={{ width: `${f.pct}%` }} />
                </div>
                <span className="whitespace-nowrap text-right text-[26px] text-foreground" style={STENCIL}>
                  {fmtNum(aMedio((rm * f.pct) / 100))} <small className="text-base text-muted-foreground">KG</small>
                </span>
                <span className="hidden whitespace-nowrap text-right text-[13px] text-muted-foreground sm:block">≈ {f.reps} {f.reps === "1" ? "rep" : "reps"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="pt-1 text-center text-[13px] text-muted-foreground">
        Es una estimación: no reemplaza probar tu máximo real y puede variar según el ejercicio y tu técnica.
      </p>
    </div>
  )
}
