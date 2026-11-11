import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { Boton, Campo, Dialogo, ErrorBanner, Esqueleto, FiltroChips, Pantalla, Pestanas } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import LogroCelebracion from "@/components/LogroCelebracion"
import { logrosNuevosPorMarcas } from "@/lib/logros"
import { formatearValor } from "@/lib/ranking"
import { toast } from "@/lib/notificar"
import { fechaCorta, hoyTexto } from "@/lib/fechasBx"
import RankingEscritorio from "./RankingEscritorio"

/*
 * Mis RM en escritorio (handoff, pantalla 04): tarjeta por ejercicio con tu RM y tu puesto, carga con validación y
 * pestaña de ranking. Los ejercicios los carga el administrador (Ejercicios del RM).
 */

// "4:32" → 272 · "1:02:10" → 3730 · "90" → 90 (segundos)
const parseTiempo = (txt) => {
  const partes = String(txt).trim().split(":").map(Number)
  if (partes.length === 0 || partes.some((n) => Number.isNaN(n) || n < 0)) return null
  return partes.reduce((acc, n) => acc * 60 + n, 0)
}

const ETIQUETA = { peso: "Peso máximo (kg) *", repeticiones: "Repeticiones *", tiempo: "Tiempo (min:seg) *" }
const AYUDA = {
  peso: "Usá punto o coma para decimales, por ejemplo 102,5.",
  repeticiones: "Cantidad de repeticiones, por ejemplo 20.",
  tiempo: "Formato min:seg, por ejemplo 4:32.",
}
const MAX_KG = 500
const VISIBLES = 3

// Revisa el valor escrito y devuelve el mensaje de error o "" si está bien
function errorDeValor(tipo, valor) {
  const txt = String(valor).trim()
  if (!txt) return tipo === "peso" ? "Ingresá un peso." : tipo === "repeticiones" ? "Ingresá las repeticiones." : "Ingresá un tiempo."
  if (tipo === "peso") {
    const kg = Number(txt.replace(",", "."))
    if (Number.isNaN(kg) || kg <= 0) return "Ingresá un número mayor a 0."
    if (kg > MAX_KG) return `Revisá el valor: es mayor a ${MAX_KG} kg.`
    return ""
  }
  if (tipo === "repeticiones") {
    const reps = Number(txt)
    return Number.isInteger(reps) && reps > 0 ? "" : "Ingresá una cantidad entera mayor a 0."
  }
  const seg = parseTiempo(txt)
  return seg && seg > 0 ? "" : "Ingresá un tiempo válido, por ejemplo 4:32."
}

