import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Medal } from "lucide-react"
import apiClient from "@/api"
import { formatearValor } from "@/lib/ranking"

/*
 * Mini vista del ranking de RM para el inicio del alumno: los tres primeros del ejercicio con más participantes
 * y el puesto de quien mira. Si todavía no hay marcas, no se muestra nada.
 */
const COLORES = { 1: "#f5c518", 2: "#c0c7d1", 3: "#cd7f32" }

export default function MiniRanking() {
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    let vigente = true
    apiClient.get("/marcas/ranking")
      .then((r) => { if (vigente) setDatos(r.data?.data || r.data) })
      .catch(() => { /* sin ranking, el inicio se ve igual */ })
    return () => { vigente = false }
  }, [])

  if (!datos?.ejercicio || !datos.ranking?.length) return null
  const { ejercicio, ranking } = datos
  const top = ranking.filter((f) => f.posicion <= 3)
  const mio = ranking.find((f) => f.esMio)

  return (
    <Link to="/alumno/marcas?vista=ranking" aria-label={`Ver el ranking completo de ${ejercicio.nombre}`}
      className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-lime-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-lime-700 dark:text-lime-400">Ranking del box</p>
          <p className="truncate text-base font-black uppercase tracking-tight text-foreground">{ejercicio.nombre}</p>
        </div>
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-foreground/60 group-hover:text-foreground">Ver todo <ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
      </div>

      <ol className="mt-3 divide-y divide-border/60">
        {top.map((f, i) => (
          <li key={`${f.posicion}-${i}`} className={`flex items-center gap-3 py-2 ${f.esMio ? "font-black" : ""}`}>
            <Medal className="h-5 w-5 shrink-0" style={{ color: COLORES[f.posicion] }} aria-label={`Puesto ${f.posicion}`} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{f.nombre}{f.esMio && <span className="ml-2 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-lime-700 dark:text-lime-400">Vos</span>}</span>
            <span className="shrink-0 text-sm font-black tabular-nums text-foreground">{formatearValor(ejercicio.tipoMarca, f.valor)}</span>
          </li>
        ))}
      </ol>

      {mio && mio.posicion > 3 && (
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">Estás en el puesto <strong className="text-foreground">{mio.posicion}º</strong> con {formatearValor(ejercicio.tipoMarca, mio.valor)}.</p>
      )}
    </Link>
  )
}
