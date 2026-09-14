import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  FileText,
  Stethoscope,
  CheckCircle2,
  Clock,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { GymLoader } from "@/components/GymLoader"
import apiClient, {
  cambiarEstadoUsuario,
  eliminarUsuario,
  getUsuarioById,
} from "@/api"
import { toast } from '@/lib/notificar'


const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  activa: { label: "Activa", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

const formatearFecha = (fechaRaw) => {
  if (!fechaRaw) return "-";
  try {
    const fechaLimpia = fechaRaw.split('T')[0];
    const [year, month, day] = fechaLimpia.split('-');
    return `${day}/${month}/${year}`;
  } catch (e) {
    return fechaRaw;
  }
};

const TIPOS_DOC = [
  { key: "comprobante_transferencia", label: "Comprobante de Transferencia", Icon: CreditCard },
  { key: "certificado_medico",        label: "Certificado Médico",           Icon: Stethoscope },
  { key: "declaracion_jurada",        label: "Declaración Jurada",           Icon: FileText },
]

export default function DetalleUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState({ open: false, action: "" })
  const [error, setError] = useState("")

  const [vistaActiva, setVistaActiva] = useState("abonos")

  const [reservasReales, setReservasReales] = useState([])
  const [cargandoReservas, setCargandoReservas] = useState(false)

  const [abonos, setAbonos] = useState([])
  const [cargandoAbonos, setCargandoAbonos] = useState(false)

  const [documentos, setDocumentos] = useState([])
  const [cargandoDocs, setCargandoDocs] = useState(false)

  useEffect(() => {
    if (!id) return
    const cargarReservas = async () => {
      try {
        setCargandoReservas(true)
        const res = await apiClient.get(`/reservas/admin/usuario/${id}`)
        setReservasReales(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Error al cargar reservas del usuario:", err)
      } finally {
        setCargandoReservas(false)
      }
    }
    cargarReservas()
  }, [id])

  useEffect(() => {
    if (!id) return
    const cargarAbonos = async () => {
      try {
        setCargandoAbonos(true)
        const res = await apiClient.get(`/usuarios/${id}/abonos`)
        setAbonos(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Error al cargar abonos del usuario:", err)
      } finally {
        setCargandoAbonos(false)
      }
    }
    cargarAbonos()
  }, [id])

  useEffect(() => {
    if (!id) return
    const cargarDocs = async () => {
      try {
        setCargandoDocs(true)
        const res = await apiClient.get(`/documentos/usuario/${id}`)
        setDocumentos(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Error al cargar documentos del usuario:", err)
      } finally {
        setCargandoDocs(false)
      }
    }
    cargarDocs()
  }, [id])

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setIsLoading(true)
        setError("")
        const respuesta = await getUsuarioById(id)
        const datosReales = respuesta?.data || respuesta;
        setUser(datosReales)
      } catch (fetchError) {
        console.error("Error al cargar detalle del usuario:", fetchError)
        setError("No se pudo cargar el detalle del usuario.")
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargarUsuario()
  }, [id])

  const status = statusConfig[user?.estado] || statusConfig.activo

  const estadoMembresia = user?.membresia || (user?.estado === "activo" ? "activa" : "vencida");
  const membership = membershipConfig[estadoMembresia] || membershipConfig.vencida

  const handleStatusChange = async (newStatus) => {
    try {
      setIsActionLoading(true)
      await cambiarEstadoUsuario(id, newStatus)
      setUser((currentUser) => ({ ...currentUser, estado: newStatus }))
    } catch (statusError) {
      console.error("Error al actualizar estado:", statusError)
      toast.error("No se pudo actualizar el estado del usuario.")
    } finally {
      setIsActionLoading(false)
      setStatusDialog({ open: false, action: "" })
    }
  }

  const handleDelete = async () => {
    try {
      setIsActionLoading(true)
      await eliminarUsuario(id)
      navigate("/admin/usuarios")
    } catch (deleteError) {
      console.error("Error al eliminar usuario:", deleteError)
      toast.error("No se pudo eliminar el usuario.")
    } finally {
      setIsActionLoading(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GymLoader text="Sincronizando ficha del usuario..." />
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">{error}</div>
        <Link to="/admin/usuarios"><Button variant="outline">Volver a usuarios</Button></Link>
      </div>
    )
  }

  const getIniciales = (nombre) => {
    if (!nombre) return "??"
    const p = nombre.trim().split(" ")
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">

      {/* BREADCRUMB + ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/admin/usuarios">
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Usuarios</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-xs text-foreground/60 uppercase tracking-widest font-semibold">Ficha</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/usuarios/${id}/editar`}>
            <button type="button" className="border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          </Link>
          {user?.estado === "activo" ? (
            <button type="button" className="border border-yellow-400/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-yellow-400 hover:bg-yellow-400/5 transition-colors flex items-center gap-1.5"
              onClick={() => setStatusDialog({ open: true, action: "suspend" })}>
              <UserX className="h-3.5 w-3.5" /> Suspender
            </button>
          ) : user?.estado !== "inactivo" ? (
            <button type="button" className="border border-lime-400/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-lime-400 hover:bg-lime-400/5 transition-colors flex items-center gap-1.5"
              onClick={() => setStatusDialog({ open: true, action: "activate" })}>
              <UserCheck className="h-3.5 w-3.5" /> Activar
            </button>
          ) : null}
          <button type="button" className="border border-red-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/5 transition-colors flex items-center gap-1.5"
            onClick={() => setDeleteDialog(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      </div>

      {/* FICHA HERO */}
      <div className="border border-border bg-card">
        {/* Nombre + avatar + badges en una sola fila */}
        <div className="flex items-center gap-5 px-5 py-5 border-b border-border">
          <div className="h-14 w-14 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-lg select-none overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.nombre} className="h-full w-full object-cover" />
              : getIniciales(user?.nombre)
            }
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground leading-none">{user?.nombre}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${user?.estado === "activo" ? "bg-lime-400/10 text-lime-400 border-lime-400/20" : user?.estado === "suspendido" ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" : "bg-foreground/5 text-foreground/50 border-border"}`}>
                {status.label}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-foreground/5 text-foreground/50 border border-border capitalize">
                {user?.perfil || "Alumno"}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Créditos</p>
            <p className="text-4xl font-black text-lime-400 leading-none mt-1">{user?.creditos ?? 0}</p>
          </div>
        </div>

        {/* Grid de datos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-border">
          {[
            { label: 'DNI', value: user?.dni, icon: CreditCard },
            { label: 'Correo', value: user?.email, icon: Mail },
            { label: 'Teléfono', value: user?.telefono || '—', icon: Phone },
            { label: 'Registro', value: formatearFecha(user?.fechaRegistro), icon: Calendar },
            { label: 'Último acceso', value: formatearFecha(user?.ultimoAcceso), icon: Calendar },
            { label: 'Membresía', value: membership.label, isStatus: true, vigente: user?.membresia === "vigente" || user?.membresia === "activa" },
          ].map(({ label, value, icon: Icon, isStatus, vigente }, i) => (
            <div key={label} className={`px-4 py-3 ${i >= 3 ? 'border-t border-border' : ''} lg:border-t-0`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
              {isStatus
                ? <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${vigente ? "bg-lime-400/10 text-lime-400 border-lime-400/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{value}</span>
                : <p className="text-sm font-semibold text-foreground truncate">{value}</p>
              }
            </div>
          ))}
        </div>
      </div>

      {/* MENÚ DE PESTAÑAS */}
      <div className="flex gap-2 border-b border-border pb-px">
        {[
          { key: "abonos",   label: "Abonos" },
          { key: "reservas", label: "Historial Reservas" },
          { key: "documentos", label: "Documentos" },
        ].map(({ key, label }) => (
          <button key={key}
            className={`px-4 py-2 text-xs font-black tracking-widest uppercase border-b-2 transition-colors ${vistaActiva === key ? "border-lime-400 text-lime-400" : "border-transparent text-foreground/40 hover:text-foreground"}`}
            onClick={() => setVistaActiva(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PESTAÑA ABONOS */}
      {vistaActiva === "abonos" && (
        <div className="border border-border bg-card">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Historial de Abonos</p>
              <p className="text-xs text-foreground/40 mt-0.5">Membresías adquiridas por este usuario.</p>
            </div>
            <Link to={`/admin/usuarios/abonos/carga-masiva?usuario=${id}`}>
              <button type="button" className="border border-lime-400/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-lime-400 hover:bg-lime-400/5 transition-colors flex items-center gap-1.5">
                + Cargar Abono
              </button>
            </Link>
          </div>
          {cargandoAbonos ? (
            <div className="p-8 text-center text-xs text-foreground/30 uppercase tracking-widest animate-pulse">Cargando abonos...</div>
          ) : abonos.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-foreground/30 uppercase tracking-widest">Sin abonos registrados</p>
              <Link to={`/admin/usuarios/abonos/carga-masiva?usuario=${id}`} className="text-[10px] text-lime-500 hover:text-lime-400 underline underline-offset-2 transition-colors">
                Cargar primer abono →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    {["Plan","Inicio","Vencimiento","Créditos","Usados","Disponibles","Estado"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {abonos.map(ab => (
                    <tr key={ab.idAbono || ab.id} className="hover:bg-foreground/3 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{ab.tipoAbono || ab.abono || ab.nombrePlan}</td>
                      <td className="px-4 py-3 text-foreground/40">{formatearFecha(ab.fechaInicio || ab.inicio)}</td>
                      <td className="px-4 py-3 text-foreground/40">{formatearFecha(ab.fechaVencimiento || ab.vencimiento)}</td>
                      <td className="px-4 py-3 text-center text-foreground/60">{ab.turnos}</td>
                      <td className="px-4 py-3 text-center text-foreground/40">{ab.usados || 0}</td>
                      <td className="px-4 py-3 text-center font-bold text-lime-400">{ab.disponibles ?? (ab.turnos - (ab.usados || 0))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                          ab.estado === "CANCELADO" ? "bg-foreground/5 text-foreground/30 border-foreground/10"
                          : ab.estado === "VENCIDO"  ? "bg-foreground/5 text-foreground/40 border-foreground/10"
                          : "bg-lime-400/10 text-lime-400 border-lime-400/20"
                        }`}>
                          {ab.estado || "ACTIVO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA RESERVAS */}
      {vistaActiva === "reservas" && (
        <div className="border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clase</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hora</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coach Asignado</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cargandoReservas ? (
                  <tr><td colSpan={5} className="p-8 text-center text-foreground/40 animate-pulse text-xs">Cargando historial de reservas...</td></tr>
                ) : reservasReales.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-foreground/40 text-xs">No se registran reservas para este usuario.</td></tr>
                ) : reservasReales.map((r) => {
                  const estadoBadge = {
                    proxima:     { label: 'Próxima',    cls: 'bg-foreground/5 text-foreground/50 border-border' },
                    completada:  { label: 'Asistió',    cls: 'bg-lime-400/10 text-lime-400 border-lime-400/20' },
                    cancelada:   { label: 'Cancelada',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
                    inasistencia:{ label: 'No asistió', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
                  }[r.estadoReserva] || { label: r.estadoReserva, cls: 'bg-foreground/5 text-foreground/50 border-border' }
                  return (
                    <tr key={r.idReserva} className="hover:bg-foreground/3 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{r.nombreClase}</td>
                      <td className="px-4 py-3 text-foreground/40">{formatearFecha(r.fechaReserva)}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{r.horaInicio ? r.horaInicio.slice(0,5) : '-'} hs</td>
                      <td className="px-4 py-3 text-foreground/40">{r.nombreProfesor || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${estadoBadge.cls}`}>
                          {estadoBadge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA DOCUMENTOS */}
      {vistaActiva === "documentos" && (
        <div className="border border-border bg-card divide-y divide-border">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documentos del alumno</p>
          </div>
          {cargandoDocs ? (
            <div className="p-8 text-center text-xs text-foreground/30 uppercase tracking-widest animate-pulse">Cargando documentos...</div>
          ) : (
            TIPOS_DOC.map(({ key, label, Icon }) => {
              const docsDelTipo = documentos.filter(d => d.tipo === key)
              const ultimo = docsDelTipo[0]
              return (
                <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 border border-border bg-muted/30 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-foreground/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-[10px] text-foreground/30">
                        {ultimo ? `Subido el ${formatearFecha(ultimo.creadoEn)}` : "Sin archivo subido"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {ultimo ? (
                      <>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                          ultimo.estado === "aprobado"
                            ? "bg-lime-400/10 text-lime-400 border-lime-400/20"
                            : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                        }`}>
                          {ultimo.estado === "aprobado" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {ultimo.estado === "aprobado" ? "Aprobado" : "En revisión"}
                        </span>
                        <a href={ultimo.urlArchivo} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-border px-3 py-1.5 text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-colors">
                          <Eye className="h-3 w-3" /> Ver
                        </a>
                      </>
                    ) : (
                      <span className="text-[10px] text-foreground/25 border border-dashed border-border px-2.5 py-1">
                        Sin documento
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MODALES */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent className="bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-semibold text-foreground tracking-tight">
              {statusDialog.action === "suspend" ? "Suspender Acceso" : "Restablecer Acceso"}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusDialog({ open: false, action: "" })}>Cancelar</Button>
            <Button variant={statusDialog.action === "activate" ? "default" : "destructive"} size="sm"
              onClick={() => handleStatusChange(statusDialog.action === "suspend" ? "suspendido" : "activo")}
              disabled={isActionLoading}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-destructive font-semibold tracking-tight">Eliminar Registro</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isActionLoading}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
