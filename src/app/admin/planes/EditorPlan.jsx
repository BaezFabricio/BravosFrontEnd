import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Check, Pencil, Plus, Trash2, X, Settings2, DollarSign, CalendarDays, ListChecks, Eye, Loader2, Clock, Users } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import apiClient from "@/api"
import { featuresDelPlan, partesDescripcion, armarDescripcion, MAX_CONDICIONES } from "@/lib/planes"
import { Cargando } from '@/components/Cargando'

/**
 * Crear o editar un plan: hoja a pantalla completa en el celular, ventana grande en la computadora.
 * Secciones: datos del plan, precio y créditos, clases del plan, condiciones que ve el alumno
 * y una vista previa idéntica a la pantalla de membresías del alumno.
 */
const DIAS_CORTOS = { LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié", JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb", DOMINGO: "Dom" }

function hoyTxt() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function EditorPlan({ open, plan, tipos, onClose, onGuardar, guardando, puedeVerClases, puedeCrearClases }) {
  // Arranca con los datos del plan (o vacío si es nuevo). La página le cambia la "key" en cada apertura.
  const partesIniciales = partesDescripcion(plan?.descripcion)
  const [nombre, setNombre] = useState(plan?.nombre || "")
  const [tipo, setTipo] = useState(plan?.tipo || "")
  const [corta, setCorta] = useState(partesIniciales.corta)
  const [precio, setPrecio] = useState(plan ? String(Number(plan.precio)) : "")
  const [creditos, setCreditos] = useState(plan ? String(plan.cantidadCreditos) : "")
  const [condiciones, setCondiciones] = useState(partesIniciales.condiciones)
  const [nueva, setNueva] = useState("")
  const [editando, setEditando] = useState(null) // índice de la condición que se está editando
  const [errores, setErrores] = useState({})
  const [clases, setClases] = useState(null)

  // Clases del plan: solo si el perfil puede ver clases (si no, la sección no aparece)
  useEffect(() => {
    if (plan?.idPlan && puedeVerClases) {
      apiClient.get("/clases")
        .then((r) => {
          const hoy = hoyTxt()
          const todas = r.data?.data || r.data || []
          setClases(todas.filter((c) => c.tipoPlan === plan.tipo && !(c.fechaEspecifica && c.fechaEspecifica.split("T")[0] < hoy)))
        })
        .catch(() => setClases([]))
    }
  }, [plan, puedeVerClases])

  // Se ofrecen los tipos activos; un plan que ya tiene un tipo desactivado lo conserva en la lista
  const opcionesTipo = (tipos || []).filter((t) => t.activo || t.codigo === plan?.tipo)
  const cambiaTipo = !!plan && !!tipo && tipo !== plan.tipo
  const alumnosConPlan = Number(plan?.alumnosActivos) || 0

  const descripcion = armarDescripcion(corta, condiciones)
  const vistaPrevia = { nombre: nombre || "Nombre del plan", precio: Number(precio) || 0, cantidadCreditos: Number(creditos) || 0, descripcion }

  const agregarCondicion = () => {
    const t = nueva.trim()
    if (!t || condiciones.length >= MAX_CONDICIONES) return
    setCondiciones((c) => [...c, t]); setNueva("")
  }

  const guardar = () => {
    const e = {}
    if (!nombre.trim()) e.nombre = "Poné el nombre del plan"
    if (!tipo) e.tipo = "Elegí el tipo de clase del plan"
    const p = Number(precio)
    if (!(p > 0)) e.precio = "El precio tiene que ser mayor a 0"
    const c = Number(creditos)
    if (!Number.isInteger(c) || c < 1) e.creditos = "Créditos: un número entero mayor a 0"
    if (descripcion.length > 1000) e.condiciones = "La descripción y las condiciones no pueden pasar de 1000 caracteres"
    setErrores(e)
    if (Object.keys(e).length) return
    onGuardar({ nombre: nombre.trim(), descripcion, precio: p, cantidadCreditos: c, tipo })
  }

  const campo = (err) => `h-11 w-full rounded-xl border bg-background/60 px-3 text-base text-foreground outline-none transition-colors focus:border-lime-500 ${err ? "border-red-500/60" : "border-border"}`
  const etiqueta = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-foreground/55"
  const seccion = "rounded-2xl border border-border bg-card p-4"
  const tituloSec = "flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground"
  const error = (m) => m && <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{m}</p>

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="hoja-movil flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 rounded-none border-0 bg-background p-0 top-0 left-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <DialogPrimitive.Title className="text-base font-black uppercase tracking-wide text-foreground">
            {plan ? "Editar plan" : "Nuevo plan"}
          </DialogPrimitive.Title>
          <button type="button" onClick={onClose} aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
          {/* 1. Datos del plan */}
          <section className={seccion} aria-labelledby="sec-datos">
            <h2 id="sec-datos" className={tituloSec}><Settings2 className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> 1. Datos del plan</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="pl-nombre" className={etiqueta}>Nombre del plan (lo ven los alumnos)</label>
                <input id="pl-nombre" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: CLASE CROSSFIT" className={campo(errores.nombre)} />
                {error(errores.nombre)}
              </div>
              <div>
                <label htmlFor="pl-tipo" className={etiqueta}>Tipo de clase</label>
                <select id="pl-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo(errores.tipo)}>
                  <option value="">Elegí el tipo de clase</option>
                  {opcionesTipo.map((t) => <option key={t.codigo} value={t.codigo}>{t.nombre}{t.activo ? "" : " (desactivado)"}</option>)}
                </select>
                <p className="mt-1.5 text-xs text-foreground/55">Define qué clases puede reservar quien compre este plan. El nombre del plan es solo para mostrar.</p>
                {error(errores.tipo)}
                {cambiaTipo && alumnosConPlan > 0 && (
                  <p role="alert" className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    Hay {alumnosConPlan} {alumnosConPlan === 1 ? "alumno" : "alumnos"} con este plan activo. Si cambiás el tipo, sus créditos pasan a valer para las clases del nuevo tipo y dejan de valer para las del anterior.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="pl-corta" className={etiqueta}>Descripción corta</label>
                <input id="pl-corta" maxLength={120} value={corta} onChange={(e) => setCorta(e.target.value)} placeholder="Ej: Plan de entrenamiento grupal" className={campo()} />
              </div>
            </div>
          </section>

          {/* 2. Precio y créditos */}
          <section className={seccion} aria-labelledby="sec-precio">
            <h2 id="sec-precio" className={tituloSec}><DollarSign className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> 2. Precio y créditos</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pl-precio" className={etiqueta}>Precio total (ARS)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-foreground/45" aria-hidden="true">$</span>
                  <input id="pl-precio" type="number" inputMode="decimal" min="1" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="36000" className={`${campo(errores.precio)} pl-7`} />
                </div>
                {error(errores.precio)}
              </div>
              <div>
                <label htmlFor="pl-creditos" className={etiqueta}>Créditos (clases)</label>
                <input id="pl-creditos" type="number" inputMode="numeric" min="1" step="1" value={creditos} onChange={(e) => setCreditos(e.target.value)} placeholder="20" className={campo(errores.creditos)} />
                {error(errores.creditos)}
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/55">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Todas las membresías vencen el día 10 del mes siguiente al pago.
            </p>
          </section>

          {/* Clases del plan (solo al editar y si el perfil puede ver clases) */}
          {plan?.idPlan && puedeVerClases && (
            <section className={seccion} aria-labelledby="sec-clases">
              <div className="flex items-center justify-between gap-2">
                <h2 id="sec-clases" className={tituloSec}><Users className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Clases de este tipo</h2>
                {clases && <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-black text-lime-700 dark:text-lime-400">{clases.filter((c) => c.estado === "Activo").length} activas</span>}
              </div>
              <p className="mt-1 text-xs text-foreground/55">Los alumnos con este plan pueden reservar estas clases, igual que los de cualquier otro plan del mismo tipo.</p>
              {clases === null ? (
                <Cargando filas={2} className="py-2" />
              ) : clases.length === 0 ? (
                <p className="mt-3 text-sm text-foreground/55">Todavía no hay clases de este tipo.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {clases.map((c) => (
                    <li key={c.idClase} className="flex items-center gap-3 bg-background/40 px-3 py-2.5">
                      <div className="w-12 shrink-0 text-center">
                        <p className="text-[10px] font-black uppercase text-foreground/55">
                          {c.fechaEspecifica ? "Única" : (c.diasSemana || "").split(",").map((d) => DIAS_CORTOS[d.trim().toUpperCase()]).filter(Boolean)[0] || "—"}
                        </p>
                        <p className="text-sm font-black tabular-nums text-foreground">{(c.horaInicio || "").slice(0, 5)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold uppercase text-foreground">{c.nombreClase}</p>
                        <p className="truncate text-xs text-foreground/55">
                          {c.nombreProfesor ? `Coach ${c.nombreProfesor} · ` : ""}{c.cupoMaximo} lugares
                          {!c.fechaEspecifica && c.diasSemana ? ` · ${(c.diasSemana || "").split(",").map((d) => DIAS_CORTOS[d.trim().toUpperCase()]).filter(Boolean).join(" ")}` : ""}
                        </p>
                      </div>
                      <Link to={`/admin/clases/editar/${c.idClase}`} aria-label={`Editar ${c.nombreClase}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground/70 hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {puedeCrearClases && (
                <Link to={`/admin/clases/nueva?tipo=${encodeURIComponent(plan.tipo)}`}
                  className="mt-3 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-lime-500/50 text-xs font-black uppercase tracking-wider text-lime-700 hover:bg-lime-400/10 dark:text-lime-400">
                  <Plus className="h-4 w-4" /> Crear clase de este tipo
                </Link>
              )}
            </section>
          )}

          {/* 3. Condiciones que ve el alumno */}
          <section className={seccion} aria-labelledby="sec-condiciones">
            <div className="flex items-center justify-between gap-2">
              <h2 id="sec-condiciones" className={tituloSec}><ListChecks className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> 3. Lo que ve el alumno</h2>
              <span className="text-[11px] font-bold text-foreground/50">{condiciones.length}/{MAX_CONDICIONES}</span>
            </div>
            <p className="mt-1 text-xs leading-snug text-foreground/55">
              Lo que incluye el plan. Poné solo lo que el box ofrece de verdad: lo publicado en una oferta obliga.
              {condiciones.length === 0 && " Si no agregás nada, se muestra: créditos, reservás desde la app y vence el día 10."}
            </p>
            {condiciones.length > 0 && (
              <ul className="mt-3 space-y-2">
                {condiciones.map((cond, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2">
                    <Check className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                    {editando === i ? (
                      <input autoFocus value={cond} maxLength={120} aria-label={`Condición ${i + 1}`}
                        onChange={(e) => setCondiciones((c) => c.map((x, k) => (k === i ? e.target.value : x)))}
                        onBlur={() => setEditando(null)} onKeyDown={(e) => { if (e.key === "Enter") setEditando(null) }}
                        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
                    ) : (
                      <span className="min-w-0 flex-1 text-sm text-foreground/85">{cond}</span>
                    )}
                    <button type="button" onClick={() => setEditando(editando === i ? null : i)} aria-label={`Editar condición ${i + 1}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/55 hover:bg-foreground/5 hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setCondiciones((c) => c.filter((_, k) => k !== i))} aria-label={`Quitar condición ${i + 1}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/55 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
            {condiciones.length < MAX_CONDICIONES && (
              <div className="mt-3 flex gap-2">
                <input value={nueva} maxLength={120} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarCondicion() } }}
                  placeholder="Ej: Acceso a Open Box los sábados" aria-label="Nueva condición" className={campo()} />
                <button type="button" onClick={agregarCondicion} disabled={!nueva.trim()}
                  className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-lime-400 px-3 text-xs font-black uppercase text-black disabled:opacity-40">
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
            )}
            {error(errores.condiciones)}
          </section>

          {/* Vista previa: igual que la ve el alumno al contratar */}
          <section className={seccion} aria-labelledby="sec-vista">
            <div className="flex items-center justify-between gap-2">
              <h2 id="sec-vista" className={tituloSec}><Eye className="h-4 w-4 text-lime-700 dark:text-lime-400" aria-hidden="true" /> Vista previa</h2>
              <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/55">Pantalla del alumno</span>
            </div>
            <div className="mt-3 rounded-2xl border-2 border-lime-500 bg-lime-400/10 dark:border-lime-400">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-lime-500 bg-lime-400 dark:border-lime-400" aria-hidden="true"><Check className="h-3 w-3 text-black" strokeWidth={3} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-black uppercase leading-tight text-foreground">{vistaPrevia.nombre}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-black leading-none tabular-nums text-foreground">${(Number(precio) || 0).toLocaleString("es-AR")}</span>
                  <span className="text-[10px] font-bold text-foreground/50">ARS</span>
                </span>
              </div>
              <ul className="mx-4 mb-4 space-y-2 border-t border-border pt-3">
                {featuresDelPlan(vistaPrevia).map((ft, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                    <span className="text-foreground/80">{ft.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/50"><Clock className="h-3 w-3" aria-hidden="true" /> Se actualiza mientras editás.</p>
          </section>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={guardar} disabled={guardando}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black shadow-lg shadow-lime-500/20 hover:bg-lime-300 disabled:opacity-50">
            {guardando ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Check className="h-4 w-4" strokeWidth={3} /> {plan ? "Guardar cambios" : "Crear plan"}</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
