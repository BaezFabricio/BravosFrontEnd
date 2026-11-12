import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import apiClient from "@/api"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { ErrorBanner, Esqueleto, Pestanas } from "@/components/bx"
import LogroCelebracion from "@/components/LogroCelebracion"
import { logrosNuevosPorMarcas } from "@/lib/logros"
import { formatearValor } from "@/lib/ranking"
import { toast } from "@/lib/notificar"
import { hoyTexto } from "@/lib/fechasBx"
import RankingEscritorio from "./RankingEscritorio"

/*
 * Mis RM en el celular (handoff móvil, Prompt 3). Pestañas Mis RM / Ranking, buscador con "+", tarjeta por ejercicio con el RM grande,
 * el puesto (abre el ranking), "Actualizar" y "Calcular %". Cargar o actualizar el RM va en BottomSheet, con validación.
 * La lógica de carga y guardado es la misma que la del escritorio (MarcasEscritorio).
 */

const MAX_KG = 500
const MAX_TIEMPO = 3600 * 10

// "4:32" → 272 · "90" → 90 (segundos)
function parseTiempo(txt) {
  const partes = String(txt).trim().split(":").map(Number)
  if (partes.length === 0 || partes.some((n) => Number.isNaN(n) || n < 0)) return null
  return partes.reduce((acc, n) => acc * 60 + n, 0)
}

// Mensaje de error para el valor escrito, o "" si está bien (validación 1–500 kg para peso)
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
  return seg && seg > 0 && seg <= MAX_TIEMPO ? "" : "Ingresá un tiempo válido, por ejemplo 4:32."
}

const AYUDA = { peso: "Usá punto o coma para decimales, por ejemplo 102,5.", repeticiones: "Cantidad de repeticiones, por ejemplo 20.", tiempo: "Formato min:seg, por ejemplo 4:32." }
const ETIQUETA = { peso: "Peso máximo (kg)", repeticiones: "Repeticiones", tiempo: "Tiempo (min:seg)" }
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

