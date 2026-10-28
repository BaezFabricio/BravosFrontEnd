import { useEffect, useMemo, useState } from "react"
import { Clock, Pencil, Plus, Trash2, Loader2 } from "lucide-react"
import apiClient from "@/api"
import { Cargando } from "@/components/Cargando"
import { BotonVolver } from "@/components/BotonVolver"
import { TituloPagina } from "@/components/TituloPagina"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/lib/notificar"
import { useTiposClase } from "@/lib/tiposClase"

/*
 * Horarios de los turnos del box (los de Instagram: "Turno mañana 8:00", "Turno siesta 13:10, 14:10, 15:10"…), separados por
 * tipo de clase. Es la lista que el formulario de nueva clase ofrece para elegir el horario con un toque, así la semana se
 * prepara sin escribir cada hora. Cambiar o borrar un horario de acá no modifica las clases que ya están creadas.
 */
const SUGERENCIAS_TURNO = ["Mañana", "Siesta", "Noche"]
const VACIO = { turno: "Siesta", etiqueta: "", horaInicio: "", horaFin: "" }

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
  const abrirEditar = (h) => { setErrorEditor(""); setEditor({ id: h.idTurnoHorario, tipoPlan: h.tipoPlan, turno: h.turno, etiqueta: h.etiqueta || "", horaInicio: h.horaInicio, horaFin: h.horaFin }) }
  const cambiar = (campo) => (e) => setEditor((prev) => ({ ...prev, [campo]: e.target.value }))

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
    <div className="space-y-8">
      <BotonVolver a="/admin/clases" texto="Volver" className="-mt-2 lg:-mt-4" />
      <TituloPagina descripcion={"Los horarios de cada turno. Al crear una clase se eligen de esta lista."}>Gestión de Turnos</TituloPagina>

      {cargando && <Cargando filas={3} className="py-4" />}

      {!cargando && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {!cargando && !error && (
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
                      <li key={h.idTurnoHorario} className="flex min-h-[56px] items-center gap-3 px-4 py-2">
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
    </div>
  )
}
