import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { Check, Copy, Eye, EyeOff, ImagePlus, MoreVertical, Pencil, Plus, Trash2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModalAdmin } from "@/components/ModalAdmin"
import { useAnchoPanel } from "@/lib/useEscritorio"
import apiClient, { enviarFormulario } from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { Cargando } from "@/components/Cargando"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilaNovedad, TarjetaNovedad } from "@/components/Novedades"
import { TIPOS_NOVEDAD, colorDe } from "@/lib/novedades"
import { BotonAdmin, EstadoVacio, TarjetaAdmin } from "@/components/admin/kit"

/*
 * Novedades del box: se cargan con foto y tipo. Tocar una tarjeta abre la ventana para editarla (no cambia de pantalla).
 * Cada novedad se muestra una vez por dispositivo en la portada. Pasada la fecha de vencimiento, o si se oculta, deja de verse.
 */

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGEN = 5 * 1024 * 1024
const inputCls = "w-full rounded-xl border border-border bg-background/60 px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm"
const etiqueta = "mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground"
const VACIO = { idNovedad: null, titulo: "", tipo: "aviso", texto: "", activa: true, hasta: "", imagen: null, archivo: null, quitarImagen: false, enlace: "", enlaceTexto: "", colorFondo: "" }

const fechaDDMM = (v) => { if (!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` }
const fechaCorta = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); if (!y || !m || !d) return ""; return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) }

export default function NovedadesPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [lista, setLista] = useState(null)
  const [filtroNov, setFiltroNov] = useState("todas")
  const [editando, setEditando] = useState(null) // ventana abierta: nueva o existente
  const [guardando, setGuardando] = useState(false)
  const escritorio = useAnchoPanel()

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

  // activaForzada: "Publicar" (true) o "Guardar borrador" (false) en escritorio; sin ella se usa lo que ya tiene la novedad
  const guardar = async (e, activaForzada) => {
    e.preventDefault()
    if (!editando || guardando) return
    setGuardando(true)
    const fd = new FormData()
    fd.append("titulo", editando.titulo)
    fd.append("tipo", editando.tipo)
    fd.append("texto", editando.texto)
    fd.append("activa", String(typeof activaForzada === "boolean" ? activaForzada : editando.activa))
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

  // Duplicar: abre la ventana con los datos de otra novedad, como una nueva en borrador
  const duplicar = (n) => setEditando({
    ...VACIO, titulo: (n.titulo + " (copia)").slice(0, 80), tipo: n.tipo || "aviso", texto: n.texto || "", activa: false,
    enlace: n.enlace || "", enlaceTexto: n.enlaceTexto || "", colorFondo: n.colorFondo || "",
  })

  // "Volver a mostrar" (sin fecha de vencimiento) o "Pasar a borrador", sin abrir la ventana
  const cambiarVisibilidad = async (n, mostrar) => {
    const fd = new FormData()
    fd.append("titulo", n.titulo)
    fd.append("tipo", n.tipo || "aviso")
    fd.append("texto", n.texto || "")
    fd.append("activa", String(mostrar))
    fd.append("hasta", mostrar ? "" : (n.hasta || ""))
    fd.append("enlace", n.enlace || "")
    fd.append("enlaceTexto", n.enlaceTexto || "")
    fd.append("colorFondo", n.colorFondo || "")
    try {
      await enviarFormulario("PUT", `/novedades/${n.idNovedad}`, fd)
      toast.success(mostrar ? "La novedad vuelve a mostrarse" : "La novedad pasó a borrador", { guardar: false })
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo cambiar la novedad"))
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
            <BotonAdmin variante="principal" onClick={() => setEditando({ ...VACIO })} className="ml-auto">
              <Plus className="h-4 w-4" aria-hidden="true" /> NUEVA NOVEDAD
            </BotonAdmin>
          )}
        </div>

        {lista === null ? (
          <Cargando filas={3} />
        ) : lista.length === 0 ? (
          <TarjetaAdmin>
            <EstadoVacio icono={ImagePlus} titulo="Todavía no hay novedades" texto="Los alumnos no están viendo ninguna novedad en su portada. Todas vencieron o están en borrador." />
          </TarjetaAdmin>
        ) : (
          <>
          <div className="hidden xl:block space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Filtrar novedades" className="flex flex-wrap gap-2">
                {[
                  { id: "todas", texto: "Todas", n: lista.length },
                  { id: "visibles", texto: "Visibles", n: lista.filter((x) => x.vigente).length },
                  { id: "borradores", texto: "Borradores", n: lista.filter((x) => !x.activa).length },
                  { id: "vencidas", texto: "Vencidas", n: lista.filter((x) => x.activa && !x.vigente).length },
                ].map((c) => (
                  <button key={c.id} type="button" aria-pressed={filtroNov === c.id} onClick={() => setFiltroNov(c.id)}
                    className={`h-10 rounded-full border px-4 text-[13px] font-bold transition-colors ${filtroNov === c.id ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-foreground/5"}`}>
                    {c.texto} · {c.n}
                  </button>
                ))}
              </div>
            </div>

            {lista.filter((x) => x.vigente).length === 0 && (
              <div role="status" className="flex items-center gap-3 rounded-[10px] border border-yellow-500/40 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-800 dark:text-yellow-400">
                <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                Los alumnos no están viendo ninguna novedad en su portada. Todas vencieron o están en borrador.
              </div>
            )}

            <section aria-label="Lista de novedades" className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="grid grid-cols-[minmax(0,1fr)_260px_170px] gap-4 border-b border-border px-5 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                <span>Novedad</span><span>Estado</span><span />
              </div>
              {(() => {
                const filas = lista.filter((x) => filtroNov === "todas" || (filtroNov === "visibles" && x.vigente) || (filtroNov === "borradores" && !x.activa) || (filtroNov === "vencidas" && x.activa && !x.vigente))
                if (filas.length === 0) return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No hay novedades en este filtro.</p>
                return (
                  <ul className="divide-y divide-border">
                    {filas.map((n) => {
                      const estado = estadoDe(n)
                      const tipoNombre = TIPOS_NOVEDAD[n.tipo]?.nombre || "Aviso"
                      const vencida = n.activa && !n.vigente
                      const color = colorDe(n)
                      return (
                        <li key={n.idNovedad} className="grid grid-cols-[minmax(0,1fr)_260px_170px] items-center gap-4 px-5 py-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-[10px]" style={n.imagen ? undefined : { background: color }}>
                              {n.imagen && <img src={n.imagen} alt="" className="h-full w-full object-cover" />}
                              <span className="absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[.1em] text-white" style={{ background: "rgba(0,0,0,.6)" }}>{tipoNombre}</span>
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-[16px] font-extrabold ${vencida ? "text-muted-foreground" : "text-foreground"}`}>{n.titulo}</p>
                              {n.texto && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{n.texto}</p>}
                              <p className="mt-1 text-[12px] text-muted-foreground">
                                {tipoNombre} · Publicada el {fechaDDMM(n.creadaEn)}{n.enlace ? " · Con botón" : ""}
                              </p>
                            </div>
                          </div>
                          <div>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[.12em] ${estado.clase}`}>{estado.texto}</span>
                            {n.hasta && <p className="mt-1.5 text-[13px] text-muted-foreground">{vencida ? "Venció el" : "Vence el"} {fechaCorta(n.hasta)}</p>}
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            {puedeEditar && (
                              <button type="button" onClick={() => abrirEdicion(n)} className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-border px-4 text-[14px] font-bold text-foreground hover:bg-foreground/5">
                                <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
                              </button>
                            )}
                            {puedeEditar && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button type="button" aria-label={`Más acciones de ${n.titulo}`} className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-border text-foreground hover:bg-foreground/5">
                                    <MoreVertical className="h-[18px] w-[18px]" aria-hidden="true" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[232px] p-1.5" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                                  <DropdownMenuItem onClick={() => duplicar(n)} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold"><Copy className="h-4 w-4" aria-hidden="true" /> Duplicar</DropdownMenuItem>
                                  {n.vigente ? (
                                    <DropdownMenuItem onClick={() => cambiarVisibilidad(n, false)} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold"><EyeOff className="h-4 w-4" aria-hidden="true" /> Pasar a borrador</DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => cambiarVisibilidad(n, true)} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold"><Eye className="h-4 w-4" aria-hidden="true" /> Volver a mostrar</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => borrarDesdeTarjeta(n)} className="min-h-[40px] gap-3 px-3 text-[14px] font-bold" style={{ color: "var(--sh-danger)" }}><Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )
              })()}
            </section>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:hidden">
            {lista.map((n) => {
              const estado = estadoDe(n)
              return (
                <div key={n.idNovedad} className="relative">
                  <TarjetaNovedad novedad={n} onAbrir={puedeEditar ? () => abrirEdicion(n) : undefined} className="h-full" />
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[0.625rem] font-black uppercase tracking-[0.12em] ${estado.clase}`}>{estado.texto}</span>
                    {puedeEditar && (
                      <button type="button" onClick={() => borrarDesdeTarjeta(n)} aria-label={`Eliminar ${n.titulo}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>

      <Dialog open={!!editando && !escritorio} onOpenChange={(o) => { if (!o && !guardando) setEditando(null) }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">{editando?.idNovedad ? "Editar novedad" : "Nueva novedad"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Así la va a ver el alumno en la portada.</DialogDescription>
          </DialogHeader>

          {editando && (
            <form onSubmit={guardar} className="grid gap-6 md:grid-cols-[1fr_17.5rem]">
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
                    <label className="relative h-14 w-14 shrink-0 cursor-pointer rounded-full p-[0.25rem] focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2 focus-within:ring-offset-background"
                      style={{ background: "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}>
                      <span className="block h-full w-full rounded-full ring-2 ring-black/20" style={{ backgroundColor: colorDe(editando).hex }} />
                      <input type="color" aria-label="Elegir el color de la novedad" value={colorDe(editando).hex}
                        onChange={(e) => setEditando({ ...editando, colorFondo: e.target.value })}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    </label>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold uppercase text-foreground">{colorDe(editando).hex}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">Tocá la rueda para elegir cualquier color.</p>
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
                    placeholder="Contá lo que tienen que saber los alumnos" className={`${inputCls} min-h-[6.875rem] py-3 leading-relaxed`} />
                  <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{editando.texto.length}/2000</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_11.25rem]">
                  <div>
                    <label htmlFor="nov-enlace" className={etiqueta}>Enlace (opcional)</label>
                    <input id="nov-enlace" type="text" inputMode="url" value={editando.enlace} maxLength={500}
                      onChange={(e) => setEditando({ ...editando, enlace: e.target.value })}
                      placeholder="https://..." className={`${inputCls} h-12`} />
                    <p className="mt-1 text-[0.6875rem] text-muted-foreground">Aparece como botón en la ventana de la novedad. Los links escritos en el mensaje también se abren al tocarlos.</p>
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
                  <p className="mt-1.5 text-[0.6875rem] text-muted-foreground">JPG, PNG, WEBP o GIF de hasta 5 MB. Si no ponés foto, se usa el color del tipo.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nov-hasta" className={etiqueta}>Mostrar hasta (opcional)</label>
                    <input id="nov-hasta" type="date" value={editando.hasta} onChange={(e) => setEditando({ ...editando, hasta: e.target.value })} className={`${inputCls} h-12`} />
                    <p className="mt-1 text-[0.6875rem] text-muted-foreground">Sin fecha, se ve hasta que la ocultes.</p>
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

      {/* ESCRITORIO: Nueva / Editar novedad como la referencia (formulario a la izquierda, vista previa a la derecha) */}
      {escritorio && (() => {
        const etq = { display: "block", marginBottom: "8px", font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }
        const campoEst = { width: "100%", boxSizing: "border-box", height: "46px", padding: "0px 14px", borderRadius: "10px", border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }
        const pista = { margin: "6px 0 0", font: "500 13px Archivo", color: "var(--muted-foreground)" }
        const SWATCHES = ["#38bdf8", "#9be600", "#22c55e", "#f59e0b", "#f472b6", "#a78bfa", "#f87171", "#e5e7eb"]
        const color = editando ? colorDe(editando) : { hex: "#38bdf8", texto: "#0b0c09" }
        const muestras = SWATCHES.includes(color.hex) ? SWATCHES : [...SWATCHES, color.hex]
        const hoyISO = new Date().toISOString().slice(0, 10)
        const vencio = editando?.hasta && editando.hasta < hoyISO
        const sinTitulo = !editando?.titulo?.trim()
        const sinTexto = !editando?.texto?.trim()
        const tipoNombre = editando ? (TIPOS_NOVEDAD[editando.tipo]?.nombre || "Aviso") : ""
        const publicarYa = editando && (!editando.idNovedad || !editando.activa)
        return (
          <ModalAdmin plano abierto={!!editando} onCerrar={() => { if (!guardando) setEditando(null) }} ancho={1100}>
            {editando && (
              <form onSubmit={(e) => guardar(e, true)} noValidate style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: "1 1 0%" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                  <div style={{ flex: "1 1 0%" }}>
                    <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 20px Archivo" }}>{editando.idNovedad ? "Editar novedad" : "Nueva novedad"}</h2>
                    <p style={{ margin: "4px 0 0", font: "400 14px Archivo", color: "var(--sh-link)" }}>Así la va a ver el alumno en la portada. Los campos con * son obligatorios.</p>
                  </div>
                  <button type="button" onClick={() => { if (!guardando) setEditando(null) }} aria-label="Cerrar" style={{ width: "32px", height: "32px", border: "none", background: "transparent", color: "var(--foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}><X className="h-[18px] w-[18px]" aria-hidden="true" /></button>
                </div>

                <div style={{ flex: "1 1 0%", overflowY: "auto", padding: "24px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "28px", alignItems: "start" }}>
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "22px" }}>
                    {vencio && (
                      <div role="status" style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--sh-warn-bg)", border: "1px solid var(--sh-warn-line)", color: "var(--sh-warn)", font: "600 14px Archivo" }}>
                        Esta novedad venció el {fechaCorta(editando.hasta)}. Cambiá la fecha de "Mostrar hasta" para volver a mostrarla.
                      </div>
                    )}
                    <div>
                      <span style={etq}>Tipo</span>
                      <div role="radiogroup" aria-label="Tipo de novedad" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {Object.entries(TIPOS_NOVEDAD).map(([k, t]) => {
                          const activo = editando.tipo === k
                          return (
                            <button key={k} type="button" role="radio" aria-checked={activo} onClick={() => setEditando({ ...editando, tipo: k })}
                              style={{ display: "inline-flex", alignItems: "center", gap: "7px", height: "40px", padding: "0px 13px", borderRadius: "999px", border: `1px solid ${activo ? "var(--foreground)" : "var(--sh-control-line)"}`, background: activo ? "var(--foreground)" : "transparent", color: activo ? "var(--background)" : "var(--foreground)", font: "700 14px Archivo", cursor: "pointer" }}>
                              <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", background: colorDe({ tipo: k }).hex }} />{t.nombre}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <span style={etq}>Color de la tarjeta</span>
                      <div role="radiogroup" aria-label="Color de la tarjeta" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {muestras.map((hex) => {
                          const elegido = color.hex === hex
                          return (
                            <button key={hex} type="button" role="radio" aria-checked={elegido} aria-label={"Color " + hex} onClick={() => setEditando({ ...editando, colorFondo: hex })}
                              style={{ width: "44px", height: "44px", borderRadius: "50%", background: hex, border: elegido ? "2px solid var(--foreground)" : "2px solid transparent", boxShadow: elegido ? "0 0 0 3px var(--card) inset" : "none", display: "grid", placeItems: "center", cursor: "pointer", color: "#0b0c09" }}>
                              {elegido && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                            </button>
                          )
                        })}
                      </div>
                      <p style={pista}>Cada tipo tiene su color; podés cambiarlo. Si ponés foto, el color no se ve.</p>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <label htmlFor="nov-titulo" style={etq}>Título *</label>
                        <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{editando.titulo.length + "/80"}</span>
                      </div>
                      <input id="nov-titulo" value={editando.titulo} maxLength={80} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} placeholder="Ej: Competencia interna del sábado" style={campoEst} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <label htmlFor="nov-texto" style={etq}>Mensaje *</label>
                        <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{editando.texto.length + "/2000"}</span>
                      </div>
                      <textarea id="nov-texto" value={editando.texto} maxLength={2000} rows={6} onChange={(e) => setEditando({ ...editando, texto: e.target.value })} placeholder="Contá lo que tienen que saber los alumnos"
                        style={{ ...campoEst, height: "auto", padding: "12px 14px", font: "400 15px / 1.6 Archivo", resize: "vertical" }} />
                      <p style={pista}>Los links que escribas en el mensaje se abren al tocarlos.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: "16px" }}>
                      <div>
                        <label htmlFor="nov-enlace" style={etq}>Enlace del botón</label>
                        <input id="nov-enlace" type="text" inputMode="url" value={editando.enlace} maxLength={500} onChange={(e) => setEditando({ ...editando, enlace: e.target.value })} placeholder="https://..." style={campoEst} />
                        <p style={pista}>Opcional. Aparece como botón al abrir la novedad.</p>
                      </div>
                      <div>
                        <label htmlFor="nov-enlace-texto" style={etq}>Texto del botón</label>
                        <input id="nov-enlace-texto" type="text" value={editando.enlaceTexto} maxLength={40} disabled={!editando.enlace.trim()} onChange={(e) => setEditando({ ...editando, enlaceTexto: e.target.value })} placeholder="Ver más" style={{ ...campoEst, opacity: editando.enlace.trim() ? 1 : 0.55 }} />
                        <p style={pista}>Se activa cuando ponés un enlace.</p>
                      </div>
                    </div>

                    <div>
                      <span style={etq}>Foto</span>
                      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", minHeight: "96px", borderRadius: "12px", border: "1px dashed var(--sh-control-line)", cursor: "pointer", textAlign: "center", padding: "12px" }}>
                        <ImagePlus className="h-[18px] w-[18px]" aria-hidden="true" />
                        <span style={{ font: "700 14px Archivo" }}>{editando.previa || editando.imagen ? "Cambiar foto" : "Elegir foto"}</span>
                        <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>Opcional · JPG, PNG, WEBP o GIF de hasta 5 MB</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={elegirFoto} className="sr-only" />
                      </label>
                      {(editando.previa || editando.imagen) && (
                        <button type="button" onClick={quitarFoto} style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", border: "none", background: "transparent", color: "var(--sh-danger)", font: "700 13px Archivo", cursor: "pointer", padding: 0 }}><X className="h-4 w-4" aria-hidden="true" /> Quitar foto</button>
                      )}
                    </div>

                    <div>
                      <label htmlFor="nov-hasta" style={etq}>Mostrar hasta</label>
                      <input id="nov-hasta" type="date" value={editando.hasta} onChange={(e) => setEditando({ ...editando, hasta: e.target.value })} style={{ ...campoEst, width: "320px" }} />
                      <p style={pista}>Opcional. Sin fecha, se ve hasta que la pases a borrador.</p>
                    </div>
                  </div>

                  <aside aria-label="Vista previa" style={{ position: "sticky", top: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                      <span style={{ font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Vista previa</span>
                      <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>Portada del alumno</span>
                    </div>
                    <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)" }}>
                      <div style={{ position: "relative", height: "180px", background: vistaPrevia?.imagen ? "#111" : color.hex }}>
                        {vistaPrevia?.imagen && <img src={vistaPrevia.imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        <span style={{ position: "absolute", top: "14px", left: "14px", padding: "3px 10px", borderRadius: "999px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", font: "800 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase" }}>{tipoNombre}</span>
                      </div>
                      <div style={{ padding: "16px 18px 18px" }}>
                        <div style={{ font: "700 12px Archivo", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>{hoy()}</div>
                        <div style={{ margin: "4px 0 6px", font: "800 26px / 1.1 Archivo", color: sinTitulo ? "var(--muted-foreground)" : "var(--foreground)" }}>{editando.titulo || "Título de la novedad"}</div>
                        <div style={{ font: "400 15px / 1.5 Archivo", color: sinTexto ? "var(--muted-foreground)" : "var(--foreground)" }}>{editando.texto || "Acá va el mensaje para los alumnos."}</div>
                        {editando.enlace.trim() && <div style={{ marginTop: "10px", font: "800 13px Archivo", letterSpacing: "0.08em", textTransform: "uppercase", color: color.hex }}>{(editando.enlaceTexto || "Ver más") + " →"}</div>}
                      </div>
                    </div>
                    <p style={{ margin: "10px 0 0", font: "500 12px Archivo", color: "var(--muted-foreground)" }}>Se ve hasta que la pases a borrador.</p>
                  </aside>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
                  {editando.idNovedad && (
                    <button type="button" onClick={borrar} style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "48px", padding: "0px 14px", borderRadius: "10px", border: "none", background: "transparent", color: "var(--sh-danger)", font: "700 14px Archivo", cursor: "pointer" }}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
                    </button>
                  )}
                  <span style={{ flex: "1 1 0%" }} />
                  <button type="button" onClick={() => setEditando(null)} disabled={guardando} style={{ height: "48px", padding: "0px 18px", borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer" }}>Cancelar</button>
                  <button type="button" onClick={(e) => guardar(e, false)} disabled={guardando || sinTitulo || sinTexto} style={{ height: "48px", padding: "0px 18px", borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer", opacity: sinTitulo || sinTexto ? 0.5 : 1 }}>Guardar borrador</button>
                  <button type="submit" disabled={guardando || sinTitulo || sinTexto} style={{ height: "48px", padding: "0px 28px", borderRadius: "10px", border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 14px Archivo", letterSpacing: "0.04em", cursor: "pointer", opacity: sinTitulo || sinTexto ? 0.5 : 1 }}>
                    {guardando ? "GUARDANDO…" : publicarYa ? "PUBLICAR" : "GUARDAR CAMBIOS"}
                  </button>
                </div>
              </form>
            )}
          </ModalAdmin>
        )
      })()}
    </>
  )
}