export default function MarcasEscritorio() {
  const [params, setParams] = useSearchParams()
  const vista = params.get("vista") === "ranking" ? "ranking" : "mis"
  const [marcas, setMarcas] = useState([])
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [puestos, setPuestos] = useState({}) // idCatalogo → { pos, total }
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos") // todos | con | sin RM cargado
  const [rankEj, setRankEj] = useState(null) // ejercicio elegido en el ranking
  const [idEj, setIdEj] = useState("") // ejercicio abierto en la ventana de carga
  const [valor, setValor] = useState("")
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [verTodas, setVerTodas] = useState(false)
  const [aEliminar, setAEliminar] = useState(null) // marca que se está por borrar (confirmación en la misma ventana)
  const [logrosNuevos, setLogrosNuevos] = useState([])

  const cargar = async () => {
    try {
      setErrorCarga(false)
      const [m, e] = await Promise.all([apiClient.get("/marcas"), apiClient.get("/marcas/ejercicios")])
      setMarcas(m.data?.data || [])
      setEjercicios(e.data?.data || [])
    } catch {
      setErrorCarga(true)
    } finally {
      setCargando(false)
    }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar() }, [])

  // Historial por ejercicio (las marcas ya vienen de la más nueva a la más vieja) y la mejor de cada uno
  const grupos = useMemo(() => {
    const map = new Map()
    marcas.forEach((m) => {
      if (!map.has(m.idCatalogo)) map.set(m.idCatalogo, { idCatalogo: m.idCatalogo, tipo: m.tipoMarca, marcas: [] })
      map.get(m.idCatalogo).marcas.push(m)
    })
    return [...map.values()].map((g) => {
      const mejor = g.marcas.reduce((a, b) => ((g.tipo === "tiempo" ? b.valorMejor < a.valorMejor : b.valorMejor > a.valorMejor) ? b : a))
      return { ...g, mejor }
    })
  }, [marcas])

  // Puesto del alumno en cada ejercicio donde ya tiene RM
  const idsConRM = grupos.map((g) => g.idCatalogo).join(",")
  useEffect(() => {
    if (!idsConRM) return undefined
    let vigente = true
    Promise.all(idsConRM.split(",").map((id) =>
      apiClient.get("/marcas/ranking", { params: { idCatalogo: id } })
        .then((r) => {
          const lista = (r.data?.data || r.data)?.ranking || []
          const mio = lista.find((f) => f.esMio)
          return [Number(id), mio ? { pos: mio.posicion, total: lista.length } : null]
        })
        .catch(() => [Number(id), null])
    )).then((pares) => { if (vigente) setPuestos(Object.fromEntries(pares.filter(([, v]) => v))) })
    return () => { vigente = false }
  }, [idsConRM, marcas])

  const ejercicio = ejercicios.find((e) => String(e.idCatalogo) === String(idEj))
  const tipo = ejercicio?.tipoMarca || "peso"
  const g = ejercicio ? grupos.find((x) => x.idCatalogo === ejercicio.idCatalogo) : null
  const error = tocado ? errorDeValor(tipo, valor) : ""

  const abrirEjercicio = (e) => {
    const gr = grupos.find((x) => x.idCatalogo === e.idCatalogo)
    // En peso se parte del RM actual para corregirlo fácil; en los demás, vacío
    setValor(gr && e.tipoMarca === "peso" ? String(gr.mejor.valorMejor).replace(".", ",") : "")
    setTocado(false)
    setVerTodas(false)
    setAEliminar(null)
    setIdEj(String(e.idCatalogo))
  }
  const cerrarEjercicio = () => { setIdEj(""); setValor(""); setAEliminar(null) }

  const guardar = async (ev) => {
    ev.preventDefault()
    if (!ejercicio || guardando) return
    setTocado(true)
    if (errorDeValor(tipo, valor)) { document.getElementById("campo-rm")?.focus(); return }
    let serie
    if (tipo === "peso") serie = { peso: Number(String(valor).trim().replace(",", ".")), repeticiones: 1 }
    else if (tipo === "repeticiones") serie = { repeticiones: Number(valor) }
    else serie = { tiempoSeg: parseTiempo(valor) }
    setGuardando(true)
    try {
      const res = await apiClient.post("/marcas", { idCatalogo: ejercicio.idCatalogo, fecha: hoyTexto(), series: [serie] })
      const r = res.data?.data || res.data
      if (r.esPR) toast.success(r.primera ? `Primer RM de ${ejercicio.nombre}: ${formatearValor(tipo, r.valorMejor)}` : `¡Nuevo RM! ${ejercicio.nombre}: ${formatearValor(tipo, r.valorMejor)}`)
      else toast.info(`Guardado. Tu mejor RM sigue siendo ${formatearValor(tipo, r.mejorPrevio)}.`)
      cerrarEjercicio()
      await cargar()
      logrosNuevosPorMarcas().then((nuevos) => { if (nuevos.length) setLogrosNuevos((prev) => [...prev, ...nuevos]) })
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar el RM")
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    const m = aEliminar
    setAEliminar(null)
    if (!m) return
    try {
      await apiClient.delete(`/marcas/${m.idMarca}`)
      toast.success("RM eliminado")
      cargar()
    } catch {
      toast.error("No se pudo eliminar el RM")
    }
  }

  const cambiarVista = (v) => setParams(v === "ranking" ? { vista: "ranking" } : {}, { replace: true })

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const cargados = new Set(marcas.map((m) => m.idCatalogo))
    return ejercicios.filter((e) => (!q || String(e.nombre).toLowerCase().includes(q)) && (filtro === "todos" || (filtro === "con") === cargados.has(e.idCatalogo)))
  }, [ejercicios, marcas, busqueda, filtro])

  // Desde el ranking se abre la carga del ejercicio que se está mirando
  const editarDesdeRanking = (idCatalogo) => {
    const e = ejercicios.find((x) => x.idCatalogo === idCatalogo)
    if (e) abrirEjercicio(e)
  }

  const visiblesHistorial = g ? (verTodas ? g.marcas : g.marcas.slice(0, VISIBLES)) : []

  return (
    <Pantalla className="gap-5">
      <LogroCelebracion logros={aEliminar ? [] : logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />

      {errorCarga && <ErrorBanner titulo="No pudimos cargar tus RM" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { setCargando(true); cargar() }} />}

      <Pestanas
        etiqueta="Mis RM"
        valor={vista}
        onChange={cambiarVista}
        items={[{ id: "mis", label: "Mis RM", contador: grupos.length || undefined }, { id: "ranking", label: "Ranking" }]}
        className="gap-1"
      />

      <div role="tabpanel" aria-label={vista === "ranking" ? "Ranking" : "Mis RM"} className="flex flex-col gap-4">
        {vista === "ranking" && <RankingEscritorio idCatalogo={rankEj} onElegir={setRankEj} onEditar={editarDesdeRanking} />}

        {vista === "mis" && cargando && (
          <div aria-busy="true" aria-label="Cargando" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">
            <Esqueleto alto={170} className="rounded-2xl" />
            <Esqueleto alto={170} className="rounded-2xl" />
          </div>
        )}

        {vista === "mis" && !cargando && !errorCarga && ejercicios.length === 0 && (
          <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-bx-line bg-bx-card px-6 py-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-bx-tile text-bx-ok-fg"><Ico d={IC.trophy} size={28} /></span>
            <div>
              <h2 className="m-0 text-xl font-bold">Todavía no hay ejercicios cargados</h2>
              <p className="mb-0 mt-1.5 text-[15px] text-bx-muted">El box los va a agregar pronto y vas a poder cargar tu RM de cada uno.</p>
            </div>
          </div>
        )}

        {vista === "mis" && !cargando && ejercicios.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative min-w-[240px] max-w-[520px] flex-1">
                <span className="sr-only">Buscar ejercicio</span>
                <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-bx-muted"><Ico d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" size={18} /></span>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar ejercicio"
                  className="h-12 w-full rounded-[10px] border border-bx-btn-line bg-bx-surf pl-[42px] pr-3.5 text-[15px] font-medium text-bx-ink placeholder:text-bx-muted"
                />
              </label>
              <FiltroChips
                etiqueta="Filtrar ejercicios"
                valor={filtro}
                onChange={setFiltro}
                opciones={[{ id: "todos", label: "Todos" }, { id: "con", label: "Con RM" }, { id: "sin", label: "Sin RM" }]}
                className="[&>button]:h-11 [&>button]:px-4 [&>button]:text-sm"
              />
              <span aria-live="polite" className="text-sm font-medium text-bx-muted">{lista.length === 1 ? "1 ejercicio" : `${lista.length} ejercicios`}</span>
            </div>

            {lista.length === 0 && (
              <div className="rounded-2xl border border-dashed border-bx-btn-line p-6 text-[15px] font-medium text-bx-muted">
                {busqueda.trim() ? `No hay ejercicios que coincidan con “${busqueda.trim()}”.` : "No hay ejercicios para mostrar con este filtro."}
              </div>
            )}

            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5 p-0">
              {lista.map((e) => {
                const gr = grupos.find((x) => x.idCatalogo === e.idCatalogo)
                const puesto = puestos[e.idCatalogo]
                const valorTxt = gr ? formatearValor(gr.tipo, gr.mejor.valorMejor) : null
                const [numero, ...unidad] = valorTxt ? valorTxt.split(" ") : []
                return (
                  <li key={e.idCatalogo} className="flex flex-col gap-4 rounded-2xl border border-bx-line bg-bx-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="m-0 text-[17px] font-bold">{e.nombre}</h2>
                      {gr && puesto && (
                        <button
                          type="button"
                          onClick={() => { setRankEj(e.idCatalogo); cambiarVista("ranking") }}
                          aria-label={`Ver ranking de ${e.nombre}, estás ${puesto.pos}º de ${puesto.total}`}
                          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-bx-ok-line bg-bx-ok-bg px-2.5 text-xs font-bold text-bx-ok-fg"
                        >
                          <Ico d={IC.trophy} size={14} />{puesto.pos}º de {puesto.total}
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-[0.1em] text-bx-muted">TU RM</div>
                      {gr ? (
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="bx-num text-[56px] leading-none">{numero}</span>
                          {unidad.length > 0 && <span className="text-lg font-bold text-bx-muted">{unidad.join(" ")}</span>}
                        </div>
                      ) : (
                        <div className="mt-2 text-[15px] font-medium text-bx-muted">Todavía no cargaste tu RM de este ejercicio.</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gr ? (
                        <>
                          <button
                            type="button"
                            onClick={() => abrirEjercicio(e)}
                            aria-label={`Actualizar RM de ${e.nombre}`}
                            className="inline-flex h-11 min-w-[130px] flex-1 items-center justify-center gap-2 rounded-lg border border-bx-btn-line bg-bx-surf text-sm font-bold text-bx-ink hover:border-bx-lima"
                          >
                            <Ico d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" size={16} />Actualizar RM
                          </button>
                          {gr.tipo === "peso" && (
                            <Boton
                              to={`/alumno/calculadora-rm?rm=${encodeURIComponent(gr.mejor.valorMejor)}`}
                              variante="secundario"
                              aria-label={`Calcular porcentajes de ${e.nombre}`}
                              className="min-w-[130px] flex-1 border-bx-btn-line text-bx-ink"
                            >
                              <Ico d={IC.calc} size={16} />Calcular %
                            </Boton>
                          )}
                        </>
                      ) : (
                        <Boton onClick={() => abrirEjercicio(e)} aria-label={`Cargar RM de ${e.nombre}`} className="min-w-[130px] flex-1">Cargar RM</Boton>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Cargar / actualizar el RM de un ejercicio, con su historial */}
      <Dialogo
        abierto={!!ejercicio}
        onCerrar={cerrarEjercicio}
        titulo={g ? "Actualizar RM" : "Cargar RM"}
        descripcion={ejercicio ? `${ejercicio.nombre} · RM actual: ${g ? formatearValor(tipo, g.mejor.valorMejor) : "sin cargar"}` : undefined}
        ancho={420}
        idEnfocar="campo-rm"
        pie={
          <>
            <Boton variante="secundario" onClick={cerrarEjercicio}>Cancelar</Boton>
            <Boton type="submit" form="form-rm" disabled={guardando} aria-busy={guardando}>{guardando ? "Guardando…" : "Guardar RM"}</Boton>
          </>
        }
      >
        {ejercicio && (
          <div className="flex flex-col gap-5">
            <form id="form-rm" noValidate onSubmit={guardar}>
              <Campo
                id="campo-rm"
                etiqueta={ETIQUETA[tipo]}
                ayuda={AYUDA[tipo]}
                error={error}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onBlur={() => { if (valor) setTocado(true) }}
                inputMode={tipo === "tiempo" ? "text" : "decimal"}
                inputClassName="h-[52px] text-[22px] font-extrabold"
                autoComplete="off"
              />
            </form>

            {g && (
              <div>
                <div className="mb-2 text-xs font-semibold tracking-[0.1em] text-bx-muted">HISTORIAL</div>
                <ul className="m-0 list-none overflow-hidden rounded-xl border border-bx-line2 p-0">
                  {visiblesHistorial.map((m) => (
                    <li key={m.idMarca} className="border-b border-bx-line2 last:border-b-0">
                      {aEliminar?.idMarca === m.idMarca ? (
                        <div role="alert" className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
                          <span className="min-w-[140px] flex-1 text-sm font-medium">¿Eliminar este RM?</span>
                          <button type="button" onClick={() => setAEliminar(null)} className="h-10 rounded-lg border border-bx-btn-line px-3 text-[13px] font-bold">No</button>
                          <button type="button" onClick={eliminar} className="h-10 rounded-lg bg-bx-err-fg px-3 text-[13px] font-bold text-bx-card">Sí, eliminar</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-3.5 py-1.5">
                          <span className="min-w-0 flex-1 text-sm text-bx-muted">{fechaCorta(m.fecha)}</span>
                          {m.esPR ? <span className="rounded-md border border-bx-ok-line bg-bx-ok-bg px-1.5 py-px text-[10px] font-extrabold tracking-wider text-bx-ok-fg">RM</span> : null}
                          <span className="text-sm font-extrabold tabular-nums">{formatearValor(g.tipo, m.valorMejor)}</span>
                          <button
                            type="button"
                            onClick={() => setAEliminar(m)}
                            aria-label={`Eliminar el RM del ${fechaCorta(m.fecha)}`}
                            className="grid h-11 w-11 place-items-center rounded-lg text-bx-muted hover:bg-bx-err-bg hover:text-bx-err-fg"
                          >
                            <Ico d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" size={16} />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {g.marcas.length > VISIBLES && (
                  <button type="button" onClick={() => setVerTodas((v) => !v)} className="mt-1 min-h-11 w-full text-center text-[13px] font-bold text-bx-muted hover:text-bx-ink">
                    {verTodas ? "Ver menos" : `Ver todo el historial (${g.marcas.length})`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Dialogo>
    </Pantalla>
  )
}
