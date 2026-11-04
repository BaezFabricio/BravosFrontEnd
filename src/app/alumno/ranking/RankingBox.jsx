import { useEffect, useMemo, useState } from "react"
import { Medal, Search } from "lucide-react"
import apiClient from "@/api"
import { Card } from "@/components/ui/card"
import { Cargando } from "@/components/Cargando"
import PodioRanking from "@/components/PodioRanking"

/* Ranking de RM del box (pestaña de Mis RM): elegís el ejercicio y ves el podio y la lista de todos los alumnos. */
export default function RankingBox() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(false)
  const [idCatalogo, setIdCatalogo] = useState(null)
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    let vigente = true
    apiClient.get("/marcas/ranking", { params: idCatalogo ? { idCatalogo } : {} })
      .then((r) => { if (vigente) { setError(false); setDatos(r.data?.data || r.data) } })
      .catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
  }, [idCatalogo])

  const ejercicios = datos?.ejercicios || []
  const actual = datos?.ejercicio
  const miPuesto = (datos?.ranking || []).find((f) => f.esMio)
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const todas = datos?.ranking || []
    return q ? todas.filter((f) => String(f.nombre).toLowerCase().includes(q)) : todas
  }, [datos, busqueda])

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-border bg-card p-8 text-center"><p className="font-bold text-foreground">No se pudo cargar el ranking</p><p className="mt-1 text-sm text-muted-foreground">Probá de nuevo en un momento.</p></Card>
      ) : !datos ? (
        <Cargando filas={4} />
      ) : !actual ? (
        <Card className="border-border bg-card p-10 text-center">
          <Medal className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-bold text-foreground">Todavía no hay ejercicios para el ranking</p>
          <p className="mt-1 text-sm text-muted-foreground">Cuando el box cargue los ejercicios y los alumnos sus marcas, vas a ver el podio acá.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un alumno" aria-label="Buscar alumno"
                className="h-12 w-full rounded-xl border border-border bg-background/60 pl-10 pr-3 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm" />
            </div>
            <select value={actual.idCatalogo} onChange={(e) => { setIdCatalogo(Number(e.target.value)); setBusqueda("") }} aria-label="Filtrar por ejercicio"
              className="h-12 w-full rounded-xl border border-border bg-background/60 px-3 text-base font-bold text-foreground outline-none focus:border-lime-500 sm:text-sm">
              {ejercicios.map((e) => <option key={e.idCatalogo} value={e.idCatalogo}>{e.nombre}{e.participantes > 0 ? ` (${e.participantes})` : ""}</option>)}
            </select>
          </div>

          {datos.ranking.length === 0 ? (
            <Card className="border-border bg-card p-10 text-center">
              <p className="font-bold text-foreground">Nadie cargó una marca de {actual.nombre} todavía</p>
              <p className="mt-1 text-sm text-muted-foreground">Podés ser el primero: cargala en Mis RM.</p>
            </Card>
          ) : (
            <>
              {miPuesto && <p className="text-sm text-muted-foreground">Estás en el puesto <strong className="text-foreground">{miPuesto.posicion}º</strong> de {datos.ranking.length} en {actual.nombre}.</p>}
              {filas.length === 0
                ? <p className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">Nadie coincide con la búsqueda.</p>
                : <PodioRanking filas={filas} tipo={actual.tipoMarca} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
