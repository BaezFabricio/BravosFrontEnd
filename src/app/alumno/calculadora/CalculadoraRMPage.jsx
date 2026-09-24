import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { Card } from "@/components/ui/card"

// Fórmulas de 1RM estimado
const FORMULAS = {
  epley: { nombre: "Epley", calc: (peso, reps) => peso * (1 + reps / 30) },
  brzycki: { nombre: "Brzycki", calc: (peso, reps) => (peso * 36) / (37 - reps) },
}

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
const fmtKg = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)} kg`

const inputCls =
  "w-full bg-background border border-border px-3 py-3 text-lg font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 transition-colors"
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5"

export default function CalculadoraRMPage() {
  const [peso, setPeso] = useState("")
  const [reps, setReps] = useState("")
  const [formula, setFormula] = useState("epley")

  const pesoNum = Number(peso)
  const repsNum = Number(reps)
  const valido = pesoNum > 0 && pesoNum < 1000 && Number.isInteger(repsNum) && repsNum >= 1 && repsNum <= 30

  const rm = useMemo(() => {
    if (!valido) return null
    if (repsNum === 1) return pesoNum
    return aMedio(FORMULAS[formula].calc(pesoNum, repsNum))
  }, [valido, pesoNum, repsNum, formula])

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">Calculadora RM</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estimá tu repetición máxima (1RM) a partir de una serie, sin tener que probar tu máximo real.
        </p>
      </div>

      <Card className="bg-card border-border p-5 sm:p-6 gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Peso levantado (kg)</label>
            <input type="number" inputMode="decimal" min="0" step="0.5" className={inputCls} placeholder="80"
              value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Repeticiones</label>
            <input type="number" inputMode="numeric" min="1" max="30" className={inputCls} placeholder="5"
              value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={`${labelCls} text-center`}>Fórmula</label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 border border-border rounded-md w-full sm:w-64 mx-auto">
            {Object.entries(FORMULAS).map(([key, f]) => (
              <button key={key} type="button" onClick={() => setFormula(key)}
                className={`py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-center transition-colors ${
                  formula === key ? "bg-lime-400 text-black shadow-sm" : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                }`}>
                {f.nombre}
              </button>
            ))}
          </div>
        </div>

        {repsNum > 10 && valido && (
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Con más de 10 repeticiones la estimación pierde precisión. Es mejor usar una serie más pesada y corta.
          </p>
        )}
      </Card>

      {rm ? (
        <>
          <Card className="bg-card border-lime-400/30 p-6 text-center gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Tu 1RM estimado</p>
            <p className="text-5xl font-black text-lime-700 dark:text-lime-400">{fmtKg(rm)}</p>
            <p className="text-xs text-muted-foreground">
              Según {fmtKg(pesoNum)} × {repsNum} {repsNum === 1 ? "repetición" : "repeticiones"} · fórmula {FORMULAS[formula].nombre}
            </p>
          </Card>

          <Card className="bg-card border-border overflow-hidden gap-0 py-0">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pesos de trabajo por porcentaje</p>
            </div>
            <div className="divide-y divide-border">
              {TABLA_PORCENTAJES.map((f) => (
                <div key={f.pct} className="px-5 py-2.5 flex items-center justify-between text-sm">
                  <span className="w-16 font-black text-foreground/60">{f.pct}%</span>
                  <span className="flex-1 font-black text-foreground">{fmtKg(aMedio((rm * f.pct) / 100))}</span>
                  <span className="text-xs text-muted-foreground">≈ {f.reps} {f.reps === "1" ? "rep" : "reps"}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="bg-card border-border p-10 text-center">
          <Calculator className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold text-foreground">Ingresá el peso y las repeticiones</p>
          <p className="text-sm text-muted-foreground mt-1">Por ejemplo, 80 kg × 5 repeticiones.</p>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Es una estimación: no reemplaza probar tu máximo real y puede variar según el ejercicio y tu técnica.
      </p>
    </div>
  )
}
