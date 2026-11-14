import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useConfirmar } from "@/components/useConfirmar"
import { Check, Lock, Pencil, Plus, Search, Trash2, Trophy, X } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { EsqueletoAdmin, EstadoVacio } from "@/components/admin/kit"

/*
 * Ejercicios del RM (pantalla 08 de la referencia). Lista de ejercicios del ranking (catálogo general): el administrador
 * agrega y renombra ejercicios; el tipo (peso, repeticiones o tiempo) no se cambia después, y no se puede borrar un
 * ejercicio que ya tiene marcas. Colores de los tokens del tema.
 */

const TIPOS = {
  peso: { nombre: "Peso (kg)", corto: "Peso", aviso: "Gana el que levanta más peso. Los alumnos cargan kilos.", unidad: "kg" },
  repeticiones: { nombre: "Repeticiones", corto: "Repeticiones", aviso: "Gana el que hace más repeticiones. Los alumnos cargan repeticiones.", unidad: "reps" },
  tiempo: { nombre: "Tiempo", corto: "Tiempo", aviso: "Gana el que tarda menos. Los alumnos cargan el tiempo.", unidad: "s" },
}

const TARJETA = { borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)" }
const CAMPO = { width: "100%", boxSizing: "border-box", height: 46, padding: "0px 14px", borderRadius: 10, border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }
const ETIQUETA = { display: "block", marginBottom: 8, font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }
const BOTON_CONTORNO = { display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", cursor: "pointer" }

const formatoMarca = (valor, tipo) => {
  const n = Number(valor)
  if (!Number.isFinite(n)) return "—"
  const texto = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "")
  return `${texto} ${TIPOS[tipo]?.unidad || ""}`.trim()
}

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

  const cantidadPorTipo = (t) => (lista || []).filter((e) => e.tipoMarca === t).length

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
    if (!(await pedirConfirmacion(`¿Eliminar ${ej.nombre}? Deja de aparecer para cargar el RM.`))) return
    try {
      await apiClient.delete(`/marcas/catalogo/${ej.idCatalogo}`)
      toast.success("Ejercicio eliminado", { guardar: false })
      cargar()
    } catch (err) {
      toast.error(mensajeDe(err, "No se pudo eliminar el ejercicio"))
    }
  }

  const chip = (activo) => ({
    height: 40, padding: "0px 14px", borderRadius: 999, whiteSpace: "nowrap", cursor: "pointer",
    border: `1px solid ${activo ? "var(--foreground)" : "var(--sh-control-line)"}`,
    background: activo ? "var(--foreground)" : "transparent",
    color: activo ? "var(--background)" : "var(--foreground)",
    font: "700 13px Archivo",
  })

  return (
    <>
      {dialogoConfirmar}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <TituloPagina descripcion={"Los ejercicios que los alumnos eligen para cargar su RM. Con ellos se arma el ranking del box."}>Ejercicios del RM</TituloPagina>

        {puedeEditar && (
          <section aria-label="Agregar ejercicio" style={{ ...TARJETA, padding: 24 }}>
            <h2 className="bv-admin-titulo" style={{ margin: "0px 0px 18px", font: "800 17px Archivo" }}>Agregar ejercicio</h2>
            <form onSubmit={agregar} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 14 }}>
              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                <label htmlFor="ej-nombre" style={ETIQUETA}>Nombre *</label>
                <input id="ej-nombre" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sentadilla trasera" style={CAMPO} />
              </div>
              <div>
                <span id="ej-tipo-l" style={ETIQUETA}>Se mide en *</span>
                <div role="radiogroup" aria-labelledby="ej-tipo-l" style={{ display: "inline-flex", gap: 2, padding: 4, borderRadius: 10, border: "1px solid var(--sh-control-line)" }}>
                  {Object.entries(TIPOS).map(([k, t]) => (
                    <button key={k} type="button" role="radio" aria-checked={tipo === k} onClick={() => setTipo(k)}
                      style={{ height: 38, padding: "0px 14px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: tipo === k ? "var(--primary)" : "transparent", color: tipo === k ? "var(--primary-foreground)" : "var(--foreground)", font: "700 13px Archivo" }}>
                      {t.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={!nombre.trim() || guardando}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0px 20px", borderRadius: 10, border: "none", background: nombre.trim() && !guardando ? "var(--primary)" : "var(--sh-track-strong)", color: nombre.trim() && !guardando ? "var(--primary-foreground)" : "var(--muted-foreground)", font: "800 13px Archivo", letterSpacing: "0.04em", textTransform: "uppercase", cursor: nombre.trim() && !guardando ? "pointer" : "not-allowed" }}>
                <Plus className="h-4 w-4" aria-hidden="true" /> {guardando ? "Guardando…" : "Agregar"}
              </button>
            </form>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 10, background: "var(--sh-track)", padding: "12px 16px", font: "500 14px Archivo", color: "var(--sh-link)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Trophy className="h-4 w-4" style={{ color: "var(--primary)" }} aria-hidden="true" /> {TIPOS[tipo].aviso}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", font: "600 13px Archivo", color: "var(--muted-foreground)" }}><Lock className="h-3.5 w-3.5" aria-hidden="true" /> No se puede cambiar después</span>
            </div>
          </section>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: "1 1 320px", maxWidth: 560, minWidth: 0 }}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un ejercicio" aria-label="Buscar un ejercicio"
              style={{ ...CAMPO, paddingLeft: 42 }} />
          </div>
          <div role="group" aria-label="Filtrar por tipo" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" aria-pressed={filtroTipo === "todos"} onClick={() => setFiltroTipo("todos")} style={chip(filtroTipo === "todos")}>
              Todos · {(lista || []).length}
            </button>
            {Object.entries(TIPOS).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={filtroTipo === k} onClick={() => setFiltroTipo(k)} style={chip(filtroTipo === k)}>
                {`${t.corto} · ${cantidadPorTipo(k)}`}
              </button>
            ))}
          </div>
          {lista !== null && (
            <span style={{ marginLeft: "auto", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>
              {`${visibles.length} ${visibles.length === 1 ? "ejercicio" : "ejercicios"}`}
            </span>
          )}
        </div>

        <section aria-label="Lista de ejercicios" style={{ ...TARJETA, overflow: "hidden" }}>
          {lista === null ? (
            <EsqueletoAdmin filas={4} />
          ) : visibles.length === 0 ? (
            lista.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Todavía no hay ejercicios"
                texto="Agregá el primero arriba. Los alumnos lo van a ver al cargar su RM."
              />
            ) : (
              <p style={{ margin: 0, padding: 32, textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Ningún ejercicio coincide con la búsqueda.</p>
            )
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {visibles.map((ej) => (
                <li key={ej.idCatalogo} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 18px 16px 22px", borderTop: "1px solid var(--sh-line)" }}>
                  <span style={{ width: 132, flexShrink: 0, padding: "10px 0px", borderRadius: 10, border: "1px solid var(--sh-control-line)", textAlign: "center", font: "700 13px Archivo", color: "var(--foreground)" }}>
                    {TIPOS[ej.tipoMarca]?.nombre || "—"}
                  </span>
                  <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                    {editando?.id === ej.idCatalogo ? (
                      <input autoFocus value={editando.nombre} maxLength={100} aria-label="Nuevo nombre"
                        onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") renombrar(); if (e.key === "Escape") setEditando(null) }}
                        style={{ ...CAMPO, height: 40 }} />
                    ) : (
                      <div style={{ font: "800 16px Archivo", color: "var(--foreground)" }}>{ej.nombre}</div>
                    )}
                    <div style={{ marginTop: 3, font: "500 13px Archivo", color: "var(--muted-foreground)" }}>
                      {`${ej.marcas} ${ej.marcas === 1 ? "marca cargada" : "marcas cargadas"}`}
                      {Number(ej.marcas) > 0 && ` · Mejor marca: ${formatoMarca(ej.mejorValor, ej.tipoMarca)}`}
                    </div>
                  </div>
                  <Link to="/ranking" style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", font: "700 14px Archivo", color: "var(--primary)", textDecoration: "none" }}>
                    Ver ranking <span aria-hidden="true">›</span>
                  </Link>
                  {puedeEditar && (
                    editando?.id === ej.idCatalogo ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={renombrar} aria-label="Guardar nombre" style={{ ...BOTON_CONTORNO, color: "var(--primary)" }}><Check className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" onClick={() => setEditando(null)} aria-label="Cancelar" style={BOTON_CONTORNO}><X className="h-4 w-4" aria-hidden="true" /></button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setEditando({ id: ej.idCatalogo, nombre: ej.nombre })} aria-label={`Cambiar el nombre de ${ej.nombre}`} style={BOTON_CONTORNO}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => borrar(ej)} disabled={ej.marcas > 0} aria-label={`Eliminar ${ej.nombre}`} title={ej.marcas > 0 ? "Ya tiene marcas cargadas: no se puede borrar" : "Eliminar"}
                          style={{ ...BOTON_CONTORNO, color: ej.marcas > 0 ? "var(--muted-foreground)" : "var(--destructive)", opacity: ej.marcas > 0 ? 0.4 : 1, cursor: ej.marcas > 0 ? "not-allowed" : "pointer" }}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