export default function MarcasMovilNuevo() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const vista = params.get("vista") === "ranking" ? "ranking" : "mis"
  const [marcas, setMarcas] = useState([])
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [puestos, setPuestos] = useState({})
  const [busqueda, setBusqueda] = useState("")
  const [rankEj, setRankEj] = useState(null)
  const [idEj, setIdEj] = useState("") // ejercicio abierto en la hoja de carga
  const [valor, setValor] = useState("")
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aEliminar, setAEliminar] = useState(null)
  const [logrosNuevos, setLogrosNuevos] = useState([])
  const [verHistorial, setVerHistorial] = useState(false)

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

  const grupos = useMemo(() => {
    const map = new Map()
    marcas.forEach((m) => {
      if (!map.has(m.idCatalogo)) map.set(m.idCatalogo, { idCatalogo: m.idCatalogo, tipo: m.tipoMarca, marcas: [] })
      map.get(m.idCatalogo).marcas.push(m)
    })
    return [...map.values()].map((g) => ({ ...g, mejor: g.marcas.reduce((a, b) => ((g.tipo === "tiempo" ? b.valorMejor < a.valorMejor : b.valorMejor > a.valorMejor) ? b : a)) }))
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
    setValor(gr && e.tipoMarca === "peso" ? String(gr.mejor.valorMejor).replace(".", ",") : "")
    setTocado(false)
    setVerHistorial(false)
    setAEliminar(null)
    setIdEj(String(e.idCatalogo))
  }
  const cerrarEjercicio = () => { setIdEj(""); setValor(""); setAEliminar(null) }

  const guardar = async (ev) => {
    ev?.preventDefault()
    if (!ejercicio || guardando) return
    setTocado(true)
    if (errorDeValor(tipo, valor)) return
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
    return ejercicios.filter((e) => !q || String(e.nombre).toLowerCase().includes(q))
  }, [ejercicios, busqueda])

  const fechaCorta = (f) => { const d = new Date(`${String(f).slice(0, 10)}T12:00:00`); return `${d.getDate()} ${MESES[d.getMonth()]}` }

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <LogroCelebracion logros={aEliminar ? [] : logrosNuevos} onCerrar={() => setLogrosNuevos((prev) => prev.slice(1))} />
      <h1 className="m-0 text-[1.375rem] font-extrabold">Mis RM</h1>

      <Pestanas etiqueta="Mis RM o ranking" valor={vista} onChange={cambiarVista} items={[{ id: "mis", label: "Mis RM" }, { id: "ranking", label: "Ranking" }]} className="gap-6" />

      <div key={vista} role="tabpanel" className="bx-aparece flex flex-col gap-4">
        {errorCarga && <ErrorBanner titulo="No pudimos cargar tus RM" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { setCargando(true); cargar() }} />}

        {vista === "ranking" && <RankingEscritorio idCatalogo={rankEj} onElegir={setRankEj} onEditar={(id) => { const e = ejercicios.find((x) => x.idCatalogo === id); if (e) abrirEjercicio(e) }} />}

        {vista === "mis" && cargando && (
          <div aria-busy="true" aria-label="Cargando" className="flex flex-col gap-2.5">
            <Esqueleto alto={48} className="rounded-xl" /><Esqueleto alto={150} className="rounded-2xl" />
          </div>
        )}

        {vista === "mis" && !cargando && !errorCarga && (
          <>
            <div className="flex items-center gap-2.5">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Buscar ejercicio</span>
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bx-muted"><Ico d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" size={18} sw={1.8} /></span>
                <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar ejercicio" className="h-[3rem] w-full rounded-[0.625rem] border border-bx-btn-line bg-bx-surf pl-[2.625rem] pr-3 text-[0.9375rem] font-medium text-bx-ink placeholder:text-bx-muted" />
              </label>
              <button type="button" onClick={() => { const libre = ejercicios.find((e) => !grupos.some((g) => g.idCatalogo === e.idCatalogo)) || ejercicios[0]; if (libre) abrirEjercicio(libre) }} aria-label="Cargar RM de un ejercicio nuevo" className="grid h-[3rem] w-[3rem] shrink-0 place-items-center rounded-[0.625rem] border border-bx-ok-fg text-bx-ok-fg active:scale-95">
                <Ico d={IC.plus} size={20} sw={2.2} />
              </button>
            </div>

            {ejercicios.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-bx-line bg-bx-card px-5 py-9 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bx-tile text-bx-ok-fg"><Ico d={IC.dumb} size={26} /></span>
                <div className="text-lg font-bold">Todavía no hay ejercicios cargados</div>
                <p className="m-0 text-sm text-bx-muted">El box los va a agregar pronto.</p>
              </div>
            )}

            {ejercicios.length > 0 && lista.length === 0 && (
              <div className="rounded-2xl border border-dashed border-bx-btn-line px-4 py-6 text-center text-sm text-bx-muted">No hay ejercicios que coincidan con “{busqueda.trim()}”.</div>
            )}

            <ul className="bx-lista m-0 flex list-none flex-col gap-3 p-0">
              {lista.map((e) => {
                const gr = grupos.find((x) => x.idCatalogo === e.idCatalogo)
                const puesto = puestos[e.idCatalogo]
                const valorTxt = gr ? formatearValor(gr.tipo, gr.mejor.valorMejor) : null
                const [numero, ...unidad] = valorTxt ? valorTxt.split(" ") : []
                return (
                  <li key={e.idCatalogo} className="bx-lift flex flex-col gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <h2 className="m-0 min-w-0 text-[1.0625rem] font-bold">{e.nombre}</h2>
                      {gr && puesto && (
                        <button type="button" onClick={() => { setRankEj(e.idCatalogo); cambiarVista("ranking") }} aria-label={`Ver el ranking de ${e.nombre}, estás ${puesto.pos}º de ${puesto.total}`}
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-bx-ok-line bg-bx-ok-bg px-3 text-xs font-bold text-bx-ok-fg active:scale-95">
                          <Ico d={IC.trophy} size={14} />{puesto.pos}º de {puesto.total}
                        </button>
                      )}
                    </div>
                    {gr ? (
                      <div>
                        <div className="text-xs font-semibold tracking-[0.1em] text-bx-muted">TU RM</div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="bx-num text-[3.25rem] leading-none">{numero}</span>
                          {unidad.length > 0 && <span className="text-[1.0625rem] font-bold text-bx-muted">{unidad.join(" ")}</span>}
                        </div>
                        <div className="mt-1 text-xs text-bx-muted">Cargado el {fechaCorta(gr.marcas[0].fecha)}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-bx-muted">Todavía no cargaste tu RM de este ejercicio.</div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => abrirEjercicio(e)} aria-label={gr ? `Actualizar RM de ${e.nombre}` : `Cargar RM de ${e.nombre}`}
                        className="flex h-[2.875rem] items-center justify-center gap-2 rounded-[0.625rem] border border-bx-ok-fg text-[0.875rem] font-bold text-bx-ok-fg active:bg-bx-ok-bg">
                        <Ico d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" size={16} />{gr ? "Actualizar" : "Cargar RM"}
                      </button>
                      {gr && gr.tipo === "peso" ? (
                        <button type="button" onClick={() => navigate(`/alumno/calculadora-rm?rm=${encodeURIComponent(gr.mejor.valorMejor)}`)} aria-label={`Calcular porcentajes de ${e.nombre}`}
                          className="flex h-[2.875rem] items-center justify-center gap-2 rounded-[0.625rem] border border-bx-btn-line text-[0.875rem] font-bold text-bx-ink active:bg-bx-surf">
                          <Ico d={IC.calc} size={16} />Calcular %
                        </button>
                      ) : <span />}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Cargar / actualizar el RM: hoja con teclado y validación */}
      <BottomSheet
        abierto={!!ejercicio}
        onCerrar={cerrarEjercicio}
        titulo={g ? "Actualizar RM" : "Cargar RM"}
        descripcion={ejercicio ? `${ejercicio.nombre}${g ? ` · RM actual ${formatearValor(tipo, g.mejor.valorMejor)}` : ""}` : undefined}
        pie={
          <div className="flex w-full flex-col gap-2.5">
            <button type="submit" form="form-rm-m" disabled={guardando} aria-busy={guardando} className="h-[3.25rem] rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold text-bx-negro active:scale-[0.98] disabled:opacity-60">{guardando ? "Guardando…" : "Guardar RM"}</button>
            <button type="button" onClick={cerrarEjercicio} className="h-11 text-sm font-bold text-bx-ink">Cancelar</button>
          </div>
        }
      >
        {ejercicio && (
          <div className="flex flex-col gap-4">
            <form id="form-rm-m" noValidate onSubmit={guardar} className="flex flex-col gap-1.5">
              <label htmlFor="campo-rm-m" className="text-sm font-semibold">{ETIQUETA[tipo]} *</label>
              <input
                id="campo-rm-m"
                inputMode={tipo === "tiempo" ? "text" : "decimal"}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onBlur={() => { if (valor) setTocado(true) }}
                aria-invalid={error ? true : undefined}
                aria-describedby="ayuda-rm-m"
                autoComplete="off"
                autoFocus
                className={`h-[3.25rem] w-full rounded-[0.625rem] border bg-bx-surf px-3.5 text-[1.375rem] font-extrabold text-bx-ink ${error ? "border-2 border-bx-err-fg" : "border-bx-btn-line"}`}
              />
              <span id="ayuda-rm-m" className={`text-[0.8125rem] font-medium ${error ? "text-bx-err-fg" : "text-bx-muted"}`}>{error || AYUDA[tipo]}</span>
            </form>

            {g && (
              <div>
                <div className="mb-2 text-xs font-semibold tracking-[0.1em] text-bx-muted">HISTORIAL</div>
                <ul className="m-0 list-none overflow-hidden rounded-xl border border-bx-line2 p-0">
                  {(verHistorial ? g.marcas : g.marcas.slice(0, 3)).map((m) => (
                    <li key={m.idMarca} className="flex items-center gap-3 border-b border-bx-line2 px-3 py-1 last:border-b-0">
                      <span className="min-w-0 flex-1 text-sm text-bx-muted">{fechaCorta(m.fecha)}</span>
                      {m.esPR && <span className="rounded-md border border-bx-ok-line bg-bx-ok-bg px-1.5 py-px text-[0.625rem] font-extrabold text-bx-ok-fg">RM</span>}
                      <span className="text-sm font-extrabold tabular-nums">{formatearValor(g.tipo, m.valorMejor)}</span>
                      <button type="button" onClick={() => setAEliminar(m)} aria-label={`Eliminar el RM del ${fechaCorta(m.fecha)}`} className="grid h-11 w-11 place-items-center rounded-lg text-bx-muted active:bg-bx-err-bg active:text-bx-err-fg">
                        <Ico d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                {g.marcas.length > 3 && <button type="button" onClick={() => setVerHistorial((v) => !v)} className="mt-1 min-h-11 w-full text-center text-[0.8125rem] font-bold text-bx-muted">{verHistorial ? "Ver menos" : `Ver todo el historial (${g.marcas.length})`}</button>}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Eliminar un RM: confirmación */}
      <BottomSheet
        abierto={!!aEliminar}
        onCerrar={() => setAEliminar(null)}
        titulo="¿Eliminar este RM?"
        alerta
        descripcion={aEliminar ? `Se borra el RM de ${formatearValor(tipo, aEliminar.valorMejor)} del ${fechaCorta(aEliminar.fecha)}. No se puede deshacer.` : ""}
        pie={
          <div className="flex w-full flex-col gap-2.5">
            <button type="button" autoFocus onClick={() => setAEliminar(null)} className="h-[3.25rem] rounded-xl border border-bx-btn-line text-[0.9375rem] font-bold text-bx-ink">No, volver</button>
            <button type="button" onClick={eliminar} className="h-[3.25rem] rounded-xl bg-bx-err-fg text-[0.9375rem] font-bold text-bx-card active:scale-[0.98]">Sí, eliminar</button>
          </div>
        }
      />
    </div>
  )
}
