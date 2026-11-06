import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { Pencil, Plus, Trash2 } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { Card } from "@/components/ui/card"
import { TituloPagina } from "@/components/TituloPagina"
import { Cargando } from "@/components/Cargando"

/*
 * Novedades del box: comunicados y eventos que se muestran en la portada a quienes tienen sesión iniciada.
 * Cada novedad se muestra una vez por dispositivo. Pasada la fecha de vencimiento (o si se desactiva), deja de mostrarse.
 */

const inputCls = "w-full rounded-xl border border-border bg-background/60 px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm"
const etiqueta = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
const VACIO = { idNovedad: null, titulo: "", texto: "", activa: true, hasta: "" }

export default function NovedadesPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [lista, setLista] = useState(null)
  const [editando, setEditando] = useState(null) // formulario abierto (nueva o existente)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    apiClient.get("/novedades")
      .then((r) => setLista(r.data?.data || r.data || []))
      .catch(() => { setLista([]); toast.error("No se pudieron cargar las novedades") })
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const mensajeDe = (err, defecto) => err.response?.data?.message || defecto

  const guardar = async (e) => {
    e.preventDefault()
    if (!editando || guardando) return
    setGuardando(true)
    const cuerpo = { titulo: editando.titulo, texto: editando.texto, activa: editando.activa, hasta: editando.hasta || null }
    try {
      if (editando.idNovedad) await apiClient.put(`/novedades/${editando.idNovedad}`, cuerpo)
      else await apiClient.post("/novedades", cuerpo)
      toast.success(editando.idNovedad ? "Novedad actualizada" : "Novedad publicada", { guardar: false })
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo guardar la novedad"))
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (n) => {
    if (!(await pedirConfirmacion(`¿Eliminar la novedad "${n.titulo}"?`))) return
    try {
      await apiClient.delete(`/novedades/${n.idNovedad}`)
      toast.success("Novedad eliminada", { guardar: false })
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo eliminar la novedad"))
    }
  }

  return (
    <>
      {dialogoConfirmar}
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TituloPagina descripcion={"Comunicados y eventos que se muestran en la portada a los alumnos con sesión iniciada."}>Novedades</TituloPagina>
        {puedeEditar && !editando && (
          <button type="button" onClick={() => setEditando({ ...VACIO })}
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-lime-400 px-4 text-xs font-black uppercase tracking-widest text-black hover:bg-lime-300 md:rounded-xl">
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva novedad
          </button>
        )}
      </div>

      {editando && (
        <Card className="gap-4 rounded-2xl border-border bg-card p-5">
          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label htmlFor="nov-titulo" className={etiqueta}>Título</label>
              <input id="nov-titulo" value={editando.titulo} maxLength={120} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                placeholder="Ej: Horarios de feriado" className={`${inputCls} h-12 font-bold`} />
            </div>
            <div>
              <label htmlFor="nov-texto" className={etiqueta}>Mensaje</label>
              <textarea id="nov-texto" value={editando.texto} maxLength={2000} rows={5} onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
                placeholder="Escribí la novedad que van a ver los alumnos" className={`${inputCls} min-h-[120px] py-3 leading-relaxed`} />
              <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{editando.texto.length}/2000</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nov-hasta" className={etiqueta}>Mostrar hasta (opcional)</label>
                <input id="nov-hasta" type="date" value={editando.hasta} onChange={(e) => setEditando({ ...editando, hasta: e.target.value })} className={`${inputCls} h-12`} />
                <p className="mt-1 text-[11px] text-muted-foreground">Si no ponés fecha, se muestra hasta que la desactives.</p>
              </div>
              <label className="flex items-center gap-3 self-end pb-2 text-sm font-bold text-foreground">
                <input type="checkbox" checked={editando.activa} onChange={(e) => setEditando({ ...editando, activa: e.target.checked })}
                  className="h-5 w-5 accent-lime-400" />
                Publicada (visible para los alumnos)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={guardando || !editando.titulo.trim() || !editando.texto.trim()}
                className="flex h-12 items-center justify-center rounded-xl bg-lime-400 px-6 text-sm font-black uppercase tracking-wide text-black hover:bg-lime-300 disabled:opacity-40">
                {guardando ? "Guardando…" : editando.idNovedad ? "Guardar cambios" : "Publicar"}
              </button>
              <button type="button" onClick={() => setEditando(null)} className="flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-bold text-foreground hover:bg-foreground/5">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="gap-0 overflow-hidden rounded-2xl border-border bg-card py-0">
        {lista === null ? (
          <div className="p-4"><Cargando filas={3} /></div>
        ) : lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Todavía no hay novedades.</p>
        ) : (
          <ul>
            {lista.map((n) => (
              <li key={n.idNovedad} className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{n.titulo}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.texto}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.06em]">
                    {n.vigente
                      ? <span className="text-lime-700 dark:text-lime-400">Visible en la portada{n.hasta ? ` hasta el ${n.hasta}` : ""}</span>
                      : <span className="text-muted-foreground">{n.activa ? "Vencida" : "Oculta"}</span>}
                  </p>
                </div>
                {puedeEditar && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setEditando({ idNovedad: n.idNovedad, titulo: n.titulo, texto: n.texto, activa: n.activa, hasta: n.hasta || "" })}
                      aria-label={`Editar ${n.titulo}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/10 hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => borrar(n)} aria-label={`Eliminar ${n.titulo}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-red-500/10 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
    </>
  )
}
