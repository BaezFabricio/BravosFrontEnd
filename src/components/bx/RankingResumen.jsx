import { useEffect, useState } from "react"
import apiClient from "@/api"
import { formatearValor } from "@/lib/ranking"
import { Tarjeta, EnlaceVer, Insignia } from "@/components/bx"

/*
 * Ranking del box en el Resumen del alumno (handoff, pantalla 01): los tres primeros del ejercicio con más
 * participantes y el puesto de quien mira. Si todavía no hay marcas, no se muestra nada.
 */
const MEDALLAS = {
  1: "bg-[#f3d56b] text-[#4a3a00]",
  2: "bg-[#d5d9e0] text-[#3a3f48]",
  3: "bg-[#d9a066] text-[#4a2a00]",
}

export default function RankingResumen() {
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
    <Tarjeta aria-labelledby="t-rank">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.1em] text-bx-muted">RANKING DEL BOX</div>
          <h2 id="t-rank" className="mt-0.5 truncate text-lg font-bold text-bx-ink">{ejercicio.nombre}</h2>
        </div>
        <EnlaceVer to="/alumno/marcas?vista=ranking">Ver ranking</EnlaceVer>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {top.map((f, i) => (
          <li key={`${f.posicion}-${i}`} className="flex items-center gap-3.5 rounded-[0.625rem] border border-bx-line2 bg-bx-surf px-3.5 py-3">
            <span aria-label={`Puesto ${f.posicion}`} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${MEDALLAS[f.posicion] || "bg-bx-track text-bx-ink"}`}>{f.posicion}</span>
            <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-bx-ink">
              {f.nombre}
              {f.esMio && <Insignia className="ml-1.5">VOS</Insignia>}
            </span>
            <span className="shrink-0 text-base font-extrabold tabular-nums text-bx-ink">{formatearValor(ejercicio.tipoMarca, f.valor)}</span>
          </li>
        ))}
      </ol>
      {mio && mio.posicion > 3 && (
        <p className="mt-3 text-sm text-bx-muted">Estás en el puesto <strong className="text-bx-ink">{mio.posicion}º</strong> con {formatearValor(ejercicio.tipoMarca, mio.valor)}.</p>
      )}
    </Tarjeta>
  )
}
