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
  FileText,
  Stethoscope,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
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
import { toast } from "@/lib/notificar"

const statusConfig = {
  activo:    { label: "Activo",     className: "bg-lime-400/10 text-lime-400 border-lime-400/20" },
  suspendido:{ label: "Suspendido", className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
  inactivo:  { label: "Inactivo",   className: "bg-foreground/5 text-foreground/50 border-border" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-lime-400/10 text-lime-400 border-lime-400/20" },
  activa:  { label: "Activa",  className: "bg-lime-400/10 text-lime-400 border-lime-400/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-400 border-red-500/20" },
}

const fmt = (fechaRaw) => {
  if (!fechaRaw) return "-"
  try {
    const [y, m, d] = fechaRaw.split("T")[0].split("-")
    return `${d}/${m}/${y}`
  } catch { return fechaRaw }
}

const TABS = ["abonos", "reservas", "documentos", "pagos"]
const TAB_LABELS = { abonos: "Abonos", reservas: "Reservas", documentos: "Documentos", pagos: "Pagos" }

const TIPOS_DOC = [
  { key: "comprobante_transferencia", label: "Comprobante de Transferencia", Icon: CreditCard },
  { key: "certificado_medico",        label: "Certificado Médico",           Icon: Stethoscope },
  { key: "declaracion_jurada",        label: "Declaración Jurada",           Icon: FileText },
]

export default function DetalleUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [user,          setUser]          = useState(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [deleteDialog,  setDeleteDialog]  = useState(false)
  const [statusDialog,  setStatusDialog]  = useState({ open: false, action: "" })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error,         setError]         = useState("")
  const [tab,           setTab]           = useState("abonos")

  const [abonos,        setAbonos]        = useState([])
  const [cargandoAbonos, setCargandoAbonos] = useState(false)

  const [reservas,      setReservas]      = useState([])
  const [cargandoReservas, setCargandoReservas] = useState(false)

  const [documentos,    setDocumentos]    = useState([])
  const [cargandoDocs,  setCargandoDocs]  = useState(false)

  const [pagos,         setPagos]         = useState([])
  const [cargandoPagos, setCargandoPagos] = useState(false)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      try {
        const res = await getUsuarioById(id)
        setUser(res?.data || res)
      } catch {
        setError("No se pudo cargar el usuario.")
      } finally {
        setIsLoading(false)
      }
    }
    cargar()
  }, [id])

  useEffect(() => {
    if (!id) return
    if (tab === "abonos" && abonos.length === 0) {
      setCargandoAbonos(true)
      apiClient.get(`/usuarios/${id}/abonos`)
        .then(r => setAbonos(r.data?.data || r.data || []))
        .catch(() => {})
        .finally(() => setCargandoAbonos(false))
    }
    if (tab === "reservas" && reservas.length === 0) {
      setCargandoReservas(true)
      apiClient.get(`/reservas/admin/usuario/${id}`)
        .then(r => setReservas(r.data?.data || r.data || []))
        .catch(() => {})
        .finally(() => setCargandoReservas(false))
    }
    if (tab === "documentos" && documentos.length === 0) {
      setCargandoDocs(true)
      apiClient.get(`/documentos/usuario/${id}`)
        .then(r => setDocumentos(r.data?.data || r.data || []))
        .catch(() => {})
        .finally(() => setCargandoDocs(false))
    }
    if (tab === "pagos" && pagos.length === 0) {
      setCargandoPagos(true)
      apiClient.get(`/usuarios/${id}/pagos`)
        .then(r => setPagos(r?.data?.data || r?.data || []))
        .catch(() => {})
        .finally(() => setCargandoPagos(false))
    }
  }, [tab, id])

  const handleStatusChange = async (newStatus) => {
    const estadoAnterior = user?.estado
    setStatusDialog({ open: false, action: "" })
    setUser(u => ({ ...u, estado: newStatus }))
    try {
      await cambiarEstadoUsuario(id, newStatus)
    } catch {
      setUser(u => ({ ...u, estado: estadoAnterior }))
      toast.error("No se pudo cambiar el estado")
    }
  }

  const handleDelete = async () => {
    setIsActionLoading(true)
    try {
      await eliminarUsuario(id)
      toast.success("Usuario eliminado")
      navigate("/admin/usuarios")
    } catch {
      toast.error("No se pudo eliminar el usuario")
    } finally {
      setIsActionLoading(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) return <GymLoader />
  if (error || !user) return (
    <div className="space-y-4">
      <Link to="/admin/usuarios" className="inline-flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <div className="border border-red-500/20 bg-card p-8 text-center">
        <p className="text-red-400">{error || "Usuario no encontrado."}</p>
      </div>
    </div>
  )

  const estadoUser    = user.estado?.toLowerCase() || "activo"
  const estadoCfg     = statusConfig[estadoUser] || statusConfig.activo
  const membresia     = (user.membresia || "vencida").toLowerCase()
  const membCfg       = membershipConfig[membresia] || membershipConfig.vencida
  const getIniciales  = (n) => n ? n.trim().split(" ").slice(0,2).map(p => p[0]).join("").toUpperCase() : "??"

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate("/admin/usuarios")}
          className="mt-1 p-1.5 text-foreground/30 hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">{user.nombre || user.nombrecompleto}</h1>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${estadoCfg.className}`}>
              {estadoCfg.label}
            </span>
          </div>
          <p className="text-xs text-foreground/40 mt-0.5">{user.nombrePerfil || user.perfil || "Sin perfil asignado"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/admin/usuarios/${id}/editar`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          </Link>
          {estadoUser === "suspendido" ? (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-green-500 border-green-500/30 hover:bg-green-500/10"
              onClick={() => setStatusDialog({ open: true, action: "activate" })}>
              <UserCheck className="h-3.5 w-3.5" /> Activar
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
              onClick={() => setStatusDialog({ open: true, action: "suspend" })}>
              <UserX className="h-3.5 w-3.5" /> Suspender
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
            onClick={() => setDeleteDialog(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </Button>
        </div>
      </div>

      {/* INFO PERSONAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-border bg-card p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Información Personal
          </p>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-lg overflow-hidden">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.nombre} className="h-full w-full object-cover" />
                : getIniciales(user.nombre || user.nombrecompleto)
              }
            </div>
            <div>
              <p className="font-black text-foreground">{user.nombre || user.nombrecompleto}</p>
              <p className="text-xs text-foreground/40">ID #{user.idUsuario || user.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
            {[
              [Mail,      "Correo",            user.email || user.correo],
              [Phone,     "Teléfono",          user.telefono],
              [CreditCard,"DNI",               user.dni],
              [Calendar,  "Fecha de registro", fmt(user.fechaRegistro || user.creadoEn)],
            ].map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="h-3.5 w-3.5 mt-0.5 text-foreground/30 shrink-0" />
                <div>
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">{label}</p>
                  <p className="text-foreground font-medium">{value || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="border border-border bg-card p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Métricas</p>
            {[
              ["Usuario",   estadoCfg.label, estadoCfg.className],
              ["Membresía", membCfg.label,   membCfg.className],
            ].map(([label, val, cls]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-foreground/50">{label}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${cls}`}>{val}</span>
              </div>
            ))}
            {user.nombrePerfil && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/50">Perfil</span>
                <span className="text-xs font-bold text-foreground">{user.nombrePerfil}</span>
              </div>
            )}
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Créditos disponibles</p>
            <p className="text-4xl font-black text-lime-400">{user.creditos ?? "-"}</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div>
        <div className="flex border-b border-border">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === t
                  ? "text-lime-400 border-b-2 border-lime-400 -mb-px"
                  : "text-foreground/40 hover:text-foreground"
              }`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* TAB ABONOS */}
        {tab === "abonos" && (
          <div className="border border-t-0 border-border bg-card">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-foreground">Historial de Abonos</p>
                <p className="text-xs text-foreground/40 mt-0.5">Membresías adquiridas por este usuario.</p>
              </div>
              <Link to={`/admin/usuarios/abonos/carga-masiva?usuario=${id}`}>
                <Button size="sm" className="bg-lime-400 text-black hover:bg-lime-300 font-black uppercase text-xs tracking-wide gap-1.5">
                  + Cargar Abono
                </Button>
              </Link>
            </div>
            {cargandoAbonos ? (
              <div className="p-10 text-center text-foreground/30 animate-pulse text-xs">Cargando...</div>
            ) : abonos.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-xs text-foreground/30">Sin abonos registrados.</p>
                <Link to={`/admin/usuarios/abonos/carga-masiva?usuario=${id}`}
                  className="mt-2 inline-block text-[10px] text-lime-500 hover:text-lime-400 underline underline-offset-2 transition-colors">
                  Cargar primer abono →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border">
                      {["Plan","Inicio","Vencimiento","Créditos","Usados","Disponibles","Estado"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {abonos.map(ab => (
                      <tr key={ab.idAbono || ab.id} className="hover:bg-foreground/[0.02] transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{ab.tipoAbono || ab.abono}</td>
                        <td className="px-4 py-3 text-foreground/60">{fmt(ab.fechaInicio || ab.inicio)}</td>
                        <td className="px-4 py-3 text-foreground/60">{fmt(ab.fechaVencimiento || ab.vencimiento)}</td>
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

        {/* TAB RESERVAS */}
        {tab === "reservas" && (
          <div className="border border-t-0 border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">Reservas</p>
              <p className="text-xs text-foreground/40 mt-0.5">Historial de clases reservadas por este alumno.</p>
            </div>
            {cargandoReservas ? (
              <div className="p-10 text-center text-foreground/30 animate-pulse text-xs">Cargando...</div>
            ) : reservas.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-xs text-foreground/30">Sin reservas registradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      {["Clase","Fecha","Hora","Coach","Estado"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reservas.map((r, i) => (
                      <tr key={r.idReserva || i} className="hover:bg-foreground/[0.02] transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{r.nombreClase || r.clase}</td>
                        <td className="px-4 py-3 text-foreground/60">{fmt(r.fecha)}</td>
                        <td className="px-4 py-3 text-foreground/60">{r.horaInicio || r.hora}</td>
                        <td className="px-4 py-3 text-foreground/60">{r.nombreProfesor || r.coach || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                            r.estado === "cancelado" ? "bg-foreground/5 text-foreground/30 border-foreground/10"
                            : "bg-lime-400/10 text-lime-400 border-lime-400/20"
                          }`}>
                            {r.estado || "activa"}
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

        {/* TAB DOCUMENTOS */}
        {tab === "documentos" && (
          <div className="border border-t-0 border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">Documentos</p>
              <p className="text-xs text-foreground/40 mt-0.5">Archivos subidos por el alumno para verificación.</p>
            </div>
            {cargandoDocs ? (
              <div className="p-10 text-center text-foreground/30 animate-pulse text-xs">Cargando...</div>
            ) : (
              <div className="divide-y divide-border">
                {TIPOS_DOC.map(({ key, label, Icon }) => {
                  const docs = documentos.filter(d => d.tipo === key)
                  const ultimo = docs[0]
                  return (
                    <div key={key} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 border border-border bg-muted/30 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-foreground/40" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{label}</p>
                          <p className="text-[10px] text-foreground/40 mt-0.5">
                            {ultimo ? `Subido el ${fmt(ultimo.creadoEn)}` : "Sin archivo subido"}
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
                              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground border border-border px-2.5 py-1 transition-colors">
                              <ExternalLink className="h-3 w-3" /> Ver
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
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB PAGOS */}
        {tab === "pagos" && (
          <div className="border border-t-0 border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">Pagos</p>
              <p className="text-xs text-foreground/40 mt-0.5">Historial de pagos registrados para este alumno.</p>
            </div>
            {cargandoPagos ? (
              <div className="p-10 text-center text-foreground/30 animate-pulse text-xs">Cargando...</div>
            ) : pagos.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-xs text-foreground/30">Sin pagos registrados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border">
                      {["Fecha","Concepto","Monto","Método","Estado"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagos.map((p, i) => (
                      <tr key={p.id || i} className="hover:bg-foreground/[0.02] transition-colors">
                        <td className="px-4 py-3 text-foreground/60">{fmt(p.fecha || p.creadoEn)}</td>
                        <td className="px-4 py-3 text-foreground">{p.concepto || p.tipoAbono || "-"}</td>
                        <td className="px-4 py-3 font-bold text-foreground">${Number(p.importe || p.monto || 0).toLocaleString("es-AR")}</td>
                        <td className="px-4 py-3 text-foreground/60">{p.metodoPago || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border bg-lime-400/10 text-lime-400 border-lime-400/20">
                            {p.estado || "Registrado"}
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
      </div>

      {/* MODAL CAMBIAR ESTADO */}
      <Dialog open={statusDialog.open} onOpenChange={open => !open && setStatusDialog({ open: false, action: "" })}>
        <DialogContent className="bg-card border border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="uppercase text-sm font-black tracking-widest">
              {statusDialog.action === "activate" ? "Activar usuario" : "Suspender usuario"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/60">
            {statusDialog.action === "activate"
              ? `¿Querés activar la cuenta de ${user.nombre || user.nombrecompleto}?`
              : `¿Querés suspender la cuenta de ${user.nombre || user.nombrecompleto}?`}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusDialog({ open: false, action: "" })}>Cancelar</Button>
            <Button size="sm"
              className={statusDialog.action === "activate"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-yellow-500 hover:bg-yellow-600 text-black font-black"}
              onClick={() => handleStatusChange(statusDialog.action === "activate" ? "activo" : "suspendido")}>
              {statusDialog.action === "activate" ? "Activar" : "Suspender"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive uppercase text-sm font-black tracking-widest">Eliminar usuario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/60">
            Esta acción es irreversible. Se eliminará la cuenta de <strong>{user.nombre || user.nombrecompleto}</strong> y todos sus datos.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
