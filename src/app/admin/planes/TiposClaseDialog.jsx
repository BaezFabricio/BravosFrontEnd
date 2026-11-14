import { useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { Cargando } from "@/components/Cargando"
import { ModalAdmin, ConfirmarAdmin } from "@/components/ModalAdmin"
import { useAnchoPanel } from "@/lib/useEscritorio"

/**
 * Administración de los tipos de clase del box (CrossFit, Planificación Atleta, Funcional…).
 * Cada plan y cada clase es de un tipo, y el alumno reserva las clases de los tipos que tiene contratados.
 * Un tipo que ya tiene planes, clases u horarios no se elimina: se desactiva (deja de ofrecerse para lo nuevo).
 */
export default function TiposClaseDialog({ open, onClose, tipos, onCambio, puedeCrear, puedeEditar, puedeBorrar }) {
  const [nuevo, setNuevo] = useState("")
  const [editando, setEditando] = useState(null) // { id, nombre }
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState("")
  const [aBorrar, setABorrar] = useState(null)
  const [aDesactivar, setADesactivar] = useState(null)
  const escritorio = useAnchoPanel()

  const mensaje = (err, porDefecto) => err.response?.data?.message || porDefecto

  const crear = async () => {
    const nombre = nuevo.trim()
    if (nombre.length < 2) { setError("Escribí el nombre del tipo de clase."); return }
    setOcupado(true); setError("")
    try {
      await apiClient.post("/tipos-clase", { nombre })
      toast.success("Tipo de clase creado")
      setNuevo("")
      await onCambio()
    } catch (err) {
      setError(mensaje(err, "No se pudo crear el tipo de clase."))
    } finally { setOcupado(false) }
  }

  const guardar = async (t, cambios) => {
    setOcupado(true); setError("")
    try {
      await apiClient.put(`/tipos-clase/${t.idTipoClase}`, { nombre: t.nombre, activo: t.activo, ...cambios })
      setEditando(null)
      await onCambio()
    } catch (err) {
      setError(mensaje(err, "No se pudo guardar el cambio."))
    } finally { setOcupado(false) }
  }

  const borrar = async () => {
    const t = aBorrar
    setABorrar(null)
    setOcupado(true); setError("")
    try {
      await apiClient.delete(`/tipos-clase/${t.idTipoClase}`)
      toast.success("Tipo de clase eliminado")
      await onCambio()
    } catch (err) {
      setError(mensaje(err, "No se pudo eliminar el tipo de clase."))
    } finally { setOcupado(false) }
  }

  const campo = "h-11 w-full rounded-xl border border-border bg-background/60 px-3 text-base text-foreground outline-none transition-colors focus:border-lime-500"
  const iconBtn = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:opacity-40"

  // ESCRITORIO (referencia 07): lista de tipos con Desactivar, y "Nuevo tipo de clase" abajo
  if (escritorio) {
    const boton = { height: "40px", padding: "0px 14px", borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer", whiteSpace: "nowrap" }
    const cuadrado = { width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", display: "grid", placeItems: "center", cursor: "pointer" }
    return (
      <>
        <ModalAdmin abierto={open} onCerrar={onClose} ancho={640} titulo="Tipos de clase">
          <p style={{ margin: "8px 40px 0px 0px", font: "400 14px / 1.5 Archivo", color: "var(--sh-link)" }}>
            Cada plan y cada clase es de un tipo. El alumno puede reservar las clases de los tipos que tiene contratados, sin importar el plan que haya comprado dentro de ese tipo.
          </p>
          {tipos === null ? <Cargando filas={2} className="py-2" /> : (
            <ul style={{ listStyle: "none", margin: "18px 0 0", padding: 0, borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
              {tipos.map((t, i) => {
                const enUso = t.planes + t.clases + t.horarios > 0
                const modo = editando?.id === t.idTipoClase
                return (
                  <li key={t.idTipoClase} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                    <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                      {modo ? (
                        <input autoFocus value={editando.nombre} maxLength={50} aria-label={"Nombre del tipo " + t.nombre}
                          onChange={(e) => setEditando({ id: t.idTipoClase, nombre: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") guardar(t, { nombre: editando.nombre.trim() }); if (e.key === "Escape") setEditando(null) }}
                          style={{ width: "100%", boxSizing: "border-box", height: "40px", padding: "0px 12px", borderRadius: "8px", border: "1px solid var(--sh-accent)", background: "var(--input)", color: "var(--foreground)", font: "700 15px Archivo" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ font: "800 15px Archivo", color: t.activo ? "var(--foreground)" : "var(--muted-foreground)" }}>{t.nombre}</span>
                          <span style={{ padding: "1px 8px", borderRadius: "999px", background: t.activo ? "var(--sh-active-bg)" : "transparent", border: "1px solid " + (t.activo ? "rgba(155, 230, 0, 0.3)" : "var(--sh-control-line)"), color: t.activo ? "var(--primary)" : "var(--muted-foreground)", font: "700 11px Archivo" }}>{t.activo ? "Activo" : "Desactivado"}</span>
                        </div>
                      )}
                      <div style={{ marginTop: "2px", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>
                        {t.planes + (t.planes === 1 ? " plan" : " planes") + " · " + t.clases + (t.clases === 1 ? " clase" : " clases") + " · " + t.horarios + (t.horarios === 1 ? " horario" : " horarios")}
                      </div>
                    </div>
                    {modo ? (
                      <>
                        <button type="button" onClick={() => guardar(t, { nombre: editando.nombre.trim() })} disabled={ocupado} aria-label="Guardar nombre" style={cuadrado}><Check className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setEditando(null)} aria-label="Cancelar" style={cuadrado}><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        {puedeEditar && (
                          <>
                            <button type="button" onClick={() => setEditando({ id: t.idTipoClase, nombre: t.nombre })} aria-label={"Cambiar el nombre de " + t.nombre} style={cuadrado}><Pencil className="h-4 w-4" /></button>
                            <button type="button" disabled={ocupado} onClick={() => (t.activo ? setADesactivar(t) : guardar(t, { activo: true }))} style={{ ...boton, minWidth: "112px" }}>{t.activo ? "Desactivar" : "Activar"}</button>
                          </>
                        )}
                        {puedeBorrar && !enUso && (
                          <button type="button" onClick={() => setABorrar(t)} aria-label={"Eliminar " + t.nombre} style={{ ...cuadrado, color: "var(--sh-danger)" }}><Trash2 className="h-4 w-4" /></button>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {puedeCrear && (
            <div style={{ marginTop: "20px" }}>
              <label htmlFor="tc-nuevo" style={{ display: "block", marginBottom: "8px", font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Nuevo tipo de clase</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input id="tc-nuevo" value={nuevo} maxLength={50} onChange={(e) => { setNuevo(e.target.value); setError("") }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); crear() } }} placeholder="Ej: Funcional, Kids, Yoga"
                  style={{ flex: "1 1 0%", minWidth: 0, boxSizing: "border-box", height: "46px", padding: "0px 14px", borderRadius: "10px", border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }} />
                <button type="button" onClick={crear} disabled={ocupado || !nuevo.trim()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "46px", padding: "0px 16px", borderRadius: "10px", border: "1px solid var(--sh-accent)", background: "transparent", color: "var(--sh-accent)", font: "800 14px Archivo", cursor: "pointer", opacity: nuevo.trim() ? 1 : 0.6 }}>
                  {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
                </button>
              </div>
            </div>
          )}
          {error && <p role="alert" style={{ margin: "12px 0 0", font: "600 13px Archivo", color: "var(--destructive)" }}>{error}</p>}
        </ModalAdmin>
        <ConfirmarAdmin abierto={!!aBorrar} onCerrar={() => setABorrar(null)} titulo="¿Eliminar este tipo de clase?" textoAccion="Eliminar" onConfirmar={borrar}
          texto={aBorrar ? aBorrar.nombre + ". No tiene planes, clases ni horarios, así que no se pierde nada." : ""} />
        <ConfirmarAdmin abierto={!!aDesactivar} onCerrar={() => setADesactivar(null)} titulo={aDesactivar ? "¿Desactivar " + aDesactivar.nombre + "?" : ""} textoAccion="Desactivar"
          texto="Sus planes y clases dejan de estar disponibles para los alumnos. Podés volver a activarlo cuando quieras."
          onConfirmar={() => { const t = aDesactivar; setADesactivar(null); guardar(t, { activo: false }) }} />
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 rounded-2xl border border-border bg-background p-0">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <DialogPrimitive.Title className="text-base font-black uppercase tracking-wide text-foreground">Tipos de clase</DialogPrimitive.Title>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="text-sm leading-snug text-foreground/65">
            Cada plan y cada clase es de un tipo. El alumno puede reservar las clases de los tipos que tiene contratados,
            sin importar el plan que haya comprado dentro de ese tipo.
          </p>

          {tipos === null ? <Cargando filas={2} className="py-2" /> : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {tipos.map((t) => {
                const enUso = t.planes + t.clases + t.horarios > 0
                const modo = editando?.id === t.idTipoClase
                return (
                  <li key={t.idTipoClase} className="flex items-center gap-2 bg-card px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      {modo ? (
                        <input autoFocus value={editando.nombre} maxLength={50} aria-label={`Nombre del tipo ${t.nombre}`}
                          onChange={(e) => setEditando({ id: t.idTipoClase, nombre: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") guardar(t, { nombre: editando.nombre.trim() }); if (e.key === "Escape") setEditando(null) }}
                          className="h-10 w-full rounded-lg border border-lime-500 bg-background/60 px-2 text-sm font-bold text-foreground outline-none" />
                      ) : (
                        <p className={`truncate text-sm font-black uppercase ${t.activo ? "text-foreground" : "text-foreground/45 line-through"}`}>{t.nombre}</p>
                      )}
                      <p className="mt-0.5 text-xs text-foreground/55">
                        {t.planes} {t.planes === 1 ? "plan" : "planes"} · {t.clases} {t.clases === 1 ? "clase" : "clases"} · {t.horarios} {t.horarios === 1 ? "horario" : "horarios"}
                        {!t.activo && " · Desactivado"}
                      </p>
                    </div>
                    {modo ? (
                      <>
                        <button type="button" onClick={() => guardar(t, { nombre: editando.nombre.trim() })} disabled={ocupado} aria-label="Guardar nombre" className={iconBtn}><Check className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setEditando(null)} aria-label="Cancelar" className={iconBtn}><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        {puedeEditar && (
                          <>
                            <button type="button" onClick={() => guardar(t, { activo: !t.activo })} disabled={ocupado}
                              className="min-h-[2.25rem] shrink-0 rounded-lg border border-border px-2.5 text-[0.6875rem] font-black uppercase tracking-wider text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:opacity-40">
                              {t.activo ? "Desactivar" : "Activar"}
                            </button>
                            <button type="button" onClick={() => setEditando({ id: t.idTipoClase, nombre: t.nombre })} aria-label={`Cambiar el nombre de ${t.nombre}`} className={iconBtn}><Pencil className="h-4 w-4" /></button>
                          </>
                        )}
                        {puedeBorrar && !enUso && (
                          <button type="button" onClick={() => setABorrar(t)} aria-label={`Eliminar ${t.nombre}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {puedeCrear && (
            <div>
              <label htmlFor="tc-nuevo" className="mb-1.5 block text-[0.6875rem] font-black uppercase tracking-widest text-foreground/55">Nuevo tipo de clase</label>
              <div className="flex gap-2">
                <input id="tc-nuevo" value={nuevo} maxLength={50} onChange={(e) => { setNuevo(e.target.value); setError("") }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); crear() } }}
                  placeholder="Ej: Funcional, Kids, Yoga" className={campo} />
                <button type="button" onClick={crear} disabled={ocupado || !nuevo.trim()}
                  className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-lime-400 px-3 text-xs font-black uppercase text-black disabled:opacity-40">
                  {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
                </button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
        </div>

        {/* Confirmación de eliminar */}
        <Dialog open={!!aBorrar} onOpenChange={(v) => { if (!v) setABorrar(null) }}>
          <DialogContent aria-describedby={undefined} className="max-w-sm">
            <DialogPrimitive.Title className="text-base font-black uppercase tracking-wide text-foreground">Eliminar tipo de clase</DialogPrimitive.Title>
            <p className="text-sm text-foreground/70">¿Eliminar <strong>{aBorrar?.nombre}</strong>? No tiene planes, clases ni horarios, así que no se pierde nada.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setABorrar(null)} className="min-h-[2.5rem] rounded-lg border border-border px-4 text-xs font-black uppercase tracking-widest text-foreground/70 hover:text-foreground">Cancelar</button>
              <button type="button" onClick={borrar} className="min-h-[2.5rem] rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-xs font-black uppercase tracking-widest text-red-700 hover:bg-red-500/20 dark:text-red-400">Eliminar</button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
