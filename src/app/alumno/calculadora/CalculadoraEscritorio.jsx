import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { Boton, Dialogo, Pantalla, Progreso, Tarjeta } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import LogroCelebracion from "@/components/LogroCelebracion"
import { logrosNuevosPorMarcas } from "@/lib/logros"
import { formatearValor } from "@/lib/ranking"
import { toast } from "@/lib/notificar"
import { hoyTexto } from "@/lib/fechasBx"

/*
 * Calculadora de RM en escritorio (handoff, pantalla 05). Fórmula de Epley con redondeo a 0,5 kg.
 * El resultado y la tabla de porcentajes salen del mismo cálculo. "Guardar como mi RM" usa el mismo servicio que Mis RM.
 */

const MAX_KG = 500
const MAX_REPS = 30
const RAPIDAS = [1, 2, 3, 5, 8, 10]
const TABLA = [[100, "1 rep"], [95, "2 reps"], [90, "4 reps"], [85, "6 reps"], [80, "8 reps"], [75, "10 reps"], [70, "12 reps"], [65, "15 reps"], [60, "20 reps"], [50, "30+ reps"]]

// Fórmula de Epley, la más usada para estimar el 1RM
const epley = (peso, reps) => (reps === 1 ? peso : peso * (1 + reps / 30))
const aNumero = (txt) => parseFloat(String(txt).replace(",", "."))
// Redondeo a 0,5 kg (el salto mínimo habitual de discos), con coma decimal
const fmt = (n) => (Math.round(n * 2) / 2).toLocaleString("es-AR", { maximumFractionDigits: 1 })
const aTexto = (n) => String(Math.max(0, Math.round(n * 2) / 2)).replace(".", ",")

const claseInput = (mala) => `h-16 w-full rounded-[10px] border bg-bx-surf pl-4 pr-14 text-bx-ink ${mala ? "border-2 border-bx-err-fg" : "border-bx-btn-line"}`
const claseStep = "h-[52px] w-[52px] shrink-0 rounded-[10px] border border-bx-btn-line bg-bx-surf text-base font-bold text-bx-ink hover:border-bx-lima"

