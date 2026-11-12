import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { Boton, Progreso } from "@/components/bx"
import LogroCelebracion from "@/components/LogroCelebracion"
import { logrosNuevosPorMarcas } from "@/lib/logros"
import { formatearValor } from "@/lib/ranking"
import { toast } from "@/lib/notificar"
import { hoyTexto } from "@/lib/fechasBx"

/*
 * Calculadora RM en el celular (handoff móvil, Prompt 3). Steppers −/+ de 2,5 kg y 1 repetición, 1RM en vivo (Epley; con 1 repetición
 * el 1RM es el peso), aviso desde 10 repeticiones, tabla de porcentajes 95–60% con la fila más cercana a la serie resaltada,
 * y "Guardar como mi RM" en BottomSheet. El resultado y la tabla salen del mismo cálculo.
 */

const MAX_KG = 500
const MAX_REPS = 30
const PORCENTAJES = [95, 90, 85, 80, 75, 70, 65, 60]
const REPS_APROX = { 95: "2", 90: "4", 85: "6", 80: "8", 75: "10", 70: "12", 65: "15", 60: "20" }

const epley = (peso, reps) => (reps === 1 ? peso : peso * (1 + reps / 30))
const aNumero = (txt) => parseFloat(String(txt).replace(",", "."))
const aMedio = (n) => Math.round(n * 2) / 2
const fmt = (n) => aMedio(n).toLocaleString("es-AR", { maximumFractionDigits: 1 })
const aTexto = (n) => String(Math.max(0, aMedio(n))).replace(".", ",")

