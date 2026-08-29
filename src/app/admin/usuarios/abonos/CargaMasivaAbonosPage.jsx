import { useEffect, useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Pencil } from "lucide-react"
import { toast } from "@/lib/notificar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const METODOS = ["Efectivo", "Transferencia", "Débito", "Tarjeta Crédito"]

const fmt = (iso) => {
  if (!iso) return "-"
  try {
    const s = iso.split("T")[0]
    const [y, m, d] = s.split("-")
    return `${d}/${m}/${y}`
  } catch { return iso }
}

const sumarUnMes = (fechaStr) => {
  if (!fechaStr) return ""
  const d = new Date(fechaStr + "T00:00:00")
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().split("T")[0]
}

function filaVacia() {
  const hoy = new Date().toISOString().split("T")[0]
  return {
    _id: Math.random().toString(36).slice(2),
    idUsuario: "",
    nombreAlumno: "",
    busqueda: "",
    sugerencias: [],
    mostrarSugerencias: false,
    idPlan: "",
    precioBase: 0,
    creditos: "",
    horario: "",
    fechaInicio: hoy,
    fechaVencimiento: sumarUnMes(hoy),
    monto: "",
    metodoPago: "Efectivo",
    estado: "pendiente",
    mensajeError: "",
  }
}

function calcularMonto(precioBase, metodoPago) {
  if (!precioBase) return ""
  return String(metodoPago === "Tarjeta Crédito" ? Math.round(precioBase * 1.1) : precioBase)
}

