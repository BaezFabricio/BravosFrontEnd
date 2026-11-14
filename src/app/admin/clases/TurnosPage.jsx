import { useEffect, useMemo, useState } from "react"
import { Clock, Pencil, Plus, Trash2, Loader2 } from "lucide-react"
import apiClient from "@/api"
import { Cargando } from "@/components/Cargando"
import { TituloPagina } from "@/components/TituloPagina"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/lib/notificar"
import { useTiposClase } from "@/lib/tiposClase"
import { useAnchoPanel } from "@/lib/useEscritorio"
import PestanasClases from "./PestanasClases"
import { ModalAdmin, ConfirmarAdmin } from "@/components/ModalAdmin"
import { BOTON_SECUNDARIO, BOTON_PRINCIPAL } from "@/components/estilosModal"

/*
 * Horarios de los turnos del box (los de Instagram: "Turno mañana 8:00", "Turno siesta 13:10, 14:10, 15:10"…), separados por
 * tipo de clase. Es la lista que el formulario de nueva clase ofrece para elegir el horario con un toque, así la semana se
 * prepara sin escribir cada hora. Cambiar o borrar un horario de acá no modifica las clases que ya están creadas.
 */
const SUGERENCIAS_TURNO = ["Mañana", "Siesta", "Noche"]
const VACIO = { turno: "Mañana", etiqueta: "", horaInicio: "", horaFin: "" }

// "60 min" o, si son horas justas desde las 2, "2 h"
const duracionTurno = (ini, fin) => {
  const [h1, m1] = String(ini).split(":").map(Number)
  const [h2, m2] = String(fin).split(":").map(Number)
  const m = h2 * 60 + m2 - (h1 * 60 + m1)
  return m >= 120 && m % 60 === 0 ? (m / 60) + " h" : m + " min"
}

// El turno se elige solo según la hora de inicio: antes de las 12 Mañana, hasta las 18 Siesta, después Noche
const turnoPorHora = (hora) => { const h = Number(String(hora).split(":")[0]); return h < 12 ? "Mañana" : h < 18 ? "Siesta" : "Noche" }

const permisosGuardados = () => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }

export default function TurnosPage() {
  const [horarios, setHorarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [editor, setEditor] = useState(null) // { id | null, ...campos } mientras se agrega o se cambia un horario
  const [errorEditor, setErrorEditor] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [aBorrar, setABorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)
  const { tipos } = useTiposClase()
  const escritorio = useAnchoPanel()
  const permisos = permisosGuardados()
  const puedeAgregar = permisos.includes("clases:alta")
  const puedeModificar = permisos.includes("clases:modificacion")
  const puedeBorrar = permisos.includes("clases:baja")

  // Cada vez que cambia "version" se vuelve a pedir la lista (al entrar y después de agregar, modificar o borrar)
  const [version, setVersion] = useState(0)
  const recargar = () => setVersion((v) => v + 1)
  useEffect(() => {
    let vigente = true
    apiClient.get("/turnos/horarios")
      .then((res) => { if (vigente) { setHorarios(res.data?.data || []); setError("") } })
      .catch((err) => { if (vigente) setError(err.response?.data?.message || "No se pudieron cargar los horarios.") })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [version])

  // Por tipo de clase y, adentro, por turno (en el orden en que empieza cada uno). Un tipo desactivado sin horarios no se muestra.
  const grupos = useMemo(() => (tipos || []).filter((t) => t.activo || horarios.some((h) => h.tipoPlan === t.codigo)).map((t) => ({ id: t.codigo, titulo: t.nombre, activo: t.activo })).map((t) => {
    const delTipo = horarios.filter((h) => h.tipoPlan === t.id)
    const turnos = []
    for (const h of delTipo) {
      let g = turnos.find((x) => x.nombre === h.turno)
      if (!g) { g = { nombre: h.turno, horarios: [] }; turnos.push(g) }
      g.horarios.push(h)
    }
    return { ...t, turnos }
  }), [horarios, tipos])

  const abrirNuevo = (tipoPlan) => { setErrorEditor(""); setEditor({ id: null, ...VACIO, tipoPlan }) }
  const abrirEditar = (h) => { setErrorEditor(""); setEditor({ turnoManual: true, id: h.idTurnoHorario, tipoPlan: h.tipoPlan, turno: h.turno, etiqueta: h.etiqueta || "", horaInicio: h.horaInicio, horaFin: h.horaFin }) }
  const cambiar = (campo) => (e) => setEditor((prev) => ({ ...prev, [campo]: e.target.value, ...(campo === "turno" ? { turnoManual: true } : {}) }))
  // Al cambiar la hora de inicio el turno se elige solo, mientras la persona no lo haya cambiado a mano
  const cambiarHora = (campo) => (e) => setEditor((prev) => {
    const nuevo = { ...prev, [campo]: e.target.value }
    if (campo === "horaInicio" && !prev.turnoManual && e.target.value) nuevo.turno = turnoPorHora(e.target.value)
    return nuevo
  })

  const guardar = async (e) => {
    e.preventDefault()
    setErrorEditor("")
    if (!editor.turno.trim()) return setErrorEditor("Escribí el nombre del turno (por ejemplo Mañana, Siesta o Noche).")
    if (!editor.horaInicio || !editor.horaFin) return setErrorEditor("Elegí la hora de inicio y la de fin.")
    if (editor.horaInicio >= editor.horaFin) return setErrorEditor("La hora de fin tiene que ser posterior a la de inicio.")
    setGuardando(true)
    try {
      const cuerpo = { tipoPlan: editor.tipoPlan, turno: editor.turno.trim(), etiqueta: editor.etiqueta.trim(), horaInicio: editor.horaInicio, horaFin: editor.horaFin }
      if (editor.id) await apiClient.put(`/turnos/horarios/${editor.id}`, cuerpo)
      else await apiClient.post("/turnos/horarios", cuerpo)
      toast.success(editor.id ? "Horario actualizado" : "Horario agregado", { guardar: false })
      setEditor(null)
      recargar()
    } catch (err) {
      setErrorEditor(err.response?.data?.message || "No se pudo guardar el horario. Probá de nuevo.")
    } finally {
      setGuardando(false)
    }
  }

  const confirmarBorrar = async () => {
    setBorrando(true)
    try {
      await apiClient.delete(`/turnos/horarios/${aBorrar.idTurnoHorario}`)
      toast.success("Horario eliminado", { guardar: false })
      setABorrar(null)
      recargar()
    } catch (err) {
      toast.error("No se pudo eliminar", { description: err.response?.data?.message || "Probá de nuevo." })
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className={escritorio ? "space-y-5" : "space-y-8"}>
      {escritorio ? (
        <>
          <TituloPagina descripcion="Horarios fijos de cada tipo de clase">Clases</TituloPagina>
          <PestanasClases activa="turnos" />
          <p style={{ margin: 0, font: "500 15px Archivo", color: "var(--muted-foreground)" }}>Son los horarios fijos de cada tipo. Al crear una clase se eligen de esta lista; si los cambiás, las clases ya creadas no cambian.</p>
        </>
      ) : (
        <TituloPagina descripcion={"Los horarios de cada turno. Al crear una clase se eligen de esta lista."}>Gestión de Turnos</TituloPagina>
      )}

      {cargando && <Cargando filas={3} className="py-4" />}

      {!cargando && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* ESCRITORIO: Turnos como la referencia (tarjeta por tipo de clase, agrupada por turno) */}
      {!cargando && !error && escritorio && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "20px", alignItems: "start" }}>
          {grupos.map((g) => {
            const total = g.turnos.reduce((n, t) => n + t.horarios.length, 0)
            return (
              <section key={g.id} aria-label={g.titulo} style={{ borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: "1 1 0%", minWidth: "0px" }}>
                    <h2 className="bv-admin-titulo" style={{ margin: "0px", font: "800 18px Archivo" }}>{g.titulo}</h2>
                    <div style={{ marginTop: "3px", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{total + (total === 1 ? " horario" : " horarios")}</div>
                  </div>
                  {puedeAgregar && g.activo && (
                    <button type="button" onClick={() => abrirNuevo(g.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "44px", padding: "0px 16px", borderRadius: "10px", border: "1px solid var(--sh-accent)", background: "transparent", color: "var(--sh-accent)", font: "800 14px Archivo", whiteSpace: "nowrap", cursor: "pointer" }}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Agregar horario
                    </button>
                  )}
                </div>

                {g.turnos.length === 0 && (
                  <p style={{ margin: 0, padding: "22px", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Todavía no hay horarios cargados para este tipo de clase.</p>
                )}

                {g.turnos.map((t) => (
                  <div key={t.nombre}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 22px 8px" }}>
                      <Clock className="h-[15px] w-[15px]" style={{ color: "var(--sh-accent)" }} aria-hidden="true" />
                      <span style={{ font: "800 12px Archivo", letterSpacing: "0.1em", color: "var(--sh-accent)" }}>{"TURNO " + t.nombre.toUpperCase()}</span>
                      <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{"· " + t.horarios.length + (t.horarios.length === 1 ? " horario" : " horarios")}</span>
                    </div>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {t.horarios.map((h) => (
                        <li key={h.idTurnoHorario} style={{ display: "flex", alignItems: "center", gap: "14px", minHeight: "60px", padding: "10px 16px 10px 22px", borderTop: "1px solid var(--border)" }}>
                          <span style={{ flex: "1 1 0%", minWidth: "0px", display: "flex", alignItems: "baseline", gap: "10px" }}>
                            <span style={{ font: "800 18px Archivo", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{h.horaInicio + " – " + h.horaFin}</span>
                            <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{duracionTurno(h.horaInicio, h.horaFin)}</span>
                            {h.etiqueta && <span style={{ font: "500 13px Archivo", color: "var(--sh-link)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.etiqueta}</span>}
                          </span>
                          {puedeModificar && (
                            <button type="button" onClick={() => abrirEditar(h)} aria-label={"Modificar el horario de las " + h.horaInicio}
                              style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                              <Pencil className="h-[15px] w-[15px]" aria-hidden="true" />
                            </button>
                          )}
                          {puedeBorrar && (
                            <button type="button" onClick={() => setABorrar(h)} aria-label={"Eliminar el horario de las " + h.horaInicio}
                              style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--sh-danger)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                              <Trash2 className="h-[15px] w-[15px]" aria-hidden="true" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div style={{ height: "8px" }} />
              </section>
            )
          })}
        </div>
      )}

      {!cargando && !error && !escritorio && (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {grupos.map((g) => (
            <section key={g.id} aria-label={g.titulo} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-2">
                <h2 className="flex items-center gap-2.5 text-lg font-black uppercase tracking-wide text-foreground">
                  <span className="h-5 w-1.5 rounded-full bg-lime-400" aria-hidden="true" /> {g.titulo}
                </h2>
                {puedeAgregar && g.activo && (
                  <Button type="button" size="sm" onClick={() => abrirNuevo(g.id)} className="bg-lime-400 font-black uppercase tracking-wide text-black hover:bg-lime-300">
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Agregar horario
                  </Button>
                )}
              </div>

              {g.turnos.length === 0 && (
                <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-foreground/60">Todavía no hay horarios cargados para este tipo de clase.</p>
              )}

              {g.turnos.map((t) => (
                <div key={t.nombre} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <Clock className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                    <h3 className="text-base font-black uppercase tracking-wide text-foreground">Turno {t.nombre.toLowerCase()}</h3>
                  </div>
                  <ul className="divide-y divide-border">
                    {t.horarios.map((h) => (
                      <li key={h.idTurnoHorario} className="flex min-h-[3.5rem] items-center gap-3 px-4 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-black tabular-nums text-foreground">{h.horaInicio} <span className="font-semibold text-foreground/45">a</span> {h.horaFin}</p>
                          {h.etiqueta && <p className="truncate text-xs text-foreground/60">{h.etiqueta}</p>}
                        </div>
                        {puedeModificar && (
                          <button type="button" onClick={() => abrirEditar(h)} aria-label={`Modificar el horario de las ${h.horaInicio}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground/70 transition-colors hover:border-lime-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {puedeBorrar && (
                          <button type="button" onClick={() => setABorrar(h)} aria-label={`Eliminar el horario de las ${h.horaInicio}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:border-red-500 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}


      {/* ESCRITORIO: agregar / editar / eliminar un horario, como la referencia */}
      {escritorio && (() => {
        const etq = { display: "block", marginBottom: "8px", font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }
        const campo = { width: "100%", boxSizing: "border-box", height: "46px", padding: "0px 14px", borderRadius: "10px", border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }
        const tipoNombre = (id) => grupos.find((t) => t.id === id)?.titulo || ""
        const opcionesTurno = editor && !["Mañana", "Siesta", "Noche"].includes(editor.turno) ? [editor.turno, "Mañana", "Siesta", "Noche"] : ["Mañana", "Siesta", "Noche"]
        const minutosEditor = editor && editor.horaInicio && editor.horaFin && editor.horaInicio < editor.horaFin ? duracionTurno(editor.horaInicio, editor.horaFin) : ""
        return (
          <>
            <ModalAdmin abierto={Boolean(editor)} onCerrar={() => setEditor(null)} titulo={editor?.id ? "Editar horario" : "Agregar horario"}
              subtitulo={editor ? tipoNombre(editor.tipoPlan) + " · Las clases que ya creaste no cambian." : ""}>
              {editor && (
                <form onSubmit={guardar} noValidate style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label htmlFor="th-turno" style={etq}>Turno</label>
                    <select id="th-turno" value={editor.turno} onChange={cambiar("turno")} style={campo}>
                      {opcionesTurno.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label htmlFor="th-inicio" style={etq}>Desde *</label>
                        <input id="th-inicio" type="time" value={editor.horaInicio} onChange={cambiarHora("horaInicio")} style={campo} />
                      </div>
                      <div>
                        <label htmlFor="th-fin" style={etq}>Hasta *</label>
                        <input id="th-fin" type="time" value={editor.horaFin} onChange={cambiarHora("horaFin")} style={campo} />
                      </div>
                    </div>
                    {minutosEditor && <p style={{ margin: "8px 0 0", font: "500 13px Archivo", color: "var(--sh-link)" }}>{"Dura " + minutosEditor + ". El turno se elige solo según la hora; podés cambiarlo."}</p>}
                  </div>
                  <div>
                    <label htmlFor="th-etiqueta" style={etq}>Aclaración <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(opcional)</span></label>
                    <input id="th-etiqueta" value={editor.etiqueta} onChange={cambiar("etiqueta")} maxLength={60} autoComplete="off" placeholder="Ej: Entrenamiento funcional" style={campo} />
                  </div>
                  {errorEditor && <p role="alert" style={{ margin: 0, font: "600 13px Archivo", color: "var(--destructive)" }}>{errorEditor}</p>}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                    <button type="button" onClick={() => setEditor(null)} disabled={guardando} style={BOTON_SECUNDARIO}>Cancelar</button>
                    <button type="submit" disabled={guardando} style={{ ...BOTON_PRINCIPAL, opacity: guardando ? 0.6 : 1 }}>{guardando ? "GUARDANDO..." : "GUARDAR"}</button>
                  </div>
                </form>
              )}
            </ModalAdmin>
            <ConfirmarAdmin abierto={Boolean(aBorrar)} onCerrar={() => setABorrar(null)} titulo="¿Eliminar este horario?" ocupado={borrando} onConfirmar={confirmarBorrar}
              texto={aBorrar ? tipoNombre(aBorrar.tipoPlan) + " · Turno " + aBorrar.turno.toLowerCase() + ", de " + aBorrar.horaInicio + " a " + aBorrar.horaFin + ". Las clases que ya creaste con este horario no cambian." : ""} />
          </>
        )
      })()}

      {/* Celular y tableta: ventanas de siempre */}
      {!escritorio && <>
      {/* Agregar o modificar un horario */}
      <Dialog open={Boolean(editor)} onOpenChange={(abierto) => { if (!abierto) setEditor(null) }}>
        <DialogContent className="max-w-md">
          {editor && (
            <form onSubmit={guardar} className="space-y-4" noValidate>
              <DialogHeader>
                <DialogTitle>{editor.id ? "Modificar horario" : "Agregar horario"}</DialogTitle>
                <DialogDescription>
                  {grupos.find((t) => t.id === editor.tipoPlan)?.titulo}. Las clases que ya creaste no cambian.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <label htmlFor="th-turno" className="text-xs font-black uppercase tracking-widest text-foreground/70">Turno</label>
                <Input id="th-turno" list="th-turnos" value={editor.turno} onChange={cambiar("turno")} maxLength={50} autoComplete="off" placeholder="Mañana, Siesta o Noche" />
                <datalist id="th-turnos">{SUGERENCIAS_TURNO.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="th-inicio" className="text-xs font-black uppercase tracking-widest text-foreground/70">Desde</label>
                  <Input id="th-inicio" type="time" value={editor.horaInicio} onChange={cambiar("horaInicio")} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="th-fin" className="text-xs font-black uppercase tracking-widest text-foreground/70">Hasta</label>
                  <Input id="th-fin" type="time" value={editor.horaFin} onChange={cambiar("horaFin")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="th-etiqueta" className="text-xs font-black uppercase tracking-widest text-foreground/70">
                  Aclaración <span className="font-medium normal-case tracking-normal text-foreground/50">(opcional)</span>
                </label>
                <Input id="th-etiqueta" value={editor.etiqueta} onChange={cambiar("etiqueta")} maxLength={60} autoComplete="off" placeholder="Ej: Entrenamiento funcional" />
              </div>
              {errorEditor && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">{errorEditor}</p>}
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setEditor(null)} disabled={guardando}>Cancelar</Button>
                <Button type="submit" disabled={guardando} className="bg-lime-400 font-black uppercase tracking-wide text-black hover:bg-lime-300">
                  {guardando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Guardando...</> : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar el borrado */}
      <Dialog open={Boolean(aBorrar)} onOpenChange={(abierto) => { if (!abierto) setABorrar(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar este horario?</DialogTitle>
            <DialogDescription>
              {aBorrar && <>Turno {aBorrar.turno.toLowerCase()}, de {aBorrar.horaInicio} a {aBorrar.horaFin}. Deja de aparecer en la lista al crear clases. Las clases que ya están creadas no cambian.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setABorrar(null)} disabled={borrando}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={confirmarBorrar} disabled={borrando}>{borrando ? "Eliminando..." : "Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>}
    </div>
  )
}
