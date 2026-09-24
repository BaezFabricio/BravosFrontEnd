import React, { useEffect, useState, useRef } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Pencil, FileText } from "lucide-react"
import { AdminFormSkeleton } from "@/components/AdminPageSkeleton"
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

const diezDelMesSiguiente = (fechaStr) => {
  if (!fechaStr) return ""
  const d = new Date(fechaStr + "T00:00:00")
  d.setMonth(d.getMonth() + 1)
  d.setDate(10)
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
    fechaVencimiento: diezDelMesSiguiente(hoy),
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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const usuarioPreId = searchParams.get("usuario")

  // Volver a donde se estaba (la lista o el perfil, según de dónde se llegó). Si
  // la página se abrió directo, sin historial previo, cae al perfil / la lista.
  const volver = () => {
    if (location.key !== "default") navigate(-1)
    else navigate(usuarioPreId ? `/admin/usuarios/${usuarioPreId}` : "/admin/usuarios")
  }

  const [planes, setPlanes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loadingInicial, setLoadingInicial] = useState(true)

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
  const [compAbiertos, setCompAbiertos] = useState({})
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

  // Comprobantes por fila de carga (idFila → array de docs)
  const [comprobantesMap, setComprobantesMap] = useState({})
  // Comprobantes por abono existente (idAbono → array de docs)
  const [comprobantesAbonos, setComprobantesAbonos] = useState({})

  const getHeaders = () => ({  "Content-Type": "application/json" })

  useEffect(() => {
    const permisos = (() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } })()
    if (!permisos.includes("membresias:alta")) { navigate("/admin/usuarios"); return }

    const h = {  }
    Promise.all([
      fetch("/api/vv1/planes",   { headers: h }).then(r => r.json()),
      fetch("/api/vv1/usuarios", { headers: h }).then(r => r.json()),
    ]).then(([rP, rU]) => {
      setPlanes(Array.isArray(rP.data) ? rP.data : [])
      const lista = Array.isArray(rU.data || rU) ? (rU.data || rU) : []
      setUsuarios(lista)

      // Pre-seleccionar alumno si viene por query param
      if (usuarioPreId) {
        const u = lista.find(x => String(x.idUsuario || x.id) === String(usuarioPreId))
        if (u) {
          const nombre = u.nombre || u.nombrecompleto || ""
          setFilas([{ ...filaVacia(), idUsuario: u.idUsuario || u.id, nombreAlumno: nombre, busqueda: nombre }])
        }
      }
    }).catch(() => {}).finally(() => setLoadingInicial(false))

    cargarAbonos()
  }, [navigate])

  const cargarAbonos = async () => {
    setCargandoAbonos(true)
    try {
      const url = usuarioPreId
        ? `/api/vv1/usuarios/${usuarioPreId}/abonos`
        : "/api/vv1/usuarios/abonos/todos"
      const r = await fetch(url, { headers: {  } })
      const json = await r.json()
      const lista = Array.isArray(json.data) ? json.data : []
      setAbonos(lista.map(a => ({
        ...a,
        id: a.idAbono || a.id,
        inicio: a.fechaInicio || a.inicio,
        vencimiento: a.fechaVencimiento || a.vencimiento,
        abono: a.tipoAbono || a.abono,
        idUsuario: a.idUsuario || usuarioPreId,
      })))
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
        `/api/vv1/usuarios/${abono.idUsuario}/abonos/${abono.id}`,
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
        `/api/vv1/usuarios/${abono.idUsuario}/abonos/${abono.id}`,
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
        `/api/vv1/usuarios/${abono.idUsuario}/abonos/${abono.id}`,
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
    setFilas(prev => prev.map(f => {
      if (f._id !== id) return f
      if (f.metodoPago === "Transferencia") cargarComprobantes(id, idUsu)
      return { ...f, idUsuario: idUsu, nombreAlumno: nombre, busqueda: nombre, sugerencias: [], mostrarSugerencias: false }
    }))
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

  const cargarComprobantes = async (filaId, idUsuario) => {
    if (!idUsuario) return
    try {
      const r = await fetch(`/api/vv1/documentos/usuario/${idUsuario}`, { headers: {  } })
      const json = await r.json()
      setComprobantesMap(prev => ({ ...prev, [filaId]: json.data || [] }))
    } catch { setComprobantesMap(prev => ({ ...prev, [filaId]: [] })) }
  }

  const cargarComprobantesAbono = async (abonoId, idUsuario) => {
    if (!idUsuario || comprobantesAbonos[abonoId] !== undefined) return
    try {
      const r = await fetch(`/api/vv1/documentos/usuario/${idUsuario}`, { headers: {  } })
      const json = await r.json()
      setComprobantesAbonos(prev => ({ ...prev, [abonoId]: json.data || [] }))
    } catch { setComprobantesAbonos(prev => ({ ...prev, [abonoId]: [] })) }
  }

  const aprobarComprobante = async (abonoId, idDocumento) => {
    try {
      await fetch(`/api/vv1/documentos/${idDocumento}/aprobar`, { method: "PATCH", headers: getHeaders() })
      setComprobantesAbonos(prev => ({
        ...prev,
        [abonoId]: (prev[abonoId] || []).map(d => d.idDocumento === idDocumento ? { ...d, estado: "aprobado" } : d)
      }))
      toast.success("Comprobante aprobado")
    } catch { toast.error("No se pudo aprobar el comprobante") }
  }

  const cambiarMetodo = (id, metodoPago) => {
    setFilas(prev => prev.map(f =>
      f._id === id
        ? { ...f, metodoPago, monto: f.precioBase ? calcularMonto(f.precioBase, metodoPago) : f.monto }
        : f
    ))
    if (metodoPago === "Transferencia") {
      const fila = filas.find(f => f._id === id)
      if (fila?.idUsuario) cargarComprobantes(id, fila.idUsuario)
    }
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
        const r = await fetch(`/api/vv1/usuarios/${f.idUsuario}/abonos`, {
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

        // Si el pago es Transferencia y hay comprobante del alumno, aprobarlo automáticamente
        if (f.metodoPago === "Transferencia" && f.idUsuario) {
          const docs = comprobantesMap[f._id] || []
          const desde = f.fechaInicio ? new Date(f.fechaInicio + "T00:00:00") : null
          const filtrados = desde
            ? docs.filter(d => d.tipo === "comprobante_transferencia" && (!d.creadoEn || new Date(d.creadoEn) >= desde))
            : docs.filter(d => d.tipo === "comprobante_transferencia")
          if (filtrados.length > 0) {
            const docId = filtrados[0].idDocumento
            await fetch(`/api/vv1/documentos/${docId}/aprobar`, { method: "PATCH", headers: getHeaders() }).catch(() => {})
            // Actualizar el estado local del comprobante
            setComprobantesMap(prev => ({
              ...prev,
              [f._id]: (prev[f._id] || []).map(d => d.idDocumento === docId ? { ...d, estado: "aprobado" } : d)
            }))
          }
        }

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

  if (loadingInicial) return <AdminFormSkeleton />

  const inp = "w-full bg-card border border-border text-sm text-foreground px-2 py-1.5 outline-none focus:border-foreground/40 transition-colors placeholder:text-foreground/25"

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={volver} aria-label="Volver" className="mt-1 p-1.5 text-foreground/30 hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
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
            {resumen.ok  > 0 && <span className="flex items-center gap-1.5 text-lime-700 dark:text-lime-500 font-bold"><CheckCircle2 className="h-3.5 w-3.5" />{resumen.ok} guardados</span>}
            {resumen.err > 0 && <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold"><AlertCircle className="h-3.5 w-3.5" />{resumen.err} errores</span>}
          </div>
        )}

        <div className="border border-border bg-card md:overflow-x-auto">
          <table className="w-full text-xs block md:table md:min-w-[1050px]">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-border bg-background/50">
                {["","Alumno","Plan","Créd.","Horario","Inicio","Vencimiento","Método Pago","Monto",""].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-border">
              {filas.map((f) => (
                <React.Fragment key={f._id}>
                <tr className={`grid grid-cols-2 gap-x-3 gap-y-2 p-3 md:table-row md:p-0 transition-colors ${f.estado === "ok" ? "bg-lime-400/5" : f.estado === "error" ? "bg-red-400/5" : ""}`}>
                  <td data-label="" className="px-3 py-2 md:w-8 text-center  ">
                    {f.estado === "cargando" && <Loader2 className="h-4 w-4 animate-spin text-foreground/40 mx-auto" />}
                    {f.estado === "ok"       && <CheckCircle2 className="h-4 w-4 text-lime-700 dark:text-lime-400 mx-auto" />}
                    {f.estado === "error"    && <AlertCircle  className="h-4 w-4 text-red-700 dark:text-red-400 mx-auto" title={f.mensajeError} />}
                  </td>

                  <td data-label="Alumno" className="px-3 py-2 md:min-w-[180px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">
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

                  <td data-label="Plan" className="px-3 py-2 md:min-w-[150px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">
                    <select className={inp} value={f.idPlan} disabled={f.estado === "ok"}
                      onChange={e => seleccionarPlan(f._id, e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {planes.map(p => <option key={p.idPlan} value={p.idPlan}>{p.nombre}</option>)}
                    </select>
                  </td>

                  <td data-label="Créditos" className="px-3 py-2 md:w-20 before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                    <input className={inp + " text-center bg-muted/40 cursor-default"} value={f.creditos} readOnly />
                  </td>

                  <td data-label="Horario" className="px-3 py-2 md:min-w-[110px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                    <input className={inp} placeholder="Lun/Mié 18hs" value={f.horario} disabled={f.estado === "ok"}
                      onChange={e => upd(f._id, "horario", e.target.value)} />
                  </td>

                  <td data-label="Inicio" className="px-3 py-2 md:min-w-[130px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                    <input type="date" className={inp} value={f.fechaInicio} disabled={f.estado === "ok"}
                      onChange={e => {
                        const val = e.target.value
                        setFilas(prev => prev.map(row =>
                          row._id === f._id
                            ? { ...row, fechaInicio: val, fechaVencimiento: val ? diezDelMesSiguiente(val) : row.fechaVencimiento }
                            : row
                        ))
                      }} />
                  </td>

                  <td data-label="Vencimiento" className="px-3 py-2 md:min-w-[130px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                    <input type="date" className={inp} value={f.fechaVencimiento} disabled={f.estado === "ok"}
                      onChange={e => upd(f._id, "fechaVencimiento", e.target.value)} />
                  </td>

                  <td data-label="Método de pago" className="px-3 py-2 md:min-w-[140px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                    <select className={inp} value={f.metodoPago} disabled={f.estado === "ok"}
                      onChange={e => cambiarMetodo(f._id, e.target.value)}>
                      {METODOS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </td>

                  <td data-label="Monto" className="px-3 py-2 md:min-w-[90px] before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                    <input type="number" className={inp} value={f.monto} disabled={f.estado === "ok"}
                      onChange={e => upd(f._id, "monto", e.target.value)} />
                  </td>

                  <td data-label="" className="px-3 py-2 md:w-10 text-center  ">
                    {f.estado !== "ok" && (
                      <button onClick={() => setFilas(prev => prev.filter(r => r._id !== f._id))}
                        className="text-foreground/20 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
                {/* Sub-fila de comprobantes cuando método = Transferencia */}
                {f.metodoPago === "Transferencia" && f.idUsuario && (() => {
                  const docs = (comprobantesMap[f._id] || []).filter(d => d.tipo === "comprobante_transferencia")
                  // Comprobantes subidos en el mes de la fecha de inicio del abono
                  const desde = f.fechaInicio ? new Date(f.fechaInicio + "T12:00:00") : null
                  const filtrados = desde
                    ? docs.filter(d => {
                        if (!d.creadoEn) return true
                        const c = new Date(d.creadoEn)
                        return c.getFullYear() === desde.getFullYear() && c.getMonth() === desde.getMonth()
                      })
                    : docs
                  return (
                    <tr key={`comp-${f._id}`} className="block md:table-row bg-lime-400/3">
                      <td colSpan={10} className="block md:table-cell px-4 py-3 border-t border-dashed border-lime-400/20">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-widest text-lime-700/70 dark:text-lime-400/70 shrink-0">
                            Comprobantes de transferencia
                          </span>
                          {comprobantesMap[f._id] === undefined ? (
                            <span className="text-xs text-foreground/30 animate-pulse">Cargando...</span>
                          ) : filtrados.length === 0 ? (
                            <span className="text-xs text-foreground/30 border border-dashed border-foreground/10 px-2 py-1">
                              Sin comprobantes cargados desde {f.fechaInicio || "la fecha de inicio"}
                            </span>
                          ) : filtrados.map((doc, i) => (
                            <a key={i} href={doc.urlArchivo} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 transition-colors ${
                                doc.estado === "aprobado"
                                  ? "border border-lime-600/50 dark:border-lime-400/50 bg-lime-400/10 text-lime-700 dark:text-lime-400 hover:bg-lime-400/15"
                                  : "border border-foreground/15 bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                              }`}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {doc.creadoEn ? new Date(doc.creadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : `Comprobante ${i + 1}`}
                              <span className={`ml-0.5 ${doc.estado === "aprobado" ? "text-lime-700/60 dark:text-lime-400/60" : "text-foreground/30"}`}>
                                {doc.estado === "aprobado" ? "✓" : "↗"}
                              </span>
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })()}
                </React.Fragment>
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
            <div className="border-b border-border px-5 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membresías</p>
                <p className="text-xs text-foreground/40 mt-0.5">Agrupadas por mes de inicio · los comprobantes son los subidos en el mes elegido.</p>
              </div>

              <div className="flex items-center gap-1 sm:shrink-0">
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
                    <span className="text-[9px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400 border border-lime-400/30 bg-lime-400/10 px-1.5 py-px">
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
                <span><span className="font-black text-lime-700 dark:text-lime-400">{delMes.filter(a => a.estado === "ACTIVO").length}</span> activas</span>
                {delMes.filter(a => a.estado === "VENCIDO").length > 0 && (
                  <span><span className="font-black text-foreground/40">{delMes.filter(a => a.estado === "VENCIDO").length}</span> vencidas</span>
                )}
                {delMes.filter(a => a.estado === "PAUSADO").length > 0 && (
                  <span><span className="font-black text-yellow-700 dark:text-yellow-400">{delMes.filter(a => a.estado === "PAUSADO").length}</span> pausadas</span>
                )}
              </div>
            )}

            <div className="md:overflow-x-auto">
              <table className="w-full text-sm block md:table md:min-w-[900px]">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-border">
                    {["#","Alumno","Plan","Inicio","Vencimiento","Créditos","Usados","Disponibles","Estado","Método Pago","","Comprobante"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y divide-border">
                  {cargandoAbonos ? (
                    <tr className="block md:table-row"><td colSpan="10" className="block md:table-cell p-8 text-center text-foreground/40 animate-pulse text-xs">Cargando...</td></tr>
                  ) : delMes.length === 0 ? (
                    <tr className="block md:table-row">
                      <td colSpan="10" className="block md:table-cell p-10 text-center">
                        <p className="text-xs text-foreground/30">Sin membresías en {labelMes(mesFiltro)}.</p>
                        {!esMesActual && (
                          <button onClick={() => setMesFiltro({ year: hoyRef.getFullYear(), month: hoyRef.getMonth() })}
                            className="mt-2 text-[10px] text-foreground/25 hover:text-foreground/50 underline underline-offset-2 transition-colors">
                            Volver al mes actual
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : delMes.map((ab) => {
                    const alumno = usuarios.find(u => String(u.idUsuario || u.id) === String(ab.idUsuario))
                    const nombreMostrar = ab.nombreAlumno || alumno?.nombre || alumno?.nombrecompleto || "-"
                    if (ab.idUsuario) cargarComprobantesAbono(ab.id, ab.idUsuario)
                    const docsAbono = (comprobantesAbonos[ab.id] || []).filter(d => {
                      if (d.tipo !== "comprobante_transferencia") return false
                      if (!d.creadoEn) return true
                      const f = new Date(d.creadoEn)
                      return f.getFullYear() === mesFiltro.year && f.getMonth() === mesFiltro.month
                    })
                    return (
                    <tr key={ab.id} className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 md:table-row md:p-0 hover:bg-foreground/[0.02] transition-colors">
                      <td data-label="N.º" className="px-4 py-3 font-mono text-xs text-foreground/40 before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.id}</td>
                      <td data-label="Alumno" className="px-4 py-3 font-semibold text-foreground text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">{nombreMostrar}</td>
                      <td data-label="Plan" className="px-4 py-3 text-foreground/70 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">{ab.abono}</td>
                      <td data-label="Inicio" className="px-4 py-3 text-foreground/60 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{fmt(ab.inicio)}</td>
                      <td data-label="Vencimiento" className="px-4 py-3 text-foreground/60 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{fmt(ab.vencimiento)}</td>
                      <td data-label="Créditos" className="px-4 py-3 text-center text-foreground/60 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.turnos}</td>
                      <td data-label="Usados" className="px-4 py-3 text-center text-foreground/40 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.usados || 0}</td>
                      <td data-label="Disponibles" className="px-4 py-3 text-center font-semibold text-lime-700 dark:text-lime-400 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.disponibles}</td>
                      <td data-label="Estado" className="px-4 py-3 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                          ab.estado === "VENCIDO"  ? "bg-foreground/5 text-foreground/40 border-foreground/10"
                          : ab.estado === "PAUSADO" ? "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/20"
                          : "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20"
                        }`}>
                          {ab.estado}
                        </span>
                      </td>
                      <td data-label="Método de pago" className="px-4 py-3 text-xs text-foreground/60 before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.metodoPago || "-"}</td>
                      <td data-label="Acciones" className="px-4 py-3 before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirEditar(ab)} className="p-1.5 text-foreground/40 hover:text-foreground transition-colors" title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteDialog({ open: true, abono: ab })} className="p-1.5 text-foreground/40 hover:text-red-700 dark:hover:text-red-400 transition-colors" title="Cancelar membresía">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td data-label="Comprobantes" className="px-4 py-3 before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">
                        {docsAbono.length > 0 && (
                          <div className="flex flex-col items-start gap-1">
                            <button
                              onClick={() => setCompAbiertos(p => ({ ...p, [ab.id]: !p[ab.id] }))}
                              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border transition-colors whitespace-nowrap ${
                                docsAbono.every(d => d.estado === "aprobado")
                                  ? "border-lime-600/50 dark:border-lime-400/50 bg-lime-400/10 text-lime-700 dark:text-lime-400"
                                  : "border-foreground/15 bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {docsAbono.length} comprobante{docsAbono.length !== 1 ? "s" : ""}
                              <span className={`inline-block transition-transform duration-300 ${compAbiertos[ab.id] ? "rotate-180" : ""}`}>▾</span>
                            </button>
                            <div
                              className={`grid transition-all duration-300 ease-out ${compAbiertos[ab.id] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                              aria-hidden={!compAbiertos[ab.id]}
                            >
                            <div className="overflow-hidden min-h-0 flex flex-col items-start gap-1 pt-1">
                            {[...docsAbono].sort((a, b) => new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0)).map((doc, i) => (
                              <div key={doc.idDocumento} className="flex items-center gap-1.5 whitespace-nowrap"
                                style={{ transform: compAbiertos[ab.id] ? "translateY(0)" : "translateY(-6px)", transition: `transform 300ms ease-out ${i * 60}ms` }}>
                                <a href={doc.urlArchivo} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border transition-colors ${
                                    doc.estado === "aprobado"
                                      ? "border-lime-600/50 dark:border-lime-400/50 bg-lime-400/10 text-lime-700 dark:text-lime-400"
                                      : "border-foreground/15 bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                  }`}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  {doc.creadoEn ? new Date(doc.creadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : "Ver"}
                                  {doc.estado === "aprobado" ? " ✓" : " ↗"}
                                </a>
                                {doc.estado !== "aprobado" && (
                                  <button
                                    onClick={() => aprobarComprobante(ab.id, doc.idDocumento)}
                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-lime-400/30 text-lime-700 dark:text-lime-400 hover:bg-lime-400/10 transition-colors"
                                  >
                                    Aprobar
                                  </button>
                                )}
                              </div>
                            ))}
                            </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
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
                  <span className="ml-2 text-[9px] bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5">{cancelados.length}</span>
                </p>
                <p className="text-xs text-foreground/25 mt-0.5">Membresías revocadas · se pueden recuperar.</p>
              </div>
              <span className="text-foreground/30 text-sm">{historialVisible ? "▲" : "▼"}</span>
            </button>

            {historialVisible && (
              <div className="md:overflow-x-auto border-t border-border border-dashed">
                <table className="w-full text-sm block md:table md:min-w-[900px]">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-border border-dashed">
                      {["#","Alumno","Plan","Inicio","Vencimiento","Créditos","Usados",""].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group divide-y divide-border divide-dashed">
                    {cancelados.map(ab => (
                      <tr key={ab.id} className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 md:table-row md:p-0 opacity-60 hover:opacity-100 transition-opacity">
                        <td data-label="N.º" className="px-4 py-3 font-mono text-xs text-foreground/30 before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.id}</td>
                        <td data-label="Alumno" className="px-4 py-3 text-foreground/70 text-xs font-semibold before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">{ab.nombreAlumno}</td>
                        <td data-label="Plan" className="px-4 py-3 text-foreground/50 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden col-span-2 md:col-span-1">{ab.abono}</td>
                        <td data-label="Inicio" className="px-4 py-3 text-foreground/40 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{fmt(ab.inicio)}</td>
                        <td data-label="Vencimiento" className="px-4 py-3 text-foreground/40 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{fmt(ab.vencimiento)}</td>
                        <td data-label="Créditos" className="px-4 py-3 text-center text-foreground/40 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.turnos}</td>
                        <td data-label="Usados" className="px-4 py-3 text-center text-foreground/30 text-xs before:mb-1 before:block before:text-[10px] before:font-black before:uppercase before:tracking-widest before:text-muted-foreground before:content-[attr(data-label)] md:before:hidden ">{ab.usados || 0}</td>
                        <td data-label="" className="px-4 py-3  col-span-2 md:col-span-1">
                          <button
                            onClick={() => setRestoreDialog({ open: true, abono: ab })}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-500 hover:text-lime-700 dark:hover:text-lime-400 border border-lime-500/30 hover:border-lime-600/50 dark:hover:border-lime-400/50 px-2.5 py-1 transition-colors"
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
                        if (key === "fechaInicio" && val) next.fechaVencimiento = diezDelMesSiguiente(val)
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
            <DialogTitle className="text-lime-700 dark:text-lime-400 uppercase text-sm font-black tracking-widest">Recuperar Membresía</DialogTitle>
          </DialogHeader>
          {restoreDialog.abono && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-lime-400/10 border border-lime-400/20 text-lime-700 dark:text-lime-400 rounded text-xs font-medium">
                ✓ La membresía volverá al estado ACTIVO con sus créditos disponibles.
              </div>
              <div className="bg-muted/60 border border-border rounded p-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Alumno:</span><span className="font-bold text-foreground">{restoreDialog.abono.nombreAlumno}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Plan:</span><span className="font-bold text-foreground">{restoreDialog.abono.abono}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Créditos:</span><span className="font-bold text-lime-700 dark:text-lime-400">{restoreDialog.abono.disponibles} disponibles</span></div>
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
