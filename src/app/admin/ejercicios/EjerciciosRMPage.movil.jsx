import { useCallback, useEffect, useMemo, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { Card } from "@/components/ui/card"
import { TituloPagina } from "@/components/TituloPagina"
import { Cargando } from "@/components/Cargando"

/*
 * Lista de ejercicios del RM y del ranking (catálogo general). El administrador agrega y renombra ejercicios;
 * el tipo (peso, repeticiones o tiempo) no se cambia después, y no se puede borrar un ejercicio que ya tiene marcas.
 */

const TIPOS = {
  peso: { nombre: "Peso (kg)", detalle: "Gana el que levanta más" },
  repeticiones: { nombre: "Repeticiones", detalle: "Gana el que hace más" },
  tiempo: { nombre: "Tiempo", detalle: "Gana el que tarda menos" },
}

const inputCls = "h-11 w-full rounded-xl border border-border bg-background/60 px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm"

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
    if (!(await pedirConfirmacion(`¿Eliminar "${ej.nombre}" de la lista?`))) return
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
    <div className="space-y-4">
      <TituloPagina descripcion={"Los ejercicios que los alumnos eligen para cargar su RM. Con ellos se arma el ranking del box."}>Ejercicios del RM</TituloPagina>

      {puedeEditar && (
        <Card className="gap-3 rounded-2xl border-border bg-card p-4">
          <form onSubmit={agregar} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12.5rem_auto] sm:items-end">
            <div>
              <label htmlFor="ej-nombre" className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Nuevo ejercicio</label>
              <input id="ej-nombre" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sentadilla trasera" className={inputCls} />
            </div>
            <div>
              <label htmlFor="ej-tipo" className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Se mide en</label>
              <select id="ej-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
                {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}
              </select>
            </div>
            <button type="submit" disabled={!nombre.trim() || guardando}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 text-sm font-black uppercase tracking-wide text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40">
              <Plus className="h-4 w-4" aria-hidden="true" /> Agregar
            </button>
          </form>
          <p className="text-xs text-muted-foreground">{TIPOS[tipo].detalle}. El tipo no se puede cambiar después.</p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_16.25rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un ejercicio" aria-label="Buscar ejercicio" className={`${inputCls} h-12 pl-10`} />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo" className={`${inputCls} h-12 font-bold`}>
          <option value="todos">Todos los tipos</option>
          {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}
        </select>
      </div>

      <Card className="gap-0 overflow-hidden rounded-2xl border-border bg-card py-0">
        {lista === null ? (
          <div className="p-4"><Cargando filas={4} /></div>
        ) : visibles.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{lista.length === 0 ? "Todavía no hay ejercicios cargados." : "Ningún ejercicio coincide con la búsqueda."}</p>
        ) : (
          <ul>
            {visibles.map((ej) => (
              <li key={ej.idCatalogo} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  {editando?.id === ej.idCatalogo ? (
                    <input autoFocus value={editando.nombre} maxLength={100} aria-label="Nombre del ejercicio"
                      onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") renombrar(); if (e.key === "Escape") setEditando(null) }}
                      className={`${inputCls} h-10`} />
                  ) : (
                    <p className="truncate text-sm font-bold text-foreground">{ej.nombre}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{TIPOS[ej.tipoMarca]?.nombre} · {ej.marcas} {ej.marcas === 1 ? "marca cargada" : "marcas cargadas"}</p>
                </div>
                {puedeEditar && (
                  <div className="flex shrink-0 items-center gap-1">
                    {editando?.id === ej.idCatalogo ? (
                      <>
                        <button type="button" onClick={renombrar} aria-label="Guardar nombre" className="flex h-9 w-9 items-center justify-center rounded-lg text-lime-700 hover:bg-lime-400/15 dark:text-lime-400"><Check className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setEditando(null)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/10"><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setEditando({ id: ej.idCatalogo, nombre: ej.nombre })} aria-label={`Cambiar el nombre de ${ej.nombre}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/10 hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => borrar(ej)} disabled={ej.marcas > 0} aria-label={`Eliminar ${ej.nombre}`} title={ej.marcas > 0 ? "Ya tiene marcas cargadas: no se puede borrar" : "Eliminar"}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground/60"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
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
