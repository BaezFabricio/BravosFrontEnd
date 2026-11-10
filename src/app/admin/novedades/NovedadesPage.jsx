import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { ImagePlus, Plus, Trash2, X } from "lucide-react"
import apiClient, { enviarFormulario } from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { Cargando } from "@/components/Cargando"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilaNovedad, TarjetaNovedad } from "@/components/Novedades"
import { TIPOS_NOVEDAD, colorDe } from "@/lib/novedades"

/*
 * Novedades del box: se cargan con foto y tipo. Tocar una tarjeta abre la ventana para editarla (no cambia de pantalla).
 * Cada novedad se muestra una vez por dispositivo en la portada. Pasada la fecha de vencimiento, o si se oculta, deja de verse.
 */

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGEN = 5 * 1024 * 1024
const inputCls = "w-full rounded-xl border border-border bg-background/60 px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm"
const etiqueta = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
const VACIO = { idNovedad: null, titulo: "", tipo: "aviso", texto: "", activa: true, hasta: "", imagen: null, archivo: null, quitarImagen: false, enlace: "", enlaceTexto: "", colorFondo: "" }

export default function NovedadesPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [lista, setLista] = useState(null)
  const [editando, setEditando] = useState(null) // ventana abierta: nueva o existente
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    apiClient.get("/novedades")
      .then((r) => setLista(r.data?.data || r.data || []))
      .catch(() => { setLista([]); toast.error("No se pudieron cargar las novedades") })
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const mensajeDe = (err, defecto) => err.response?.data?.message || err.message || defecto

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ""
    if (!archivo) return
    if (!TIPOS_IMAGEN.includes(archivo.type)) return toast.error("La foto tiene que ser JPG, PNG, WEBP o GIF")
    if (archivo.size > MAX_IMAGEN) return toast.error("La foto pesa más de 5 MB")
    // La vista previa es un enlace temporal del navegador: se libera al cambiar la foto
    if (editando?.previa) URL.revokeObjectURL(editando.previa)
    setEditando((prev) => ({ ...prev, archivo, previa: URL.createObjectURL(archivo), quitarImagen: false }))
  }

  const quitarFoto = () => {
    if (editando?.previa) URL.revokeObjectURL(editando.previa)
    setEditando((prev) => ({ ...prev, archivo: null, previa: null, imagen: null, quitarImagen: true }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!editando || guardando) return
    setGuardando(true)
    const fd = new FormData()
    fd.append("titulo", editando.titulo)
    fd.append("tipo", editando.tipo)
    fd.append("texto", editando.texto)
    fd.append("activa", String(editando.activa))
    fd.append("hasta", editando.hasta || "")
    fd.append("enlace", editando.enlace || "")
    fd.append("enlaceTexto", editando.enlaceTexto || "")
    fd.append("colorFondo", editando.colorFondo || "")
    if (editando.archivo) fd.append("imagen", editando.archivo)
    else if (editando.quitarImagen) fd.append("quitarImagen", "true")
    try {
      if (editando.idNovedad) await enviarFormulario("PUT", `/novedades/${editando.idNovedad}`, fd)
      else await enviarFormulario("POST", "/novedades", fd)
      toast.success(editando.idNovedad ? "Novedad actualizada" : "Novedad publicada", { guardar: false })
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo guardar la novedad"))
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async () => {
    if (!editando?.idNovedad) return
    if (!(await pedirConfirmacion(`¿Eliminar la novedad "${editando.titulo}"? Ya no se va a ver en la portada.`))) return
    try {
      await apiClient.delete(`/novedades/${editando.idNovedad}`)
      toast.success("Novedad eliminada", { guardar: false })
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo eliminar la novedad"))
    }
  }

  const borrarDesdeTarjeta = async (n) => {
    if (!(await pedirConfirmacion(`¿Eliminar la novedad "${n.titulo}"? Ya no se va a ver en la portada.`))) return
    try {
      await apiClient.delete(`/novedades/${n.idNovedad}`)
      toast.success("Novedad eliminada", { guardar: false })
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo eliminar la novedad"))
    }
  }

  const abrirEdicion = (n) => setEditando({
    idNovedad: n.idNovedad, titulo: n.titulo, tipo: n.tipo || "aviso", texto: n.texto,
    activa: n.activa, hasta: n.hasta || "", imagen: n.imagen || null, archivo: null, quitarImagen: false,
    enlace: n.enlace || "", enlaceTexto: n.enlaceTexto || "",
    colorFondo: n.colorFondo || "",
  })

  // Lo que se ve en la vista previa mientras se escribe: la misma fila y el mismo detalle que ve el alumno
  const hoy = () => {
    const d = new Date()
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  }
  const vistaPrevia = editando && {
    titulo: editando.titulo || "Título de la novedad",
    tipo: editando.tipo,
    colorFondo: editando.colorFondo,
    texto: editando.texto || "Acá va el mensaje que van a ver los alumnos.",
    imagen: editando.previa || editando.imagen,
    fecha: hoy(),
    hasta: editando.hasta,
    enlace: editando.enlace.trim(),
    enlaceTexto: editando.enlaceTexto,
  }

  const estadoDe = (n) => (n.vigente ? { texto: "Visible", clase: "bg-lime-400 text-black" } : n.activa ? { texto: "Vencida", clase: "bg-zinc-600 text-white" } : { texto: "Oculta", clase: "bg-zinc-800 text-white" })

  return (
    <>
      {dialogoConfirmar}
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <TituloPagina descripcion={"Comunicados, eventos y promos que se ven en la portada de los alumnos con sesión iniciada."}>Novedades</TituloPagina>
          {puedeEditar && (
            <button type="button" onClick={() => setEditando({ ...VACIO })}
              className="ml-auto flex min-h-[44px] items-center gap-2 rounded-full bg-lime-400 px-5 text-xs font-black uppercase tracking-widest text-black hover:bg-lime-300 md:rounded-xl">
              <Plus className="h-4 w-4" aria-hidden="true" /> Nueva novedad
            </button>
          )}
        </div>

        {lista === null ? (
          <Cargando filas={3} />
        ) : lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Todavía no hay novedades. Creá la primera con el botón de arriba.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((n) => {
              const estado = estadoDe(n)
              return (
                <div key={n.idNovedad} className="relative">
                  <TarjetaNovedad novedad={n} onAbrir={puedeEditar ? () => abrirEdicion(n) : undefined} className="h-full" />
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${estado.clase}`}>{estado.texto}</span>
                    {puedeEditar && (
                      <button type="button" onClick={() => borrarDesdeTarjeta(n)} aria-label={`Eliminar ${n.titulo}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => { if (!o && !guardando) setEditando(null) }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">{editando?.idNovedad ? "Editar novedad" : "Nueva novedad"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Así la va a ver el alumno en la portada.</DialogDescription>
          </DialogHeader>

          {editando && (
            <form onSubmit={guardar} className="grid gap-6 md:grid-cols-[1fr_280px]">
              <div className="space-y-5">
                <div>
                  <span className={etiqueta}>Tipo</span>
                  <div role="radiogroup" aria-label="Tipo de novedad" className="flex flex-wrap gap-2">
                    {Object.entries(TIPOS_NOVEDAD).map(([k, t]) => (
                      <button key={k} type="button" role="radio" aria-checked={editando.tipo === k}
                        onClick={() => setEditando({ ...editando, tipo: k })}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.1em] transition-all ${editando.tipo === k ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"}`}>
                        {t.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className={etiqueta}>Color</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="relative h-14 w-14 shrink-0 cursor-pointer rounded-full p-[4px] focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2 focus-within:ring-offset-background"
                      style={{ background: "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}>
                      <span className="block h-full w-full rounded-full ring-2 ring-black/20" style={{ backgroundColor: colorDe(editando).hex }} />
                      <input type="color" aria-label="Elegir el color de la novedad" value={colorDe(editando).hex}
                        onChange={(e) => setEditando({ ...editando, colorFondo: e.target.value })}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    </label>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold uppercase text-foreground">{colorDe(editando).hex}</p>
                      <p className="text-[11px] text-muted-foreground">Tocá la rueda para elegir cualquier color.</p>
                      {editando.colorFondo && (
                        <button type="button" onClick={() => setEditando({ ...editando, colorFondo: "" })}
                          className="mt-1 text-xs font-bold text-foreground underline underline-offset-4">Usar el color del tipo</button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="nov-titulo" className={etiqueta}>Título</label>
                  <input id="nov-titulo" value={editando.titulo} maxLength={120} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                    placeholder="Ej: Competencia interna de sábado" className={`${inputCls} h-12 font-bold`} />
                </div>

                <div>
                  <label htmlFor="nov-texto" className={etiqueta}>Mensaje</label>
                  <textarea id="nov-texto" value={editando.texto} maxLength={2000} rows={4} onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
                    placeholder="Contá lo que tienen que saber los alumnos" className={`${inputCls} min-h-[110px] py-3 leading-relaxed`} />
                  <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{editando.texto.length}/2000</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <div>
                    <label htmlFor="nov-enlace" className={etiqueta}>Enlace (opcional)</label>
                    <input id="nov-enlace" type="text" inputMode="url" value={editando.enlace} maxLength={500}
                      onChange={(e) => setEditando({ ...editando, enlace: e.target.value })}
                      placeholder="https://..." className={`${inputCls} h-12`} />
                    <p className="mt-1 text-[11px] text-muted-foreground">Aparece como botón en la ventana de la novedad. Los links escritos en el mensaje también se abren al tocarlos.</p>
                  </div>
                  <div>
                    <label htmlFor="nov-enlace-texto" className={etiqueta}>Texto del botón</label>
                    <input id="nov-enlace-texto" type="text" value={editando.enlaceTexto} maxLength={40} disabled={!editando.enlace.trim()}
                      onChange={(e) => setEditando({ ...editando, enlaceTexto: e.target.value })}
                      placeholder="Ver más" className={`${inputCls} h-12 disabled:opacity-40`} />
                  </div>
                </div>

                <div>
                  <span className={etiqueta}>Foto (opcional)</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm font-bold text-foreground hover:bg-foreground/5">
                      <ImagePlus className="h-4 w-4" aria-hidden="true" /> {editando.previa || editando.imagen ? "Cambiar foto" : "Elegir foto"}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={elegirFoto} className="sr-only" />
                    </label>
                    {(editando.previa || editando.imagen) && (
                      <button type="button" onClick={quitarFoto} className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-red-600 hover:bg-red-500/10">
                        <X className="h-4 w-4" aria-hidden="true" /> Quitar foto
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">JPG, PNG, WEBP o GIF de hasta 5 MB. Si no ponés foto, se usa el color del tipo.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nov-hasta" className={etiqueta}>Mostrar hasta (opcional)</label>
                    <input id="nov-hasta" type="date" value={editando.hasta} onChange={(e) => setEditando({ ...editando, hasta: e.target.value })} className={`${inputCls} h-12`} />
                    <p className="mt-1 text-[11px] text-muted-foreground">Sin fecha, se ve hasta que la ocultes.</p>
                  </div>
                  <label className="flex items-center gap-3 self-end pb-2 text-sm font-bold text-foreground">
                    <input type="checkbox" checked={editando.activa} onChange={(e) => setEditando({ ...editando, activa: e.target.checked })} className="h-5 w-5 accent-lime-400" />
                    Publicada (visible para los alumnos)
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5">
                  {editando.idNovedad ? (
                    <button type="button" onClick={borrar} className="flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-bold text-red-600 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
                    </button>
                  ) : <span />}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditando(null)} disabled={guardando}
                      className="flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-bold text-foreground hover:bg-foreground/5">
                      Cancelar
                    </button>
                    <button type="submit" disabled={guardando || !editando.titulo.trim() || !editando.texto.trim()}
                      className="flex h-12 items-center justify-center rounded-xl bg-lime-400 px-6 text-sm font-black uppercase tracking-wide text-black hover:bg-lime-300 disabled:opacity-40">
                      {guardando ? "Guardando…" : editando.idNovedad ? "Guardar cambios" : "Publicar"}
                    </button>
                  </div>
                </div>
              </div>

              <aside className="hidden md:block">
                <p className={etiqueta}>Así se ve en la portada</p>
                {vistaPrevia && (
                  <ul className="pointer-events-none rounded-2xl bg-zinc-950 px-4 text-white">
                    <li><FilaNovedad novedad={vistaPrevia} onAbrir={() => {}} /></li>
                  </ul>
                )}
              </aside>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
