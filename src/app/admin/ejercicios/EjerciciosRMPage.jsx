import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useConfirmar } from "@/components/useConfirmar"
import { Check, Dumbbell, Pencil, Plus, Search, Trash2, Trophy, X } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { BotonAdmin, EsqueletoAdmin, EstadoVacio, TarjetaAdmin } from "@/components/admin/kit"

/*
 * Lista de ejercicios del RM y del ranking (catálogo general). El administrador agrega y renombra ejercicios;
 * el tipo (peso, repeticiones o tiempo) no se cambia después, y no se puede borrar un ejercicio que ya tiene marcas.
 */

const TIPOS = {
  peso: { nombre: "Peso (kg)", detalle: "Gana el que levanta más" },
  repeticiones: { nombre: "Repeticiones", detalle: "Gana el que hace más" },
  tiempo: { nombre: "Tiempo", detalle: "Gana el que tarda menos" },
}

const inputCls = "h-12 w-full rounded-[10px] border border-border bg-background px-3.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
const etiquetaCls = "mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground"

export default function EjerciciosRMPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [lista, setLista] = useState(null)
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState("peso")
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(null) // { id, nombre }
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")

  const cargar = useCallback(() => {
    apiClient.get("/marcas/catalogo")
      .then((r) => setLista(r.data?.data || r.data || []))
      .catch(() => { setLista([]); toast.error("No se pudo cargar la lista de ejercicios") })
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return (lista || []).filter((e) => (!q || e.nombre.toLowerCase().includes(q)) && (filtroTipo === "todos" || e.tipoMarca === filtroTipo))
  }, [lista, busqueda, filtroTipo])

  const mensajeDe = (err, defecto) => err.response?.data?.message || defecto

  const agregar = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || guardando) return
    setGuardando(true)
    try {
      await apiClient.post("/marcas/catalogo", { nombre, tipoMarca: tipo })
      toast.success("Ejercicio agregado", { guardar: false })
      setNombre("")
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo agregar el ejercicio"))
    } finally {
      setGuardando(false)
    }
  }

  const renombrar = async () => {
    if (!editando?.nombre.trim()) return
    try {
      await apiClient.put(`/marcas/catalogo/${editando.id}`, { nombre: editando.nombre })
      toast.success("Nombre actualizado", { guardar: false })
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo cambiar el nombre"))
    }
  }

  const borrar = async (ej) => {
    if (!(await pedirConfirmacion(`¿Eliminar "${ej.nombre}"? Deja de aparecer para cargar el RM.`))) return
    try {
      await apiClient.delete(`/marcas/catalogo/${ej.idCatalogo}`)
      toast.success("Ejercicio eliminado", { guardar: false })
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo eliminar el ejercicio"))
    }
  }

  return (
    <>
      {dialogoConfirmar}
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <TituloPagina descripcion={"Los ejercicios que los alumnos eligen para cargar su RM. Con ellos se arma el ranking del box."}>Ejercicios del RM</TituloPagina>
          <Link to="/ranking" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border px-4 text-[13px] font-bold text-foreground no-underline hover:bg-[rgba(128,128,128,.14)]"><Trophy className="h-4 w-4" aria-hidden="true" /> Ver ranking</Link>
        </div>

        {puedeEditar && (
          <TarjetaAdmin className="p-5">
            <h2 className="mb-4 text-[17px] font-extrabold text-foreground">Agregar ejercicio</h2>
            <form onSubmit={agregar} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end">
              <div>
                <label htmlFor="ej-nombre" className={etiquetaCls}>Nombre *</label>
                <input id="ej-nombre" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sentadilla trasera" className={inputCls} />
              </div>
              <div>
                <label htmlFor="ej-tipo" className={etiquetaCls}>Se mide en *</label>
                <select id="ej-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
                  {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}
                </select>
              </div>
              <BotonAdmin variante="principal" type="submit" disabled={!nombre.trim() || guardando} className="h-12">
                <Plus className="h-4 w-4" aria-hidden="true" /> {guardando ? "GUARDANDO…" : "GUARDAR"}
              </BotonAdmin>
            </form>
            <p className="mt-2 text-[13px] text-muted-foreground">{TIPOS[tipo].detalle}. No se puede cambiar después.</p>
          </TarjetaAdmin>
        )}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_16.25rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un ejercicio" aria-label="Buscar un ejercicio" className={`${inputCls} pl-10`} />
          </div>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo" className={`${inputCls} font-bold`}>
            <option value="todos">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}
          </select>
        </div>

        <TarjetaAdmin>
          {lista === null ? (
            <EsqueletoAdmin filas={4} />
          ) : visibles.length === 0 ? (
            lista.length === 0 ? (
              <EstadoVacio
                icono={Dumbbell}
                titulo="Todavía no hay ejercicios"
                texto="Agregá el primero arriba. Los alumnos lo van a ver al cargar su RM."
              />
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">Ningún ejercicio coincide con la búsqueda.</p>
            )
          ) : (
            <ul className="divide-y divide-border">
              {visibles.map((ej) => (
                <li key={ej.idCatalogo} className="flex min-h-[64px] items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    {editando?.id === ej.idCatalogo ? (
                      <input autoFocus value={editando.nombre} maxLength={100} aria-label="Nuevo nombre"
                        onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") renombrar(); if (e.key === "Escape") setEditando(null) }}
                        className={`${inputCls} h-11`} />
                    ) : (
                      <p className="truncate text-[15px] font-bold text-foreground">{ej.nombre}</p>
                    )}
                    <p className="text-[13px] text-muted-foreground">{TIPOS[ej.tipoMarca]?.nombre} · {ej.marcas} {ej.marcas === 1 ? "marca cargada" : "marcas cargadas"}</p>
                  </div>
                  {puedeEditar && (
                    <div className="flex shrink-0 items-center gap-1">
                      {editando?.id === ej.idCatalogo ? (
                        <>
                          <button type="button" onClick={renombrar} aria-label="Guardar nombre" className="grid h-11 w-11 place-items-center rounded-[10px] text-lime-700 hover:bg-lime-400/15 dark:text-lime-400"><Check className="h-4 w-4" aria-hidden="true" /></button>
                          <button type="button" onClick={() => setEditando(null)} aria-label="Cancelar" className="grid h-11 w-11 place-items-center rounded-[10px] text-muted-foreground hover:bg-[rgba(128,128,128,.14)]"><X className="h-4 w-4" aria-hidden="true" /></button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => setEditando({ id: ej.idCatalogo, nombre: ej.nombre })} aria-label={`Cambiar el nombre de ${ej.nombre}`} className="grid h-11 w-11 place-items-center rounded-[10px] text-muted-foreground hover:bg-[rgba(128,128,128,.14)] hover:text-foreground"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                          <button type="button" onClick={() => borrar(ej)} disabled={ej.marcas > 0} aria-label={`Eliminar ${ej.nombre}`} title={ej.marcas > 0 ? "Ya tiene marcas cargadas: no se puede borrar" : "Eliminar"}
                            className="grid h-11 w-11 place-items-center rounded-[10px] text-muted-foreground hover:bg-red-500/10 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:text-[#ff8a80]"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TarjetaAdmin>
      </div>
    </>
  )
}
