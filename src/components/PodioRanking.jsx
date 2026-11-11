import { Medal } from "lucide-react"
import { formatearValor } from "@/lib/ranking"

/*
 * Ranking de RM en forma de tabla: una fila por alumno, con las columnas Puesto, Alumno y RM.
 * Los tres primeros llevan medalla de oro, plata y bronce; los empates comparten puesto (y medalla).
 * filas: [{ posicion, nombre, valor, esMio? }] ya ordenadas. tipo: "peso" | "repeticiones" | "tiempo".
 * Con soloPodio solo se muestran los tres primeros (portada).
 */

const MEDALLAS = {
  1: { nombre: "Oro", color: "#f5c518" },
  2: { nombre: "Plata", color: "#c0c7d1" },
  3: { nombre: "Bronce", color: "#cd7f32" },
}

export default function PodioRanking({ filas = [], tipo = "peso", soloPodio = false }) {
  const visibles = soloPodio ? filas.filter((f) => f.posicion <= 3) : filas
  if (!visibles.length) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" role="table" aria-label="Ranking de RM">
      <div role="row" className="grid grid-cols-[4rem_minmax(0,1fr)_6.875rem] items-center gap-3 border-b border-border bg-foreground/[0.04] px-4 py-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        <span role="columnheader">Puesto</span>
        <span role="columnheader">Alumno</span>
        <span role="columnheader" className="text-right">RM</span>
      </div>
      <div role="rowgroup">
        {visibles.map((f, i) => {
          const m = MEDALLAS[f.posicion]
          return (
            <div key={`${f.posicion}-${f.nombre}-${i}`} role="row"
              className={`grid grid-cols-[4rem_minmax(0,1fr)_6.875rem] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 ${f.esMio ? "bg-lime-400/10" : ""}`}>
              <span role="cell" className="flex items-center gap-1.5">
                {m ? (
                  <>
                    <Medal className="h-6 w-6 shrink-0" style={{ color: m.color }} aria-hidden="true" />
                    <span className="sr-only">{m.nombre}, puesto </span>
                    <span className="text-sm font-black tabular-nums text-foreground">{f.posicion}º</span>
                  </>
                ) : (
                  <span className="pl-1 text-sm font-black tabular-nums text-muted-foreground">{f.posicion}º</span>
                )}
              </span>
              <span role="cell" className={`min-w-0 truncate text-sm ${m || f.esMio ? "font-black" : "font-semibold"} text-foreground`}>
                {f.nombre}
                {f.esMio && <span className="ml-2 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-lime-700 dark:text-lime-400">Vos</span>}
              </span>
              <span role="cell" className="text-right text-sm font-black tabular-nums text-foreground">{formatearValor(tipo, f.valor)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
