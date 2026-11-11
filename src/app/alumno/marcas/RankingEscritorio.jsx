import { useEffect, useMemo, useState } from "react"
import apiClient from "@/api"
import { Boton, ErrorBanner, Esqueleto, HeroCard, Insignia, Vacio } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { formatearValor } from "@/lib/ranking"

/*
 * Pestaña "Ranking" de Mis RM en escritorio (handoff, pantalla 04): elegís el ejercicio, ves tu puesto y la tabla.
 */

const MEDALLAS = {
  1: "bg-[#f3d56b] text-[#4a3a00]",
  2: "bg-[#d5d9e0] text-[#3a3f48]",
  3: "bg-[#d9a066] text-[#4a2a00]",
}

const campoCls = "h-12 w-full rounded-[10px] border border-bx-btn-line bg-bx-surf text-[15px] font-medium text-bx-ink placeholder:text-bx-muted"

const ordinal = (n) => `${n}º`

export default function RankingEscritorio({ idCatalogo, onElegir, onEditar }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    apiClient.get("/marcas/ranking", { params: idCatalogo ? { idCatalogo } : {} })
      .then((r) => { if (vigente) { setError(false); setDatos(r.data?.data || r.data) } })
      .catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
  }, [idCatalogo, intento])

  const ejercicios = datos?.ejercicios || []
  const actual = datos?.ejercicio
  const ranking = useMemo(() => datos?.ranking || [], [datos])
  const mio = ranking.find((f) => f.esMio)
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? ranking.filter((f) => String(f.nombre).toLowerCase().includes(q)) : ranking
  }, [ranking, busqueda])

  if (error) {
    return <ErrorBanner titulo="No pudimos cargar el ranking" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { setDatos(null); setIntento((n) => n + 1) }} />
  }
  if (!datos) {
    return <div aria-busy="true" aria-label="Cargando ranking" className="flex flex-col gap-3"><Esqueleto alto={48} /><Esqueleto alto={120} className="rounded-2xl" /></div>
  }
  if (!actual) {
    return <Vacio className="rounded-2xl p-6" titulo="Todavía no hay ejercicios para el ranking" texto="Cuando el box cargue los ejercicios y los alumnos sus marcas, vas a ver el ranking acá." />
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-bx-muted">Ejercicio</span>
          <select
            value={actual.idCatalogo}
            onChange={(e) => { onElegir(Number(e.target.value)); setBusqueda("") }}
            className={`${campoCls} cursor-pointer px-3.5`}
          >
            {ejercicios.map((e) => (
              <option key={e.idCatalogo} value={e.idCatalogo}>
                {e.nombre}{e.participantes > 0 ? ` (${e.participantes} ${e.participantes === 1 ? "alumno" : "alumnos"})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="relative min-w-[240px] max-w-[520px] flex-1">
          <span className="sr-only">Buscar alumno</span>
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-bx-muted"><Ico d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" size={18} /></span>
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno" className={`${campoCls} pl-[42px] pr-3.5`} />
        </label>
      </div>

      {ranking.length === 0 ? (
        <Vacio className="rounded-2xl p-6" titulo={`Nadie cargó una marca de ${actual.nombre} todavía`} texto="Podés ser el primero: cargala en Mis RM." />
      ) : (
        <>
          <HeroCard logo={false} className="!p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              {mio ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="bx-num text-[56px] leading-none text-bx-lima">{ordinal(mio.posicion)}</span>
                    <span className="text-[15px] font-semibold text-[#a3a698]">de {ranking.length}</span>
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <div className="text-base font-bold">{mio.posicion === 1 ? `Estás primero en ${actual.nombre}` : `Estás en el puesto ${mio.posicion} en ${actual.nombre}`}</div>
                    <div className="text-sm text-[#a3a698]">Tu RM: {formatearValor(actual.tipoMarca, mio.valor)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditar(actual.idCatalogo)}
                    className="h-11 rounded-lg border border-[#4a4d42] bg-transparent px-4 text-sm font-bold text-[#ecefe4] transition-colors hover:border-bx-lima hover:text-bx-lima"
                  >
                    Actualizar mi RM
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-[200px] flex-1">
                    <div className="text-base font-bold">Todavía no estás en el ranking de {actual.nombre}</div>
                    <div className="text-sm text-[#a3a698]">Cargá tu RM para sumarte.</div>
                  </div>
                  <Boton onClick={() => onEditar(actual.idCatalogo)}>Cargar mi RM</Boton>
                </>
              )}
            </div>
          </HeroCard>

          {filas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bx-btn-line p-6 text-[15px] font-medium text-bx-muted">Nadie coincide con “{busqueda}”.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
              <table className="w-full border-collapse text-[15px] font-medium">
                <caption className="sr-only">Ranking de {actual.nombre}</caption>
                <thead>
                  <tr className="border-b border-bx-line">
                    <th scope="col" className="w-[90px] px-5 py-3.5 text-left text-xs font-semibold tracking-[0.1em] text-bx-muted">PUESTO</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold tracking-[0.1em] text-bx-muted">ALUMNO</th>
                    <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold tracking-[0.1em] text-bx-muted">RM</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={`${f.posicion}-${i}`} aria-current={f.esMio ? "true" : undefined} className={`${f.esMio ? "bg-bx-ok-bg" : ""} ${i > 0 ? "border-t border-bx-line2" : ""}`}>
                      <td className="px-5 py-4">
                        <span aria-label={`Puesto ${f.posicion}`} className={`inline-grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold ${MEDALLAS[f.posicion] || "bg-bx-track text-bx-ink"}`}>{f.posicion}</span>
                      </td>
                      <td className="px-3 py-4 font-bold">
                        {f.nombre}
                        {f.esMio && <Insignia className="ml-1.5">VOS</Insignia>}
                      </td>
                      <td className="px-5 py-4 text-right text-base font-extrabold tabular-nums">{formatearValor(actual.tipoMarca, f.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
