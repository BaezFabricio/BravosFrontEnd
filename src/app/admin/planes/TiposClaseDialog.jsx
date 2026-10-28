import { useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { Cargando } from "@/components/Cargando"

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
                              className="min-h-[36px] shrink-0 rounded-lg border border-border px-2.5 text-[11px] font-black uppercase tracking-wider text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:opacity-40">
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
              <label htmlFor="tc-nuevo" className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-foreground/55">Nuevo tipo de clase</label>
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
              <button type="button" onClick={() => setABorrar(null)} className="min-h-[40px] rounded-lg border border-border px-4 text-xs font-black uppercase tracking-widest text-foreground/70 hover:text-foreground">Cancelar</button>
              <button type="button" onClick={borrar} className="min-h-[40px] rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-xs font-black uppercase tracking-widest text-red-700 hover:bg-red-500/20 dark:text-red-400">Eliminar</button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