export default function CalculadoraMovilNuevo() {
  const [params] = useSearchParams()
  const rmInicial = aNumero(params.get("rm"))
  const [peso, setPeso] = useState(() => (rmInicial > 0 ? aTexto(rmInicial) : ""))
  const [reps, setReps] = useState(() => (rmInicial > 0 ? "1" : ""))
  const [hoja, setHoja] = useState(false)
  const [ejercicios, setEjercicios] = useState(null)
  const [idEj, setIdEj] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [logrosNuevos, setLogrosNuevos] = useState([])

  const p = aNumero(peso)
  const r = parseInt(reps, 10)
  const valido = peso !== "" && reps !== "" && p > 0 && p <= MAX_KG && r >= 1 && r <= MAX_REPS
  const rm = valido ? epley(p, r) : 0
  const rmRedondeado = aMedio(rm)

  // Al abrir "Guardar como mi RM" se piden los ejercicios de peso y el RM actual de cada uno
  useEffect(() => {
    if (!hoja || ejercicios) return undefined
    let vigente = true
    Promise.all([apiClient.get("/marcas/ejercicios"), apiClient.get("/marcas")])
      .then(([e, m]) => {
        if (!vigente) return
        const marcas = m.data?.data || []
        const lista = (e.data?.data || []).filter((x) => x.tipoMarca === "peso").map((x) => {
          const propias = marcas.filter((mk) => mk.idCatalogo === x.idCatalogo)
          return { ...x, actual: propias.length ? Math.max(...propias.map((mk) => Number(mk.valorMejor))) : null }
        })
        setEjercicios(lista)
        if (lista.length) setIdEj((v) => v || String(lista[0].idCatalogo))
      })
      .catch(() => { if (vigente) setEjercicios([]) })
    return () => { vigente = false }
  }, [hoja, ejercicios])

  const ejercicio = ejercicios?.find((e) => String(e.idCatalogo) === String(idEj))

  const guardar = async () => {
    if (!ejercicio || guardando || !valido) return
    setGuardando(true)
    try {
      const res = await apiClient.post("/marcas", { idCatalogo: ejercicio.idCatalogo, fecha: hoyTexto(), series: [{ peso: rmRedondeado, repeticiones: 1 }] })
      const d = res.data?.data || res.data
      if (d.esPR) toast.success(`Guardamos ${fmt(rm)} kg como tu RM de ${ejercicio.nombre}.`, { enlace: { to: "/alumno/marcas", texto: "Ver mis RM" } })
      else toast.info(`Guardado. Tu mejor RM sigue siendo ${formatearValor("peso", d.mejorPrevio)}.`)
      setHoja(false)
      setEjercicios(null)
      logrosNuevosPorMarcas().then((nuevos) => { if (nuevos.length) setLogrosNuevos((prev) => [...prev, ...nuevos]) })
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar el RM")
    } finally {
      setGuardando(false)
    }
  }

  // Fila de la tabla más cercana a la serie: ese porcentaje queda resaltado
  const porcentajeCercano = valido && rm > 0 ? PORCENTAJES.reduce((mejor, pc) => (Math.abs(pc - (p / rm) * 100) < Math.abs(mejor - (p / rm) * 100) ? pc : mejor), PORCENTAJES[0]) : null

  const stepper = "grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-xl border border-bx-btn-line bg-bx-surf text-bx-ink active:scale-95"

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Calculadora RM</h1>

      <section aria-labelledby="t-serie-m" className="flex flex-col gap-4 rounded-2xl border border-bx-line bg-bx-card p-4">
        <div>
          <h2 id="t-serie-m" className="m-0 text-[1.0625rem] font-bold">Tu serie</h2>
          <p className="mb-0 mt-0.5 text-sm text-bx-muted">Cargá el peso y las repeticiones que hiciste.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="in-peso-m" className="text-sm font-semibold">Peso levantado</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPeso(aTexto((Number.isNaN(p) ? 0 : p) - 2.5))} aria-label="Restar 2,5 kg" className={stepper}><Ico d="M5 12h14" size={20} sw={2.4} /></button>
            <div className="relative min-w-0 flex-1">
              <input id="in-peso-m" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0" aria-invalid={peso !== "" && !(p > 0 && p <= MAX_KG) ? true : undefined}
                className="h-[3.75rem] w-full rounded-xl border border-bx-btn-line bg-bx-surf pl-4 pr-14 text-center text-[2.125rem] text-bx-ink placeholder:text-bx-muted bx-num" />
              <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-bx-muted">KG</span>
            </div>
            <button type="button" onClick={() => setPeso(aTexto((Number.isNaN(p) ? 0 : p) + 2.5))} aria-label="Sumar 2,5 kg" className={stepper}><Ico d={IC.plus} size={20} sw={2.4} /></button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="in-reps-m" className="text-sm font-semibold">Repeticiones</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setReps(String(Math.max(1, (Number.isNaN(r) ? 1 : r) - 1)))} aria-label="Restar 1 repetición" className={stepper}><Ico d="M5 12h14" size={20} sw={2.4} /></button>
            <div className="relative min-w-0 flex-1">
              <input id="in-reps-m" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0"
                className="h-[3.75rem] w-full rounded-xl border border-bx-btn-line bg-bx-surf pl-4 pr-16 text-center text-[2.125rem] text-bx-ink placeholder:text-bx-muted bx-num" />
              <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-bx-muted">REPS</span>
            </div>
            <button type="button" onClick={() => setReps(String(Math.min(MAX_REPS, (Number.isNaN(r) ? 0 : r) + 1)))} aria-label="Sumar 1 repetición" className={stepper}><Ico d={IC.plus} size={20} sw={2.4} /></button>
          </div>
        </div>
      </section>

      {/* 1RM en vivo */}
      <section aria-labelledby="t-res-m" aria-live="polite" className="flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-bx-hero-line bg-bx-hero p-5 text-[#ecefe4]">
        <h2 id="t-res-m" className="m-0 text-xs font-semibold tracking-[0.1em] text-[#a3a698]">TU 1RM ESTIMADO</h2>
        {valido ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="bx-num text-[4.5rem] leading-[0.9] text-bx-lima">{fmt(rm)}</span>
              <span className="text-lg font-bold text-[#a3a698]">kg</span>
            </div>
            <div className="text-sm text-[#b9bcae]">Según {fmt(p)} kg × {r} {r === 1 ? "repetición" : "repeticiones"} · fórmula Epley</div>
            {r > 10 && <div className="text-sm font-medium text-[#e6c200]">Con más de 10 repeticiones la estimación es menos precisa.</div>}
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button" onClick={() => setHoja(true)} className="inline-flex h-[2.875rem] items-center gap-2 rounded-[0.625rem] bg-bx-lima px-4 text-sm font-extrabold text-bx-negro active:scale-[0.98]">
                <Ico d="M5 3h11l3 3v15H5zM8 3v5h7M8 14h8v7H8z" size={16} sw={2} />Guardar como mi RM
              </button>
              <button type="button" onClick={() => { setPeso(""); setReps("") }} className="h-[2.875rem] rounded-[0.625rem] border border-[#4a4d42] px-4 text-sm font-bold text-[#ecefe4] active:bg-[#1f2119]">Limpiar</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2"><span className="bx-num text-[4.5rem] leading-[0.9] text-[#3a3c33]">—</span><span className="text-lg font-bold text-[#5d6152]">kg</span></div>
            <div className="text-sm text-[#b9bcae]">Ingresá el peso y las repeticiones para ver tu estimación.</div>
          </>
        )}
      </section>

      {/* Pesos de trabajo: la fila más cercana a tu serie queda resaltada */}
      {valido && (
        <section aria-labelledby="t-pct-m" className="flex flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
          <div className="px-4 pb-2 pt-4">
            <h2 id="t-pct-m" className="m-0 text-[1.0625rem] font-bold">Pesos de trabajo</h2>
            <p className="mb-0 mt-0.5 text-sm text-bx-muted">Porcentajes de tu 1RM, redondeados a 0,5 kg.</p>
          </div>
          <table className="w-full border-collapse text-[0.9375rem] font-medium">
            <caption className="sr-only">Pesos de trabajo por porcentaje</caption>
            <thead>
              <tr className="border-b border-bx-line">
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold tracking-[0.1em] text-bx-muted">%</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-semibold tracking-[0.1em] text-bx-muted">PESO</th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-semibold tracking-[0.1em] text-bx-muted">REPS</th>
              </tr>
            </thead>
            <tbody>
              {[100, ...PORCENTAJES].map((pc) => {
                const resaltada = pc === porcentajeCercano
                return (
                  <tr key={pc} className={`border-b border-bx-line2 ${resaltada ? "bg-bx-ok-bg" : ""}`}>
                    <th scope="row" className={`h-[3.25rem] px-4 text-left text-[0.9375rem] font-extrabold ${resaltada ? "text-bx-ok-fg" : "text-bx-ink"}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="min-w-[2.75rem]">{pc}%</span>
                        <span className="hidden max-w-[5rem] flex-1 min-[360px]:block"><Progreso valor={pc} max={100} etiqueta={`${pc}%`} alto={6} /></span>
                      </div>
                    </th>
                    <td className="bx-num px-2 text-right text-[1.375rem]">{fmt((rm * pc) / 100)}<span className="ml-1 text-xs font-bold text-bx-muted">kg</span></td>
                    <td className="px-4 text-right text-sm text-bx-muted">{pc === 100 ? "1" : `≈ ${REPS_APROX[pc]}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      <p className="m-0 text-[0.8125rem] leading-normal text-bx-muted">Es una estimación: no reemplaza probar tu máximo real y puede variar según el ejercicio y tu técnica.</p>

      {/* Guardar como mi RM: hoja con el ejercicio y el nuevo RM */}
      <BottomSheet
        abierto={hoja}
        onCerrar={() => setHoja(false)}
        titulo="Guardar como mi RM"
        descripcion="Reemplaza tu RM actual y actualiza tu puesto en el ranking."
        pie={
          <div className="flex w-full flex-col gap-2.5">
            <Boton onClick={guardar} disabled={guardando || !ejercicio} aria-busy={guardando} className="h-[3.25rem] w-full text-[0.9375rem]">{guardando ? "Guardando…" : "Guardar RM"}</Boton>
            <button type="button" onClick={() => setHoja(false)} className="h-11 text-sm font-bold text-bx-ink">Cancelar</button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {ejercicios === null && <p className="m-0 text-sm text-bx-muted">Cargando ejercicios…</p>}
          {ejercicios && ejercicios.length === 0 && <p className="m-0 text-sm text-bx-muted">Todavía no hay ejercicios de peso cargados en el box.</p>}
          {ejercicios && ejercicios.length > 0 && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Ejercicio</span>
                <select value={idEj} onChange={(e) => setIdEj(e.target.value)} className="h-[3.25rem] rounded-[0.625rem] border border-bx-btn-line bg-bx-surf px-3.5 text-[0.9375rem] font-semibold text-bx-ink">
                  {ejercicios.map((e) => <option key={e.idCatalogo} value={e.idCatalogo}>{e.nombre} · {e.actual != null ? `RM actual ${fmt(e.actual)} kg` : "sin RM"}</option>)}
                </select>
              </label>
              <div className="flex items-center justify-between rounded-xl border border-bx-line2 bg-bx-surf px-4 py-3.5">
                <span className="text-sm font-semibold">Nuevo RM</span>
                <strong className="bx-num text-[1.625rem]">{fmt(rm)} kg</strong>
              </div>
              {ejercicio?.actual != null && rmRedondeado < ejercicio.actual && (
                <p className="m-0 text-sm text-bx-muted">Es menor a tu RM actual: queda en tu historial, pero tu mejor RM sigue siendo {fmt(ejercicio.actual)} kg.</p>
              )}
            </>
          )}
        </div>
      </BottomSheet>
      <LogroCelebracion logros={hoja ? [] : logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />
    </div>
  )
}