export default function CalculadoraEscritorio() {
  const [params] = useSearchParams()
  // Desde "Calcular %" en Mis RM se llega con el RM ya cargado (1 repetición)
  const rmInicial = aNumero(params.get("rm"))
  const [peso, setPeso] = useState(() => (rmInicial > 0 ? aTexto(rmInicial) : ""))
  const [reps, setReps] = useState(() => (rmInicial > 0 ? "1" : ""))
  const [abierto, setAbierto] = useState(false)
  const [ejercicios, setEjercicios] = useState(null) // ejercicios de peso con el RM actual de cada uno
  const [idEj, setIdEj] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [logrosNuevos, setLogrosNuevos] = useState([])

  const p = aNumero(peso)
  const r = parseInt(reps, 10)
  const errPeso = peso === "" ? "" : Number.isNaN(p) || p <= 0 ? "Ingresá un peso mayor a 0." : p > MAX_KG ? `Revisá el peso: es mayor a ${MAX_KG} kg.` : ""
  const errReps = reps === "" ? "" : Number.isNaN(r) || r < 1 ? "Ingresá al menos 1 repetición." : r > MAX_REPS ? `Usá una serie de ${MAX_REPS} repeticiones o menos.` : ""
  const valido = peso !== "" && reps !== "" && !errPeso && !errReps
  const rm = valido ? epley(p, r) : 0 // sin redondear: de acá salen el resultado y la tabla
  const rmRedondeado = Math.round(rm * 2) / 2

  // Al abrir "Guardar como mi RM" se piden los ejercicios de peso y el RM actual de cada uno
  useEffect(() => {
    if (!abierto || ejercicios) return undefined
    let vigente = true
    Promise.all([apiClient.get("/marcas/ejercicios"), apiClient.get("/marcas")])
      .then(([e, m]) => {
        if (!vigente) return
        const marcas = m.data?.data || []
        const lista = (e.data?.data || []).filter((x) => x.tipoMarca === "peso").map((x) => {
          const propias = marcas.filter((mk) => mk.idCatalogo === x.idCatalogo)
          const actual = propias.length ? Math.max(...propias.map((mk) => Number(mk.valorMejor))) : null
          return { ...x, actual }
        })
        setEjercicios(lista)
        if (lista.length) setIdEj((v) => v || String(lista[0].idCatalogo))
      })
      .catch(() => { if (vigente) setEjercicios([]) })
    return () => { vigente = false }
  }, [abierto, ejercicios])

  const ejercicio = ejercicios?.find((e) => String(e.idCatalogo) === String(idEj))
  const menorAlActual = ejercicio?.actual != null && rmRedondeado < ejercicio.actual

  const guardar = async () => {
    if (!ejercicio || guardando || !valido) return
    setGuardando(true)
    try {
      const res = await apiClient.post("/marcas", {
        idCatalogo: ejercicio.idCatalogo,
        fecha: hoyTexto(),
        series: [{ peso: rmRedondeado, repeticiones: 1 }],
      })
      const d = res.data?.data || res.data
      if (d.esPR) toast.success(`Guardamos ${fmt(rm)} kg como tu RM de ${ejercicio.nombre}.`, { enlace: { to: "/alumno/marcas", texto: "Ver mis RM" } })
      else toast.info(`Guardado. Tu mejor RM sigue siendo ${formatearValor("peso", d.mejorPrevio)}.`)
      setAbierto(false)
      setEjercicios(null) // la próxima vez se vuelve a pedir el RM actualizado
      logrosNuevosPorMarcas().then((nuevos) => { if (nuevos.length) setLogrosNuevos((prev) => [...prev, ...nuevos]) })
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar el RM")
    } finally {
      setGuardando(false)
    }
  }

  const limpiar = () => { setPeso(""); setReps("") }

  return (
    <Pantalla className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-6">
      <LogroCelebracion logros={abierto ? [] : logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />

      <div className="flex min-w-0 flex-col gap-5">
        <Tarjeta aria-labelledby="t-serie" className="flex flex-col gap-5">
          <div>
            <h2 id="t-serie" className="m-0 text-lg font-bold">Tu serie</h2>
            <p className="mb-0 mt-1 text-sm text-bx-muted">Cargá el peso y las repeticiones que hiciste.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="in-peso" className="text-sm font-semibold">Peso levantado</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPeso(aTexto((Number.isNaN(p) ? 0 : p) - 2.5))} aria-label="Restar 2,5 kg" className={claseStep}>−2,5</button>
              <div className="relative min-w-0 flex-1">
                <input
                  id="in-peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0"
                  aria-invalid={errPeso ? true : undefined} aria-describedby="in-peso-ayuda" autoComplete="off"
                  className={`${claseInput(errPeso)} bx-num text-4xl`}
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-bx-muted">KG</span>
              </div>
              <button type="button" onClick={() => setPeso(aTexto((Number.isNaN(p) ? 0 : p) + 2.5))} aria-label="Sumar 2,5 kg" className={claseStep}>+2,5</button>
            </div>
            <span id="in-peso-ayuda" className={`text-[13px] font-medium ${errPeso ? "text-bx-err-fg" : "text-bx-muted"}`}>{errPeso || "Podés usar coma para decimales, por ejemplo 82,5."}</span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="in-reps" className="text-sm font-semibold">Repeticiones</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setReps(String(Math.max(1, (Number.isNaN(r) ? 1 : r) - 1)))} aria-label="Restar 1 repetición" className={claseStep}>−1</button>
              <div className="relative min-w-0 flex-1">
                <input
                  id="in-reps" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0"
                  aria-invalid={errReps ? true : undefined} aria-describedby="in-reps-ayuda" autoComplete="off"
                  className={`${claseInput(errReps)} bx-num text-4xl`}
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-bx-muted">REPS</span>
              </div>
              <button type="button" onClick={() => setReps(String(Math.min(MAX_REPS, (Number.isNaN(r) ? 0 : r) + 1)))} aria-label="Sumar 1 repetición" className={claseStep}>+1</button>
            </div>
            <span id="in-reps-ayuda" className={`text-[13px] font-medium ${errReps ? "text-bx-err-fg" : "text-bx-muted"}`}>{errReps || "Las estimaciones son más precisas entre 1 y 10 repeticiones."}</span>
          </div>

          <div role="group" aria-label="Repeticiones rápidas" className="flex flex-wrap gap-2">
            {RAPIDAS.map((n) => {
              const activa = r === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReps(String(n))}
                  aria-pressed={activa}
                  aria-label={`${n} ${n === 1 ? "repetición" : "repeticiones"}`}
                  className={`h-11 min-w-11 rounded-full border px-3 text-sm font-bold transition-colors hover:border-bx-lima ${activa ? "border-bx-ink bg-bx-ink text-bx-bg" : "border-bx-btn-line bg-transparent text-bx-ink"}`}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </Tarjeta>

        <section aria-labelledby="t-res" aria-live="polite" className="relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-bx-hero-line bg-bx-hero p-7 text-[#ecefe4]">
          <h2 id="t-res" className="m-0 text-xs font-semibold tracking-[0.1em] text-[#a3a698]">TU 1RM ESTIMADO</h2>
          {valido ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="bx-num text-[clamp(64px,8vw,96px)] leading-[0.9] text-bx-lima">{fmt(rm)}</span>
                <span className="text-[22px] font-bold text-[#a3a698]">kg</span>
              </div>
              <div className="text-[15px] text-[#b9bcae]">Según {fmt(p)} kg × {r} {r === 1 ? "repetición" : "repeticiones"} · fórmula Epley</div>
              {r > 10 && <div className="text-sm font-medium text-[#e6c200]">Con más de 10 repeticiones la estimación es menos precisa.</div>}
              <div className="mt-1 flex flex-wrap gap-2.5">
                <Boton tamano="lg" onClick={() => setAbierto(true)} className="h-12 gap-2 px-5">
                  <Ico d="M5 3h11l3 3v15H5zM8 3v5h7M8 14h8v7H8z" size={18} sw={2} />Guardar como mi RM
                </Boton>
                <button type="button" onClick={limpiar} className="h-12 rounded-lg border border-[#4a4d42] bg-transparent px-[18px] text-[15px] font-bold text-[#ecefe4] transition-colors hover:border-bx-lima hover:text-bx-lima">Limpiar</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="bx-num text-[72px] leading-[0.9] text-[#3a3c33]">—</span>
                <span className="text-[22px] font-bold text-[#5d6152]">kg</span>
              </div>
              <div className="text-[15px] text-[#b9bcae]">Ingresá el peso y las repeticiones para ver tu estimación.</div>
            </>
          )}
        </section>

        <p className="m-0 text-[13px] leading-normal text-bx-muted">Es una estimación: no reemplaza probar tu máximo real y puede variar según el ejercicio y tu técnica.</p>
      </div>

      <section aria-labelledby="t-pct" className="min-w-0 overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
        <div className="px-6 pb-3 pt-5">
          <h2 id="t-pct" className="m-0 text-lg font-bold">Pesos de trabajo</h2>
          <p className="mb-0 mt-1 text-sm text-bx-muted">Porcentajes de tu 1RM, redondeados a 0,5 kg.</p>
        </div>
        <table className="w-full border-collapse text-[15px] font-medium">
          <thead>
            <tr className="border-b border-bx-line">
              <th scope="col" className="px-6 py-2.5 text-left text-xs font-semibold tracking-[0.1em] text-bx-muted">%</th>
              <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold tracking-[0.1em] text-bx-muted">PESO</th>
              <th scope="col" className="px-6 py-2.5 text-right text-xs font-semibold tracking-[0.1em] text-bx-muted">REPS APROX.</th>
            </tr>
          </thead>
          <tbody>
            {TABLA.map(([pc, aprox]) => (
              <tr key={pc} className={`border-b border-bx-line2 ${pc === 100 ? "bg-bx-ok-bg" : ""}`}>
                <th scope="row" className={`h-[52px] px-6 text-left text-base font-extrabold ${pc === 100 ? "text-bx-ok-fg" : "text-bx-ink"}`}>
                  <div className="flex items-center gap-3.5">
                    <span className="min-w-12">{pc}%</span>
                    <span aria-hidden="true" className="max-w-[140px] flex-1"><Progreso valor={pc} max={100} etiqueta={`${pc}%`} alto={6} /></span>
                  </div>
                </th>
                <td className="bx-num px-3 text-right text-2xl">{valido ? fmt((rm * pc) / 100) : "—"}<span className="ml-1 text-xs font-bold text-bx-muted" style={{ fontFamily: "Archivo, sans-serif" }}>kg</span></td>
                <td className="px-6 text-right text-sm text-bx-muted">≈ {aprox}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Guardar como mi RM"
        ancho={420}
        idEnfocar="in-ejercicio"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
            <Boton onClick={guardar} disabled={guardando || !ejercicio} aria-busy={guardando}>{guardando ? "Guardando…" : "Guardar RM"}</Boton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {ejercicios === null && <p className="m-0 text-sm text-bx-muted">Cargando ejercicios…</p>}
          {ejercicios && ejercicios.length === 0 && <p className="m-0 text-sm text-bx-muted">Todavía no hay ejercicios de peso cargados en el box.</p>}
          {ejercicios && ejercicios.length > 0 && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Ejercicio</span>
                <select
                  id="in-ejercicio"
                  value={idEj}
                  onChange={(e) => setIdEj(e.target.value)}
                  className="h-12 cursor-pointer rounded-[10px] border border-bx-btn-line bg-bx-surf px-3.5 text-[15px] font-medium text-bx-ink"
                >
                  {ejercicios.map((e) => (
                    <option key={e.idCatalogo} value={e.idCatalogo}>{e.nombre} · {e.actual != null ? `RM actual ${fmt(e.actual)} kg` : "sin RM"}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-bx-line2 bg-bx-surf px-4 py-3.5 text-[15px] font-medium">
                Nuevo RM: <strong className="bx-num text-[26px]">{fmt(rm)} kg</strong>
              </div>
              <p className="m-0 text-sm text-bx-muted">
                {menorAlActual
                  ? `Es menor a tu RM actual: queda en tu historial, pero tu mejor RM sigue siendo ${fmt(ejercicio.actual)} kg.`
                  : "Reemplaza tu RM actual y actualiza tu puesto en el ranking."}
              </p>
            </>
          )}
        </div>
      </Dialogo>
    </Pantalla>
  )
}