export default function GestionAbonosPage() {
  const navigate = useNavigate()

  const [planes, setPlanes] = useState([])
  const [usuarios, setUsuarios] = useState([])

  // Lista general de abonos
  const [abonos, setAbonos] = useState([])
  const [cargandoAbonos, setCargandoAbonos] = useState(false)

  // Modales
  const [editDialog, setEditDialog] = useState({ open: false, abono: null })
  const [formEdit, setFormEdit] = useState({ fechaInicio: "", fechaVencimiento: "", turnos: "", estado: "ACTIVO", motivo: "" })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, abono: null })
  const [restoreDialog, setRestoreDialog] = useState({ open: false, abono: null })
  const [guardando, setGuardando] = useState(false)
  const [historialVisible, setHistorialVisible] = useState(false)

  // Navegación por mes
  const hoyRef = new Date()
  const [mesFiltro, setMesFiltro] = useState({ year: hoyRef.getFullYear(), month: hoyRef.getMonth() })

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  const labelMes = ({ year, month }) => `${MESES[month]} ${year}`

  const moverMes = (delta) => setMesFiltro(prev => {
    const d = new Date(prev.year, prev.month + delta, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const esMesActual = mesFiltro.year === hoyRef.getFullYear() && mesFiltro.month === hoyRef.getMonth()

  const abonosPorMes = (lista) =>
    lista.filter(a => {
      if (!a.inicio) return false
      const d = new Date(a.inicio)
      return d.getFullYear() === mesFiltro.year && d.getMonth() === mesFiltro.month
    })

  // Meses con datos para mostrar punto indicador
  const mesesConDatos = new Set(
    abonos.filter(a => a.inicio).map(a => {
      const d = new Date(a.inicio)
      return `${d.getFullYear()}-${d.getMonth()}`
    })
  )

  // Carga masiva
  const [filas, setFilas] = useState([filaVacia()])
  const [enviando, setEnviando] = useState(false)
  const busquedaRefs = useRef({})
  const [dropdownPos, setDropdownPos] = useState({})

  const getToken = () => localStorage.getItem("token")
  const getHeaders = () => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" })

  useEffect(() => {
    const permisos = (() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } })()
    if (!permisos.includes("membresias:alta")) { navigate("/admin/usuarios"); return }

    const h = { Authorization: `Bearer ${getToken()}` }
    Promise.all([
      fetch("http://localhost:3001/api/vv1/planes",   { headers: h }).then(r => r.json()),
      fetch("http://localhost:3001/api/vv1/usuarios", { headers: h }).then(r => r.json()),
    ]).then(([rP, rU]) => {
      setPlanes(Array.isArray(rP.data) ? rP.data : [])
      const lista = rU.data || rU
      setUsuarios(Array.isArray(lista) ? lista : [])
    }).catch(() => {})

    cargarAbonos()
  }, [navigate])

  const cargarAbonos = async () => {
    setCargandoAbonos(true)
    try {
      const r = await fetch("http://localhost:3001/api/vv1/usuarios/abonos/todos", {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const json = await r.json()
      setAbonos(Array.isArray(json.data) ? json.data : [])
    } catch { setAbonos([]) }
    finally { setCargandoAbonos(false) }
  }

  // ── Editar ─────────────────────────────────────────────────────────────────
  const abrirEditar = (abono) => {
    setFormEdit({
      fechaInicio:      abono.inicio      ? abono.inicio.split("T")[0]      : "",
      fechaVencimiento: abono.vencimiento ? abono.vencimiento.split("T")[0] : "",
      turnos:  abono.turnos ?? "",
      estado:  abono.estado || "ACTIVO",
      motivo:  "",
    })
    setEditDialog({ open: true, abono })
  }

  const guardarEdicion = async () => {
    const { abono } = editDialog
    setGuardando(true)
    try {
      const r = await fetch(
        `http://localhost:3001/api/vv1/usuarios/${abono.idUsuario}/abonos/${abono.id}`,
        { method: "PUT", headers: getHeaders(), body: JSON.stringify({
          fechaInicio:      formEdit.fechaInicio,
          fechaVencimiento: formEdit.fechaVencimiento,
          turnos:           Number(formEdit.turnos),
          estado:           formEdit.estado,
        }) }
      )
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Error") }
      toast.success("Abono actualizado")
      setEditDialog({ open: false, abono: null })
      cargarAbonos()
    } catch (e) { toast.error(e.message || "No se pudo actualizar") }
    finally { setGuardando(false) }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    const { abono } = deleteDialog
    setGuardando(true)
    try {
      const r = await fetch(
        `http://localhost:3001/api/vv1/usuarios/${abono.idUsuario}/abonos/${abono.id}`,
        { method: "DELETE", headers: getHeaders() }
      )
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Error") }
      toast.success("Membresía cancelada — podés recuperarla desde el historial")
      setDeleteDialog({ open: false, abono: null })
      setHistorialVisible(true)
      cargarAbonos()
    } catch (e) { toast.error(e.message || "No se pudo cancelar") }
    finally { setGuardando(false) }
  }

  const confirmarRestaurar = async () => {
    const { abono } = restoreDialog
    setGuardando(true)
    try {
      const r = await fetch(
        `http://localhost:3001/api/vv1/usuarios/${abono.idUsuario}/abonos/${abono.id}`,
        { method: "PUT", headers: getHeaders(), body: JSON.stringify({ estado: "ACTIVO" }) }
      )
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Error") }
      toast.success("Membresía recuperada exitosamente")
      setRestoreDialog({ open: false, abono: null })
      cargarAbonos()
    } catch (e) { toast.error(e.message || "No se pudo recuperar") }
    finally { setGuardando(false) }
  }

  // ── Carga masiva helpers ───────────────────────────────────────────────────
  const upd = (id, campo, valor) =>
    setFilas(prev => prev.map(f => f._id === id ? { ...f, [campo]: valor } : f))

  const buscarAlumno = (id, texto, inputEl) => {
    upd(id, "busqueda", texto)
    upd(id, "mostrarSugerencias", true)
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect()
      setDropdownPos(prev => ({ ...prev, [id]: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width } }))
    }
    if (!texto.trim()) { upd(id, "sugerencias", []); return }
    const q = texto.toLowerCase()
    const matches = usuarios.filter(u => {
      const nombre = (u.nombre || u.nombrecompleto || "").toLowerCase()
      const email  = (u.email || u.correo || "").toLowerCase()
      const dni    = String(u.dni || "")
      return nombre.includes(q) || email.includes(q) || dni.includes(q)
    }).slice(0, 6)
    upd(id, "sugerencias", matches)
  }

  const seleccionarAlumno = (id, usuario) => {
    const idUsu  = usuario.idUsuario || usuario.id
    const nombre = usuario.nombre || usuario.nombrecompleto || ""
    setFilas(prev => prev.map(f =>
      f._id === id
        ? { ...f, idUsuario: idUsu, nombreAlumno: nombre, busqueda: nombre, sugerencias: [], mostrarSugerencias: false }
        : f
    ))
  }

  const seleccionarPlan = (id, idPlan) => {
    const plan = planes.find(p => String(p.idPlan) === String(idPlan))
    setFilas(prev => prev.map(f =>
      f._id === id
        ? { ...f, idPlan,
            precioBase: plan?.precio || 0,
            creditos: plan ? String(plan.cantidadCreditos || "") : f.creditos,
            monto: plan ? calcularMonto(plan.precio, f.metodoPago) : f.monto }
        : f
    ))
  }

  const cambiarMetodo = (id, metodoPago) => {
    setFilas(prev => prev.map(f =>
      f._id === id
        ? { ...f, metodoPago, monto: f.precioBase ? calcularMonto(f.precioBase, metodoPago) : f.monto }
        : f
    ))
  }

  const enviar = async () => {
    const pendientes = filas.filter(f => f.estado !== "ok")
    if (pendientes.filter(f => !f.idUsuario || !f.idPlan || !f.fechaInicio).length > 0) {
      toast.error("Completá todos los campos obligatorios", { description: "Alumno, plan y fecha son requeridos." })
      return
    }
    setEnviando(true)
    const sesion = (() => { try { return JSON.parse(localStorage.getItem("usuario") || localStorage.getItem("user") || "{}") } catch { return {} } })()

    for (const f of pendientes) {
      upd(f._id, "estado", "cargando")
      try {
        const plan = planes.find(p => String(p.idPlan) === String(f.idPlan))
        const r = await fetch(`http://localhost:3001/api/vv1/usuarios/${f.idUsuario}/abonos`, {
          method: "POST", headers: getHeaders(),
          body: JSON.stringify({
            tipoAbono:         plan?.nombre,
            fechaInicio:       f.fechaInicio,
            fechaVencimiento:  f.fechaVencimiento || undefined,
            metodoPago:        f.metodoPago,
            importe:           f.monto ? parseFloat(f.monto) : undefined,
            idUsuarioOperador: sesion.idUsuario,
          })
        })
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Error") }
        upd(f._id, "estado", "ok")
      } catch (err) {
        upd(f._id, "estado", "error")
        upd(f._id, "mensajeError", err.message || "Error al guardar")
      }
    }
    setEnviando(false)
    toast.success("Carga completada")
    cargarAbonos()
  }

  const resumen = {
    ok:  filas.filter(f => f.estado === "ok").length,
    err: filas.filter(f => f.estado === "error").length,
  }

  const inp = "w-full bg-card border border-border text-sm text-foreground px-2 py-1.5 outline-none focus:border-foreground/40 transition-colors placeholder:text-foreground/25"

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/usuarios" className="mt-1 p-1.5 text-foreground/30 hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Gestión de Abonos</h1>
          <p className="text-sm text-foreground/50 mt-0.5">Cargá y administrá los abonos de los alumnos.</p>
        </div>
      </div>

      {/* ── CARGA MASIVA ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-foreground">Nueva Carga</p>
            <p className="text-xs text-foreground/40 mt-0.5">Completá las filas y guardá todos de una vez.</p>
          </div>
          <button
            onClick={enviar}
            disabled={enviando || filas.every(f => f.estado === "ok")}
            className="flex items-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-5 py-2.5 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {enviando ? "Guardando..." : "Guardar Todo"}
          </button>
        </div>

        {(resumen.ok > 0 || resumen.err > 0) && (
          <div className="flex items-center gap-4 text-xs">
            {resumen.ok  > 0 && <span className="flex items-center gap-1.5 text-lime-500 font-bold"><CheckCircle2 className="h-3.5 w-3.5" />{resumen.ok} guardados</span>}
            {resumen.err > 0 && <span className="flex items-center gap-1.5 text-red-400 font-bold"><AlertCircle className="h-3.5 w-3.5" />{resumen.err} errores</span>}
          </div>
        )}

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-[1050px]">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {["","Alumno","Plan","Créd.","Horario","Inicio","Vencimiento","Método Pago","Monto",""].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((f) => (
                <tr key={f._id} className={`transition-colors ${f.estado === "ok" ? "bg-lime-400/5" : f.estado === "error" ? "bg-red-400/5" : ""}`}>
                  <td className="px-3 py-2 w-8 text-center">
                    {f.estado === "cargando" && <Loader2 className="h-4 w-4 animate-spin text-foreground/40 mx-auto" />}
                    {f.estado === "ok"       && <CheckCircle2 className="h-4 w-4 text-lime-400 mx-auto" />}
                    {f.estado === "error"    && <AlertCircle  className="h-4 w-4 text-red-400 mx-auto" title={f.mensajeError} />}
                  </td>

                  <td className="px-3 py-2 min-w-[180px]">
                    <input
                      className={inp}
                      placeholder="Buscar alumno..."
                      value={f.busqueda}
                      disabled={f.estado === "ok"}
                      onChange={e => buscarAlumno(f._id, e.target.value, e.target)}
                      onFocus={e => {
                        const rect = e.target.getBoundingClientRect()
                        setDropdownPos(prev => ({ ...prev, [f._id]: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width } }))
                        upd(f._id, "mostrarSugerencias", true)
                      }}
                      onBlur={() => setTimeout(() => upd(f._id, "mostrarSugerencias", false), 200)}
                    />
                  </td>

                  <td className="px-3 py-2 min-w-[150px]">
                    <select className={inp} value={f.idPlan} disabled={f.estado === "ok"}
                      onChange={e => seleccionarPlan(f._id, e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {planes.map(p => <option key={p.idPlan} value={p.idPlan}>{p.nombre}</option>)}
                    </select>
                  </td>

                  <td className="px-3 py-2 w-20">
                    <input className={inp + " text-center bg-muted/40 cursor-default"} value={f.creditos} readOnly />
                  </td>

                  <td className="px-3 py-2 min-w-[110px]">
                    <input className={inp} placeholder="Lun/Mié 18hs" value={f.horario} disabled={f.estado === "ok"}
                      onChange={e => upd(f._id, "horario", e.target.value)} />
                  </td>

                  <td className="px-3 py-2 min-w-[130px]">
                    <input type="date" className={inp} value={f.fechaInicio} disabled={f.estado === "ok"}
                      onChange={e => {
                        const val = e.target.value
                        setFilas(prev => prev.map(row =>
                          row._id === f._id
                            ? { ...row, fechaInicio: val, fechaVencimiento: val ? sumarUnMes(val) : row.fechaVencimiento }
                            : row
                        ))
                      }} />
                  </td>

                  <td className="px-3 py-2 min-w-[130px]">
                    <input type="date" className={inp} value={f.fechaVencimiento} disabled={f.estado === "ok"}
                      onChange={e => upd(f._id, "fechaVencimiento", e.target.value)} />
                  </td>

                  <td className="px-3 py-2 min-w-[140px]">
                    <select className={inp} value={f.metodoPago} disabled={f.estado === "ok"}
                      onChange={e => cambiarMetodo(f._id, e.target.value)}>
                      {METODOS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </td>

                  <td className="px-3 py-2 min-w-[90px]">
                    <input type="number" className={inp} value={f.monto} disabled={f.estado === "ok"}
                      onChange={e => upd(f._id, "monto", e.target.value)} />
                  </td>

                  <td className="px-3 py-2 w-10 text-center">
                    {f.estado !== "ok" && (
                      <button onClick={() => setFilas(prev => prev.filter(r => r._id !== f._id))}
                        className="text-foreground/20 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={() => setFilas(prev => [...prev, filaVacia()])}
          className="flex items-center gap-2 text-xs text-foreground/40 hover:text-foreground transition-colors border border-dashed border-border px-4 py-2">
          <Plus className="h-4 w-4" /> Agregar fila
        </button>
      </div>

      {/* ── LISTA DE ABONOS POR MES ──────────────────────────────────────────── */}
      {(() => {
        const activos = abonos.filter(a => a.estado !== "CANCELADO")
        const delMes  = abonosPorMes(activos)
        const prevKey = `${mesFiltro.year}-${mesFiltro.month - 1 < 0 ? 11 : mesFiltro.month - 1}`
          .replace(/-([-\d]+)$/, m => {
            const n = parseInt(m.slice(1)); return `-${n < 0 ? 11 : n}`
          })
        const nextKey = `${mesFiltro.year}-${(mesFiltro.month + 1) % 12}`
        const hayPrev = mesesConDatos.has(`${mesFiltro.month === 0 ? mesFiltro.year - 1 : mesFiltro.year}-${mesFiltro.month === 0 ? 11 : mesFiltro.month - 1}`)
        const hayNext = mesesConDatos.has(`${mesFiltro.month === 11 ? mesFiltro.year + 1 : mesFiltro.year}-${(mesFiltro.month + 1) % 12}`)

        return (
          <div className="border border-border bg-card">
            {/* Cabecera con navegación de mes */}
            <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membresías</p>
                <p className="text-xs text-foreground/40 mt-0.5">Agrupadas por mes de inicio · editá fechas, créditos o cancelá.</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moverMes(-1)}
                  className="w-7 h-7 flex items-center justify-center text-foreground/40 hover:text-foreground border border-border hover:border-foreground/30 transition-colors text-sm"
                  title="Mes anterior"
                >
                  ‹
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 border border-border bg-muted/40 min-w-[150px] justify-center">
                  <span className="text-xs font-semibold text-foreground">{labelMes(mesFiltro)}</span>
                  {esMesActual && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-lime-400 border border-lime-400/30 bg-lime-400/10 px-1.5 py-px">
                      Actual
                    </span>
                  )}
                  {mesesConDatos.has(`${mesFiltro.year}-${mesFiltro.month}`) && !esMesActual && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30 border border-border px-1.5 py-px">
                      Archivado
                    </span>
                  )}
                </div>

                <button
                  onClick={() => moverMes(1)}
                  disabled={esMesActual}
                  className="w-7 h-7 flex items-center justify-center text-foreground/40 hover:text-foreground border border-border hover:border-foreground/30 transition-colors text-sm disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Mes siguiente"
                >
                  ›
                </button>

                <button onClick={cargarAbonos} className="ml-2 text-xs text-foreground/30 hover:text-foreground transition-colors" title="Actualizar">↺</button>
              </div>
            </div>

            {/* Resumen rápido del mes */}
            {delMes.length > 0 && (
              <div className="border-b border-border border-dashed px-5 py-2 flex items-center gap-6 text-[10px] text-muted-foreground">
                <span><span className="font-black text-foreground">{delMes.length}</span> membresía{delMes.length !== 1 ? "s" : ""}</span>
                <span><span className="font-black text-lime-400">{delMes.filter(a => a.estado === "ACTIVO").length}</span> activas</span>
                {delMes.filter(a => a.estado === "VENCIDO").length > 0 && (
                  <span><span className="font-black text-foreground/40">{delMes.filter(a => a.estado === "VENCIDO").length}</span> vencidas</span>
                )}
                {delMes.filter(a => a.estado === "PAUSADO").length > 0 && (
                  <span><span className="font-black text-yellow-400">{delMes.filter(a => a.estado === "PAUSADO").length}</span> pausadas</span>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    {["#","Alumno","Plan","Inicio","Vencimiento","Créditos","Usados","Disponibles","Estado",""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargandoAbonos ? (
                    <tr><td colSpan="10" className="p-8 text-center text-foreground/40 animate-pulse text-xs">Cargando...</td></tr>
                  ) : delMes.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-10 text-center">
                        <p className="text-xs text-foreground/30">Sin membresías en {labelMes(mesFiltro)}.</p>
                        {!esMesActual && (
                          <button onClick={() => setMesFiltro({ year: hoyRef.getFullYear(), month: hoyRef.getMonth() })}
                            className="mt-2 text-[10px] text-foreground/25 hover:text-foreground/50 underline underline-offset-2 transition-colors">
                            Volver al mes actual
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : delMes.map(ab => (
                    <tr key={ab.id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground/40">{ab.id}</td>
                      <td className="px-4 py-3 font-semibold text-foreground text-xs">{ab.nombreAlumno}</td>
                      <td className="px-4 py-3 text-foreground/70 text-xs">{ab.abono}</td>
                      <td className="px-4 py-3 text-foreground/60 text-xs">{fmt(ab.inicio)}</td>
                      <td className="px-4 py-3 text-foreground/60 text-xs">{fmt(ab.vencimiento)}</td>
                      <td className="px-4 py-3 text-center text-foreground/60 text-xs">{ab.turnos}</td>
                      <td className="px-4 py-3 text-center text-foreground/40 text-xs">{ab.usados || 0}</td>
                      <td className="px-4 py-3 text-center font-semibold text-lime-400 text-xs">{ab.disponibles}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                          ab.estado === "VENCIDO"  ? "bg-foreground/5 text-foreground/40 border-foreground/10"
                          : ab.estado === "PAUSADO" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                          : "bg-lime-400/10 text-lime-400 border-lime-400/20"
                        }`}>
                          {ab.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirEditar(ab)} className="p-1.5 text-foreground/40 hover:text-foreground transition-colors" title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteDialog({ open: true, abono: ab })} className="p-1.5 text-foreground/40 hover:text-red-400 transition-colors" title="Cancelar membresía">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Meses con datos — navegación rápida */}
            {mesesConDatos.size > 1 && (
              <div className="border-t border-border border-dashed px-5 py-2.5 flex items-center gap-2 flex-wrap">
                <span className="text-[9px] uppercase tracking-widest text-foreground/25 font-bold mr-1">Ir a:</span>
                {Array.from(mesesConDatos)
                  .map(k => { const [y, m] = k.split("-").map(Number); return { year: y, month: m } })
                  .sort((a, b) => b.year - a.year || b.month - a.month)
                  .map(({ year, month }) => {
                    const activo = year === mesFiltro.year && month === mesFiltro.month
                    return (
                      <button key={`${year}-${month}`}
                        onClick={() => setMesFiltro({ year, month })}
                        className={`text-[10px] px-2 py-0.5 border transition-colors ${
                          activo
                            ? "border-foreground/40 text-foreground bg-foreground/5"
                            : "border-border text-foreground/35 hover:text-foreground hover:border-foreground/25"
                        }`}>
                        {MESES[month].slice(0, 3)} {year}
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── HISTORIAL DE CANCELADOS ──────────────────────────────────────────── */}
      {(() => {
        const cancelados = abonos.filter(a => a.estado === "CANCELADO")
        if (cancelados.length === 0) return null
        return (
          <div className="border border-border border-dashed bg-card/50">
            <button
              onClick={() => setHistorialVisible(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-foreground/3 transition-colors"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  Historial de Canceladas
                  <span className="ml-2 text-[9px] bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5">{cancelados.length}</span>
                </p>
                <p className="text-xs text-foreground/25 mt-0.5">Membresías revocadas · se pueden recuperar.</p>
              </div>
              <span className="text-foreground/30 text-sm">{historialVisible ? "▲" : "▼"}</span>
            </button>

            {historialVisible && (
              <div className="overflow-x-auto border-t border-border border-dashed">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border border-dashed">
                      {["#","Alumno","Plan","Inicio","Vencimiento","Créditos","Usados",""].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border divide-dashed">
                    {cancelados.map(ab => (
                      <tr key={ab.id} className="opacity-60 hover:opacity-100 transition-opacity">
                        <td className="px-4 py-3 font-mono text-xs text-foreground/30">{ab.id}</td>
                        <td className="px-4 py-3 text-foreground/70 text-xs font-semibold">{ab.nombreAlumno}</td>
                        <td className="px-4 py-3 text-foreground/50 text-xs">{ab.abono}</td>
                        <td className="px-4 py-3 text-foreground/40 text-xs">{fmt(ab.inicio)}</td>
                        <td className="px-4 py-3 text-foreground/40 text-xs">{fmt(ab.vencimiento)}</td>
                        <td className="px-4 py-3 text-center text-foreground/40 text-xs">{ab.turnos}</td>
                        <td className="px-4 py-3 text-center text-foreground/30 text-xs">{ab.usados || 0}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setRestoreDialog({ open: true, abono: ab })}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-lime-500 hover:text-lime-400 border border-lime-500/30 hover:border-lime-400/50 px-2.5 py-1 transition-colors"
                            title="Recuperar membresía"
                          >
                            ↺ Recuperar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── MODAL EDITAR ─────────────────────────────────────────────────────── */}
      <Dialog open={editDialog.open} onOpenChange={open => !open && setEditDialog({ open: false, abono: null })}>
        <DialogContent className="bg-card border border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase text-sm font-black tracking-widest">Editar Abono</DialogTitle>
          </DialogHeader>
          {editDialog.abono && (
            <div className="space-y-3 text-xs">
              <div className="bg-muted/50 border border-border rounded p-3">
                <p className="font-bold text-foreground">{editDialog.abono.nombreAlumno}</p>
                <p className="text-foreground/60">{editDialog.abono.abono}</p>
              </div>
              {[
                ["Inicio:", "date", "fechaInicio"],
                ["Vencimiento:", "date", "fechaVencimiento"],
                ["Turnos:", "number", "turnos"],
              ].map(([label, type, key]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-28 shrink-0 font-semibold uppercase">{label}</span>
                  <input type={type} value={formEdit[key]}
                    onChange={e => {
                      const val = e.target.value
                      setFormEdit(p => {
                        const next = { ...p, [key]: val }
                        if (key === "fechaInicio" && val) next.fechaVencimiento = sumarUnMes(val)
                        return next
                      })
                    }}
                    className="flex-1 bg-muted border border-border rounded p-2 text-foreground outline-none text-xs" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-28 shrink-0 font-semibold uppercase">Estado:</span>
                <select value={formEdit.estado} onChange={e => setFormEdit(p => ({ ...p, estado: e.target.value }))}
                  className="flex-1 bg-muted border border-border rounded p-2 text-foreground outline-none text-xs">
                  <option>ACTIVO</option>
                  <option>CANCELADO</option>
                  <option>VENCIDO</option>
                  <option>PAUSADO</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditDialog({ open: false, abono: null })}>Cancelar</Button>
            <Button size="sm" onClick={guardarEdicion} disabled={guardando}
              className="bg-green-600 hover:bg-green-700 text-foreground uppercase text-xs tracking-wide">
              {guardando && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL CANCELAR ─────────────────────────────────────────────────── */}
      <Dialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, abono: null })}>
        <DialogContent className="bg-card border border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive uppercase text-sm font-black tracking-widest">Cancelar Membresía</DialogTitle>
          </DialogHeader>
          {deleteDialog.abono && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded text-xs font-medium">
                ⚠️ Se darán de baja los créditos del alumno. Podés recuperarla desde el historial.
              </div>
              <div className="bg-muted/60 border border-border rounded p-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Alumno:</span><span className="font-bold text-foreground">{deleteDialog.abono.nombreAlumno}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Plan:</span><span className="font-bold text-foreground">{deleteDialog.abono.abono}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vencimiento:</span><span className="font-mono text-foreground">{fmt(deleteDialog.abono.vencimiento)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog({ open: false, abono: null })}>Volver</Button>
            <Button variant="destructive" size="sm" onClick={confirmarEliminar} disabled={guardando}>
              {guardando && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Cancelar membresía
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DROPDOWN BÚSQUEDA ALUMNO (fuera de la tabla, position fixed) ──── */}
      {filas.map(f => f.mostrarSugerencias && f.sugerencias.length > 0 && dropdownPos[f._id] && (
        <div
          key={`drop-${f._id}`}
          style={{ position: "fixed", top: dropdownPos[f._id].top, left: dropdownPos[f._id].left, width: dropdownPos[f._id].width, zIndex: 9999 }}
          className="bg-card border border-border shadow-2xl max-h-52 overflow-y-auto"
        >
          {f.sugerencias.map(u => (
            <button key={u.idUsuario || u.id} type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-foreground/5 transition-colors border-b border-border last:border-0"
              onMouseDown={() => seleccionarAlumno(f._id, u)}>
              <p className="font-semibold text-foreground text-xs">{u.nombre || u.nombrecompleto}</p>
              <p className="text-foreground/40 text-[10px]">{u.email || u.correo}</p>
            </button>
          ))}
        </div>
      ))}

      {/* ── MODAL RECUPERAR ────────────────────────────────────────────────── */}
      <Dialog open={restoreDialog.open} onOpenChange={open => !open && setRestoreDialog({ open: false, abono: null })}>
        <DialogContent className="bg-card border border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lime-400 uppercase text-sm font-black tracking-widest">Recuperar Membresía</DialogTitle>
          </DialogHeader>
          {restoreDialog.abono && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-lime-400/10 border border-lime-400/20 text-lime-400 rounded text-xs font-medium">
                ✓ La membresía volverá al estado ACTIVO con sus créditos disponibles.
              </div>
              <div className="bg-muted/60 border border-border rounded p-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Alumno:</span><span className="font-bold text-foreground">{restoreDialog.abono.nombreAlumno}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Plan:</span><span className="font-bold text-foreground">{restoreDialog.abono.abono}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Créditos:</span><span className="font-bold text-lime-400">{restoreDialog.abono.disponibles} disponibles</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vencimiento:</span><span className="font-mono text-foreground">{fmt(restoreDialog.abono.vencimiento)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRestoreDialog({ open: false, abono: null })}>Cancelar</Button>
            <Button size="sm" onClick={confirmarRestaurar} disabled={guardando}
              className="bg-lime-500 hover:bg-lime-400 text-black font-black uppercase text-xs tracking-wide">
              {guardando && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Recuperar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
